import { expect, test } from "./fixtures";

for (const width of [320, 375, 743, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Author spacing stays compact and consistent at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      const authors = page.locator(".author");
      await expect(authors).toHaveCount(2);
      for (const author of await authors.all()) {
        await expect(author).toBeVisible();
        await expect(
          author.getByRole("heading", { name: "Muhammad Rehan Saeed" }),
        ).toBeVisible();
        await expect(author.getByRole("link")).toHaveCount(10);

        const layout = await author.evaluate((element) => {
          const children = [...element.children];
          const bounds = children.map((child) => child.getBoundingClientRect());
          const titleStyle = getComputedStyle(children[1]!);
          return {
            gap: Number.parseFloat(getComputedStyle(element).rowGap),
            gaps: bounds
              .slice(1)
              .map((rect, index) => rect.top - bounds[index]!.bottom),
            titleFontSize: Number.parseFloat(titleStyle.fontSize),
            titleLineHeight: Number.parseFloat(titleStyle.lineHeight),
            fits: bounds.every(
              (rect) => rect.left >= 0 && rect.right <= innerWidth,
            ),
          };
        });

        expect(layout.gap).toBeGreaterThanOrEqual(16);
        expect(layout.gap).toBeLessThanOrEqual(20);
        for (const gap of layout.gaps) {
          expect(gap).toBeCloseTo(layout.gap, 1);
        }
        expect(layout.titleLineHeight / layout.titleFontSize).toBeCloseTo(
          1.2,
          2,
        );
        expect(layout.fits).toBe(true);
      }
    });
  }
}

test("Author content stays visible in forced colours", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  const authors = page.locator(".author");
  await expect(authors).toHaveCount(2);
  for (const author of await authors.all()) {
    await expect(author.getByRole("img")).toBeVisible();
    await expect(author.getByRole("heading")).toBeVisible();
    await expect(author.locator(".author__description")).toBeVisible();
    for (const link of await author.getByRole("link").all()) {
      await expect(link).toBeVisible();
      await expect(link).toHaveAccessibleName(/\S/);
    }
  }
});
