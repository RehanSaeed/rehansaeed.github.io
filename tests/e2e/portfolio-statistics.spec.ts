import { load } from "cheerio";
import { test as unitTest } from "@playwright/test";
import { portfolioStatistics } from "../../modules/blog-content/statistics";
import type { ContentEntry } from "../../modules/blog-content/scan";
import { expect, test } from "./fixtures";

const entry = (
  repository: string,
  overrides: Partial<ContentEntry["data"]> = {},
): ContentEntry => ({
  collection: "portfolio",
  path: `portfolio/${repository}/index.md`,
  data: {
    title: repository,
    permalink: `https://github.com/${repository}`,
    heroImage: "/images/hero/Code-1600x900.jpg",
    published: true,
    ...overrides,
  },
});

unitTest(
  "Portfolio totals deduplicate repositories and packages case-insensitively",
  () => {
    const first = entry("owner/first");
    const second = entry("owner/second", { kind: "open-source" });
    const duplicate = entry("OWNER/FIRST");
    const entries = [first, second, duplicate];
    const popularity = Object.fromEntries(
      entries.map(({ data }) => [
        data.permalink,
        {
          repository: new URL(data.permalink).pathname.slice(1),
          stars: data.title.toLowerCase().endsWith("first") ? 50 : 25,
        },
      ]),
    );
    const downloads = {
      [first.data.permalink]: {
        nugetPackages: [{ id: "Example.Shared", downloads: 100 }],
      },
      [second.data.permalink]: {
        nugetPackages: [
          { id: "example.shared", downloads: 100 },
          { id: "Example.Second", downloads: 200 },
        ],
      },
      [duplicate.data.permalink]: {
        nugetPackages: [{ id: "EXAMPLE.SHARED", downloads: 100 }],
      },
    };
    expect(portfolioStatistics(entries, popularity, downloads)).toEqual({
      stars: 75,
      downloads: 300,
      repositories: 2,
      packages: 2,
    });
  },
);

unitTest(
  "Portfolio totals exclude drafts, Microsoft work and blog posts",
  () => {
    const post = entry("owner/post");
    post.collection = "posts";
    expect(
      portfolioStatistics(
        [
          entry("owner/draft", { published: false }),
          entry("owner/microsoft", { kind: "microsoft" }),
          post,
        ],
        {},
        {},
      ),
    ).toEqual({ stars: 0, downloads: 0, repositories: 0, packages: 0 });
  },
);

unitTest(
  "Portfolio totals require complete data but accept genuine zero counts",
  () => {
    const project = entry("owner/first");
    const popularity = {
      [project.data.permalink]: { repository: "owner/first", stars: 0 },
    };
    expect(() => portfolioStatistics([project], {}, {})).toThrow(
      "Missing portfolio statistics:",
    );
    expect(() => portfolioStatistics([project], popularity, {})).toThrow(
      "Missing portfolio statistics:",
    );
    expect(
      portfolioStatistics([project], popularity, {
        [project.data.permalink]: { nugetPackages: [] },
      }),
    ).toEqual({ stars: 0, downloads: 0, repositories: 1, packages: 0 });
  },
);

