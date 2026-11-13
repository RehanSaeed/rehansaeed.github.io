import {
  expect as baseExpect,
  test,
  type Locator,
  type Page,
} from "@playwright/test";
import type { Router } from "vue-router";

const expect = baseExpect.configure({ timeout: 5_000 });
const destination = "/live-streaming-dotnet/";
const title = "Live Streaming .NET";
const searchTerm = "Live Streaming";
const activators = {
  mouse: (link: Locator) => link.click(),
  Enter: (link: Locator) => link.press("Enter"),
};
type SearchTransitionProbe = {
  starts: number;
  ready: number;
  finished: number;
  errors: string[];
  sourceDialogs: number[];
  sourceNames: number[];
  sourceBoxes: Array<{ x: number; y: number; width: number; height: number }>;
  modifiedDefaultPrevented: boolean[];
  captures: Array<{
    dialogs: number;
    focus: string | null;
    names: number;
    heroAnimations: number;
    scrollY: number;
  }>;
};
declare global {
  interface Window {
    /** Native snapshot and focus observations for search activation. */
    searchTransitionProbe: SearchTransitionProbe;
    /** Release the deliberately pending navigation in the cold-route regression. */
    releaseSearchNavigation?: () => void;
    /** Whether the test's route guard is currently holding navigation. */
    searchNavigationPending?: boolean;
  }
}

const instrument = (page: Page, unsupported = false) =>
  page.addInitScript((disableTransitions) => {
    if (disableTransitions) {
      Object.defineProperty(document, "startViewTransition", {
        value: undefined,
      });
    }
    const probe: SearchTransitionProbe = {
      starts: 0,
      ready: 0,
      finished: 0,
      errors: [],
      sourceDialogs: [],
      sourceNames: [],
      sourceBoxes: [],
      modifiedDefaultPrevented: [],
      captures: [],
    };
    window.searchTransitionProbe = probe;
    document.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey) {
        probe.modifiedDefaultPrevented.push(event.defaultPrevented);
      }
    });
    if (typeof document.startViewTransition !== "function") {
      return;
    }
    const countHeroes = () =>
      [...document.querySelectorAll("img")].filter(
        (image) => getComputedStyle(image).viewTransitionName === "post-hero",
      ).length;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      probe.starts++;
      probe.sourceNames.push(countHeroes());
      const source = document.querySelector(".post-view-transition__bridge");
      if (source) {
        const { x, y, width, height } = source.getBoundingClientRect();
        probe.sourceBoxes.push({ x, y, width, height });
      }
      const callback = typeof update === "function" ? update : update?.update;
      const capture = async () => {
        // The native old snapshot is taken immediately before this callback,
        // after Nuxt's synchronous start hooks have closed the dialog.
        probe.sourceDialogs.push(
          document.querySelectorAll("dialog[open]").length,
        );
        await callback?.();
      };
      const transition = start(
        typeof update === "function" ? capture : { ...update, update: capture },
      );
      void transition.ready.then(
        () => {
          probe.ready++;
          probe.captures.push({
            dialogs: document.querySelectorAll("dialog[open]").length,
            focus: document.activeElement?.getAttribute("id") ?? null,
            names: countHeroes(),
            heroAnimations: document
              .getAnimations()
              .filter(
                (animation) =>
                  animation.effect instanceof KeyframeEffect &&
                  animation.effect.pseudoElement ===
                    "::view-transition-group(post-hero)",
              ).length,
            scrollY,
          });
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
  }, unsupported);

