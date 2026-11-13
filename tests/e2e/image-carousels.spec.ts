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

for (const width of [1440, 640, 320]) {
  test(`Window gallery preserves images and full-bleed geometry at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ai-learnings-from-upgrading-my-blog/");
    const gallery = page.locator(".image-carousel");
    const track = gallery.getByRole("group", { name: "Gallery images" });
    const images = gallery.locator("img");
    await expect(images).toHaveCount(2);
    await expect(images.first()).toHaveAttribute("loading", "lazy");
    await expect(images.first()).toHaveAttribute("alt", /conversion cards/);
    await expect(images.last()).toHaveAttribute("alt", /currency picker/);
    await expect(track).toHaveCSS("scroll-snap-type", "x mandatory");
    await expect(
      gallery.getByRole("button", { name: "Next image" }),
    ).toBeEnabled();
    await track.scrollIntoViewIfNeeded();

    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const bounds = await gallery
        .locator(".image-carousel__viewport")
        .boundingBox();
      expect(bounds!.x).toBeCloseTo(0, 0);
      expect(bounds!.width).toBeCloseTo(width, 0);
      for (const index of [0, 1]) {
        await gallery
          .getByRole("button", { name: `Go to image ${index + 1} of 2` })
          .click();
        await expect(gallery.locator(".image-carousel__position")).toHaveText(
          `Image ${index + 1} of 2`,
        );
        const image = images.nth(index);
        const dimensions = await image.boundingBox();
        expect(dimensions!.x + dimensions!.width / 2).toBeCloseTo(width / 2, 0);
        expect(dimensions!.width / dimensions!.height).toBeCloseTo(
          1999 / 1124,
          2,
        );
        const standalone = await image.evaluate((element) => {
          const paragraph = document.createElement("p");
          const picture = element.closest(".prose-image")!.cloneNode(true);
          paragraph.append(picture);
          element.closest(".post__content")!.append(paragraph);
          const bounds = paragraph
            .querySelector("img")!
            .getBoundingClientRect();
          const result = {
            x: bounds.x,
            width: bounds.width,
            height: bounds.height,
          };
          paragraph.remove();
          return result;
        });
        expect(dimensions!.x).toBeCloseTo(standalone.x, 0);
        expect(dimensions!.width).toBeCloseTo(standalone.width, 0);
        expect(dimensions!.height).toBeCloseTo(standalone.height, 0);
        await expect(image).toHaveCSS("translate", "none");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }

    await page.emulateMedia({ forcedColors: "active" });
    await track.focus();
    await expect(track).toHaveCSS("outline-style", "solid");
    await track.press("Home");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 2",
    );
    const firstDot = gallery.getByRole("button", {
      name: "Go to image 1 of 2",
    });
    const secondDot = gallery.getByRole("button", {
      name: "Go to image 2 of 2",
    });
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
    await expect(
      page.locator('.image-carousel img[src*="about-page-experiments"]'),
    ).toHaveCount(0);
  });
}

test("Keyboard endpoints, focus continuity, captions, links and resizing", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/");
  const gallery = page.locator(".image-carousel");
  const track = gallery.getByRole("group", { name: "Gallery images" });
  const next = gallery.getByRole("button", { name: "Next image" });
  await expect(next).toBeEnabled();
  await expect(gallery.locator("figcaption")).toHaveCount(3);
  await expect(gallery.locator("figcaption").first()).toHaveText(
    "A linked code image; open it to read the CSS guidelines.",
  );
  const link = track.locator("a").first();
  await expect(link).toHaveAttribute("href", "/css-general-rules-of-thumb/");
  await expect(link.getByRole("button")).toHaveCount(0);
  await track.focus();
  await track.press("End");
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 3 of 3",
  );
  await expect(next).toHaveCount(0);
  await track.press("Home");
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 1 of 3",
  );
  await track.press("ArrowRight");
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await next.focus();
  await next.press("Enter");
  await expect(next).toHaveCount(0);
  await expect(track).toBeFocused();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect
    .poll(() =>
      track.evaluate((element) =>
        Math.abs(
          element.scrollLeft - (element.scrollWidth - element.clientWidth),
        ),
      ),
    )
    .toBeLessThan(2);
  await track.press("Home");
  await link.focus();
  await expect(link).toBeFocused();
  const href = await link.getAttribute("href");
  await link.press("Enter");
  await expect(page).toHaveURL(new RegExp(href!.replaceAll(".", "\\.")));
});

test("Mouse dragging a linked image scrolls without opening the link", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/");
  const gallery = page.locator(".image-carousel");
  await expect(
    gallery.getByRole("button", { name: "Next image" }),
  ).toBeEnabled();
  const track = gallery.getByRole("group", { name: "Gallery images" });
  await track.scrollIntoViewIfNeeded();
  const bounds = await track.locator("img").first().boundingBox();
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.8,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(bounds!.x, bounds!.y + bounds!.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
});

test.describe("Continuous window motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Pans continuously within a clipping window, fully opening at the centre", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/");
    const gallery = page.locator(".image-carousel");
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await expect(
      gallery.getByRole("button", { name: "Next image" }),
    ).toBeEnabled();
    await track.scrollIntoViewIfNeeded();
    const supported = await page.evaluate(() =>
      CSS.supports("animation-timeline: view(inline)"),
    );
    const firstImage = track.locator("img").first();
    const frame = track.locator(".prose-image").first();
    await expect(firstImage).toHaveCSS(
      "animation-name",
      supported ? "image-window-pan" : "none",
    );
    await expect(firstImage).toHaveCSS("translate", supported ? "0%" : "none");
    // Stop snapping only to sample two genuine between-slide scroll positions.
    await page.addStyleTag({
      content: ".image-carousel__track { scroll-snap-type: none; }",
    });
    const sample = async (fraction: number, previousPan: number) => {
      await track.evaluate((element, value) => {
        const slides = element.children;
        const step =
          (slides[1] as HTMLElement).offsetLeft -
          (slides[0] as HTMLElement).offsetLeft;
        element.scrollLeft = step * value;
      }, fraction);
      await expect
        .poll(() =>
          firstImage.evaluate(
            (element, previous) =>
              Number.parseFloat(getComputedStyle(element).translate) > previous,
            previousPan,
          ),
        )
        .toBe(supported);
      return {
        pan: Number.parseFloat(
          await firstImage.evaluate(
            (element) => getComputedStyle(element).translate,
          ),
        ),
        clip: await frame.evaluate(
          (element) => getComputedStyle(element).clipPath,
        ),
      };
    };
    const early = await sample(0.2, 0);
    const later = await sample(0.4, early.pan);
    expect(later.pan > early.pan).toBe(supported);
    expect(later.clip !== early.clip).toBe(supported);
    await expect(gallery.locator("figcaption").first()).toHaveCSS(
      "translate",
      "none",
    );
    await expect(gallery.locator("figcaption").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await track.evaluate((element) => {
      element.scrollLeft = 0;
    });
    await expect(firstImage).toHaveCSS("translate", supported ? "0%" : "none");
    await expect(frame).toHaveCSS(
      "clip-path",
      supported ? "inset(0px)" : "none",
    );
    await track.locator("a").first().focus();
    await expect(frame).toHaveCSS("clip-path", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(firstImage).toHaveCSS("animation-name", "none");
    await expect(firstImage).toHaveCSS("translate", "none");
    await expect(frame).toHaveCSS("clip-path", "none");
  });
});

test.describe("Native no-JavaScript fallback", () => {
  test.use({ javaScriptEnabled: false });

  test("Retains images, captions, links and native scrolling without dead controls", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/");
    const gallery = page.locator(".image-carousel");
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await expect(track.locator("img")).toHaveCount(3);
    await expect(gallery.locator("figcaption")).toHaveCount(3);
    await expect(gallery.getByRole("button")).toHaveCount(0);
    await expect(track.locator("a")).toHaveAttribute(
      "href",
      "/css-general-rules-of-thumb/",
    );
    await track.focus();
    await track.press("End");
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    await expect(track.locator("img").last()).toHaveCSS("translate", "none");
  });
});

test.describe("Touch controls", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 } });

  test("Keeps controls visible and usable without hover", async ({ page }) => {
    await page.goto("/cheat-sheet/");
    const gallery = page.locator(".image-carousel");
    const next = gallery.getByRole("button", { name: "Next image" });
    await expect(next).toBeEnabled();
    await gallery.scrollIntoViewIfNeeded();
    await expect(next).toHaveCSS("opacity", "1");
    await next.tap();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 3",
    );
  });
});
