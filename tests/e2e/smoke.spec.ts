import { load } from "cheerio";
import { expect, test } from "./fixtures";

test.describe("Smoke", () => {
  for (const { name, url } of [
    { name: "Mastodon", url: "https://hachyderm.io/@RehanSaeed" },
    { name: "Bluesky", url: "https://bsky.app/profile/rehansaeed.bsky.social" },
  ]) {
    test(`${name} social link supports profile verification before and after hydration`, async ({
      page,
      request,
    }) => {
      const response = await request.get("/");
      expect(response.ok()).toBe(true);
      const $ = load(await response.text());
      const staticLink = $(`footer .social a[aria-label="${name}"]`);
      expect(staticLink.length).toBe(1);
      expect(staticLink.attr("href")).toBe(url);
      expect(staticLink.attr("rel")).toBe("me");
      const staticIcon = staticLink.find("svg.icon");
      expect(staticIcon.length).toBe(1);
      expect(staticIcon.attr("aria-hidden")).toBe("true");
      expect(staticIcon.find("path").length).toBeGreaterThan(0);

      await page.goto("/");
      const link = page.locator("main .social").getByRole("link", {
        name,
        exact: true,
      });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", url);
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
          name,
          exact: true,
        }),
      ).toHaveAttribute("href", url);
    });
  }

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
