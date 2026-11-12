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
});

for (const width of [1440, 640, 375, 320]) {
  test(`Image galleries are full-bleed and scroll without page overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ai-learnings-from-upgrading-my-blog/", {
      waitUntil: "domcontentloaded",
    });
    const gallery = page.locator(".image-carousel").filter({
      has: page.locator('img[alt*="Currency Converter Pro"]'),
    });
    const track = gallery.getByRole("group", { name: "Gallery images" });
    const images = track.locator("img");
    await expect(images).toHaveCount(2);
    await expect(images.nth(0)).toHaveAttribute("alt", /conversion cards/);
    await expect(images.nth(1)).toHaveAttribute("alt", /currency picker/);
    await expect(images.nth(0)).toHaveAttribute("loading", "lazy");
    await expect(
      page.locator('.image-carousel img[src*="about-page-experiments"]'),
    ).toHaveCount(0);
    await expect(track).toHaveAttribute("tabindex", "0");
    await expect(track).toHaveCSS("scroll-snap-type", "x mandatory");
    await expect(track).toHaveCSS("scrollbar-width", "none");
    await expect(gallery).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(gallery).not.toContainText(
      "Scroll, swipe or use arrow keys when the gallery is focused.",
    );
    await expect(gallery).not.toContainText(
      "Drag the image, use Previous and Next, or choose an image below.",
    );
    await expect(track.locator(".image-carousel__slide").first()).toHaveCSS(
      "scroll-snap-stop",
      "always",
    );
    await track.scrollIntoViewIfNeeded();
    const previous = gallery.getByRole("button", { name: "Previous image" });
    const next = gallery.getByRole("button", { name: "Next image" });
    await expect(previous).toHaveCount(0);
    await expect(next).toBeEnabled();
    await expect(next).toHaveClass(/button--icon/);
    await expect(next).toHaveCSS("border-radius", "50%");
    const pagination = gallery.getByRole("group", { name: "Choose image" });
    await expect(pagination.getByRole("button")).toHaveCount(2);
    await expect(
      pagination.locator('[aria-current="true"]'),
    ).toHaveAccessibleName("Go to image 1 of 2");
    const [currentPicture, nextPicture, dot] = await Promise.all([
      gallery.locator(".prose-image").nth(0).boundingBox(),
      gallery.locator(".prose-image").nth(1).boundingBox(),
      pagination.locator(".carousel-pagination__dot").first().boundingBox(),
    ]);
    expect(currentPicture).not.toBeNull();
    expect(nextPicture).not.toBeNull();
    expect(dot).not.toBeNull();
    const previewGap =
      nextPicture!.x - (currentPicture!.x + currentPicture!.width);
    const dotGap = dot!.y - (currentPicture!.y + currentPicture!.height);
    expect(previewGap).toBeGreaterThanOrEqual(0);
    expect(previewGap).toBeLessThanOrEqual(16);
    expect(dotGap).toBeGreaterThanOrEqual(0);
    expect(dotGap).toBeLessThanOrEqual(16);

    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const bounds = await gallery
        .locator(".image-carousel__viewport")
        .boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeCloseTo(0, 0);
      expect(bounds!.width).toBeCloseTo(width, 0);
      const currentImage = await images.first().boundingBox();
      expect(currentImage).not.toBeNull();
      expect(currentImage!.x + currentImage!.width / 2).toBeCloseTo(
        width / 2,
        0,
      );
      expect(
        await page
          .locator(".post__content")
          .evaluate((element) => element.clientWidth),
      ).toBeLessThan(width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }

    await track.focus();
    await expect(track).toBeFocused();
    await track.press("ArrowRight");
    await expect
      .poll(() =>
        track.evaluate(
          (element) =>
            Math.abs(
              element.scrollLeft - (element.scrollWidth - element.clientWidth),
            ) < 1,
        ),
      )
      .toBe(true);
    await track.press("ArrowLeft");
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBe(0);
    await next.click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 2",
    );
    await expect(next).toHaveCount(0);
    await expect(previous).toBeEnabled();
    await expect(track).toBeFocused();
    await expect(
      pagination.locator('[aria-current="true"]'),
    ).toHaveAccessibleName("Go to image 2 of 2");
    await expect(images.nth(1)).toBeInViewport();
    await expect
      .poll(() =>
        images.nth(1).evaluate((element) => {
          const image = element.getBoundingClientRect();
          const slide = element
            .closest(".image-carousel__slide")!
            .getBoundingClientRect();
          // Native scroll offsets can round to the nearest device pixel.
          return (
            image.left >= slide.left - 1 &&
            image.right <= slide.right + 1 &&
            Math.abs((image.left + image.right) / 2 - window.innerWidth / 2) <=
              1
          );
        }),
      )
      .toBe(true);
    await expect
      .poll(() =>
        images
          .nth(1)
          .evaluate(
            (element) =>
              element instanceof HTMLImageElement &&
              element.complete &&
              element.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.emulateMedia({ forcedColors: "active" });
    await previous.focus();
    await previous.press("Shift+Tab");
    await expect(track).toBeFocused();
    await expect(track).toHaveCSS("outline-style", "solid");
    await expect(images.nth(1)).toBeVisible();
    await track.press("Tab");
    await expect(previous).toBeFocused();
    await expect(previous).toHaveCSS("outline-style", "solid");
    await previous.press("Enter");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 2",
    );
    await expect(previous).toHaveCount(0);
    await expect(next).toBeEnabled();
    await expect(track).toBeFocused();
  });
}

test("Figure galleries keep captions, links and the standalone image outside the gallery", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const gallery = page.locator(".image-carousel");
  await expect(gallery).toHaveCount(1);
  await expect(gallery.locator("figure")).toHaveCount(2);
  await expect(gallery.locator("figcaption").nth(0)).toHaveText(
    "The first gallery image retains its link.",
  );
  await expect(gallery.locator("figcaption").nth(1)).toHaveText(
    "The second gallery image retains its caption.",
  );
  await expect(gallery.getByRole("link")).toHaveAttribute(
    "href",
    "/css-general-rules-of-thumb/",
  );
  await expect(page.locator(".post__content > p .prose-image")).toHaveCount(1);
  await expect(page.locator(".post__content > figure")).toHaveCount(2);
  await expect(
    gallery.getByRole("button", { name: "Next image" }),
  ).toBeEnabled();
  await gallery.scrollIntoViewIfNeeded();
  const image = gallery.locator("img").first();
  const standaloneImage = page.locator(".post__content > figure img").first();
  for (const width of [1440, 640, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(gallery.locator(".prose-image").first()).toHaveCSS(
      "scale",
      "1",
    );
    const [normalBounds, currentBounds] = await Promise.all([
      standaloneImage.boundingBox(),
      image.boundingBox(),
    ]);
    expect(normalBounds).not.toBeNull();
    expect(currentBounds).not.toBeNull();
    expect(currentBounds!.width).toBeCloseTo(normalBounds!.width, 0);
    expect(currentBounds!.height).toBeCloseTo(normalBounds!.height, 0);
    expect(currentBounds!.x).toBeCloseTo(normalBounds!.x, 0);
  }
  await gallery.scrollIntoViewIfNeeded();
  const bounds = await image.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.8;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - bounds!.width * 0.65, y, { steps: 12 });
  await page.mouse.up();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 2",
  );
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
  await expect(gallery.locator(".image-carousel__track")).toHaveCSS(
    "scroll-snap-type",
    "x mandatory",
  );
  await expect
    .poll(() =>
      gallery
        .locator("img")
        .nth(1)
        .evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return Math.abs(bounds.x + bounds.width / 2 - window.innerWidth / 2);
        }),
    )
    .toBeLessThanOrEqual(1);
  await expect(gallery.locator("figcaption").nth(1)).toBeInViewport();
  await expect(gallery.locator("a button")).toHaveCount(0);
  await gallery.getByRole("button", { name: "Previous image" }).click();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 1 of 2",
  );
  await gallery.getByRole("link").click();
  await expect(page).toHaveURL(/\/css-general-rules-of-thumb\/$/);
});

test("Buttons advance one slide and galleries have independent controls", async ({
  page,
}) => {
  await page.goto("/wpf-metro-part2-mahapps-metro/", {
    waitUntil: "domcontentloaded",
  });
  const galleries = page.locator(".image-carousel");
  await expect(galleries).toHaveCount(2);
  const trackIds = await galleries
    .locator(".image-carousel__track")
    .evaluateAll((tracks) => tracks.map((track) => track.id));
  expect(new Set(trackIds).size).toBe(2);
  const gallery = galleries.filter({
    has: page.locator(".image-carousel__slide:nth-child(3)"),
  });
  const previous = gallery.getByRole("button", { name: "Previous image" });
  const next = gallery.getByRole("button", { name: "Next image" });
  await expect(next).toBeEnabled();
  await next.focus();
  await next.press("Enter");
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute(
    "aria-controls",
    await gallery
      .locator(".image-carousel__track")
      .evaluate((element) => element.id),
  );
  await next.click();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 3 of 3",
  );
  await expect(next).toHaveCount(0);
  await expect(gallery.locator(".image-carousel__track")).toBeFocused();
  const firstDot = gallery.getByRole("button", { name: "Go to image 1 of 3" });
  await firstDot.focus();
  await firstDot.press("Enter");
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 1 of 3",
  );
  await expect(firstDot).toBeFocused();
  await expect(firstDot).toHaveAttribute("aria-current", "true");
  await expect(previous).toHaveCount(0);
  await expect(
    galleries
      .filter({ hasNot: page.locator(".image-carousel__slide:nth-child(3)") })
      .locator(".image-carousel__position"),
  ).toHaveText("Image 1 of 2");
});

test("Galleries and their images render with JavaScript disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/ai-learnings-from-upgrading-my-blog/`, {
    waitUntil: "domcontentloaded",
  });
  const track = page.locator(".image-carousel__track").filter({
    has: page.locator('img[alt*="Currency Converter Pro"]'),
  });
  await expect(track.locator("img")).toHaveCount(2);
  const buttons = page.locator(".image-carousel button");
  await expect(buttons).toHaveCount(1);
  await expect(page.locator(".carousel-pagination")).toHaveCount(0);
  await expect(page.locator(".image-carousel__position")).toHaveText(
    "2 images",
  );
  for (const button of await buttons.all()) {
    await expect(button).toBeDisabled();
    await expect(button).toBeHidden();
  }
  await track.scrollIntoViewIfNeeded();
  await track.focus();
  await track.press("ArrowRight");
  await expect
    .poll(() => track.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await context.close();
});

