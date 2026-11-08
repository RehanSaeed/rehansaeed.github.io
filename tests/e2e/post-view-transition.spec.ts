import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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
  errors: string[];
  captures: Capture[];
  sourceScroll: number[];
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
  }
}

const destination = "/live-streaming-dotnet/";
const destinationContent =
  /\/(?:__nuxt_content\/posts\/sql_dump\.txt|live-streaming-dotnet\/_payload\.json)(?:\?|$)/;
const activators = {
  mouse: (link: Locator) => link.click({ noWaitAfter: true }),
  Enter: (link: Locator) => link.press("Enter", { noWaitAfter: true }),
};
const instrument = async (page: Page) => {
  await page.addInitScript(() => {
    const probe: Probe = {
      starts: 0,
      ready: 0,
      skipped: 0,
      finished: 0,
      errors: [],
      captures: [],
      sourceScroll: [],
      skips: [],
    };
    window.postViewTransitionProbe = probe;
    if (typeof document.startViewTransition !== "function") {
      return;
    }
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      probe.starts++;
      probe.sourceScroll.push(scrollY);
      const started = performance.now();
      const transition = start(update);
      const skip = transition.skipTransition.bind(transition);
      transition.skipTransition = () => {
        probe.skipped++;
        const hero = document.querySelector<HTMLImageElement>(".post__photo");
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
          const hero = document.querySelector<HTMLImageElement>(".post__photo");
          if (!hero) {
            probe.errors.push("Destination hero missing at capture.");
            return;
          }
          const box = hero.getBoundingClientRect();
          probe.captures.push({
            scrollY,
            top: box.top,
            bottom: box.bottom,
            imageReady: hero.complete && hero.naturalWidth > 0,
            names: [
              ...document.querySelectorAll(".post-card__image, .post__photo"),
            ].filter(
              (image) =>
                getComputedStyle(image).viewTransitionName === "post-hero",
            ).length,
            rootName: getComputedStyle(document.documentElement)
              .viewTransitionName,
            focus: document.activeElement?.getAttribute("id") ?? null,
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
    // The deep card is offscreen, so this setup navigation is not eligible.
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
  const link = page.locator(`.post-card__title a[href="${destination}"]`);
  const card = page.locator(".post-card").filter({ has: link });
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
const expectClean = async (page: Page) => {
  await expect(page.locator("html")).not.toHaveClass(/post-view-transition/);
  await expect(page.locator(".post-card__image--view-transition")).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(() => window.postViewTransitionProbe.errors),
  ).toEqual([]);
};

test.describe("Bounded card-to-article hero continuity", () => {
  test.use({
    reducedMotion: "no-preference",
    viewport: { width: 1280, height: 1000 },
    navigationTimeout: 15_000,
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
        expect(capture.rootName).toBe("none");
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

  test("Leaves article neighbours and section anchors unanimated", async ({
    page,
  }) => {
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
    const neighbour = page.locator(".post-navigation a").first();
    await neighbour.click({ noWaitAfter: true });
    await expect(page).not.toHaveURL(
      /\/optimally-configuring-open-telemetry-tracing-for-asp-net-core\//,
    );
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.starts),
    ).toBe(0);
    await expectClean(page);
  });

  test("Skips frozen capture while cold Content is still loading", async ({
    page,
  }) => {
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
        const hero = document.querySelector<HTMLImageElement>(".post__photo");
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
        .toBe(1);
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
    await page.route(destinationContent, (route) => route.abort());
    const link = await prepare(page, false);
    await activators.Enter(link);
    await expect(
      page.getByRole("heading", { name: "404 Not Found", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.postViewTransitionProbe.finished))
      .toBe(1);
    await expectClean(page);
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
    clipped: (page: Page) => page.setViewportSize({ width: 1280, height: 200 }),
  };
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

  test("Does not intercept a card href containing a fragment", async ({
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

  test("Bypasses a broken source hero", async ({ page }) => {
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
    expect(
      await page.evaluate(() => window.postViewTransitionProbe.starts),
    ).toBe(0);
    await expectClean(page);
  });
});
