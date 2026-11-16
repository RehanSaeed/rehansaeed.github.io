import { expect, test, type Locator } from "@playwright/test";

const choosePaginationImage = async (group: Locator, target: number) => {
  const control = group.getByRole("button", {
    name: new RegExp(`Select image ${target + 1} of 3$`),
  });
  await control.click();
  return control;
};
const previousPaginationImage = async (group: Locator) => {
  const control = group.getByRole("button", { name: /Previous image$/ });
  await control.click();
  return control;
};
const selectPaginationImage = async (group: Locator, target: number) => {
  const control = group.getByRole("combobox");
  await control.selectOption(String(target));
  return control;
};
const paginationActivators: readonly ((
  group: Locator,
  target: number,
) => Promise<Locator>)[] = [
  choosePaginationImage,
  choosePaginationImage,
  choosePaginationImage,
  choosePaginationImage,
  choosePaginationImage,
  choosePaginationImage,
  choosePaginationImage,
  previousPaginationImage,
  selectPaginationImage,
  choosePaginationImage,
];

declare global {
  interface Window {
    /** Bounded event-time evidence, enabled only by the manual carousel diagnostic. */
    carouselDiagnostic?: {
      /** Pointer, scroll and layout observations in delivery order. */
      events: Record<string, unknown>[];
      /** Number of observations omitted after reaching the limit. */
      dropped: number;
    };
  }
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ status: 204 }),
  );
  if (process.env.CAROUSEL_DIAGNOSTIC === "1") {
    await page.addInitScript(() => {
      const probe = { events: [] as Record<string, unknown>[], dropped: 0 };
      window.carouselDiagnostic = probe;
      const label = (value: EventTarget | null) =>
        value instanceof Element
          ? `${value.tagName}.${value.className}`
          : value === window
            ? "window"
            : "document";
      const record = (kind: string, event?: Event) => {
        if (probe.events.length >= 512) {
          probe.dropped++;
          return;
        }
        const gallery =
          (event?.target instanceof Element
            ? event.target.closest(".carousel")
            : null) ?? document.querySelector(".carousel:has(figure)");
        const track = gallery?.querySelector(".carousel__track");
        const image = gallery?.querySelector("img");
        const bounds = image?.getBoundingClientRect();
        const pointer = event instanceof PointerEvent ? event : undefined;
        probe.events.push({
          kind,
          time: performance.now(),
          scrollY,
          target: label(event?.target ?? null),
          active: label(document.activeElement),
          prevented: event?.defaultPrevented,
          pointer: pointer && {
            id: pointer.pointerId,
            x: pointer.clientX,
            y: pointer.clientY,
            buttons: pointer.buttons,
            hit: label(
              document.elementFromPoint(pointer.clientX, pointer.clientY),
            ),
            captured:
              track instanceof Element &&
              track.hasPointerCapture(pointer.pointerId),
          },
          trackId: track?.id,
          scrollLeft: track?.scrollLeft,
          image: bounds && {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            complete: image?.complete,
            naturalWidth: image?.naturalWidth,
          },
        });
      };
      for (const type of [
        "pointerdown",
        "pointermove",
        "pointerup",
        "pointercancel",
        "gotpointercapture",
        "lostpointercapture",
        "focusin",
        "scroll",
      ]) {
        for (const capture of [true, false]) {
          window.addEventListener(
            type,
            (event) => {
              if (
                !(event instanceof PointerEvent) ||
                type !== "pointermove" ||
                event.buttons
              ) {
                record(`${type}:${capture ? "capture" : "bubble"}`, event);
              }
            },
            { capture, passive: true },
          );
        }
      }
      document.addEventListener("DOMContentLoaded", () => {
        const observer = new ResizeObserver(() => {
          record("resize");
        });
        for (const element of document.querySelectorAll(
          ".carousel__track, .carousel img",
        )) {
          observer.observe(element);
        }
      });
      document.fonts.addEventListener("loadingdone", () => {
        record("fonts:loadingdone");
      });
      if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
        new PerformanceObserver(() => {
          record("layout-shift");
        }).observe({ type: "layout-shift", buffered: true });
      }
    });
  }
});