test("Overlay buttons reveal on hover and keyboard focus with dismissible tooltips", async ({
  page,
}) => {
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const gallery = page.locator(".image-carousel");
  const track = gallery.locator(".image-carousel__track");
  const image = gallery.locator("img").first();
  const next = gallery.getByRole("button", { name: "Next image" });
  await expect(next).toBeEnabled();
  await expect(next).toHaveCSS("inline-size", "44px");
  await expect(next).toHaveCSS("block-size", "44px");
  await track.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  // Hybrid devices retain visible controls for their touch input.
  const hasTouchPointer = await page.evaluate(
    () => window.matchMedia("(any-pointer: coarse)").matches,
  );
  await expect(next).toHaveCSS("opacity", hasTouchPointer ? "1" : "0");
  await image.hover();
  await expect(next).toHaveCSS("opacity", "1");
  const [control, picture] = await Promise.all([
    next.boundingBox(),
    image.boundingBox(),
  ]);
  expect(control).not.toBeNull();
  expect(picture).not.toBeNull();
  expect(control!.x).toBeGreaterThanOrEqual(picture!.x);
  expect(control!.x + control!.width).toBeLessThanOrEqual(
    picture!.x + picture!.width + 1,
  );
  expect(control!.y).toBeGreaterThanOrEqual(picture!.y);
  expect(control!.y + control!.height).toBeLessThanOrEqual(
    picture!.y + picture!.height + 1,
  );
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await image.hover();
    await expect(next).toHaveCSS("background-color", "rgba(0, 0, 0, 0.65)");
    await expect(next).toHaveCSS("color", "rgb(255, 255, 255)");
    await next.hover();
    await expect(next).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(next).not.toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await expect(page.getByRole("tooltip", { name: "Next image" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.mouse.move(0, 0);
  await track.focus();
  await track.press("Tab");
  await expect(next).toBeFocused();
  await expect(next).toHaveCSS("opacity", "1");
  await expect(page.getByRole("tooltip", { name: "Next image" })).toBeVisible();
  await next.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("Dot navigation selects images and respects reduced motion in both themes", async ({
  page,
}) => {
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const gallery = page.locator(".image-carousel");
  const pictures = gallery.locator(".prose-image");
  const firstDot = gallery.getByRole("button", { name: "Go to image 1 of 2" });
  const secondDot = gallery.getByRole("button", { name: "Go to image 2 of 2" });
  await gallery.scrollIntoViewIfNeeded();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    await firstDot.click();
    await expect(pictures.nth(0)).toHaveCSS("opacity", "1");
    await expect(pictures.nth(0)).toHaveCSS("scale", "1");
    await expect(pictures.nth(1)).toHaveCSS("opacity", "0.5");
    await expect(pictures.nth(1)).toHaveCSS("scale", "0.88");
    await expect(pictures.nth(1)).toHaveCSS("transition-duration", "0s");
    await secondDot.click();
    await expect(secondDot).toHaveAttribute("aria-current", "true");
    await expect(firstDot).not.toHaveAttribute("aria-current");
    await expect(pictures.nth(1)).toHaveCSS("opacity", "1");
    await expect(pictures.nth(1)).toHaveCSS("scale", "1");
    await expect(pictures.nth(0)).toHaveCSS("opacity", "0.5");
    await expect(pictures.nth(0)).toHaveCSS("scale", "0.88");
  }
  await page.emulateMedia({ forcedColors: "active" });
  await firstDot.focus();
  await firstDot.press("Tab");
  await expect(secondDot).toBeFocused();
  await expect(secondDot).toHaveCSS("outline-style", "solid");
  await expect(secondDot.locator("span")).not.toHaveCSS(
    "background-color",
    await firstDot
      .locator("span")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  );
});

test.describe("Image focus animations", () => {
  test.use({ reducedMotion: "no-preference" });

  test("The centred image fades and grows to full size without changing snap geometry", async ({
    page,
  }) => {
    await page.goto("/ai-learnings-from-upgrading-my-blog/", {
      waitUntil: "domcontentloaded",
    });
    const gallery = page.locator(".image-carousel");
    const pictures = gallery.locator(".prose-image");
    const next = gallery.getByRole("button", { name: "Next image" });
    await expect(next).toBeEnabled();
    await gallery.scrollIntoViewIfNeeded();
    await expect(pictures.nth(1)).toHaveCSS("opacity", "0.5");
    await gallery.locator("img").first().hover();
    await expect(next).toHaveCSS("opacity", "1");
    const transitions = pictures.nth(1).evaluate(
      (element) =>
        new Promise<string[]>((resolve) => {
          const properties = new Set<string>();
          element.addEventListener("transitionend", (event) => {
            if (
              !(event instanceof TransitionEvent) ||
              event.target !== element
            ) {
              return;
            }
            properties.add(event.propertyName);
            if (properties.has("opacity") && properties.has("scale")) {
              resolve([...properties]);
            }
          });
        }),
    );
    await next.click();
    expect(await transitions).toEqual(
      expect.arrayContaining(["opacity", "scale"]),
    );
    await expect(pictures.nth(1)).toHaveCSS("opacity", "1");
    await expect(pictures.nth(1)).toHaveCSS("scale", "1");
    await expect(pictures.nth(0)).toHaveCSS("opacity", "0.5");
    await expect(pictures.nth(0)).toHaveCSS("scale", "0.88");
    await expect
      .poll(() =>
        pictures.nth(1).evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return Math.abs(bounds.x + bounds.width / 2 - window.innerWidth / 2);
        }),
      )
      .toBeLessThanOrEqual(1);
  });
});

test.describe("Touch-capable devices", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test("Overlay buttons remain visible without hover", async ({ page }) => {
    await page.goto("/ai-learnings-from-upgrading-my-blog/", {
      waitUntil: "domcontentloaded",
    });
    const gallery = page.locator(".image-carousel");
    const next = gallery.getByRole("button", { name: "Next image" });
    await expect(next).toBeEnabled();
    await gallery.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(next).toHaveCSS("opacity", "1");
    await next.tap();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 2",
    );
  });
});
