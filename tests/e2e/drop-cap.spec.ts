import { expect, test } from "./fixtures";

for (const width of [375, 640, 1280]) {
  for (const appearance of ["light", "dark", "high-contrast"] as const) {
    test(`Post drop caps have breathing room at ${width}px in ${appearance}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        colorScheme: appearance === "dark" ? "dark" : "light",
        forcedColors: appearance === "high-contrast" ? "active" : "none",
      });
      await page.goto("/asp-net-core-fluent-interface-extensions/");
      const paragraph = page.locator(".post__content > p").first();
      await expect(paragraph).toContainText("Last week");
      await expect(paragraph).toBeVisible();

      const spacing = await paragraph.evaluate((element) => {
        const dropCap = getComputedStyle(element, "::first-letter");
        return {
          padding: Number.parseFloat(dropCap.paddingInlineEnd),
          rootFontSize: Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ),
        };
      });
      expect(spacing.padding).toBeCloseTo(spacing.rootFontSize * 0.75, 1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    });
  }
}
