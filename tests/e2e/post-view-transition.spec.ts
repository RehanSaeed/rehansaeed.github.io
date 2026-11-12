// Warm captures need HTTP caching; the shared routing fixture disables it.
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import type { Router } from "vue-router";

test.use({ trace: "retain-on-failure" });

type Capture = {
  scrollY: number;
  top: number;
  bottom: number;
  imageReady: boolean;
  names: number;
  rootName: string;
  focus: string | null;
};
type Probe = {
  starts: number;
  ready: number;
  skipped: number;
  finished: number;
  failures: string[];
  errors: string[];
  captures: Capture[];
  sourceScroll: number[];
  sourceBoxes: Array<{ x: number; y: number; width: number }>;
  sourceNames: number[];
  activations: Array<{
    destination: string;
    currentPath: string;
    imageReady: boolean;
    top: number;
    bottom: number;
  }>;
  skips: Array<{
    time: number;
    scrollY: number;
    top?: number;
    ready?: boolean;
  }>;
};
declare global {
  interface Window {
    /** Observed native transition lifecycle for the browser regression tests. */
    postViewTransitionProbe: Probe;
    /** Clear observations after warm-up navigation has completed. */
    resetPostViewTransitionProbe: () => void;
  }
}

const destination = "/live-streaming-dotnet/";
const destinationContent = /\/__nuxt_content\/posts\/sql_dump\.txt(?:\?|$)/;
const destinationPayload = /\/live-streaming-dotnet\/_payload\.json(?:\?|$)/;
const forceClientContentQuery = (page: Page) =>
  // An empty devalue payload makes the article query the client Content database.
  page.route(destinationPayload, (route) =>
    route.fulfill({ json: [{ data: 1 }, {}] }),
  );
const activators = {
  mouse: (link: Locator) => link.click({ noWaitAfter: true }),
  Enter: (link: Locator) => link.press("Enter", { noWaitAfter: true }),
};
const instrument = async (page: Page) => {
  await page.addInitScript(() => {
    const createProbe = (): Probe => ({
      starts: 0,
      ready: 0,
      skipped: 0,
      finished: 0,
      failures: [],
      errors: [],
      captures: [],
      sourceScroll: [],
      sourceBoxes: [],
      sourceNames: [],
      activations: [],
      skips: [],
    });
    let probe = createProbe();
    window.postViewTransitionProbe = probe;
    window.resetPostViewTransitionProbe = () => {
      probe = createProbe();
      window.postViewTransitionProbe = probe;
    };
    document.addEventListener(
      "click",
      (event) => {
        const link =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>(
                "a[data-view-transition-link], [data-view-transition-link] a",
              )
            : null;
        const image = link
          ?.closest("[data-view-transition-source]")
          ?.querySelector<HTMLImageElement>("img[data-view-transition-image]");
        if (link && image) {
          const box = image.getBoundingClientRect();
          probe.activations.push({
            destination: link.pathname,
            currentPath: location.pathname,
            imageReady: image.complete && image.naturalWidth > 0,
            top: box.top,
            bottom: box.bottom,
          });
        }
      },
      { capture: true },
    );
    if (typeof document.startViewTransition !== "function") {
      return;
    }
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      probe.starts++;
      probe.sourceScroll.push(scrollY);
      const source = document
        .querySelector(
          "[data-view-transition-source] .post-view-transition__hero",
        )
        ?.getBoundingClientRect();
      if (source) {
        probe.sourceBoxes.push({
          x: source.x,
          y: source.y,
          width: source.width,
        });
      }
      const sourceNames = [
        ...document.querySelectorAll("img[data-view-transition-image]"),
      ].filter(
        (image) => getComputedStyle(image).viewTransitionName === "post-hero",
      ).length;
      probe.sourceNames.push(sourceNames);
      const started = performance.now();
      const transition = start(update);
      const skip = transition.skipTransition.bind(transition);
      transition.skipTransition = () => {
        probe.skipped++;
        const hero = document.querySelector<HTMLImageElement>(
          "[data-view-transition-destination] img[data-view-transition-image]",
        );
        probe.skips.push({
          time: performance.now() - started,
          scrollY,
          top: hero?.getBoundingClientRect().top,
          ready: hero ? hero.complete && hero.naturalWidth > 0 : undefined,
        });
        skip();
      };
      void transition.ready.then(
        () => {
          probe.ready++;
          const hero = document.querySelector<HTMLImageElement>(
            "[data-view-transition-destination] img[data-view-transition-image]",
          );
          if (!hero) {
            if (sourceNames > 0) {
              probe.errors.push("Destination hero missing at capture.");
            }
            return;
          }
          const box = hero.getBoundingClientRect();
          probe.captures.push({
            scrollY,
            top: box.top,
            bottom: box.bottom,
            imageReady: hero.complete && hero.naturalWidth > 0,
            names: [
              ...document.querySelectorAll("img[data-view-transition-image]"),
            ].filter(
              (image) =>
                getComputedStyle(image).viewTransitionName === "post-hero",
            ).length,
            rootName: getComputedStyle(document.documentElement)
              .viewTransitionName,
            focus: document.activeElement?.getAttribute("id") ?? null,
          });
        },
        async (error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          try {
            await transition.updateCallbackDone;
          } catch (updateError) {
            // Navigation rejections are asserted through finished, not as capture errors.
            if (Object.is(error, updateError)) {
              return;
            }
          }
          probe.errors.push(String(error));
        },
      );
      void transition.finished.then(
        () => probe.finished++,
        (error: unknown) => probe.failures.push(String(error)),
      );
      return transition;
    };
  });
};

