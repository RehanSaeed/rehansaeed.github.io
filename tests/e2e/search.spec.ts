import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const openSearch = (page: Page) =>
  page.getByRole("button", { name: "Open search" }).click();

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`Search focus with ${reducedMotion} motion`, () => {
    test.use({ reducedMotion });

    test("Opening and reopening focus the input and keyboard dismissal restores the opener", async ({
      page,
    }) => {
      await page.goto("/");
      const opener = page.getByRole("button", {
        name: "Open search",
        exact: true,
      });
      const input = page.getByRole("searchbox", {
        name: "Search",
        exact: true,
      });
      const dialog = page.getByRole("dialog", {
        name: "Search",
        exact: true,
        includeHidden: true,
      });

      await expect(opener).toBeEnabled();
      await opener.focus();
      await opener.press("Enter");
      await expect(input).toBeFocused();
      await page.keyboard.type("Schema.NET");
      await expect(input).toHaveValue("Schema.NET");
      await expect(
        page.locator(".search-result__link").first(),
      ).toHaveAttribute("href", "https://github.com/RehanSaeed/Schema.NET");

      await dialog
        .getByRole("button", { name: "Close Search", exact: true })
        .press("Enter");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();

      await opener.press("Enter");
      await expect(input).toBeFocused();
      await expect(input).toHaveValue("Schema.NET");
      // A populated native search input consumes Escape to clear the query first.
      await page.keyboard.press("Escape");
      await expect(input).toHaveValue("");
      await expect(input).toBeFocused();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();

      await opener.press("Enter");
      await expect(input).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });

    test("A search deep link focuses the prefilled input", async ({ page }) => {
      await page.goto("/?search=Schema.NET");
      const input = page.getByRole("searchbox", {
        name: "Search",
        exact: true,
      });

      await expect(input).toBeFocused();
      await expect(input).toHaveValue("Schema.NET");
      await expect(
        page.locator(".search-result__link").first(),
      ).toHaveAttribute("href", "https://github.com/RehanSaeed/Schema.NET");
    });
  });
}

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
