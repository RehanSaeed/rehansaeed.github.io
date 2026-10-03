import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TestInfo } from "@playwright/test";

// Local-only visual comparison (excluded in CI). Capture baselines from live with
// `BASE_URL=https://rehansaeed.com npm run test:visual -- --update-snapshots`, then run
// `npm run test:visual` against the local build and review diffs in the HTML report.

const pages = [
  "/",
  "/2/",
  "/on-the-etiquette-of-pull-request-comments/",
  "/tag/net/",
  "/about/",
  "/portfolio/",
  "/this-does-not-exist/",
];

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },
};

const slug = (path: string) =>
  path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";

async function readyForScreenshot(page: Page) {
  if (!new URL(page.url()).pathname.startsWith("/streaming/")) {
    await page
      .locator('a[href^="mailto:"]')
      .first()
      .waitFor({ state: "attached" });
  }
  await page.evaluate(async () => {
    await document.fonts.load("16px Audiowide");
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content: `
      * { content-visibility: visible !important; }
      .comments, .webmentions { display: none !important; }
      :root {
        --global-font-size-default: clamp(1rem, 0.859375rem + 0.390625vw, 1.25rem);
        --global-space-fluid-6: clamp(1.5rem, -0.1875rem + 4.6875vw, 4.5rem);
      }
    `,
  });
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) => {
        image.loading = "eager";
        return image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            });
      }),
    );
  });
}

async function checkGeometry(page: Page, info: TestInfo, name: string) {
  const file = `${info.snapshotPath(name)}.geometry.json`;
  const geometry = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  if (info.config.updateSnapshots === "all") {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(geometry));
  } else {
    const reference: { width: number; height: number } = JSON.parse(
      await readFile(file, "utf8"),
    );
    expect(geometry.width).toBe(reference.width);
    expect(Math.abs(geometry.height - reference.height)).toBeLessThanOrEqual(2);
  }
  // PNG comparison requires identical dimensions; separately enforce a <=2px layout difference.
  await page.evaluate((height) => {
    document.body.style.minHeight = `${Math.ceil(height / 100) * 100}px`;
  }, geometry.height);
}

test.describe("Visual @visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date("2023-01-01T00:00:00Z") });
    await page.route(/^https:\/\/(?!rehansaeed\.com(?:\/|$))/, (route) =>
      route.fulfill({
        contentType:
          route.request().resourceType() === "document"
            ? "text/html"
            : "text/plain",
        body: "",
      }),
    );
  });

  for (const [device, viewport] of Object.entries(viewports)) {
    for (const colorScheme of ["light", "dark"] as const) {
      for (const path of pages) {
        test(`${path} ${device} ${colorScheme}`, async ({ page }, info) => {
          await page.setViewportSize(viewport);
          await page.emulateMedia({ colorScheme });
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await readyForScreenshot(page);
          const name = `${slug(path)}-${device}-${colorScheme}.png`;
          await checkGeometry(page, info, name);
          await expect(page).toHaveScreenshot(name, {
            fullPage: true,
            animations: "disabled",
            // Volatile comments/webmentions are covered separately by behavioral tests.
            mask: [
              page.locator('img[src^="http"]:not([src*="rehansaeed.com"])'),
              page.locator("iframe"),
              // Approved image optimizations/encoding differ; retain their layout comparison.
              page.locator(
                ".about__mvp-image, .about__badge-image, .about__open-uk-honours-image",
              ),
            ],
            maxDiffPixelRatio: 0.02,
          });
        });
      }
    }
  }

  const overlays = {
    "streaming-border": "/streaming/border/?hue1=200&border-width=10px",
    "streaming-thumbnail-dark": "/streaming/thumbnail/?background=dark",
    "streaming-thumbnail-designer":
      "/streaming/thumbnail/?title=Hello&subtitle=World&title-font-size=5&image1=/images/hero/Application-Insights-1366x768.png&image1-rotate=10&image1-x=100&no-logo",
  };

  for (const [name, path] of Object.entries(overlays)) {
    test(name, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await readyForScreenshot(page);

      await expect(page).toHaveScreenshot(`${name}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
