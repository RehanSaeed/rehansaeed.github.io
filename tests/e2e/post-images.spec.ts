import { expect, test } from "@playwright/test";

for (const width of [1280, 375, 320]) {
  test(`Inset post images stay centred without upscaling at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.route(
      (url) => url.origin !== new URL(baseURL!).origin,
      (route) => route.fulfill({ status: 204 }),
    );
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/ai-learnings-from-upgrading-my-blog/", {
      waitUntil: "domcontentloaded",
    });
    const image = page.locator(".post__image-inset img");
    await expect(image).toBeVisible();
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element) => {
      if (element instanceof HTMLImageElement) {
        await element.decode();
      }
    });

    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const dimensions = await image.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const container = element.closest(".post__image-inset")!;
        const containerBounds = container.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          left: bounds.left,
          right: bounds.right,
          centre: bounds.left + bounds.width / 2,
          containerCentre: containerBounds.left + containerBounds.width / 2,
        };
      });

      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.width).toBeLessThanOrEqual(311);
      expect(dimensions.left).toBeGreaterThanOrEqual(0);
      expect(dimensions.right).toBeLessThanOrEqual(width);
      expect(dimensions.centre).toBeCloseTo(dimensions.containerCentre, 0);
      expect(dimensions.width / dimensions.height).toBeCloseTo(311 / 388, 2);
    }

    await page.emulateMedia({ forcedColors: "active" });
    await expect(image).toBeVisible();
  });
}
