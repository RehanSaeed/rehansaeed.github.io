import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1280]) {
  test(`Six title-and-number treatments stay side by side at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(
      await readFile(
        join(process.cwd(), "tests", "fixtures", "oss-card-treatments.html"),
        "utf8",
      ),
    );
    await expect(page.locator(".treatment")).toHaveCount(6);
    for (const treatment of await page.locator(".treatment").all()) {
      const cards = treatment.locator(".metric");
      await expect(cards).toHaveCount(2);
      await expect(cards.locator("h3")).toHaveText([
        "NuGet downloads",
        "GitHub stars",
      ]);
      await expect(cards.locator("p")).toHaveText(["301,807,974", "8,784"]);
      const first = (await cards.nth(0).boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      expect(second.y).toBe(first.y);
      expect(second.x).toBeGreaterThan(first.x);
      expect(
        await cards.evaluateAll((elements) =>
          elements.every(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ),
      ).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const theme = page.getByRole("button", { name: "Dark mode" });
    await theme.click();
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Narrow preview" }).click();
    await expect(page.locator("main")).toHaveClass("narrow");
  });
}
