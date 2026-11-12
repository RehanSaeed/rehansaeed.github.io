import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type TagCapture = {
  names: number;
  text: string | null;
  focused: boolean;
  scrollY: number;
  top: number;
  bottom: number;
};
type TagProbe = {
  starts: number;
  ready: number;
  finished: number;
  skipped: number;
  sourceNames: number[];
  sourceText: Array<string | null>;
  captures: TagCapture[];
  errors: string[];
};
declare global {
  interface Window {
    /** Native tag transition lifecycle observations. */
    tagTransitionProbe: TagProbe;
    /** Clear observations after warm-up navigation. */
    resetTagTransitionProbe: () => void;
  }
}

const destination = "/tag/net/";
const instrument = (page: Page) =>
  page.addInitScript(() => {
    const createProbe = (): TagProbe => ({
      starts: 0,
      ready: 0,
      finished: 0,
      skipped: 0,
      sourceNames: [],
      sourceText: [],
      captures: [],
      errors: [],
    });
    let probe = createProbe();
    window.tagTransitionProbe = probe;
    window.resetTagTransitionProbe = () => {
      probe = createProbe();
      window.tagTransitionProbe = probe;
    };
    if (typeof document.startViewTransition !== "function") {
      return;
    }
    const namedLabels = () =>
      [...document.querySelectorAll("[data-tag-transition-label]")].filter(
        (label) => getComputedStyle(label).viewTransitionName === "tag-title",
      );
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      probe.starts++;
      const source = namedLabels();
      probe.sourceNames.push(source.length);
      probe.sourceText.push(source[0]?.textContent ?? null);
      const transition = start(update);
      const skip = transition.skipTransition.bind(transition);
      transition.skipTransition = () => {
        probe.skipped++;
        skip();
      };
      void transition.ready.then(
        () => {
          probe.ready++;
          const heading = document.querySelector("[data-tag-transition-heading]");
          const target = heading?.querySelector("[data-tag-transition-label]");
          if (target) {
            const box = target.getBoundingClientRect();
            probe.captures.push({
              names: namedLabels().length,
              text: target.textContent,
              focused: document.activeElement === heading,
              scrollY,
              top: box.top,
              bottom: box.bottom,
            });
          }
        },
        (error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            probe.errors.push(String(error));
          }
        },
      );
      void transition.finished.then(
        () => probe.finished++,
        (error: unknown) => probe.errors.push(String(error)),
      );
      return transition;
    };
  });

const prepare = async (page: Page) => {
  await instrument(page);
  // Warm the destination's client Content data before measuring a bounded capture.
  await page.goto(destination);
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await page.getByRole("link", { name: "Blog", exact: true }).click();
  const links = page.locator(`a[data-tag-transition-link][href="${destination}"]`);
  await expect(links.first()).toBeVisible();
  const link = links.first();
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await expect
    .poll(() => page.evaluate(() => document.fonts.status))
    .toBe("loaded");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const probe = window.tagTransitionProbe;
        return probe.starts === probe.finished;
      }),
    )
    .toBe(true);
  await page.evaluate(() => window.resetTagTransitionProbe());
  return link;
};

const expectClean = async (page: Page) => {
  await expect(page.locator(".tag-view-transition__title")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/post-view-transition/);
  expect(await page.evaluate(() => window.tagTransitionProbe.errors)).toEqual([]);
};