const resetProbe = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const probe = window.postViewTransitionProbe;
        return probe.finished + probe.failures.length === probe.starts;
      }),
    )
    .toBe(true);
  await page.evaluate(() => {
    window.resetPostViewTransitionProbe();
  });
};

const prepare = async (page: Page, warm = true) => {
  await instrument(page);
  await page.goto("/", { waitUntil: "commit" });
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  if (warm) {
    // Warm the actual client Content and article picture, not just SSR data.
    // The offscreen source uses only the default page fade during warm-up.
    await page
      .locator(`.post-card__title a[href="${destination}"]`)
      .evaluate((anchor: HTMLAnchorElement) => {
        anchor.click();
      });
    await expect(page.locator(".post-page__title-container h1")).toHaveText(
      "Live Streaming .NET",
    );
    await page
      .locator(".post__photo")
      .evaluate((image: HTMLImageElement) => image.decode());
    await page
      .getByRole("link", { name: "Blog", exact: true })
      .click({ noWaitAfter: true });
  }
  await expect(page.locator(".posts")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => document.fonts.status))
    .toBe("loaded");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  const card = page.locator(`.post-card[data-post-permalink="${destination}"]`);
  const link = card.locator(".post-card__title a");
  await card.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      card
        .locator("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await card
    .locator("img")
    .evaluate((image: HTMLImageElement) => image.decode());
  await card.locator("img").evaluate((image) => {
    image.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await link.focus();
  await card.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await resetProbe(page);
  return link;
};

const expectDestination = async (page: Page) => {
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  await expect(page.locator(".post-page__title-container h1")).toHaveText(
    "Live Streaming .NET",
  );
  await expect(page.locator(".nuxt-route-announcer")).toContainText(
    "Live Streaming .NET",
  );
};
const expectClean = async (page: Page, expectedFailures = 0) => {
  await expect(page.locator("html")).not.toHaveClass(/post-view-transition/);
  await expect(page.locator(".post-view-transition__hero")).toHaveCount(0);
  expect(
    await page.evaluate(() => window.postViewTransitionProbe.errors),
  ).toEqual([]);
  expect(
    await page.evaluate(() => window.postViewTransitionProbe.failures),
  ).toHaveLength(expectedFailures);
};

const expectFadeWithoutHero = async (page: Page) => {
  await expect
    .poll(() => page.evaluate(() => window.postViewTransitionProbe.finished))
    .toBe(1);
  const probe = await page.evaluate(() => window.postViewTransitionProbe);
  expect(probe.starts).toBe(1);
  expect(probe.ready).toBe(1);
  expect(probe.skipped).toBe(0);
  expect(probe.sourceNames).toEqual([0]);
  for (const capture of probe.captures) {
    expect(capture.names).toBe(0);
    expect(capture.rootName).toBe("root");
  }
  await expectClean(page);
};

const pauseTransitions = async (page: Page) => {
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      const transition = start(update);
      void transition.ready.then(
        () => {
          for (const animation of document.getAnimations()) {
            if (
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement?.includes("view-transition")
            ) {
              animation.pause();
              animation.currentTime = 0;
            }
          }
        },
        (error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            window.postViewTransitionProbe.errors.push(String(error));
          }
        },
      );
      return transition;
    };
  });
};

