import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) =>
      route.fulfill({
        status: route.request().isNavigationRequest() ? 200 : 204,
        contentType: "text/html",
      }),
  );
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
});

const gallerySelector = ".image-carousel";

test("Groups article images with working links, captions and stable endpoint focus", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const track = gallery.locator(".image-carousel__track");
  await gallery.scrollIntoViewIfNeeded();
  await expect(gallery.locator(".image-carousel__slide")).toHaveCount(3);
  await expect(gallery.getByRole("link")).toHaveAttribute(
    "href",
    "/css-general-rules-of-thumb/",
  );
  await expect(gallery.locator("figcaption")).toHaveText([
    "The first image retains its link.",
    "Human review remains part of the workflow.",
    "The last image can be centred too.",
  ]);
  const previous = gallery.getByRole("button", { name: "Previous image" });
  const next = gallery.getByRole("button", { name: "Next image" });
  await gallery.locator(".image-carousel__track").hover();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await next.click();
  await expect(
    gallery.getByRole("button", { name: "Go to image 2 of 3" }),
  ).toHaveAttribute("aria-current", "true");
  await next.click();
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(next).toBeFocused();
  await expect(gallery.locator("[aria-live]")).toHaveText("Image 3 of 3");
  await next.press("Enter");
  await expect(next).toBeFocused();
  await track.focus();
  await track.press("Home");
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await track.press("End");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await track.press("ArrowLeft");
  await expect(
    gallery.getByRole("button", { name: "Go to image 2 of 3" }),
  ).toHaveAttribute("aria-current", "true");
  await gallery.getByRole("link").focus();
  await expect(previous).toHaveAttribute("aria-disabled", "true");
  await expect(gallery.getByRole("link")).toBeFocused();
  await gallery.getByRole("link").click();
  await expect(page).toHaveURL(/\/css-general-rules-of-thumb\/$/);
});