test("Portfolio and About totals are in static HTML and match the listed projects", async ({
  request,
}) => {
  const portfolio = await request.get("/portfolio/");
  expect(portfolio.ok()).toBe(true);
  const $ = load(await portfolio.text());
  const repositories = new Map<string, number>();
  const packages = new Map<string, number>();
  $(".portfolio__open-source .portfolio-card").each((_, card) => {
    const repository = $(card)
      .find(".portfolio-card__title a")
      .attr("href")!
      .toLowerCase();
    const stars = Number(
      $(card)
        .find(".portfolio-card__stars")
        .attr("alt")!
        .match(/: (\d+) GitHub stars at last build$/)![1],
    );
    repositories.set(repository, stars);
    $(card)
      .find(".portfolio-card__nuget")
      .each((_, link) => {
        packages.set(
          $(link).attr("href")!.toLowerCase(),
          Number($(link).attr("data-downloads")),
        );
      });
  });
  const downloads = [...packages.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const stars = [...repositories.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const totals = $(".portfolio__open-source > .portfolio-statistics");
  expect(totals).toHaveLength(1);
  expect(totals.attr("data-downloads")).toBe(String(downloads));
  expect(totals.attr("data-stars")).toBe(String(stars));
  const tickers = totals.find(".number-ticker");
  expect(tickers).toHaveLength(2);
  expect(tickers.last().find(".number-ticker__accessible").text()).toBe(
    stars.toLocaleString("en-GB"),
  );
  expect(totals.text()).toContain(
    `Across ${repositories.size} repositories and ${packages.size} NuGet packages`,
  );
  expect(totals.text()).toContain("Downloads are not unique users.");
  expect(totals.text()).toContain("Refreshed weekly");
  const timestamp = totals
    .find(".portfolio-statistics__note time")
    .attr("datetime")!;
  expect(Number.isFinite(Date.parse(timestamp))).toBe(true);
  expect(totals.find(".portfolio-statistics__note time").text()).toBe(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(timestamp)),
  );
  expect(tickers.first().find(".number-ticker__accessible").text()).toBe(
    downloads.toLocaleString("en-GB"),
  );
  tickers.each((_, ticker) => {
    expect($(ticker).attr("data-state")).toBe("paused");
    expect($(ticker).find("h3, p")).toHaveLength(2);
    expect($(ticker).find(".number-ticker__value").attr("aria-live")).toBe(
      "off",
    );
  });
  const about = await request.get("/about/");
  expect(about.ok()).toBe(true);
  const summary = load(await about.text())(".portfolio-statistics__summary");
  expect(summary.attr("data-downloads")).toBe(String(downloads));
  expect(summary.attr("data-stars")).toBe(String(stars));
  expect(summary.text()).toContain(stars.toLocaleString("en-GB"));
  expect(summary.find("a").attr("href")).toBe(
    "/portfolio/#portfolio-open-source",
  );
});

for (const width of [320, 375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`Shared statistics render and navigate at ${width}px in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.clock.install();
      await page.goto("/about/");
      const summary = page.locator(".portfolio-statistics__summary");
      await expect(summary).toBeVisible();
      const downloads = await summary.getAttribute("data-downloads");
      const stars = await summary.getAttribute("data-stars");
      await summary.getByRole("link", { name: "portfolio" }).click();
      await expect(page).toHaveURL(/\/portfolio\/#portfolio-open-source$/);
      const totals = page.locator(".portfolio-statistics");
      await expect(totals).toBeVisible();
      await expect(totals).toHaveAttribute("data-downloads", downloads!);
      await expect(totals).toHaveAttribute("data-stars", stars!);
      await expect(totals.locator(".number-ticker__title")).toHaveText([
        "NuGet downloads",
        "GitHub stars",
      ]);
      const cards = totals.locator(".number-ticker");
      const first = (await cards.nth(0).boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      expect(second.y).toBe(first.y);
      expect(second.x).toBeGreaterThan(first.x);
      for (const ticker of await cards.all()) {
        await expect(ticker).toHaveAttribute("data-state", "paused");
        expect(
          await ticker
            .locator("h3")
            .evaluate((heading) => getComputedStyle(heading).fontFamily),
        ).toContain("Audiowide");
        const digits = ticker.locator(".number-ticker__digits");
        const before = await digits.textContent();
        await page.clock.runFor(2100);
        expect(await digits.textContent()).toBe(before);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      const bounds = await totals.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    });
  }
}

test("Portfolio uses real lifetime rates to animate the shared odometers and can pause both", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const now = Date.now();
  await page.clock.install({ time: new Date(now - 10_000) });
  await page.clock.pauseAt(new Date(now));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/portfolio/");
  const downloads = page.locator(".number-ticker").first();
  await expect(downloads).toHaveAttribute("data-state", "running");
  const value = Number(await downloads.getAttribute("data-value"));
  const rate = Number(await downloads.getAttribute("data-rate"));
  expect(rate).toBeGreaterThan(0);
  await page.clock.runFor(20_000);
  await expect(downloads).toHaveAttribute(
    "data-value",
    String(value + Math.trunc(20 * rate)),
  );
  await page.getByRole("button", { name: "Pause estimates" }).click();
  await expect(page.locator(".number-ticker[data-state='paused']")).toHaveCount(
    2,
  );
  const paused = await downloads.getAttribute("data-value");
  await page.clock.runFor(5000);
  await expect(downloads).toHaveAttribute("data-value", paused!);
});
