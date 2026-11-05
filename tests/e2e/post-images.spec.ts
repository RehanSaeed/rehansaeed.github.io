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

      test("Image captions stay close to the image with space after the caption", async ({
        page,
        baseURL,
      }) => {
        await page.route(
          (url) => url.origin !== new URL(baseURL!).origin,
          (route) => route.fulfill({ status: 204 }),
        );
        await page.goto("/cheat-sheet/", {
          waitUntil: "domcontentloaded",
        });
        const figure = page.locator(".post__content figure").filter({
          hasText: "A code-themed illustration.",
        });
        const image = figure.locator("img");
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(async (element) => {
          if (element instanceof HTMLImageElement) {
            await element.decode();
          }
        });

        for (const width of [1280, 640, 375]) {
          await page.setViewportSize({ width, height: 900 });
          for (const theme of ["light", "dark"]) {
            await page.evaluate((value) => {
              document.documentElement.dataset.theme = value;
            }, theme);
            for (const forcedColors of ["none", "active"] as const) {
              await page.emulateMedia({ forcedColors });
              const caption = figure.locator("figcaption");
              await expect(caption).toBeVisible();
              await expect(caption).toHaveCSS("font-style", "italic");
              const spacing = await figure.evaluate((element) => {
                const image = element.querySelector("img")!;
                const caption = element.querySelector("figcaption")!;
                const paragraph = image.closest("p")!;
                const style = getComputedStyle(paragraph);
                return {
                  gap:
                    caption.getBoundingClientRect().top -
                    image.getBoundingClientRect().bottom,
                  paragraphMargin: Number.parseFloat(style.marginBlockEnd),
                  captionMargin: Number.parseFloat(
                    getComputedStyle(caption).marginBlockEnd,
                  ),
                };
              });
              expect(spacing.gap).toBeGreaterThan(0);
              expect(spacing.gap).toBeCloseTo(spacing.paragraphMargin, 0);
              expect(spacing.gap).toBeCloseTo(spacing.captionMargin / 4, 0);
            }
          }
        }
      });
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

  test(`Currency Converter Pro screenshots fit at ${width}px`, async ({
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
    const images = page.locator(
      '.post__content img[src*="currency-converter-pro-"]',
    );
    await expect(images).toHaveCount(2);

    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(async (element) => {
        if (element instanceof HTMLImageElement) {
          await element.decode();
        }
      });
      await expect(image).toHaveAttribute("alt", /Currency Converter Pro/);
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        const bounds = await image.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.width).toBeGreaterThan(0);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        expect(bounds!.width / bounds!.height).toBeCloseTo(1999 / 1124, 2);
      }
      await page.emulateMedia({ forcedColors: "active" });
      await expect(image).toBeVisible();
      await page.emulateMedia({ forcedColors: "none" });
    }
  });
}
