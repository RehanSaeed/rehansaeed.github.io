import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, getAnalyticsEvents, test } from "./fixtures";

type BaselinePage = { cards: string[] };

const baseline: Record<string, BaselinePage> = JSON.parse(
  readFileSync(join(process.cwd(), "tests/parity/baseline/pages.json"), "utf8"),
);

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

test.describe("Parity", () => {
  for (const path of [
    "/",
    "/2/",
    "/on-the-etiquette-of-pull-request-comments/",
    "/tag/net/",
    "/about/",
    "/portfolio/",
  ]) {
    test(`Console is clean on ${path}`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() !== "error" && message.type() !== "warning") return;
        const source = message.location().url;
        // Third-party embeds (badges, avatars, comments) are outside our control.
        if (source && !source.startsWith(origin)) return;
        if (
          message.type() === "warning" &&
          !/hydrat|\[Vue warn\]/i.test(message.text())
        )
          return;
        // An artefact of `serviceWorkers: 'block'`; registration is covered by its own test.
        if (/service worker registration/i.test(message.text())) return;
        errors.push(`${message.type()}: ${message.text()}`);
      });

      await page.goto(path);
      await page.waitForLoadState("load");

      expect(errors).toEqual([]);
    });
  }

  for (const path of [
    "/",
    "/2/",
    "/tag/net/",
    "/tag/c/",
    "/tag/asp-net-core/",
  ]) {
    test(`Card order on ${path}`, async ({ page }) => {
      await page.goto(path);

      const cards = (
        await page.locator(".post-card__title").allTextContents()
      ).map(collapse);
      expect(cards).toEqual(baseline[path].cards);
    });
  }

  test("Dates are absolute in HTML and relative after hydration", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2022-08-05T00:00:00Z") });

    const response = await page.goto(
      "/on-the-etiquette-of-pull-request-comments/",
    );
    expect(await response!.text()).toMatch(
      /<time[^>]*datetime="2022-08-02[^"]*"[^>]*>\s*2 August 2022\s*<\/time>/,
    );
    await expect(page.locator("time").first()).toHaveText("3 days ago");

    await page.goto("/open-uk-honouree/");
    await expect(page.locator("time").first()).toHaveText("7 February 2022");
  });

  test("Theme follows the OS colour scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.emulateMedia({ colorScheme: "dark" });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      "dark",
    );
  });

  test("Stored theme is applied before first paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute("data-theme"),
      ),
    ).toBe("dark");
  });

  test("Theme toggle swaps About page images", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/about/");
    const stackOverflow = page.locator(".about__stack-overflow-image");
    const gitHub = page.locator("img.about__github-statistics");
    await expect(stackOverflow).toHaveAttribute("src", /[?&]theme=dark$/);
    await expect(gitHub).toHaveAttribute("src", /profile-green-animate\.svg$/);

    await page.getByRole("button", { name: "Toggle dark/light" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(stackOverflow).toHaveAttribute("src", /[?&]theme=light$/);
    await expect(gitHub).toHaveAttribute("src", /profile-night-green\.svg$/);
  });

  test("Analytics events", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const openSearch = page.getByRole("button", { name: "Open search" });
    const searchInput = page.locator("input#search");
    const tracked = async () =>
      (await getAnalyticsEvents(page)).filter((e) =>
        ["app-theme", "search"].includes(e.category),
      );

    await expect
      .poll(tracked)
      .toEqual([
        { category: "app-theme", action: "theme-loaded", label: "light" },
      ]);

    await openSearch.click();
    await expect(searchInput).toBeVisible();
    await page.getByRole("button", { name: "Close search" }).click();
    await expect(searchInput).toBeHidden();
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await openSearch.click();
    await searchInput.fill("ASP.NET");
    await page.locator(".search-result__link").first().click();
    await expect(searchInput).toBeHidden();

    await expect.poll(tracked).toEqual([
      { category: "app-theme", action: "theme-loaded", label: "light" },
      { category: "search", action: "search-opened" },
      { category: "search", action: "search-closed" },
      { category: "app-theme", action: "theme-changed", label: "dark" },
      { category: "search", action: "search-opened" },
      {
        category: "search",
        action: "search-result-selected",
        label: "ASP.NET",
      },
    ]);
  });

  test("Search deep link opens the dialog prefilled", async ({ page }) => {
    await page.goto("/?search=ASP.NET");

    await expect(page.locator("input#search")).toBeVisible();
    await expect(page.locator("input#search")).toHaveValue("ASP.NET");
  });
});

test.describe("Service worker", () => {
  test.use({ serviceWorkers: "allow" });

  test("Registers at /service-worker.js", async ({ page, baseURL }) => {
    test.slow();
    await page.goto("/");

    // ready only resolves once the precache install succeeds and the worker activates.
    const scriptURL = await page.evaluate(
      async () => (await navigator.serviceWorker.ready).active?.scriptURL,
    );
    expect(scriptURL).toBe(new URL("/service-worker.js", baseURL).href);
  });

  test("Works offline", async ({ page, context, browserName }) => {
    test.skip(
      browserName === "firefox",
      "Playwright's Firefox offline mode bypasses service workers.",
    );
    test.slow();
    // Without the HTTP cache, every offline request must be answered by the service worker.
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener("controllerchange", resolve),
        );
      }
    });
    await context.setOffline(true);

    await page.goto("/tag/c/");
    await expect(page).toHaveTitle(/C#/);

    await page.locator('a[href="/about/"]').first().click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page).toHaveTitle(/^About/);
  });
});