test.afterEach(async ({ page }, testInfo) => {
  if (process.env.CAROUSEL_DIAGNOSTIC === "1" && !page.isClosed()) {
    testInfo.annotations.push({
      type: "diagnostic",
      description: "Event-time layout observations may affect timing.",
    });
    await testInfo.attach("carousel-events", {
      contentType: "application/json",
      body: JSON.stringify(
        await page.evaluate(() => window.carouselDiagnostic ?? null),
        null,
        2,
      ),
    });
  }
});

for (const width of [1440, 640, 375, 320]) {
  test(`Gallery preserves article image sizing and full-bleed rail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    const track = gallery.getByRole("list", { name: "Gallery images" });
    await expect(track.locator(":scope > li")).toHaveCount(3);
    await expect(gallery.locator(".prose-image").nth(1)).toHaveCSS(
      "transform",
      "none",
    );
    await expect(gallery.locator("figure")).toHaveCount(3);
    await expect(gallery.locator("figcaption").first()).toHaveText(
      "The first gallery image retains its link.",
    );
    await expect(gallery.getByRole("link")).toHaveAttribute(
      "href",
      "/css-general-rules-of-thumb/",
    );
    const normal = page.locator(".post__content > figure img").first();
    const image = gallery.locator("img").first();
    await gallery.scrollIntoViewIfNeeded();
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const [reference, current, rail, caption, referenceCaption] =
        await Promise.all([
          normal.boundingBox(),
          image.boundingBox(),
          track.boundingBox(),
          gallery.locator("figcaption").first().boundingBox(),
          page
            .locator(".post__content > figure > figcaption")
            .first()
            .boundingBox(),
        ]);
      expect(reference).not.toBeNull();
      expect(current).not.toBeNull();
      expect(rail).not.toBeNull();
      expect(caption).not.toBeNull();
      expect(referenceCaption).not.toBeNull();
      expect(current!.width).toBeCloseTo(reference!.width, 0);
      expect(current!.height).toBeCloseTo(reference!.height, 0);
      expect(current!.x).toBeCloseTo(reference!.x, 0);
      expect(rail!.x).toBeCloseTo(0, 0);
      expect(rail!.width).toBeCloseTo(width, 0);
      expect(caption!.x).toBeCloseTo(referenceCaption!.x, 0);
      expect(caption!.width).toBeCloseTo(referenceCaption!.width, 0);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
    const next = gallery.getByRole("button", {
      name: "Next image",
      exact: true,
    });
    const previous = gallery.getByRole("button", {
      name: "Previous image",
      exact: true,
    });
    await expect(previous).toHaveCount(0);
    await expect(
      gallery.getByRole("button", {
        name: "Previous image",
        exact: true,
        includeHidden: true,
      }),
    ).toHaveAttribute("aria-disabled", "true");
    await image.hover();
    await expect(next).toHaveCSS(
      "font-size",
      await track.evaluate((element) => getComputedStyle(element).fontSize),
    );
    await next.click();
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await next.click();
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await expect(next).toHaveCount(0);
    await expect(
      gallery.getByRole("button", {
        name: "Next image",
        exact: true,
        includeHidden: true,
      }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(track).toBeFocused();
    await track.press("ArrowRight");
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await track.focus();
    await track.press("Home");
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 1 of 3",
    );
    await track.press("ArrowRight");
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await page.setViewportSize({
      width: width === 320 ? 640 : 320,
      height: 700,
    });
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await expect(gallery.locator("img").nth(1)).toBeInViewport();
    await expect
      .poll(() =>
        gallery
          .locator("img")
          .nth(1)
          .evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            return Math.abs(bounds.x + bounds.width / 2 - innerWidth / 2);
          }),
      )
      .toBeLessThanOrEqual(1);
    await track.press("End");
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await gallery.getByRole("link").focus();
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 1 of 3",
    );
    await expect(gallery.getByRole("link")).toBeFocused();
    await page.emulateMedia({ forcedColors: "active" });
    await page.keyboard.press("Shift+Tab");
    await expect(track).toBeFocused();
    await expect(track).toHaveCSS("outline-style", "solid");
    await expect(image).toHaveCSS("opacity", "1");
    await gallery.getByRole("button", { name: "Go to image 3 of 3" }).click();
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 3 of 3",
    );
  });
}

for (const { width, theme, forced } of [
  { width: 1280, theme: "light", forced: false },
  { width: 1280, theme: "dark", forced: false },
  { width: 320, theme: "light", forced: false },
  { width: 320, theme: "dark", forced: false },
  { width: 320, theme: "dark", forced: true },
] as const) {
  test(`Pagination alternatives and animated variations control the gallery at ${width}px in ${theme}${forced ? " forced colours" : ""}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ forcedColors: forced ? "active" : "none" });
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    const options = page.getByRole("region", { name: "Pagination options" });
    const groups = options.getByRole("group", { name: /^\d+\. / });
    await expect(groups).toHaveCount(10);
    for (let index = 0; index < 10; index++) {
      const group = groups.nth(index);
      await expect(group.locator("legend")).toHaveText(
        new RegExp(`^${index + 1}\\. `),
      );
      const target = 1 - (index % 2);
      const control = await paginationActivators[index]!(group, target);
      await expect(gallery.locator(".carousel__position")).toHaveText(
        `Image ${target + 1} of 3`,
      );
      await expect(options.getByRole("combobox")).toHaveValue(String(target));
      await expect(options.locator(".carousel-pagination__counter")).toHaveText(
        `${target + 1} / 3`,
      );
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      // Firefox can report an exact 44px layout as 43.999992 after DOMRect subtraction.
      expect(Number(bounds!.width.toFixed(4))).toBeGreaterThanOrEqual(44);
      expect(Number(bounds!.height.toFixed(4))).toBeGreaterThanOrEqual(44);
    }
    const variations = options.getByRole("group", { name: /^[12][A-C]\. / });
    await expect(variations).toHaveCount(6);
    for (let index = 0; index < 6; index++) {
      const target = 1 - (index % 2);
      const control = await choosePaginationImage(
        variations.nth(index),
        target,
      );
      await expect(control).toHaveAttribute("aria-current", "true");
      await expect(gallery.locator(".carousel__position")).toHaveText(
        `Image ${target + 1} of 3`,
      );
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(Number(bounds!.width.toFixed(4))).toBeGreaterThanOrEqual(44);
      expect(Number(bounds!.height.toFixed(4))).toBeGreaterThanOrEqual(44);
    }
    const secondDot = variations
      .first()
      .getByRole("button", { name: /Select image 2 of 3$/ });
    await secondDot.focus();
    await secondDot.press("Enter");
    await expect(gallery.locator(".carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await expect(secondDot).toHaveAttribute("aria-current", "true");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
  });
}

