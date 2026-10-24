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

  for (const width of [390, 1280]) {
    test(`Search preserves the navigation and background layout at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const opener = page.getByRole("button", { name: "Open search" });
      await expect(opener).toBeEnabled();
      await page.evaluate(() => document.fonts.ready);
      const icon = opener.locator("svg");
      await expect(icon).toBeVisible();
      const layout = () =>
        page.evaluate(() => {
          const button =
            document.querySelector<HTMLButtonElement>(".search-button")!;
          return {
            buttonWidth: button.offsetWidth,
            buttonHeight: button.offsetHeight,
            mainTop: document.querySelector("main")!.getBoundingClientRect()
              .top,
            navigationHeight: document
              .querySelector("nav")!
              .getBoundingClientRect().height,
          };
        });
      const before = await layout();

      await openSearch(page);
      await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
      await expect(icon).toBeVisible();
      expect(await layout()).toEqual(before);

      await page.getByRole("button", { name: "Close Search" }).click();
      await expect(page.locator(".search-dialogue")).toBeHidden();
      await expect(icon).toBeVisible();
      expect(await layout()).toEqual(before);
    });
  }

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
    await expect(page.locator(".search-result__link").first()).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    const count = await page.locator(".search-result").count();
    await expect(page.locator(".nuxt-announcer")).toHaveText(
      `${count} search ${count === 1 ? "result" : "results"}.`,
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