test.describe("Selected tag to tag-title continuity", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1280, height: 1000 },
    navigationTimeout: 15_000,
  });

  test.afterEach(async ({ page }) => {
    await test.info().attach("tag-transition-lifecycle", {
      body: JSON.stringify(await page.evaluate(() => window.tagTransitionProbe)),
      contentType: "application/json",
    });
  });

  for (const activation of ["mouse", "Enter"] as const) {
    test(`Pairs only the selected repeated tag with the title using ${activation}`, async ({
      page,
    }) => {
      const link = await prepare(page);
      expect(
        await page
          .locator(`a[data-tag-transition-link][href="${destination}"]`)
          .count(),
      ).toBeGreaterThan(1);
      await expect(link).toHaveAttribute("href", destination);
      if (activation === "mouse") {
        await link.click({ noWaitAfter: true });
      } else {
        await link.press("Enter", { noWaitAfter: true });
      }
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      const heading = page.getByRole("heading", { name: "# .NET", exact: true });
      await expect(heading).toBeVisible();
      await expect(page.locator(".nuxt-route-announcer")).toContainText(".NET");
      await expect
        .poll(() => page.evaluate(() => window.tagTransitionProbe.finished))
        .toBe(1);
      const probe = await page.evaluate(() => window.tagTransitionProbe);
      expect(probe.starts).toBe(1);
      expect(probe.ready).toBe(1);
      expect(probe.skipped).toBe(0);
      expect(probe.sourceNames).toEqual([1]);
      expect(probe.sourceText).toEqual([".NET"]);
      expect(probe.captures).toHaveLength(1);
      const capture = probe.captures[0]!;
      expect(capture.names).toBe(1);
      expect(capture.text).toBe(".NET");
      expect(capture.focused).toBe(true);
      expect(capture.scrollY).toBe(0);
      expect(capture.top).toBeGreaterThanOrEqual(0);
      expect(capture.bottom).toBeLessThanOrEqual(1000);
      await expect(heading).toBeFocused();
      await expect(page.locator(".tag-page img")).toHaveCount(0);
      await expectClean(page);
    });
  }

  test("Preserves history scroll restoration and hash navigation without continuity", async ({
    page,
  }) => {
    const link = await prepare(page);
    const before = await page.evaluate(() => scrollY);
    await link.click();
    await expect
      .poll(() => page.evaluate(() => window.tagTransitionProbe.finished))
      .toBe(1);
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    await expect(link).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
    expect(await page.evaluate(() => window.tagTransitionProbe.starts)).toBe(1);
    await link.evaluate((anchor: HTMLAnchorElement) => {
      anchor.hash = ".net";
    });
    await link.click();
    await expect(page).toHaveURL(/\/tag\/net\/#\.net$/);
    await expect(page.getByRole("heading", { name: "# .NET" })).toBeInViewport();
    expect(await page.evaluate(() => window.tagTransitionProbe.starts)).toBe(1);
    await expectClean(page);
  });

  test("Leaves offscreen tags unnamed rather than matching another repeated tag", async ({
    page,
  }) => {
    const link = await prepare(page);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
    await expect(link).not.toBeInViewport();
    await link.evaluate((anchor: HTMLAnchorElement) => anchor.click());
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect
      .poll(() => page.evaluate(() => window.tagTransitionProbe.finished))
      .toBe(1);
    const probe = await page.evaluate(() => window.tagTransitionProbe);
    expect(probe.ready).toBe(1);
    expect(probe.sourceNames).toEqual([0]);
    expect(probe.captures[0]?.names).toBe(0);
    await expectClean(page);
  });

  test("Cancels a mismatched tag title without blocking navigation", async ({
    page,
  }) => {
    const link = await prepare(page);
    await link.locator("[data-tag-transition-label]").evaluate((label) => {
      label.textContent = "Different tag";
    });
    await link.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.getByRole("heading", { name: "# .NET" })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.tagTransitionProbe.finished))
      .toBe(1);
    const probe = await page.evaluate(() => window.tagTransitionProbe);
    expect(probe.skipped).toBeGreaterThan(0);
    expect(probe.ready).toBe(0);
    await expectClean(page);
  });

  for (const fallback of [
    "reduced motion",
    "forced colours",
    "unsupported API",
  ] as const) {
    test(`Keeps native tag navigation with ${fallback}`, async ({ page }) => {
      if (fallback === "reduced motion") {
        await page.emulateMedia({ reducedMotion: "reduce" });
      } else if (fallback === "forced colours") {
        await page.emulateMedia({ forcedColors: "active" });
      } else {
        await page.addInitScript(() => {
          Object.defineProperty(document, "startViewTransition", {
            configurable: true,
            value: undefined,
          });
        });
      }
      const link = await prepare(page);
      await link.press("Enter");
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      await expect(page.getByRole("heading", { name: "# .NET" })).toBeVisible();
      await expect(page.locator(".nuxt-route-announcer")).toContainText(".NET");
      expect(await page.evaluate(() => window.tagTransitionProbe.starts)).toBe(0);
      await expectClean(page);
    });
  }
});