test("Dot and pill variations animate real selections and stop for reduced motion and forced colours", async ({
  page,
}, testInfo) => {
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const options = page.getByRole("region", { name: "Pagination options" });
  const variations = options.getByRole("group", { name: /^[12][A-C]\. / });
  const evidence: { label: string; start: string[]; middle: string[] }[] = [];
  await expect(variations).toHaveCount(6);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await options.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  for (let index = 0; index < 6; index++) {
    const group = variations.nth(index);
    await group.evaluate((element) => {
      const pause = () => {
        for (const animation of element.getAnimations({ subtree: true })) {
          animation.pause();
        }
      };
      element.addEventListener("animationstart", pause, { once: true });
      element.addEventListener("transitionrun", pause, { once: true });
    });
    const control = await choosePaginationImage(group, 1 - (index % 2));
    await expect(control).toHaveAttribute("aria-current", "true");
    await expect
      .poll(() =>
        group.evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .some(
              (animation) =>
                animation.playState === "paused" &&
                (animation instanceof CSSAnimation ||
                  (animation instanceof CSSTransition &&
                    animation.transitionProperty === "x")),
            ),
        ),
      )
      .toBe(true);
    const samples = await group.evaluate((element) => {
      const animations = element
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation instanceof CSSAnimation ||
            (animation instanceof CSSTransition &&
              animation.transitionProperty === "x"),
        );
      const snapshot = () =>
        [
          ...element.querySelectorAll(
            ".carousel-pagination__dot, .carousel-pagination__capsule",
          ),
        ].flatMap((marker) => [
          getComputedStyle(marker).transform,
          getComputedStyle(marker).getPropertyValue("x"),
          getComputedStyle(marker, "::after").transform,
          getComputedStyle(marker, "::after").opacity,
        ]);
      for (const animation of animations) {
        animation.currentTime = 0;
      }
      const start = snapshot();
      for (const animation of animations) {
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
      const middle = snapshot();
      return { start, middle };
    });
    expect(samples.middle).not.toEqual(samples.start);
    evidence.push({
      label: await group.locator("legend").innerText(),
      ...samples,
    });
    await testInfo.attach(`pagination-${index + 1}-midpoint`, {
      body: await group.screenshot({ animations: "allow" }),
      contentType: "image/png",
    });
    await group.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.finish();
      }
    });
  }
  await testInfo.attach("pagination-animation-samples", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
  await options.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  await testInfo.attach("pagination-overview", {
    body: await options.screenshot({ animations: "allow" }),
    contentType: "image/png",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const control = await choosePaginationImage(variations.first(), 2);
  await expect(control).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() =>
      options.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    )
    .toBe(0);
  await page.emulateMedia({
    reducedMotion: "no-preference",
    forcedColors: "active",
  });
  const forcedControl = await choosePaginationImage(variations.last(), 0);
  await expect(forcedControl).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() =>
      options.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    )
    .toBe(0);
});

