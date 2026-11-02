import { load } from "cheerio";
import { expect, test } from "./fixtures";

test.describe("Smoke", () => {
  test("Auto-imported components render without unresolved custom elements", async ({
    request,
  }) => {
    for (const path of [
      "/",
      "/2/",
      "/about/",
      "/portfolio/",
      "/on-the-etiquette-of-pull-request-comments/",
      "/streaming/thumbnail/",
      "/404-not-found/",
    ]) {
      const response = await request.get(path);
      expect(response.status()).toBe(path === "/404-not-found/" ? 404 : 200);
      const $ = load(await response.text());
      const unresolved = $("*")
        .toArray()
        .map((element) =>
          "name" in element && typeof element.name === "string"
            ? element.name
            : "",
        )
        .filter((tag) => tag.startsWith("u-"));
      expect(unresolved, path).toEqual([]);
      expect(
        $(path === "/streaming/thumbnail/" ? ".thumbnail__logo svg" : "h1")
          .length,
        path,
      ).toBeGreaterThan(0);
    }
  });

  for (const { name, url, previous } of [
    {
      name: "Bluesky",
      url: "https://bsky.app/profile/rehansaeed.bsky.social",
      previous: "Stack Overflow",
    },
    {
      name: "Mastodon",
      url: "https://hachyderm.io/@RehanSaeed",
      previous: "Bluesky",
    },
  ]) {
    test(`${name} social link supports profile verification before and after hydration`, async ({
      page,
      request,
    }) => {
      const iconRequests: string[] = [];
      page.on("request", (request) => {
        if (/iconify|_nuxt_icon/.test(request.url())) {
          iconRequests.push(request.url());
        }
      });
      const response = await request.get("/");
      expect(response.ok()).toBe(true);
      const $ = load(await response.text());
      const staticLink = $(`footer .social a[aria-label="${name}"]`);
      expect(staticLink).toHaveLength(1);
      expect(staticLink.attr("href")).toBe(url);
      expect(staticLink.attr("rel")).toBe("me");
      expect(staticLink.prev().attr("aria-label")).toBe(previous);
      const staticIcon = staticLink.find("svg.icon");
      expect(staticIcon).toHaveLength(1);
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
      await expect(
        page.locator(`main .social a[aria-label="${previous}"] + a`),
      ).toHaveAttribute("aria-label", name);
      await expect(link.locator("svg.icon")).toBeVisible();
      await expect(link.locator("svg.icon")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(link.locator("svg.icon path")).not.toHaveCount(0);

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
      await expect(
        page.locator(`.about__social-links a[aria-label="${previous}"] + a`),
      ).toHaveAttribute("aria-label", name);
      await expect(link.locator("svg.icon path")).not.toHaveCount(0);
      expect(iconRequests).toEqual([]);
    });
  }

  test("Visit all pages", async ({ page }) => {
    const unresolved: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Failed to resolve component")) {
        unresolved.push(message.text());
      }
    });
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
    expect(unresolved).toEqual([]);
  });

  test("404 Page", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(
      page.locator("h1").filter({ hasText: "404 Not Found" }),
    ).toBeVisible();
  });
});
