import { expect, test } from "./fixtures";

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

test.describe("Visual @visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date("2023-01-01T00:00:00Z") });
  });

  for (const [device, viewport] of Object.entries(viewports)) {
    for (const colorScheme of ["light", "dark"] as const) {
      for (const path of pages) {
        test(`${path} ${device} ${colorScheme}`, async ({ page }) => {
          await page.setViewportSize(viewport);
          await page.emulateMedia({ colorScheme });
          await page.goto(path);
          await page.waitForLoadState("load");

          await expect(page).toHaveScreenshot(
            `${slug(path)}-${device}-${colorScheme}.png`,
            {
              fullPage: true,
              animations: "disabled",
              // Third-party images (badges, flair, avatars) and comments change independently.
              mask: [
                page.locator('img[src^="http"]:not([src*="rehansaeed.com"])'),
                page.locator("iframe"),
              ],
              maxDiffPixelRatio: 0.02,
            },
          );
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
      await page.goto(path);
      await page.waitForLoadState("load");

      await expect(page).toHaveScreenshot(`${name}.png`, {
        animations: "disabled",
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