test("Mouse dragging browses images without following links and ordinary clicks still navigate", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const track = gallery.locator(".image-carousel__track");
  await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
  await gallery.scrollIntoViewIfNeeded();
  await expect(track).toHaveCSS("scrollbar-width", "none");
  const image = gallery.locator("img").first();
  const bounds = await image.boundingBox();
  expect(bounds).not.toBeNull();
  const startX = bounds!.x + bounds!.width * 0.8;
  const y = bounds!.y + bounds!.height / 3;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - bounds!.width * 0.75, y, { steps: 15 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
  await expect(
    gallery.getByRole("button", { name: "Go to image 2 of 3" }),
  ).toHaveAttribute("aria-current", "true");
  await expect(track).toHaveCSS("cursor", "grab");

  const middle = await gallery.locator("img").nth(1).boundingBox();
  expect(middle).not.toBeNull();
  await page.mouse.move(
    middle!.x + middle!.width * 0.2,
    middle!.y + middle!.height / 3,
  );
  await page.mouse.down();
  await page.mouse.move(
    middle!.x + middle!.width * 0.95,
    middle!.y + middle!.height / 3,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect(
    gallery.getByRole("button", { name: "Previous image" }),
  ).toHaveAttribute("aria-disabled", "true");
  await gallery.getByRole("link").click();
  await expect(page).toHaveURL(/\/css-general-rules-of-thumb\/$/);
});

test("Overlay arrows appear on hover or keyboard focus without covering captions", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const track = gallery.locator(".image-carousel__track");
  const next = gallery.getByRole("button", { name: "Next image" });
  const shell = gallery.locator(".image-carousel__arrow-shell").last();
  await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
  await gallery.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(shell).toHaveCSS("opacity", "0");
  await track.hover();
  await expect(shell).toHaveCSS("opacity", "1");
  const image = await gallery.locator("img").first().boundingBox();
  const button = await next.boundingBox();
  expect(image).not.toBeNull();
  expect(button).not.toBeNull();
  expect(button!.x).toBeGreaterThanOrEqual(image!.x);
  expect(button!.x + button!.width).toBeLessThanOrEqual(
    image!.x + image!.width,
  );
  expect(button!.y).toBeGreaterThan(image!.y);
  expect(button!.y + button!.height).toBeLessThan(image!.y + image!.height);
  await page.mouse.move(0, 0);
  await expect(shell).toHaveCSS("opacity", "0");
  await track.focus();
  await expect(shell).toHaveCSS("opacity", "1");
  await page.keyboard.press("Tab");
  await expect(gallery.getByRole("link")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    gallery.getByRole("button", { name: "Previous image" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    gallery.getByRole("button", { name: "Go to image 2 of 3" }),
  ).toHaveAttribute("aria-current", "true");
});

test.describe("Touch input", () => {
  test.use({ hasTouch: true });

  test("Overlay arrows remain available without hover on touch devices", async ({
    page,
  }) => {
    const gallery = page.locator(gallerySelector).first();
    const next = gallery.getByRole("button", { name: "Next image" });
    await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
    await gallery.scrollIntoViewIfNeeded();
    await expect(next).toHaveCSS("opacity", "1");
    await next.tap();
    await expect(
      gallery.getByRole("button", { name: "Go to image 2 of 3" }),
    ).toHaveAttribute("aria-current", "true");
  });
});

test("Overlay arrows match the video control colours, targets and inset circles", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const next = gallery.getByRole("button", { name: "Next image" });
  await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await gallery.locator(".image-carousel__track").hover();
    await expect(next).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(next).toHaveCSS("inline-size", "44px");
    await expect(next).toHaveCSS("block-size", "44px");
    await expect(next).toHaveCSS("font-size", "20px");
    await expect(next).toHaveCSS("padding", "4px");
    await expect(next).toHaveCSS("background-clip", "content-box");
    await expect(
      gallery.locator(".image-carousel__arrow-shell").last(),
    ).toHaveCSS("background-color", "rgba(0, 0, 0, 0.65)");
    await next.hover();
    await expect(next).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const hoverMatchesTheme = await next.evaluate((button, currentTheme) => {
      const sample = document.createElement("span");
      sample.style.color =
        currentTheme === "dark"
          ? "var(--global-alternate-accent-color)"
          : "var(--global-accent-color)";
      button.append(sample);
      const matches =
        getComputedStyle(button).color === getComputedStyle(sample).color;
      sample.remove();
      return matches;
    }, theme);
    expect(hoverMatchesTheme).toBe(true);
  }
});

test("Native horizontal scrolling updates the selected image", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const track = gallery.locator(".image-carousel__track");
  await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
  await track.hover();
  await page.mouse.wheel(800, 0);
  await expect
    .poll(() => track.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await expect(
    gallery.getByRole("button", { name: "Go to image 1 of 3" }),
  ).not.toHaveAttribute("aria-current", "true");
});

test("Normal image size, first/last centring and controls survive narrow and scaled layouts", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  for (const width of [1280, 640, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      for (const number of [1, 3]) {
        await gallery
          .getByRole("button", { name: `Go to image ${number} of 3` })
          .click();
        await expect(
          gallery.getByRole("button", { name: `Go to image ${number} of 3` }),
        ).toHaveAttribute("aria-current", "true");
        const image = gallery.locator("img").nth(number - 1);
        const bounds = await image.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x + bounds!.width / 2).toBeCloseTo(width / 2, 0);
        expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 2);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        await expect(
          gallery.getByRole("button", { name: "Previous image" }),
        ).toBeVisible();
        await expect(
          gallery.getByRole("button", { name: "Next image" }),
        ).toBeVisible();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
  }
});

test("Reduced motion and forced colours retain a flat, keyboard-operable gallery", async ({
  page,
}) => {
  const gallery = page.locator(gallerySelector).first();
  const track = gallery.locator(".image-carousel__track");
  await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
  for (const forcedColors of ["none", "active"] as const) {
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors });
    await track.focus();
    await track.press("End");
    await expect(
      gallery.getByRole("button", { name: "Next image" }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(gallery.locator(".image-carousel__frame").last()).toHaveCSS(
      "transform",
      "none",
    );
    await expect(track).toBeFocused();
    await expect(track).toHaveCSS("outline-style", "solid");
  }
});