const openResult = async (page: Page) => {
  // Warm the destination's client data and decoded picture before testing motion.
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  await page
    .locator(`.post-card__title a[href="${destination}"]`)
    .evaluate((anchor: HTMLAnchorElement) => {
      anchor.click();
    });
  await expect(page.locator("[data-view-transition-heading]")).toHaveText(
    title,
  );
  await page
    .locator(".post__photo")
    .evaluate((image: HTMLImageElement) => image.decode());
  await expect
    .poll(() =>
      page.evaluate(() => {
        const probe = window.searchTransitionProbe;
        return probe.starts === probe.finished;
      }),
    )
    .toBe(true);
  await page.getByRole("link", { name: "Blog", exact: true }).click();
  await expect(page.locator(".posts")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const probe = window.searchTransitionProbe;
        return probe.starts === probe.finished;
      }),
    )
    .toBe(true);
  await page.evaluate(() => {
    const probe = window.searchTransitionProbe;
    probe.starts = 0;
    probe.ready = 0;
    probe.finished = 0;
    probe.sourceDialogs = [];
    probe.sourceNames = [];
    probe.sourceBoxes = [];
    probe.captures = [];
    window.scrollTo({ top: 1800, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(1800);
  await page.getByRole("button", { name: "Open search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill(searchTerm);
  const link = page.locator(`.search-result__link[href="${destination}"]`);
  await expect(link).toBeVisible();
  await expect
    .poll(() =>
      link
        .locator("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await link
    .locator("img")
    .evaluate((image: HTMLImageElement) => image.decode());
  await page.locator("dialog[open]").evaluate(async (dialog) => {
    await Promise.all(
      dialog.getAnimations().map((animation) => animation.finished),
    );
  });
  return link;
};

const expectArticle = async (page: Page) => {
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  const heading = page.locator("[data-view-transition-heading]");
  await expect(heading).toHaveText(title);
  await expect(heading).toBeFocused();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator(".post-view-transition__bridge")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/post-view-transition/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(
    await page.evaluate(() => window.searchTransitionProbe.errors),
  ).toEqual([]);
};

test.describe("Search result article continuity", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1280, height: 1000 },
    navigationTimeout: 15_000,
  });
  test.setTimeout(30_000);

  test("A cold pending navigation keeps search visible until the snapshot boundary", async ({
    page,
  }) => {
    await instrument(page);
    await page.goto("/");
    const opener = page.getByRole("button", {
      name: "Open search",
      exact: true,
    });
    await expect(opener).toBeEnabled();
    await page.evaluate((path) => {
      const root = document.querySelector<
        HTMLElement & {
          /** Mounted Nuxt application exposing the real router. */
          __vue_app__: { $nuxt: { $router: Router } };
        }
      >("#__nuxt");
      const unregister = root!.__vue_app__.$nuxt.$router.beforeEach((to) => {
        if (to.path === path) {
          window.searchNavigationPending = true;
          return new Promise<void>((resolve) => {
            window.releaseSearchNavigation = () => {
              unregister();
              resolve();
            };
          });
        }
      });
    }, destination);
    await opener.click();
    await page
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill(searchTerm);
    const link = page.locator(`.search-result__link[href="${destination}"]`);
    await expect(link).toBeVisible();
    await Promise.all([
      link.click({ noWaitAfter: true }),
      (async () => {
        await expect
          .poll(() => page.evaluate(() => window.searchNavigationPending))
          .toBe(true);
        await expect(
          page.getByRole("dialog", { name: "Search", exact: true }),
        ).toBeVisible();
        await expect(link).toBeVisible();
        expect(
          await page.evaluate(() => window.searchTransitionProbe.starts),
        ).toBe(0);
        await page.evaluate(() => {
          window.releaseSearchNavigation!();
        });
      })(),
    ]);
    await expectArticle(page);
    expect(
      await page.evaluate(() => window.searchTransitionProbe.sourceDialogs),
    ).toEqual([0]);
  });

  for (const activation of ["mouse", "Enter"] as const) {
    test(`Captures only the selected image, without a modal, using ${activation}`, async ({
      page,
    }) => {
      await instrument(page);
      const link = await openResult(page);
      const source = await link.locator("img").boundingBox();
      const sourceScroll = await page.evaluate(() => scrollY);
      expect(source).not.toBeNull();
      await activators[activation](link);
      await expectArticle(page);
      const probe = await page.evaluate(() => window.searchTransitionProbe);
      expect(probe.starts).toBe(1);
      expect(probe.ready).toBe(1);
      expect(probe.finished).toBe(1);
      expect(probe.sourceDialogs).toEqual([0]);
      expect(probe.sourceNames).toEqual([1]);
      expect(probe.sourceBoxes).toHaveLength(1);
      expect(probe.sourceBoxes[0]!.x).toBeCloseTo(source!.x, 0);
      expect(probe.sourceBoxes[0]!.y).toBeCloseTo(source!.y, 0);
      expect(probe.sourceBoxes[0]!.width).toBeCloseTo(source!.width, 0);
      expect(probe.sourceBoxes[0]!.height).toBeCloseTo(source!.height, 0);
      expect(probe.captures).toEqual([
        {
          dialogs: 0,
          focus: await page
            .locator("[data-view-transition-heading]")
            .getAttribute("id"),
          names: 1,
          heroAnimations: 1,
          scrollY: 0,
        },
      ]);

      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => !!document.activeElement?.closest("dialog")),
      ).toBe(false);
      await page.goBack();
      await expect(page).toHaveURL(new URL("/", page.url()).href);
      await expect(page.locator(".posts")).toBeVisible();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(sourceScroll);
    });
  }

  for (const fallback of [
    {
      name: "unsupported",
      unsupported: true,
      reducedMotion: "no-preference",
      forcedColors: "none",
    },
    {
      name: "reduced motion",
      unsupported: false,
      reducedMotion: "reduce",
      forcedColors: "none",
    },
    {
      name: "forced colours",
      unsupported: false,
      reducedMotion: "no-preference",
      forcedColors: "active",
    },
  ] as const) {
    test(`Closes search and focuses the article with ${fallback.name}`, async ({
      page,
    }) => {
      await page.emulateMedia({
        reducedMotion: fallback.reducedMotion,
        forcedColors: fallback.forcedColors,
      });
      await instrument(page, fallback.unsupported);
      const link = await openResult(page);
      await link.press("Enter");
      await expectArticle(page);
      expect(
        await page.evaluate(() => window.searchTransitionProbe.starts),
      ).toBe(0);
    });
  }

  test("Modified activation preserves the dialog, real link, and query", async ({
    page,
  }) => {
    await instrument(page);
    const link = await openResult(page);
    await expect(link).toHaveAttribute("href", destination);
    await link.click({ modifiers: ["ControlOrMeta"] });
    expect(
      await page.evaluate(
        () => window.searchTransitionProbe.modifiedDefaultPrevented,
      ),
    ).toEqual([false]);
    await expect(page).toHaveURL(new URL("/", page.url()).href);
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: "Search", exact: true }),
    ).toHaveValue(searchTerm);
    expect(await page.evaluate(() => window.searchTransitionProbe.starts)).toBe(
      0,
    );
    await expect(page.locator(".post-view-transition__bridge")).toHaveCount(0);
    await link.focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeFocused();
  });

  test("An unavailable result image still closes search and focuses its article", async ({
    page,
  }) => {
    await instrument(page);
    const link = await openResult(page);
    await link.locator("img").evaluate((image) => {
      image.closest("picture")?.querySelector("source")?.remove();
      image.src = "data:image/png,invalid";
    });
    await expect
      .poll(() =>
        link
          .locator("img")
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(0);
    await link.click();
    await expectArticle(page);
    const probe = await page.evaluate(() => window.searchTransitionProbe);
    expect(probe.sourceNames).toEqual([0]);
    expect(probe.sourceDialogs).toEqual([0]);
    expect(probe.ready).toBe(1);
  });

  test("An explicit new-tab link leaves search open without a transition", async ({
    page,
  }) => {
    await instrument(page);
    const link = await openResult(page);
    await link.evaluate((anchor: HTMLAnchorElement) => {
      anchor.target = "_blank";
    });
    const popup = page.waitForEvent("popup");
    await link.click();
    await (await popup).close();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(page.locator(".post-view-transition__bridge")).toHaveCount(0);
    expect(await page.evaluate(() => window.searchTransitionProbe.starts)).toBe(
      0,
    );
  });

  test("A cancelled navigation cleans the image bridge and allows search to reopen", async ({
    page,
  }) => {
    await instrument(page);
    const link = await openResult(page);
    await page.evaluate((path) => {
      const root = document.querySelector<
        HTMLElement & {
          /** Mounted Nuxt application exposing the real router. */
          __vue_app__: { $nuxt: { $router: Router } };
        }
      >("#__nuxt");
      const unregister = root!.__vue_app__.$nuxt.$router.beforeEach((to) => {
        if (to.path === path) {
          unregister();
          return false;
        }
      });
    }, destination);
    await link.press("Enter");
    await expect(page).toHaveURL(new URL("/", page.url()).href);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator(".post-view-transition__bridge")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/post-view-transition/);
    const opener = page.getByRole("button", {
      name: "Open search",
      exact: true,
    });
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    await expect(
      page.getByRole("searchbox", { name: "Search", exact: true }),
    ).toBeFocused();
    await link.press("Enter");
    await expectArticle(page);
  });
});