test.describe("Continuous scroll-linked motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("interpolates scale and opacity before and after the midpoint without waiting for a slide change", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    const track = gallery.getByRole("list", { name: "Gallery images" });
    await gallery.scrollIntoViewIfNeeded();
    await expect(
      gallery.getByRole("button", { name: "Go to image 1 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    const image = gallery.locator("img").first();
    await image.hover();
    const bounds = await image.boundingBox();
    expect(bounds).not.toBeNull();
    const step = await track.evaluate((element) => {
      const slides = element.querySelectorAll<HTMLElement>(".carousel__slide");
      return slides[1]!.offsetLeft - slides[0]!.offsetLeft;
    });
    const x = bounds!.x + bounds!.width * 0.95;
    const y = bounds!.y + bounds!.height * 0.3;
    expect(x - step).toBeGreaterThan(0);
    await page.mouse.move(x, y);
    await expect(
      gallery.getByRole("button", { name: "Next image", exact: true }),
    ).toBeVisible();
    await expect(gallery.locator(".carousel-arrows__shell").last()).toHaveCSS(
      "opacity",
      "1",
    );
    await page.mouse.down();
    const samples = [];
    for (const fraction of [0, 0.02, 0.2, 0.4, 0.6, 0.8, 1]) {
      const left = Math.round(step * fraction);
      const progress = left / step;
      await page.mouse.move(x - left, y);
      await expect
        .poll(() => track.evaluate((element) => element.scrollLeft))
        .toBeCloseTo(left, 0);
      await expect(
        gallery.locator(".carousel-arrows__button:visible"),
      ).toHaveCount(fraction === 0 ? 1 : 0);
      await expect
        .poll(() =>
          track
            .locator(".prose-image")
            .first()
            .evaluate((element) => Number(getComputedStyle(element).opacity)),
        )
        .toBeCloseTo(1 - progress * 0.55, 2);
      // Avoid main-world role queries: https://github.com/microsoft/playwright/issues/43967.
      samples.push(
        await track.evaluate((element) =>
          Array.from(element.querySelectorAll(".prose-image"))
            .slice(0, 2)
            .map((image) => {
              const style = getComputedStyle(image);
              return {
                opacity: Number(style.opacity),
                scale: image.getBoundingClientRect().width / image.clientWidth,
              };
            }),
        ),
      );
    }
    const reverseLeft = Math.round(step * 0.65);
    await page.mouse.move(x - reverseLeft, y);
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeCloseTo(reverseLeft, 0);
    await track.evaluate((element) => {
      element.addEventListener(
        "pointerup",
        () => {
          element.dataset.releasePosition = String(element.scrollLeft);
        },
        { once: true },
      );
    });
    await page.mouse.up();
    expect(
      Number(await track.getAttribute("data-release-position")),
    ).toBeCloseTo(reverseLeft, 0);
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeCloseTo(step, 0);
    expect(samples[0]![0]!.scale).toBeCloseTo(1, 2);
    expect(samples[0]![1]!.scale).toBeCloseTo(0.82, 2);
    expect(samples.at(-1)![0]!.scale).toBeCloseTo(0.82, 2);
    expect(samples.at(-1)![1]!.scale).toBeCloseTo(1, 2);
    for (let index = 1; index < samples.length; index++) {
      expect(samples[index]![0]!.opacity).toBeLessThan(
        samples[index - 1]![0]!.opacity,
      );
      expect(samples[index]![0]!.scale).toBeLessThan(
        samples[index - 1]![0]!.scale,
      );
      expect(samples[index]![1]!.opacity).toBeGreaterThan(
        samples[index - 1]![1]!.opacity,
      );
      expect(samples[index]![1]!.scale).toBeGreaterThan(
        samples[index - 1]![1]!.scale,
      );
    }
    const finishPreviousScroll = () =>
      track.evaluate((element) => {
        element.dispatchEvent(
          new Event("scrollend", {
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
      });
    await gallery.locator("img").nth(1).hover();
    await expect(
      gallery.getByRole("button", { name: "Previous image", exact: true }),
    ).toBeVisible();
    await expect(
      gallery.getByRole("button", { name: "Next image", exact: true }),
    ).toBeVisible();
    await gallery
      .getByRole("button", { name: "Next image", exact: true })
      .click();
    // A prior focus/visibility scroll can finish after smooth navigation starts.
    await finishPreviousScroll();
    await expect
      .poll(() =>
        track.evaluate(
          (element) =>
            element.scrollWidth - element.clientWidth - element.scrollLeft,
        ),
      )
      .toBeCloseTo(0, 0);
    await expect(
      gallery.getByRole("button", { name: "Go to image 3 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    await gallery
      .getByRole("button", { name: "Previous image", exact: true })
      .click();
    await finishPreviousScroll();
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeCloseTo(step, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(track.locator(".prose-image").first()).toHaveCSS(
      "transform",
      "none",
    );
    await expect(track.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "1",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(track.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "0.45",
    );
    await page.emulateMedia({ forcedColors: "active" });
    await expect(track.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "1",
    );
    await page.emulateMedia({ forcedColors: "none" });
    await expect(track.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "0.45",
    );
  });

  test("Cover Flow controls fade over images, reveal immediately for keyboard input and animate both paging states", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    const shell = gallery.locator(".carousel-arrows__shell").last();
    const image = gallery.locator("img").first();
    const next = gallery.getByRole("button", {
      name: "Next image",
      exact: true,
    });
    const firstDot = gallery.getByRole("button", {
      name: "Go to image 1 of 3",
    });
    await expect(gallery.locator(".carousel-pagination__button")).toHaveCount(
      3,
    );
    await gallery.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(shell).toHaveCSS("opacity", "0");
    await image.evaluate((element) => {
      element.addEventListener(
        "pointerenter",
        () => {
          element
            .closest(".carousel")!
            .querySelector(".carousel-arrows__shell:last-child")!
            .getAnimations()
            .forEach((animation) => {
              animation.pause();
              animation.currentTime = 100;
            });
        },
        { once: true },
      );
    });
    await image.hover();
    const midpoint = await shell.evaluate((element) =>
      Number(getComputedStyle(element).opacity),
    );
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(1);
    await shell.evaluate((element) => {
      element.getAnimations().forEach((animation) => {
        animation.finish();
      });
    });
    await gallery.locator("figcaption").first().hover();
    await expect(shell).toHaveCSS("opacity", "0");
    await firstDot.click();
    await page.keyboard.press("Shift+Tab");
    await expect(next).toBeFocused();
    await expect(shell).toHaveCSS("opacity", "1");
    await expect(shell).toHaveCSS("transition-duration", "0s");
    await firstDot.click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await image.hover();
    await expect(shell).toHaveCSS("opacity", "1");
    await expect(shell).toHaveCSS("transition-duration", "0s");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.mouse.move(0, 0);
    const paging = await gallery.evaluate(
      (element) =>
        new Promise<{
          properties: string[];
          midpoint: number[];
          endpoint: number[];
        }>((resolve) => {
          const buttons = element.querySelectorAll<HTMLButtonElement>(
            ".carousel-pagination__button",
          );
          const dots = [buttons[0]!, buttons[1]!].map((button) =>
            button.querySelector("span")!,
          );
          dots.forEach((dot) => dot.getBoundingClientRect());
          const observer = new MutationObserver(() => {
            if (buttons[1]!.getAttribute("aria-current") !== "true") {
              return;
            }
            observer.disconnect();
            const transitions = dots.flatMap((dot) => dot.getAnimations());
            transitions.forEach((transition) => {
              transition.pause();
              transition.currentTime = 100;
            });
            const midpoint = dots.map(
              (dot) => dot.getBoundingClientRect().width,
            );
            transitions.forEach((transition) => {
              transition.currentTime = 200;
            });
            resolve({
              properties: transitions.map((transition) =>
                transition instanceof CSSTransition
                  ? transition.transitionProperty
                  : "other",
              ),
              midpoint,
              endpoint: dots.map((dot) => dot.getBoundingClientRect().width),
            });
          });
          observer.observe(element, {
            attributes: true,
            subtree: true,
            attributeFilter: ["aria-current"],
          });
          buttons[1]!.click();
        }),
    );
    expect(paging.properties).toEqual(
      expect.arrayContaining(["background-color"]),
    );
    for (const width of paging.midpoint) {
      expect(width).toBeGreaterThan(10);
      expect(width).toBeLessThan(16);
    }
    expect(paging.endpoint).toEqual([10, 16]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await firstDot.click();
    await expect(firstDot).toHaveAttribute("aria-current", "true");
    await expect(firstDot.locator("span")).toHaveCSS("width", "16px");
    await expect(firstDot.locator("span")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await expect(
      gallery
        .getByRole("button", { name: "Go to image 2 of 3" })
        .locator("span"),
    ).toHaveCSS("width", "10px");
  });
});

test("Cover Flow arrow shells and shared paging retain their colours, inset circles and targets", async ({
  page,
}) => {
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const gallery = page
    .locator(".carousel")
    .filter({ has: page.locator('img[alt*="Currency Converter Pro"]') });
  const image = gallery.locator("img").first();
  const next = gallery.getByRole("button", { name: "Next image", exact: true });
  const track = gallery.getByRole("list", { name: "Gallery images" });
  const firstDot = gallery.getByRole("button", { name: "Go to image 1 of 2" });
  const secondDot = gallery.getByRole("button", { name: "Go to image 2 of 2" });
  const shell = gallery.locator(".carousel-arrows__shell").last();
  const arrows = gallery.getByRole("group", {
    name: "Gallery navigation",
    exact: true,
  });
  const paging = gallery.getByRole("group", {
    name: "Choose image",
    exact: true,
  });
  await expect(
    arrows.getByRole("button", { name: "Next image", exact: true }),
  ).toBeVisible();
  await expect(paging.getByRole("button")).toHaveCount(2);
  await gallery.scrollIntoViewIfNeeded();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await image.hover();
    const [picture, button] = await Promise.all([
      image.boundingBox(),
      next.boundingBox(),
    ]);
    expect(picture).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button!.x).toBeGreaterThanOrEqual(picture!.x);
    expect(button!.x + button!.width).toBeLessThanOrEqual(
      picture!.x + picture!.width,
    );
    expect(button!.y).toBeGreaterThanOrEqual(picture!.y);
    expect(button!.y + button!.height).toBeLessThanOrEqual(
      picture!.y + picture!.height,
    );
    await expect(shell).toHaveCSS("background-color", "rgba(0, 0, 0, 0.65)");
    await expect(next).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(next).toHaveCSS("inline-size", "44px");
    await expect(next).toHaveCSS("block-size", "44px");
    const rootFontSize = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    );
    await expect(next).toHaveCSS("font-size", rootFontSize);
    await expect
      .poll(() =>
        next.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingInlineStart),
        ),
      )
      .toBeCloseTo((Number.parseFloat(rootFontSize) * 3) / 16, 2);
    await expect(next).toHaveCSS("background-clip", "content-box");
    await next.hover();
    await expect(next).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(next).not.toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await secondDot.click();
  await expect(secondDot).toHaveAttribute("aria-current", "true");
  await expect(firstDot).not.toHaveAttribute("aria-current");
  await expect(secondDot.locator("span")).toHaveCSS("width", "16px");
  await expect(firstDot.locator("span")).toHaveCSS("width", "10px");
  await expect(firstDot).toHaveCSS("width", "44px");
  await expect(firstDot).toHaveCSS("height", "44px");
  await firstDot.click();
  await page.emulateMedia({ forcedColors: "active" });
  await firstDot.focus();
  await firstDot.press("Tab");
  await expect(secondDot).toBeFocused();
  await expect(secondDot).toHaveCSS("outline-style", "solid");
  await expect(secondDot.locator("span")).toHaveCSS(
    "forced-color-adjust",
    "none",
  );
  await track.focus();
  await track.press("Tab");
  await expect(next).toBeFocused();
});

test.describe("Touch gesture tracking", () => {
  test.use({
    hasTouch: true,
    viewport: { width: 375, height: 812 },
    reducedMotion: "no-preference",
  });
  // eslint-disable-next-line playwright/no-skipped-test -- Firefox cannot create a hasTouch context or dispatch CDP touch gestures.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Trusted touch injection requires Chromium's DevTools protocol.",
  );

  test("A held swipe follows the finger before settling, without blocking vertical page scrolling", async ({
    page,
    context,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    const track = gallery.getByRole("list", { name: "Gallery images" });
    await gallery.scrollIntoViewIfNeeded();
    const image = gallery.locator("img").first();
    const bounds = await image.boundingBox();
    expect(bounds).not.toBeNull();
    const x = bounds!.x + bounds!.width * 0.8;
    const y = bounds!.y + bounds!.height * 0.3;
    const session = await context.newCDPSession(page);
    try {
      await expect(
        gallery.getByRole("button", { name: "Next image" }),
      ).toBeVisible();
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (const distance of [12, 48, 96, 144, 96]) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x - distance, y }],
        });
        await expect
          .poll(() => track.evaluate((element) => element.scrollLeft))
          .toBeCloseTo(distance, 0);
        await expect(
          gallery.locator(".carousel-arrows__button:visible"),
        ).toHaveCount(0);
        const opacity = await track
          .locator(".prose-image")
          .first()
          .evaluate((element) => Number(getComputedStyle(element).opacity));
        expect(opacity).toBeLessThan(1);
        expect(opacity).toBeGreaterThan(0.45);
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() => track.evaluate((element) => element.scrollLeft))
        .toBeLessThanOrEqual(1);
      await expect(
        gallery.getByRole("button", { name: "Next image" }),
      ).toHaveCSS("opacity", "1");
      await expect(gallery.locator(".carousel-arrows__shell").last()).toHaveCSS(
        "opacity",
        "1",
      );
      const top = await page.evaluate(() => scrollY);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (const distance of [20, 50, 100]) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y - distance }],
        });
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(top);
      await expect
        .poll(() => track.evaluate((element) => element.scrollLeft))
        .toBeLessThanOrEqual(1);
      await gallery.scrollIntoViewIfNeeded();
      await gallery.getByRole("link").tap();
      await expect(page).toHaveURL(/\/css-general-rules-of-thumb\/$/);
    } finally {
      await session.detach();
    }
  });
});

