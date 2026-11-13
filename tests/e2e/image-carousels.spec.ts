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
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await next.click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 2 of 3",
    );
    await next.click();
    await expect(gallery.locator(".image-carousel__position")).toHaveText(
      "Image 3 of 3",
    );
    await expect(next).toBeFocused();
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await next.press("Enter");
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
    await track.focus();
    await track.press("Home");
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
    await expect(
      gallery.getByRole("button", { name: "Go to image 1 of 3" }),
    ).toHaveAttribute("aria-current", "true");
    const samples = [];
    for (const progress of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      await track.evaluate((element, value) => {
        const slides = element.querySelectorAll<HTMLElement>(
          ".image-carousel__slide",
        );
        // Hold intermediate positions: mandatory snapping would otherwise immediately settle.
        element.classList.add("image-carousel__track--dragging");
        element.scrollLeft =
          (slides[1]!.offsetLeft - slides[0]!.offsetLeft) * value;
      }, progress);
      await expect
        .poll(() =>
          track
            .locator(".prose-image")
            .first()
            .evaluate((element) => Number(getComputedStyle(element).opacity)),
        )
        .toBeCloseTo(1 - progress * 0.55, 2);
      samples.push(
        await track.locator(".prose-image").evaluateAll((images) =>
          images.slice(0, 2).map((image) => {
            const style = getComputedStyle(image);
            return {
              opacity: Number(style.opacity),
              scale: image.getBoundingClientRect().width / image.clientWidth,
            };
          }),
        ),
      );
    }
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
