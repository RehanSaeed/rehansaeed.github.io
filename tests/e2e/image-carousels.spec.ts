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

for (const width of [1440, 640, 390, 320]) {
  test(`Normal-sized central images and adjacent cropped windows at ${width}px`, async ({
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
    await expect(gallery.getByRole("radio")).toHaveCount(0);
    await track.scrollIntoViewIfNeeded();
    await page.addStyleTag({
      content: ".image-carousel__track--unsnapped { scroll-snap-type: none; }",
    });

    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const bounds = await gallery
        .locator(".image-carousel__viewport")
        .boundingBox();
      expect(bounds!.x).toBeCloseTo(0, 0);
      expect(bounds!.width).toBeCloseTo(width, 0);
      await gallery.getByRole("button", { name: "Go to image 1 of 2" }).click();
      await expect(gallery.locator(".image-carousel__position")).toHaveText(
        "Image 1 of 2",
      );
      const adjacency = await track.evaluate((element) => {
        const viewport = element.getBoundingClientRect();
        const frames = Array.from(element.querySelectorAll(".prose-image")).map(
          (frame) => frame.getBoundingClientRect(),
        );
        return {
          gap: frames[1]!.left - frames[0]!.right,
          width: frames[0]!.width,
          height: frames[0]!.height,
          firstLeft: frames[0]!.left,
          viewportLeft: viewport.left,
          viewportRight: viewport.right,
          secondVisibleWidth:
            Math.min(viewport.right, frames[1]!.right) -
            Math.max(viewport.left, frames[1]!.left),
        };
      });
      expect(adjacency.firstLeft + adjacency.width / 2).toBeCloseTo(
        width / 2,
        0,
      );
      expect(adjacency.gap).toBeGreaterThan(0);
      expect(adjacency.gap).toBeLessThanOrEqual(40);
      expect(Math.max(0, adjacency.secondVisibleWidth)).toBeCloseTo(
        Math.max(0, (width - adjacency.width) / 2 - adjacency.gap),
        0,
      );
      for (const index of [0, 1]) {
        await gallery
          .getByRole("button", { name: `Go to image ${index + 1} of 2` })
          .click();
        await expect(gallery.locator(".image-carousel__position")).toHaveText(
          `Image ${index + 1} of 2`,
        );
        const image = images.nth(index);
        const dimensions = await image.boundingBox();
        const viewport = await track.boundingBox();
        expect(dimensions!.x).toBeGreaterThanOrEqual(viewport!.x - 1);
        expect(dimensions!.x + dimensions!.width).toBeLessThanOrEqual(
          viewport!.x + viewport!.width + 1,
        );
        const standalone = await image.evaluate((element) => {
          const paragraph = document.createElement("p");
          paragraph.append(element.closest(".prose-image")!.cloneNode(true));
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
        await expect(image).toHaveCSS("object-fit", "contain");
        await expect(image).toHaveCSS("object-position", "50% 50%");
        await expect(image).toHaveCSS("translate", "none");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await gallery.getByRole("button", { name: "Go to image 1 of 2" }).click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 2",
    );
    const frames = gallery.locator(".prose-image");
    const central = await frames.first().boundingBox();
    const side = await frames.last().boundingBox();
    expect(side!.height).toBeCloseTo(central!.height, 1);
    await track.evaluate((element) => {
      element.classList.add("image-carousel__track--unsnapped");
      element.scrollLeft = (element.scrollWidth - element.clientWidth) * 0.3;
    });
    const between = await track.evaluate((element) => {
      const port = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll(".prose-image")).map(
        (frame) => {
          const bounds = frame.getBoundingClientRect();
          return (
            Math.min(port.right, bounds.right) -
            Math.max(port.left, bounds.left)
          );
        },
      );
    });
    expect(between.every((visible) => visible > 0)).toBe(true);
    await track.evaluate((element) => {
      element.scrollLeft = 0;
      element.classList.remove("image-carousel__track--unsnapped");
    });
    await page.emulateMedia({ forcedColors: "active" });
    await track.focus();
    await track.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(track).toBeFocused();
    await track.press("Home");
    await expect(track).toHaveCSS("outline-style", "solid");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 2",
    );
    const firstDot = gallery.getByRole("button", {
      name: "Go to image 1 of 2",
    });
    const secondDot = gallery.getByRole("button", {
      name: "Go to image 2 of 2",
    });
    const dotSpacing = await secondDot.evaluate((element) => {
      const previous = element.previousElementSibling!;
      return (
        element.getBoundingClientRect().x - previous.getBoundingClientRect().x
      );
    });
    expect(dotSpacing).toBeLessThanOrEqual(32);
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
  await expect(gallery.getByRole("radio")).toHaveCount(0);
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
  await expect(link).toHaveCSS("outline-style", "solid");
  await expect(link).toHaveCSS("outline-offset", "-2px");
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
    bounds!.x + bounds!.width * 0.4,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds!.x - bounds!.width * 0.4,
    bounds!.y + bounds!.height / 2,
    { steps: 12 },
  );
  await expect(gallery.locator(".image-carousel__arrows")).toBeHidden();
  await page.mouse.up();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
});

test.describe("Continuous window motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Pans inside side windows while opening the centred image to normal size", async ({
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
    await expect(firstImage).toHaveCSS(
      "animation-name",
      supported ? "image-window-pan" : "none",
    );
    await expect(firstImage).toHaveCSS("object-fit", "contain");
    const pan = () =>
      firstImage.evaluate((element) => {
        const value = getComputedStyle(element).translate;
        return value === "none" ? 0 : Number.parseFloat(value);
      });
    await expect.poll(pan).toBeLessThan(0.01);
    await expect.poll(pan).toBeGreaterThan(-0.01);
    // Stop snapping only to sample two genuine between-slide scroll positions.
    await page.addStyleTag({
      content: ".image-carousel__track { scroll-snap-type: none; }",
    });
    const sample = async (fraction: number, previousPan: number) => {
      await track.evaluate((element, value) => {
        element.scrollLeft =
          (element.scrollWidth - element.clientWidth) * value;
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
        pan: await pan(),
        frame: await firstImage.boundingBox(),
      };
    };
    const early = await sample(0.1, 0);
    const later = await sample(0.2, early.pan);
    expect(later.pan > early.pan).toBe(supported);
    expect(later.frame!.width).toBeCloseTo(early.frame!.width, 1);
    expect(later.frame!.height).toBeCloseTo(early.frame!.height, 1);
    expect(later.frame!.width / later.frame!.height).toBeCloseTo(1600 / 900, 2);
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
    await track.locator("a").first().focus();
    await expect(firstImage).toHaveCSS("object-fit", "contain");
    await expect(firstImage).toHaveCSS("animation-name", "none");
    await track.focus();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(firstImage).toHaveCSS("animation-name", "none");
    await expect(firstImage).toHaveCSS("translate", "none");
    await expect(firstImage).toHaveCSS("object-fit", "contain");
    await expect(firstImage).toHaveCSS("object-position", "50% 50%");
  });

  test("Mouse release smoothly settles from the dragged position without jumping", async ({
    page,
  }) => {
    await page.goto("/ai-learnings-from-upgrading-my-blog/");
    const gallery = page.locator(".image-carousel");
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await expect(
      gallery.getByRole("button", { name: "Next image" }),
    ).toBeEnabled();
    await track.scrollIntoViewIfNeeded();
    const image = await track.locator("img").first().boundingBox();
    const y = image!.y + image!.height / 2;
    await page.mouse.move(image!.x + image!.width * 0.6, y);
    await page.mouse.down();
    await page.mouse.move(image!.x - image!.width * 0.05, y, { steps: 12 });
    await expect(gallery.locator(".image-carousel__arrows")).toBeHidden();
    const releasedPosition = await track.evaluate(
      (element) => element.scrollLeft,
    );
    const target = await track.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    );
    expect(releasedPosition).toBeGreaterThan(target / 2);
    expect(releasedPosition).toBeLessThan(target - 30);
    await track.evaluate((element) => {
      element.addEventListener(
        "pointerup",
        () => {
          const start = element.scrollLeft;
          const end = element.scrollWidth - element.clientWidth;
          let intermediate = 0;
          const sample = () => {
            const position = element.scrollLeft;
            if (position > start + 1 && position < end - 1) {
              intermediate++;
            }
            element.dataset.releaseIntermediateFrames = String(intermediate);
            if (position < end - 1) {
              requestAnimationFrame(sample);
            }
          };
          requestAnimationFrame(sample);
        },
        { once: true },
      );
    });
    await page.mouse.up();
    await expect
      .poll(() =>
        track.evaluate((element) =>
          Math.abs(
            element.scrollLeft - (element.scrollWidth - element.clientWidth),
          ),
        ),
      )
      .toBeLessThan(1);
    expect(
      Number(await track.getAttribute("data-release-intermediate-frames")),
    ).toBeGreaterThanOrEqual(2);
    await expect(track).toHaveCSS("scroll-snap-type", "x mandatory");
    await expect(gallery.locator(".image-carousel__arrows")).toBeVisible();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 2",
    );
    await track.press("Home");
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeLessThan(1);
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
    await track.press("ArrowRight");
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
