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
  test("Searches from two characters and explains short and unmatched queries", async ({
    page,
  }) => {
    await page.goto("/");
    await openSearch(page);
    const input = page.getByRole("searchbox", { name: "Search", exact: true });
    const status = page.locator(".search__feedback [role='status']");

    await expect(status).toHaveText("");
    await input.fill("a");
    await expect(
      status.getByRole("heading", { name: "Keep typing" }),
    ).toBeVisible();
    await expect(status.locator(".search__feedback-icon")).toBeVisible();
    await expect(
      status.getByText("Enter at least 2 characters to search."),
    ).toBeVisible();
    await expect(page.locator(".search-result")).toHaveCount(0);
    await input.clear();
    await expect(status).toHaveText("");
    await input.fill("AI");
    await expect(
      page.getByRole("dialog", { name: "Search" }).getByRole("link", {
        name: /AI Gone Rogue/,
      }),
    ).toBeVisible();
    await expect(status).toHaveText("");
    await input.fill("zzzznonexistentsearchterm");
    const heading = status.getByRole("heading", { name: "No results found" });
    await expect(heading).toBeVisible();
    await expect(status.locator(".search__feedback-icon")).toBeVisible();
    await expect(status.getByText("Try a different search.")).toBeVisible();
    const feedbackCenterOffset = await heading.evaluate((message) => {
      const range = document.createRange();
      range.selectNodeContents(message);
      const text = range.getBoundingClientRect();
      const container = message.parentElement!.getBoundingClientRect();
      return Math.abs(
        (text.left + text.right - container.left - container.right) / 2,
      );
    });
    expect(feedbackCenterOffset).toBeLessThan(1);
    await expect(page.locator(".search-result")).toHaveCount(0);
    await input.fill("Schema.NET");
    await expect(page.locator(".search-result__link").first()).toHaveAttribute(
      "href",
      "https://github.com/RehanSaeed/Schema.NET",
    );
    await expect(status).toHaveText("");
  });

  test("Does not show stale results after the query becomes too short", async ({
    page,
  }) => {
    let releaseIndex!: () => void;
    const indexGate = new Promise<void>((resolve) => {
      releaseIndex = resolve;
    });
    await page.route("**/flexsearch.json", async (route) => {
      await indexGate;
      await route.continue();
    });
    await page.goto("/");
    await openSearch(page);
    const input = page.getByRole("searchbox", { name: "Search", exact: true });
    const status = page.locator(".search__feedback [role='status']");
    await input.fill("Schema.NET");
    await expect(
      status.getByRole("heading", { name: "Searching…" }),
    ).toBeVisible();
    await expect(status.locator(".search__feedback-icon")).toBeVisible();
    await input.fill("a");
    await expect(
      status.getByRole("heading", { name: "Keep typing" }),
    ).toBeVisible();
    const response = page.waitForResponse("**/flexsearch.json");
    releaseIndex();
    await response;
    await input.fill("zzzznonexistentsearchterm");
    await expect(
      status.getByRole("heading", { name: "No results found" }),
    ).toBeVisible();
    await expect(page.locator(".search-result")).toHaveCount(0);
  });

  test("Reports index failures and retries the current query", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    let fail = true;
    await page.route("**/flexsearch.json", async (route) => {
      if (fail) {
        await route.fulfill({ status: 503, body: "Unavailable" });
      } else {
        await route.continue();
      }
    });
    await page.goto("/");
    await openSearch(page);
    const input = page.getByRole("searchbox", { name: "Search", exact: true });
    await input.fill("Schema.NET");
    const status = page.locator(".search__feedback [role='status']");
    await expect(
      status.getByRole("heading", { name: "Search is unavailable" }),
    ).toBeVisible();
    await expect(status.locator(".search__feedback-icon")).toBeVisible();
    await expect(status.getByText("Please try again.")).toBeVisible();
    fail = false;
    const retry = page.getByRole("button", { name: "Retry search" });
    await input.press("Tab");
    await expect(retry).toBeFocused();
    await expect(retry).toHaveCSS("outline-style", "solid");
    await retry.press("Enter");
    await expect(input).toBeFocused();
    await expect(page.locator(".search-result__link").first()).toHaveAttribute(
      "href",
      "https://github.com/RehanSaeed/Schema.NET",
    );
  });

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
