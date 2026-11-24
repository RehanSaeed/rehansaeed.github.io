import { expect, test } from "./fixtures";

test("Uses valid OKLCH accent tokens where supported", async ({ page }) => {
  await page.goto("/");
  const accents = await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = "light";
    const light = getComputedStyle(root)
      .getPropertyValue("--global-accent-color")
      .trim();
    root.dataset.theme = "dark";
    const dark = getComputedStyle(root)
      .getPropertyValue("--global-accent-color")
      .trim();
    return {
      supportsOklch: CSS.supports("color", "oklch(0.5 0.1 290)"),
      lightValid: CSS.supports("color", light),
      darkValid: CSS.supports("color", dark),
      light,
      dark,
    };
  });

  expect(accents.light).not.toBe(accents.dark);
  expect(accents.lightValid).toBe(true);
  expect(accents.darkValid).toBe(true);
  expect(accents.light.startsWith("oklch(")).toBe(accents.supportsOklch);
  expect(accents.dark.startsWith("oklch(")).toBe(accents.supportsOklch);
});