test("Neighbour preview is actually painted beyond the article card, not merely laid out there", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const gallery = page
    .getByRole("region", { name: "Image gallery" })
    .filter({ has: page.locator("figure") });
  await gallery.scrollIntoViewIfNeeded();
  await expect(
    gallery.getByRole("button", { name: "Go to image 1 of 3" }),
  ).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() =>
      gallery
        .locator("img")
        .nth(1)
        .evaluate((image) => {
          const bounds = image.getBoundingClientRect();
          const article = image.closest("article")!.getBoundingClientRect();
          const x = Math.min(
            innerWidth - 8,
            Math.max(article.right + 8, bounds.left + 8),
          );
          const y = bounds.top + bounds.height / 2;
          return (
            x > article.right &&
            x < bounds.right &&
            Boolean(document.elementFromPoint(x, y)?.closest(".carousel"))
          );
        }),
    )
    .toBe(true);
});

test("Mouse dragging a linked image scrolls without opening its link, but a normal click still works", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const gallery = page
    .getByRole("region", { name: "Image gallery" })
    .filter({ has: page.locator("figure") });
  await expect(gallery).toHaveClass(/carousel--interactive/);
  const image = gallery.locator("img").first();
  await image.hover();
  const bounds = await image.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.8;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - bounds!.width * 0.8, y, { steps: 12 });
  await page.mouse.up();
  await expect(gallery.locator(".carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
  await gallery.getByRole("button", { name: "Go to image 1 of 3" }).click();
  await expect(gallery.locator(".carousel__position")).toHaveText(
    "Image 1 of 3",
  );
  await gallery.getByRole("link").click();
  await expect(page).toHaveURL(/\/css-general-rules-of-thumb\/$/);
});

