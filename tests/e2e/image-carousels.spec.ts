import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  await page.route(
    (url) => url.origin !== new URL(baseURL!).origin,
    (route) => route.fulfill({ status: 204 }),
  );
});

for (const width of [1440, 640, 375, 320]) {
  test(`Gallery preserves article image sizing and full-bleed rail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page.getByRole("region", { name: "Image gallery" });
    const track = gallery.getByRole("group", { name: "Gallery images" });
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
      const [reference, current, rail] = await Promise.all([
        normal.boundingBox(),
        image.boundingBox(),
        track.boundingBox(),
      ]);
      expect(reference).not.toBeNull();
      expect(current).not.toBeNull();
      expect(rail).not.toBeNull();
      expect(current!.width).toBeCloseTo(reference!.width, 0);
      expect(current!.height).toBeCloseTo(reference!.height, 0);
      expect(current!.x).toBeCloseTo(reference!.x, 0);
      expect(rail!.x).toBeCloseTo(0, 0);
      expect(rail!.width).toBeCloseTo(width, 0);
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
    await image.hover();
    await next.click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await next.click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await expect(next).toHaveCount(0);
    await expect(track).toBeFocused();
    await track.press("ArrowRight");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await track.focus();
    await track.press("Home");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 3",
    );
    await track.press("ArrowRight");
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await page.setViewportSize({
      width: width === 320 ? 640 : 320,
      height: 700,
    });
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
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
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await gallery.getByRole("link").focus();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 1 of 3",
    );
    await expect(gallery.getByRole("link")).toBeFocused();
    await page.emulateMedia({ forcedColors: "active" });
    await page.keyboard.press("Shift+Tab");
    await expect(track).toBeFocused();
    await expect(track).toHaveCSS("outline-style", "solid");
    await expect(image).toHaveCSS("opacity", "1");
    await gallery.getByRole("button", { name: "Go to image 3 of 3" }).click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 3 of 3",
    );
  });
}

test.describe("Continuous scroll-linked motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("interpolates scale and opacity before and after the midpoint without waiting for a slide change", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page.getByRole("region", { name: "Image gallery" });
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await gallery.scrollIntoViewIfNeeded();
    await expect(
      gallery.getByRole("button", { name: "Go to image 1 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    const image = gallery.locator("img").first();
    const bounds = await image.boundingBox();
    expect(bounds).not.toBeNull();
    const step = await track.evaluate((element) => {
      const slides = element.querySelectorAll<HTMLElement>(
        ".image-carousel__slide",
      );
      return slides[1]!.offsetLeft - slides[0]!.offsetLeft;
    });
    const x = bounds!.x + bounds!.width * 0.8;
    const y = bounds!.y + bounds!.height * 0.3;
    await page.mouse.move(x, y);
    await page.mouse.down();
    const samples = [];
    for (const progress of [0, 0.02, 0.2, 0.4, 0.6, 0.8, 1]) {
      await page.mouse.move(x - step * progress, y);
      await expect
        .poll(() => track.evaluate((element) => element.scrollLeft))
        .toBeCloseTo(step * progress, 0);
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
    await page.mouse.move(x - step * 0.65, y);
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeCloseTo(step * 0.65, 0);
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
    ).toBeCloseTo(step * 0.65, 0);
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
  });
});

test("Overlay arrows and dot paging match the other carousel alternatives", async ({
  page,
}) => {
  await page.goto("/ai-learnings-from-upgrading-my-blog/", {
    waitUntil: "domcontentloaded",
  });
  const gallery = page
    .locator(".image-carousel")
    .filter({ has: page.locator('img[alt*="Currency Converter Pro"]') });
  const image = gallery.locator("img").first();
  const next = gallery.getByRole("button", { name: "Next image", exact: true });
  const track = gallery.getByRole("group", { name: "Gallery images" });
  const firstDot = gallery.getByRole("button", { name: "Go to image 1 of 2" });
  const secondDot = gallery.getByRole("button", { name: "Go to image 2 of 2" });
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
    await expect(next).toHaveCSS("background-color", "rgba(0, 0, 0, 0.65)");
    await expect(next).toHaveCSS("color", "rgb(255, 255, 255)");
    await next.hover();
    await expect(next).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(next).not.toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await expect(page.getByRole("tooltip", { name: "Next image" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await secondDot.click();
  await expect(secondDot).toHaveAttribute("aria-current", "true");
  await expect(firstDot).not.toHaveAttribute("aria-current");
  await expect(secondDot.locator("span")).toHaveCSS("width", "20px");
  await expect(firstDot.locator("span")).toHaveCSS("width", "14px");
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
    const gallery = page.getByRole("region", { name: "Image gallery" });
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await gallery.scrollIntoViewIfNeeded();
    const image = gallery.locator("img").first();
    const bounds = await image.boundingBox();
    expect(bounds).not.toBeNull();
    const x = bounds!.x + bounds!.width * 0.8;
    const y = bounds!.y + bounds!.height * 0.3;
    const session = await context.newCDPSession(page);
    try {
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
  const gallery = page.getByRole("region", { name: "Image gallery" });
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
            Boolean(document.elementFromPoint(x, y)?.closest(".image-carousel"))
          );
        }),
    )
    .toBe(true);
});

test("Mouse dragging a linked image scrolls without opening its link, but a normal click still works", async ({
  page,
}) => {
  await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
  const gallery = page.getByRole("region", { name: "Image gallery" });
  await gallery.scrollIntoViewIfNeeded();
  const image = gallery.locator("img").first();
  const bounds = await image.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width * 0.8;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - bounds!.width * 0.8, y, { steps: 12 });
  await page.mouse.up();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 3",
  );
  await expect(page).toHaveURL(/\/cheat-sheet\/$/);
  await gallery.getByRole("button", { name: "Go to image 1 of 3" }).click();
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
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
    .locator(".image-carousel")
    .filter({ has: page.locator('img[alt*="Currency Converter Pro"]') });
  await expect(gallery.locator("img")).toHaveCount(2);
  await expect(gallery.locator("img").first()).toHaveAttribute(
    "loading",
    "lazy",
  );
  await gallery.scrollIntoViewIfNeeded();
  await gallery.getByRole("group", { name: "Gallery images" }).hover();
  await page.mouse.wheel(1200, 0);
  await expect(gallery.locator(".image-carousel__position")).toHaveText(
    "Image 2 of 2",
  );
  await expect(
    page.locator('.image-carousel img[src*="about-page-experiments"]'),
  ).toHaveCount(0);
});

test.describe("Progressive enhancement", () => {
  test.use({ javaScriptEnabled: false });

  test("Images, captions and links remain available without JavaScript", async ({
    page,
  }) => {
    await page.goto("/cheat-sheet/", { waitUntil: "domcontentloaded" });
    const gallery = page.getByRole("region", { name: "Image gallery" });
    await expect(gallery.locator("img")).toHaveCount(3);
    await expect(gallery.locator("figcaption")).toHaveCount(3);
    await expect(gallery.getByRole("link")).toHaveAttribute(
      "href",
      "/css-general-rules-of-thumb/",
    );
    await expect(gallery.getByRole("button")).toHaveCount(0);
    const track = gallery.getByRole("group", { name: "Gallery images" });
    await expect(track).toHaveAttribute("tabindex", "0");
    await expect(track).toHaveCSS("overflow-x", "auto");
    await expect(gallery.locator(".prose-image").first()).toHaveCSS(
      "opacity",
      "1",
    );
  });
});