test.describe("Continuous Cover Flow", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Pagination animates both selected states and honours reduced motion", async ({
    page,
  }) => {
    const gallery = page.locator(gallerySelector).first();
    await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
    await gallery.scrollIntoViewIfNeeded();
    const animation = await gallery.evaluate(
      (element) =>
        new Promise<{
          properties: string[];
          midpoint: number[];
          endpoint: number[];
        }>((resolve) => {
          const buttons = element.querySelectorAll<HTMLButtonElement>(
            ".image-carousel__dot",
          );
          const spans = [buttons[0]!, buttons[1]!].map((button) =>
            button.querySelector("span")!,
          );
          spans.forEach((span) => span.getBoundingClientRect());
          const observer = new MutationObserver(() => {
            if (buttons[1]!.getAttribute("aria-current") !== "true") {
              return;
            }
            observer.disconnect();
            const transitions = spans.flatMap((span) => span.getAnimations());
            transitions.forEach((transition) => {
              transition.pause();
              transition.currentTime = 100;
            });
            const midpoint = spans.map(
              (span) => span.getBoundingClientRect().width,
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
              endpoint: spans.map((span) => span.getBoundingClientRect().width),
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
    expect(animation.properties).toEqual(
      expect.arrayContaining(["background-color"]),
    );
    for (const width of animation.midpoint) {
      expect(width).toBeGreaterThan(10);
      expect(width).toBeLessThan(16);
    }
    expect(animation.endpoint).toEqual([10, 16]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gallery.getByRole("button", { name: "Go to image 1 of 3" }).click();
    await expect(
      gallery.getByRole("button", { name: "Go to image 1 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      gallery
        .getByRole("button", { name: "Go to image 1 of 3" })
        .locator("span"),
    ).toHaveCSS("transition-duration", "0s");
  });

  test("Transforms follow fractional scroll positions, not just the selected image", async ({
    page,
  }) => {
    const gallery = page.locator(gallerySelector).first();
    const track = gallery.locator(".image-carousel__track");
    await expect(gallery.locator(".image-carousel__controls")).toBeVisible();
    await gallery.scrollIntoViewIfNeeded();
    const supported = await page.evaluate(() =>
      CSS.supports("animation-timeline: view(inline)"),
    );
    const frame = gallery.locator(".image-carousel__frame").first();
    await track.evaluate((element) => {
      element.style.scrollSnapType = "none";
      element.scrollLeft =
        element.children[0]!.getBoundingClientRect().width * 0.1;
    });
    await expect
      .poll(() =>
        frame.evaluate(
          (element) => getComputedStyle(element).transform !== "none",
        ),
      )
      .toBe(supported);
    const first = await frame.evaluate(
      (element) => getComputedStyle(element).transform,
    );
    await track.evaluate((element) => {
      element.scrollLeft =
        element.children[0]!.getBoundingClientRect().width * 0.3;
    });
    await expect
      .poll(
        async () =>
          (await frame.evaluate(
            (element) => getComputedStyle(element).transform,
          )) !== first,
      )
      .toBe(supported);
    await expect(
      gallery.getByRole("button", { name: "Go to image 1 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(frame).toHaveCSS("transform", "none");
  });
});

test.describe("Without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("Server-rendered images and captions remain available to native scrolling", async ({
    page,
  }) => {
    const gallery = page.locator(gallerySelector).first();
    await expect(gallery.locator("img")).toHaveCount(3);
    await expect(gallery.locator("figcaption").last()).toHaveText(
      "The last image can be centred too.",
    );
    await expect(gallery.locator(".image-carousel__controls")).toHaveCount(0);
    const track = gallery.locator(".image-carousel__track");
    await track.focus();
    await track.press("ArrowRight");
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  });
});
