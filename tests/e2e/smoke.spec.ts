import { load } from "cheerio";
import { expect, test } from "./fixtures";

test.describe("Smoke", () => {
  test("Mastodon social link supports profile verification before and after hydration", async ({
    page,
    request,
  }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);
    const $ = load(await response.text());
    const staticLink = $('footer .social a[aria-label="Mastodon"]');
    expect(staticLink.length).toBe(1);
    expect(staticLink.attr("href")).toBe("https://hachyderm.io/@RehanSaeed");
    expect(staticLink.attr("rel")).toBe("me");
    expect(staticLink.find("svg title").text()).toBe("Mastodon");

    await page.goto("/");
    const link = page.locator("main .social").getByRole("link", {
      name: "Mastodon",
      exact: true,
    });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      "https://hachyderm.io/@RehanSaeed",
    );
    await expect(link).toHaveAttribute("rel", "me");

    await page
      .locator("nav")
      .getByRole("link", { name: "About", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("rel", "me");
    await expect(
      page.locator(".about__social-links").getByRole("link", {
        name: "Mastodon",
        exact: true,
      }),
    ).toHaveAttribute("href", "https://hachyderm.io/@RehanSaeed");
  });

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