const finishTransitions = (page: Page) =>
  page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (
        animation.effect instanceof KeyframeEffect &&
        animation.effect.pseudoElement?.includes("view-transition")
      ) {
        animation.finish();
      }
    }
  });

test.describe("Bounded card-to-article hero continuity", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1280, height: 1000 },
    navigationTimeout: 15_000,
  });

  test.afterEach(async ({ page }) => {
    if (!page.isClosed()) {
      await test.info().attach("transition-lifecycle", {
        body: JSON.stringify(
          await page.evaluate(() => window.postViewTransitionProbe),
          null,
          2,
        ),
        contentType: "application/json",
      });
    }
  });

  test.describe("Warmed captures", () => {
    for (const activation of ["mouse", "Enter"] as const) {
      test(`Captures the warmed hero after deep-scroll restoration using ${activation}`, async ({
        page,
      }) => {
        const link = await prepare(page);
        const before = await page.evaluate(() => scrollY);
        expect(before).toBeGreaterThan(2000);
        const sourceScreenshot = test
          .info()
          .outputPath("listing-before-transition.png");
        await page.screenshot({ path: sourceScreenshot });
        await test.info().attach("listing-before-transition", {
          path: sourceScreenshot,
          contentType: "image/png",
        });
        await activators[activation](link);
        await expect
          .poll(() =>
            page.evaluate(() => window.postViewTransitionProbe.starts),
          )
          .toBe(1);
        await expectDestination(page);
        await expect
          .poll(() =>
            page.evaluate(() => window.postViewTransitionProbe.finished),
          )
          .toBe(1);
        const probe = await page.evaluate(() => window.postViewTransitionProbe);
        const measurements = test.info().outputPath("hero-capture.json");
        await writeFile(measurements, JSON.stringify(probe, null, 2));
        await test.info().attach("hero-capture", {
          path: measurements,
          contentType: "application/json",
        });
        expect(probe.starts).toBe(1);
        expect(probe.ready).toBe(1);
        expect(probe.skipped).toBe(0);
        expect(probe.captures).toHaveLength(1);
        const capture = probe.captures[0]!;
        expect(capture.scrollY).toBe(0);
        expect(capture.top).toBeGreaterThanOrEqual(0);
        expect(capture.bottom).toBeLessThanOrEqual(1000);
        expect(capture.imageReady).toBe(true);
        expect(capture.names).toBe(1);
        expect(capture.rootName).toBe("root");
        expect(capture.focus).toBe(
          await page
            .locator(".post-page__title-container h1")
            .getAttribute("id"),
        );
        await expect(
          page.locator(".post-page__title-container h1"),
        ).toBeFocused();
        await expectClean(page);
        const targetScreenshot = test
          .info()
          .outputPath("article-after-transition.png");
        await page.screenshot({ path: targetScreenshot });
        await test.info().attach("article-after-transition", {
          path: targetScreenshot,
          contentType: "image/png",
        });

        await page.goBack();
        await expect(page.locator(".posts")).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(
              (expected) => Math.abs(scrollY - expected),
              probe.sourceScroll[0]!,
            ),
          )
          .toBeLessThanOrEqual(2);
        expect(
          await page.evaluate(() => window.postViewTransitionProbe.starts),
        ).toBe(1);
        await page.goForward();
        await expectDestination(page);
        expect(
          await page.evaluate(() => window.postViewTransitionProbe.starts),
        ).toBe(1);
        await expectClean(page);
      });
    }
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`Keeps mobile hero continuity in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 1000 });
      await page.emulateMedia({ colorScheme });
      const link = await prepare(page);
      await activators.Enter(link);
      await expectDestination(page);
      await expect
        .poll(() =>
          page.evaluate(() => window.postViewTransitionProbe.finished),
        )
        .toBe(1);
      const probe = await page.evaluate(() => window.postViewTransitionProbe);
      expect(probe.ready).toBe(1);
      expect(probe.captures[0]!.scrollY).toBe(0);
      expect(probe.captures[0]!.top).toBeGreaterThanOrEqual(0);
      expect(probe.captures[0]!.bottom).toBeLessThanOrEqual(1000);
      await expect(
        page.locator(".post-page__title-container h1"),
      ).toBeFocused();
      await expectClean(page);
    });
  }

  test("Moves the shared image when the destination extends below a laptop viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const link = await prepare(page);
    await pauseTransitions(page);
    try {
      await activators.Enter(link);
      await expectDestination(page);
      await expect
        .poll(() => page.evaluate(() => window.postViewTransitionProbe.ready))
        .toBe(1);
      const capture = await page.evaluate(
        () => window.postViewTransitionProbe.captures[0]!,
      );
      expect(capture.top).toBeLessThan(720);
      expect(capture.bottom).toBeGreaterThan(720);
      const samples = [];
      for (const time of [0, 100, 200]) {
        samples.push(
          await page.evaluate((currentTime) => {
            for (const animation of document.getAnimations()) {
              if (
                animation.effect instanceof KeyframeEffect &&
                animation.effect.pseudoElement?.includes("view-transition")
              ) {
                animation.currentTime = currentTime;
              }
            }
            const style = getComputedStyle(
              document.documentElement,
              "::view-transition-group(post-hero)",
            );
            return {
              x: new DOMMatrixReadOnly(style.transform).m41,
              y: new DOMMatrixReadOnly(style.transform).m42,
              width: Number.parseFloat(style.width),
              oldPageOpacity: Number.parseFloat(
                getComputedStyle(
                  document.documentElement,
                  "::view-transition-old(root)",
                ).opacity,
              ),
              newPageOpacity: Number.parseFloat(
                getComputedStyle(
                  document.documentElement,
                  "::view-transition-new(root)",
                ).opacity,
              ),
            };
          }, time),
        );
        const path = test.info().outputPath(`hero-movement-${time}ms.png`);
        await page.screenshot({ path });
        await test.info().attach(`hero-movement-${time}ms`, {
          path,
          contentType: "image/png",
        });
      }
      const [source, midpoint, target] = samples;
      const original = await page.evaluate(
        () => window.postViewTransitionProbe.sourceBoxes[0]!,
      );
      expect(source!.x).toBeCloseTo(original.x, 0);
      expect(source!.y).toBeCloseTo(original.y, 0);
      expect(source!.width).toBeCloseTo(original.width, 0);
      expect(Math.abs(target!.y - source!.y)).toBeGreaterThan(50);
      expect(midpoint!.y).toBeGreaterThan(Math.min(source!.y, target!.y));
      expect(midpoint!.y).toBeLessThan(Math.max(source!.y, target!.y));
      expect(target!.y).toBeCloseTo(capture.top, 0);
      expect(midpoint!.width).toBeGreaterThan(source!.width);
      expect(midpoint!.width).toBeLessThan(target!.width);
      expect(source!.oldPageOpacity).toBe(1);
      expect(source!.newPageOpacity).toBe(0);
      expect(midpoint!.oldPageOpacity).toBeGreaterThan(0);
      expect(midpoint!.oldPageOpacity).toBeLessThan(1);
      expect(midpoint!.newPageOpacity).toBeGreaterThan(0);
      expect(midpoint!.newPageOpacity).toBeLessThan(1);
      await test.info().attach("hero-movement-measurements", {
        body: JSON.stringify(samples, null, 2),
        contentType: "application/json",
      });
    } finally {
      await finishTransitions(page);
    }
    await expectClean(page);
  });

  test("Leaves article section anchors unanimated", async ({ page }) => {
    await instrument(page);
    await page.goto(
      "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
      { waitUntil: "commit" },
    );
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled();
    const anchor = page.locator(".post__content a.anchor-link").first();
    await anchor.scrollIntoViewIfNeeded();
    await anchor.click({ noWaitAfter: true });
    await expect(page).toHaveURL(/#.+$/);
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.starts),
    ).toBe(0);
    await expectClean(page);
  });

  test("Finds a hero source independently of title styling classes", async ({
    page,
  }) => {
    await prepare(page);
    const link = page.locator(
      `[data-view-transition-source][data-post-permalink="${destination}"] [data-view-transition-link] a`,
    );
    await link.evaluate((anchor) => {
      anchor.closest("[data-view-transition-link]")?.removeAttribute("class");
    });
    await activators.Enter(link);
    await expectDestination(page);
    await expect
      .poll(() => page.evaluate(() => window.postViewTransitionProbe.finished))
      .toBe(1);
    const probe = await page.evaluate(() => window.postViewTransitionProbe);
    expect(probe.ready).toBe(1);
    expect(probe.skipped).toBe(0);
    expect(probe.sourceNames).toEqual([1]);
    expect(probe.captures[0]!.names).toBe(1);
    await expectClean(page);
  });

  test("Animates a listing title when its source image is partly above the viewport", async ({
    page,
  }) => {
    const link = await prepare(page);
    await link.evaluate((anchor) => {
      window.scrollBy({
        top: anchor.getBoundingClientRect().top - 120,
        behavior: "instant",
      });
    });
    const image = page.locator(
      `.post-card[data-post-permalink="${destination}"] img`,
    );
    const source = await image.boundingBox();
    expect(source!.y).toBeLessThan(0);
    expect(source!.y + source!.height).toBeGreaterThan(0);
    const title = await link.boundingBox();
    expect(title!.y).toBeGreaterThanOrEqual(0);
    expect(title!.y + title!.height).toBeLessThanOrEqual(1000);
    // Locator activation scrolls stretched links and changes the source geometry.
    await page.mouse.click(
      title!.x + title!.width / 2,
      title!.y + title!.height / 2,
    );
    await expectDestination(page);
    await expect
      .poll(() => page.evaluate(() => window.postViewTransitionProbe.finished))
      .toBe(1);
    const probe = await page.evaluate(() => window.postViewTransitionProbe);
    expect(probe.ready).toBe(1);
    expect(probe.skipped).toBe(0);
    expect(probe.sourceBoxes[0]!.y).toBeLessThan(0);
    expect(probe.sourceNames).toEqual([1]);
    await expectClean(page);
  });

  for (const direction of ["prev", "next"] as const) {
    test(`Animates the ${direction} article thumbnail without naming the current hero`, async ({
      page,
    }) => {
      await instrument(page);
      await page.goto(destination, { waitUntil: "commit" });
      await expect(
        page.getByRole("button", { name: "Open search", exact: true }),
      ).toBeEnabled();
      const link = page.locator(`.post-navigation__link[rel="${direction}"]`);
      const href = await link.getAttribute("href");
      const title = await link.locator(".post-navigation__title").innerText();
      // Warm the destination through an offscreen source, using only a page fade.
      await link.evaluate((anchor: HTMLAnchorElement) => {
        anchor.click();
      });
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(".post-page__title-container h1")).toHaveText(
        title,
      );
      await page
        .locator(".post__photo")
        .evaluate((image: HTMLImageElement) => image.decode());
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      await expect(page.locator(".post-page__title-container h1")).toHaveText(
        "Live Streaming .NET",
      );
      // Let Nuxt's deferred history scroll finish before positioning lazy media.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          }),
      );
      await link.locator("img").evaluate((image) => {
        image.scrollIntoView({ block: "center", behavior: "instant" });
      });
      await link
        .locator("img")
        .evaluate((image: HTMLImageElement) => image.decode());
      await resetProbe(page);
      await activators.mouse(link);
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(".post-page__title-container h1")).toHaveText(
        title,
      );
      await expect(page.locator(".nuxt-route-announcer")).toContainText(title);
      await expect
        .poll(() =>
          page.evaluate(() => window.postViewTransitionProbe.finished),
        )
        .toBe(1);
      const probe = await page.evaluate(() => window.postViewTransitionProbe);
      expect(probe.starts).toBe(1);
      expect(probe.ready).toBe(1);
      expect(probe.skipped).toBe(0);
      expect(probe.sourceNames).toEqual([1]);
      expect(probe.captures[0]!.names).toBe(1);
      expect(probe.captures[0]!.scrollY).toBe(0);
      await expect(
        page.locator(".post-page__title-container h1"),
      ).toBeFocused();
      await expectClean(page);
    });
  }

  test("Skips frozen capture while cold Content is still loading", async ({
    page,
  }) => {
    await forceClientContentQuery(page);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let intercepted = false;
    await page.route(destinationContent, async (route) => {
      const response = await route.fetch();
      const body = await response.body();
      intercepted = true;
      await blocked;
      await route.fulfill({ response, body });
    });
    try {
      const link = await prepare(page, false);
      await activators.Enter(link);
      await expect.poll(() => intercepted).toBe(true);
      await expect
        .poll(() => page.evaluate(() => window.postViewTransitionProbe.skipped))
        .toBeGreaterThan(0);
      expect(
        await page.evaluate(() => window.postViewTransitionProbe.ready),
      ).toBe(0);
    } finally {
      release();
    }
    await expectDestination(page);
    await expect
      .poll(() => page.evaluate(() => window.postViewTransitionProbe.finished))
      .toBe(1);
    await expectClean(page);
  });

  test("Does not wait for an unavailable destination image", async ({
    page,
  }) => {
    const link = await prepare(page);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let intercepted = false;
    await page.route("**/unavailable-destination-hero", async (route) => {
      intercepted = true;
      await blocked;
      await route.abort();
    });
    await page.evaluate(() => {
      const observer = new MutationObserver(() => {
        const hero = document.querySelector<HTMLImageElement>(
          "[data-view-transition-destination] img[data-view-transition-image]",
        );
        if (!hero) {
          return;
        }
        observer.disconnect();
        hero
          .closest("picture")
          ?.querySelectorAll("source")
          .forEach((source) => {
            source.remove();
          });
        hero.removeAttribute("srcset");
        hero.src = "/unavailable-destination-hero";
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    try {
      await activators.Enter(link);
      await expectDestination(page);
      await expect.poll(() => intercepted).toBe(true);
      await expect
        .poll(() =>
          page.evaluate(() => window.postViewTransitionProbe.finished),
        )
        .toBe(1);
      expect(
        await page.evaluate(() => window.postViewTransitionProbe.skipped),
      ).toBeGreaterThan(0);
      expect(
        await page.evaluate(() => window.postViewTransitionProbe.ready),
      ).toBe(0);
      await expectClean(page);
    } finally {
      release();
    }
  });

  test("Cancels a pending transition when another route is selected", async ({
    page,
  }) => {
    await forceClientContentQuery(page);
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let delivered = false;
    await page.route(destinationContent, async (route) => {
      const response = await route.fetch();
      const body = await response.body();
      await blocked;
      await route.fulfill({ response, body });
      delivered = true;
    });
    try {
      const link = await prepare(page, false);
      await activators.Enter(link);
      await expect
        .poll(() => page.evaluate(() => window.postViewTransitionProbe.skipped))
        .toBeGreaterThan(0);
      await page
        .getByRole("link", { name: "About", exact: true })
        .click({ noWaitAfter: true });
      await expect(page).toHaveURL(/\/about\/$/);
      await expect
        .poll(() =>
          page.evaluate(() => window.postViewTransitionProbe.finished),
        )
        .toBe(2);
      await expectClean(page);
    } finally {
      release();
    }
    await expect.poll(() => delivered).toBe(true);
    await expect(page).toHaveURL(/\/about\/$/);
    await expectClean(page);
  });

  test("Releases transition state when the destination fails to load", async ({
    page,
  }) => {
    await page.route(destinationPayload, (route) => route.abort());
    await page.route(destinationContent, (route) => route.abort());
    const link = await prepare(page, false);
    await activators.Enter(link);
    await expect(
      page.getByRole("heading", { name: "404 Not Found", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => window.postViewTransitionProbe.failures.length),
      )
      .toBe(1);
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.finished),
    ).toBe(0);
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.ready),
    ).toBe(0);
    await expectClean(page, 1);
    await page
      .getByRole("link", { name: "Go Home", exact: true })
      .click({ noWaitAfter: true });
    await expect(page.locator(".posts")).toBeVisible();
  });

  const bypasses = {
    reduced: (page: Page) => page.emulateMedia({ reducedMotion: "reduce" }),
    "forced-colors": (page: Page) =>
      page.emulateMedia({ forcedColors: "active" }),
    unsupported: (page: Page) =>
      page.addInitScript(() => {
        Object.defineProperty(document, "startViewTransition", {
          value: undefined,
        });
      }),
  };

  test("Cross-fades ordinary pages without naming a hero", async ({ page }) => {
    await prepare(page);
    await pauseTransitions(page);
    try {
      await page
        .getByRole("link", { name: "About", exact: true })
        .click({ noWaitAfter: true });
      await expect(page).toHaveURL(/\/about\/$/);
      await expect
        .poll(() => page.evaluate(() => window.postViewTransitionProbe.ready))
        .toBe(1);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      const samples = [];
      for (const progress of [0, 0.5, 1]) {
        samples.push(
          await page.evaluate((fraction) => {
            for (const animation of document.getAnimations()) {
              const effect = animation.effect;
              if (
                effect instanceof KeyframeEffect &&
                effect.pseudoElement?.includes("view-transition")
              ) {
                const duration = effect.getTiming().duration;
                if (typeof duration === "number") {
                  animation.currentTime = duration * fraction;
                }
              }
            }
            return {
              old: Number.parseFloat(
                getComputedStyle(
                  document.documentElement,
                  "::view-transition-old(root)",
                ).opacity,
              ),
              new: Number.parseFloat(
                getComputedStyle(
                  document.documentElement,
                  "::view-transition-new(root)",
                ).opacity,
              ),
            };
          }, progress),
        );
        const path = test.info().outputPath(`page-fade-${progress}.png`);
        await page.screenshot({ path });
        await test.info().attach(`page-fade-${progress}`, {
          path,
          contentType: "image/png",
        });
      }
      const [source, midpoint, target] = samples;
      expect(source).toEqual({ old: 1, new: 0 });
      expect(midpoint!.old).toBeGreaterThan(0);
      expect(midpoint!.old).toBeLessThan(1);
      expect(midpoint!.new).toBeGreaterThan(0);
      expect(midpoint!.new).toBeLessThan(1);
      expect(target).toEqual({ old: 0, new: 1 });
    } finally {
      await finishTransitions(page);
    }
    await expectFadeWithoutHero(page);
  });

  for (const [bypass, configure] of Object.entries(bypasses)) {
    test(`Leaves ${bypass} navigation unanimated`, async ({ page }) => {
      await configure(page);
      const link = await prepare(page);
      await activators.Enter(link);
      await expectDestination(page);
      expect(
        await page.evaluate(() => window.postViewTransitionProbe.starts),
      ).toBe(0);
      await expectClean(page);
    });
  }

  test("Uses only a page fade for a completely offscreen source", async ({
    page,
  }) => {
    const link = await prepare(page);
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    const source = await page
      .locator(`.post-card[data-post-permalink="${destination}"] img`)
      .boundingBox();
    expect(source!.y).toBeGreaterThanOrEqual(1000);
    await link.evaluate((anchor: HTMLAnchorElement) => {
      anchor.click();
    });
    await expectDestination(page);
    await expectFadeWithoutHero(page);
  });

  test("Does not name a hero when the DOM href differs from the router destination", async ({
    page,
  }) => {
    const link = await prepare(page);
    await link.evaluate((anchor: HTMLAnchorElement) => {
      anchor.hash = "main";
    });
    await activators.Enter(link);
    await expect(page.locator(".post-page__title-container h1")).toHaveText(
      "Live Streaming .NET",
    );
    // NuxtLink navigates its `to` prop, not a subsequently mutated DOM href.
    await expectDestination(page);
    await expectFadeWithoutHero(page);
  });

  test("Does not animate an in-app fragment destination", async ({ page }) => {
    await prepare(page);
    await page.evaluate(async (to) => {
      const root = document.querySelector<
        HTMLElement & {
          /** Mounted Vue application, used to exercise real router navigation. */
          __vue_app__: {
            /** Nuxt application owning the router under test. */
            $nuxt: {
              /** Real SPA router; no document navigation or URL-only mutation. */
              $router: Router;
            };
          };
        }
      >("#__nuxt");
      await root!.__vue_app__.$nuxt.$router.push(to);
    }, `${destination}#main`);
    await expect(page).toHaveURL(new RegExp(`${destination}#main$`));
    await expect(page.locator(".post-page__title-container h1")).toHaveText(
      "Live Streaming .NET",
    );
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.starts),
    ).toBe(0);
    await expectClean(page);
  });

  test("Preserves new-tab activation", async ({ page }) => {
    const link = await prepare(page);
    await link.evaluate((anchor: HTMLAnchorElement) => {
      anchor.target = "_blank";
    });
    const popup = page.waitForEvent("popup");
    await link.click({ noWaitAfter: true });
    await (await popup).close();
    await expect(page.locator(".posts")).toBeVisible();
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.starts),
    ).toBe(0);
    await expectClean(page);
  });

  test("Uses only a page fade for a broken source hero", async ({ page }) => {
    const link = await prepare(page);
    await page.route("**/unavailable-post-hero", (route) => route.abort());
    await link.evaluate((anchor) => {
      const image = anchor
        .closest(".post-card")
        ?.querySelector<HTMLImageElement>("img");
      image
        ?.closest("picture")
        ?.querySelectorAll("source")
        .forEach((source) => {
          source.remove();
        });
      if (image) {
        image.removeAttribute("srcset");
        image.src = "/unavailable-post-hero";
      }
    });
    await expect
      .poll(() =>
        link.evaluate(
          (anchor) =>
            anchor.closest(".post-card")?.querySelector<HTMLImageElement>("img")
              ?.naturalWidth,
        ),
      )
      .toBe(0);
    await activators.Enter(link);
    await expectDestination(page);
    await expectFadeWithoutHero(page);
  });
});
