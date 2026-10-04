import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const openSearch = (page: Page) =>
  page.getByRole("button", { name: "Open search" }).click();

test.describe("Search", () => {
  test("Open search", async ({ page }) => {
    await page.goto("/");
    await openSearch(page);

    await expect(
      page.getByRole("searchbox", { name: "Search", exact: true }),
    ).toBeVisible();
  });

  test("Close search", async ({ page }) => {
    await page.goto("/");
    await openSearch(page);
    await page.getByRole("button", { name: "Close Search" }).click();

    await expect(
      page.getByRole("searchbox", {
        name: "Search",
        exact: true,
        includeHidden: true,
      }),
    ).toBeHidden();
  });

  test("Search portfolio", async ({ page }) => {
    await page.goto("/");
    await openSearch(page);
    await page
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill("Schema.NET");

    await expect(page.locator(".search-result__link").first()).toHaveAttribute(
      "href",
      "https://github.com/RehanSaeed/Schema.NET",
    );
  });

  test("Search post", async ({ page }) => {
    await page.goto("/");
    await openSearch(page);
    await page
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill("ASP.NET");
    await page.locator(".search-result__link").first().click();

    await expect(
      page.getByRole("searchbox", {
        name: "Search",
        exact: true,
        includeHidden: true,
      }),
    ).toBeHidden();
  });
});