test("Native horizontal scrolling preserves the actual article's adjacent screenshots", async ({
  page,
}) => {
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const gallery = page
    .locator(".carousel")
    .filter({ has: page.locator('img[alt*="Currency Converter Pro"]') });
  await expect(gallery.locator("img")).toHaveCount(2);
  await expect(gallery.locator("img").first()).toHaveAttribute(
    "loading",
    "lazy",
  );
  await gallery.scrollIntoViewIfNeeded();
  await gallery.getByRole("list", { name: "Gallery images" }).hover();
  await page.mouse.wheel(1200, 0);
  await expect(gallery.locator(".carousel__position")).toHaveText(
    "Image 2 of 2",
  );
  await expect(
    page.locator('.carousel img[src*="about-page-experiments"]'),
  ).toHaveCount(0);
});

test("Consecutive plain images form a separate carousel without captions or links", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const galleries = page.getByRole("region", { name: "Image gallery" });
  await expect(galleries).toHaveCount(2);
  await expect(
    page
      .getByRole("heading", { level: 1 })
      .locator(".heading__text", { hasText: /^Carousel$/ }),
  ).toBeVisible();
  const gallery = galleries.first();
  await expect(gallery.locator("img")).toHaveCount(2);
  await expect(
    gallery
      .getByRole("list", { name: "Gallery images" })
      .locator(":scope > li"),
  ).toHaveCount(2);
  await expect(gallery.locator("figure, figcaption, a")).toHaveCount(0);
  await gallery.scrollIntoViewIfNeeded();
  await gallery.locator("img").first().hover();
  await gallery
    .getByRole("button", { name: "Next image", exact: true })
    .click();
  await expect(
    gallery.getByRole("button", { name: "Go to image 2 of 2" }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    gallery.getByRole("button", { name: "Next image", exact: true }),
  ).toHaveCount(0);
  await gallery.getByRole("button", { name: "Go to image 1 of 2" }).click();
  await expect(
    gallery.getByRole("button", { name: "Go to image 1 of 2" }),
  ).toHaveAttribute("aria-current", "true");
});

test.describe("Progressive enhancement", () => {
  test.use({ javaScriptEnabled: false });

  test("Images, captions and links remain available without JavaScript", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ has: page.locator("figure") });
    await expect(gallery.locator("img")).toHaveCount(3);
    await expect(gallery.locator("figcaption")).toHaveCount(3);
    await expect(gallery.getByRole("link")).toHaveAttribute(
      "href",
      "/css-general-rules-of-thumb/",
    );
    await expect(gallery.getByRole("button")).toHaveCount(0);
    const track = gallery.getByRole("list", { name: "Gallery images" });
    await expect(track).toHaveAttribute("tabindex", "0");
    await expect(track).toHaveCSS("overflow-x", "auto");
    await expect(gallery.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "1",
    );
    const plainGallery = page
      .getByRole("region", { name: "Image gallery" })
      .filter({ hasNot: page.locator("figure") });
    await expect(plainGallery.locator("img")).toHaveCount(2);
    await expect(
      plainGallery.locator("figure, figcaption, a, button"),
    ).toHaveCount(0);
  });
});
