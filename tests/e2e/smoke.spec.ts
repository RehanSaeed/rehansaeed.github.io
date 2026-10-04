import { expect, test } from "./fixtures";

test.describe("Smoke", () => {
  test("Visit all pages", async ({ page }) => {
    const nav = page.locator("nav");

    await page.goto("/");
    await expect(page.locator("h1#muhammad-rehan-saeed").first()).toBeVisible();

    await nav.getByRole("link", { name: "Portfolio", exact: true }).click();
    await expect(page.locator("h1#portfolio")).toBeVisible();

    await nav.getByRole("link", { name: "About", exact: true }).click();
    await expect(page.locator("h1#about")).toBeVisible();

    await nav.getByRole("link", { name: "Blog", exact: true }).click();
    await expect(page.locator("h1#muhammad-rehan-saeed").first()).toBeVisible();

    await page.locator(".post-card__title").first().click();
    await expect(page.locator(".post-page__title-container")).toBeVisible();

    await page.locator(".tags__link").first().click();
    await expect(page).toHaveURL(/\/tag\//);
    await expect(page.locator("h1").first()).toContainText("#");
  });

  test("404 Page", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.locator("h1").filter({ hasText: "404 Not Found" }),
    ).toBeVisible();
  });
});
