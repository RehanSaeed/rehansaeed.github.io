import type { E2EFixtures } from "./fixtures";
import { expect, test } from "./fixtures";

for (const width of [375, 1280, 1920]) {
  async function verifyCardSizing({ page }: Pick<E2EFixtures, "page">) {
    await page.setViewportSize({ width, height: 1080 });
    const measurements = [];
    for (const path of ["/", "/2/", "/tag/net/", "/portfolio/"]) {
      await page.goto(path);
      const card = page.locator(".post-card, .portfolio-card").first();
      await expect(card).toHaveClass(/card--compact/);
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      const image = card.locator(".post-card__image, .portfolio-card__image");
      if (await image.count()) {
        await image.evaluate((element: HTMLImageElement) => element.decode());
      }
      const compact = await card.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          width: bounds.width,
          height: bounds.height,
          fontSize: Number.parseFloat(style.fontSize),
          padding: Number.parseFloat(style.paddingTop),
          columns: getComputedStyle(
            element.parentElement!,
          ).gridTemplateColumns.split(" ").length,
        };
      });
      measurements.push(compact);
      expect(compact.fontSize).toBeGreaterThanOrEqual(16);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      if (width === 1920) {
        const original = await card.evaluate((element) => {
          const grid = element.parentElement!;
          const cards = [...grid.querySelectorAll(".card--compact")];
          cards.forEach((card) => {
            card.classList.remove("card--compact");
          });
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const result = {
            width: bounds.width,
            height: bounds.height,
            fontSize: Number.parseFloat(style.fontSize),
            padding: Number.parseFloat(style.paddingTop),
            columns:
              getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          };
          cards.forEach((card) => {
            card.classList.add("card--compact");
          });
          return result;
        });
        expect(compact.columns).toBe(original.columns);
        expect(
          Math.abs(compact.width - original.width * 0.85),
        ).toBeLessThanOrEqual(1);
        expect(compact.height).toBeLessThan(original.height);
        expect(compact.fontSize).toBeCloseTo(original.fontSize * 0.85, 1);
        expect(compact.padding).toBeCloseTo(original.padding * 0.85, 1);
      }
    }
    const reference = measurements[0]!;
    for (const size of measurements.slice(1)) {
      expect(size.width).toBeCloseTo(reference.width, 1);
      expect(size.padding).toBeCloseTo(reference.padding, 1);
      expect(size.fontSize).toBeCloseTo(reference.fontSize, 1);
    }
  }

  test(`Blog and Portfolio cards share modest compact sizing at ${width}px`, async ({
    page,
  }) => {
    await expect(
      verifyCardSizing({
        page,
      }),
    ).resolves.toBeUndefined();
  });
}
