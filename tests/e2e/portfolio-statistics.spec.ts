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

test("Portfolio totals match the listed projects and About shares the star total", async ({
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
  expect(
    tickers
      .find(".number-ticker__title")
      .map((_, title) => $(title).text())
      .get(),
  ).toEqual(["My Package Downloads", "My GitHub Stars"]);
  expect(tickers.last().find(".number-ticker__accessible").text()).toBe(
    stars.toLocaleString("en-GB"),
  );
  expect(totals.children("p")).toHaveLength(0);
  expect(totals.find("button")).toHaveLength(2);
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
  const aboutHtml = load(await about.text());
  const aboutTickers = aboutHtml(".about__statistics .number-ticker");
  expect(aboutTickers).toHaveLength(4);
  expect(aboutTickers.first().find(".number-ticker__title").text()).toBe(
    "My Package Downloads",
  );
  expect(aboutTickers.first().find(".number-ticker__accessible").text()).toBe(
    downloads.toLocaleString("en-GB"),
  );
  const aboutStars = aboutTickers.eq(1);
  expect(aboutStars.find(".number-ticker__title").text()).toBe(
    "My GitHub Stars",
  );
  expect(aboutStars.find(".number-ticker__accessible").text()).toBe(
    stars.toLocaleString("en-GB"),
  );
  expect(aboutHtml('img[src*="shields.io/github/stars/"]')).toHaveLength(0);
  expect(aboutHtml('img[src*="shields.io/github/sponsors/"]')).toHaveLength(0);
  for (const [index, attribute, title] of [
    [2, "data-followers", "My GitHub Followers"],
    [3, "data-watchers", "My GitHub Watchers"],
  ] as const) {
    const value = Number(aboutHtml(".about__statistics").attr(attribute));
    expect(Number.isInteger(value) && value >= 0).toBe(true);
    expect(aboutTickers.eq(index).find("h3").text()).toBe(title);
    expect(
      aboutTickers.eq(index).find(".number-ticker__accessible").text(),
    ).toBe(value.toLocaleString("en-GB"));
    expect(aboutTickers.eq(index).attr("data-rate")).toBe("0");
  }
  const watchersBadge = aboutHtml(
    '.about__github-images img[alt^="GitHub watch subscriptions"]',
  );
  const watchers = watchersBadge.attr("alt")!.match(/: (\d+)$/)![1];
  expect(watchersBadge.attr("src")).toBe(
    `https://img.shields.io/badge/Watchers-${watchers}-blue?logo=github&style=social`,
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
      await page.goto("/about/", { waitUntil: "domcontentloaded" });
      const aboutTickers = page.locator(".about__statistics .number-ticker");
      await expect(aboutTickers).toHaveCount(4);
      await expect(aboutTickers.locator("h3")).toHaveText([
        "My Package Downloads",
        "My GitHub Stars",
        "My GitHub Followers",
        "My GitHub Watchers",
      ]);
      const aboutStars = aboutTickers.nth(1);
      await expect(aboutStars).toBeVisible();
      await expect(aboutStars.locator("h3")).toHaveText("My GitHub Stars");
      const starTotal = await page
        .locator(".about__statistics")
        .getAttribute("data-stars");
      await expect(
        page.locator('img[src*="shields.io/github/stars/"]'),
      ).toHaveCount(0);
      await expect(
        page.getByRole("img", { name: "GitHub sponsors", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("img", { name: "GitHub follower count", exact: true }),
      ).toBeVisible();
      for (const index of [2, 3]) {
        await expect(aboutTickers.nth(index)).toHaveAttribute("data-rate", "0");
        await expect(aboutTickers.nth(index)).toHaveAttribute(
          "data-state",
          "paused",
        );
      }
      expect(
        await aboutStars.evaluate((ticker) => {
          const bounds = ticker.getBoundingClientRect();
          const badges = document
            .querySelector(".about__github-images")!
            .getBoundingClientRect();
          return {
            border: getComputedStyle(ticker).borderTopWidth,
            aboveBadges: bounds.bottom <= badges.top,
            fits: bounds.left >= 0 && bounds.right <= window.innerWidth,
          };
        }),
      ).toEqual({ border: "0px", aboveBadges: true, fits: true });
      expect(
        await aboutTickers.evaluateAll((tickers) => {
          const [downloads, stars, followers, watchers] = tickers.map(
            (ticker) => ticker.getBoundingClientRect(),
          );
          return {
            sideBySide:
              downloads!.top === stars!.top && downloads!.right <= stars!.left,
            secondRow:
              followers!.top === watchers!.top &&
              followers!.right <= watchers!.left &&
              followers!.top >= downloads!.bottom,
            borderless: tickers.every(
              (ticker) => getComputedStyle(ticker).borderTopWidth === "0px",
            ),
            fits: tickers.every((ticker) => {
              const bounds = ticker.getBoundingClientRect();
              const digits = ticker.querySelector(".number-ticker__digits")!;
              return (
                bounds.left >= 0 &&
                bounds.right <= window.innerWidth &&
                digits.scrollWidth <= digits.clientWidth
              );
            }),
          };
        }),
      ).toEqual({
        sideBySide: true,
        secondRow: true,
        borderless: true,
        fits: true,
      });
      const watchersBadge = page.getByRole("img", {
        name: /^GitHub watch subscriptions/,
      });
      await expect(watchersBadge).toBeVisible();
      await expect(aboutTickers.last()).toHaveAttribute(
        "data-value",
        (await page
          .locator(".about__statistics")
          .getAttribute("data-watchers"))!,
      );
      const watchers = (await watchersBadge.getAttribute("alt"))!.match(
        /: (\d+)$/,
      )![1];
      await expect(watchersBadge).toHaveAttribute(
        "src",
        `https://img.shields.io/badge/Watchers-${watchers}-blue?logo=github&style=social`,
      );
      await expect(watchersBadge.locator("..")).toHaveAttribute(
        "href",
        "https://github.com/RehanSaeed",
      );
      expect(
        await watchersBadge.evaluate((image) => {
          const bounds = image.getBoundingClientRect();
          return {
            height: bounds.height,
            fits: bounds.left >= 0 && bounds.right <= window.innerWidth,
          };
        }),
      ).toEqual({ height: 30, fits: true });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      await page
        .locator(".about__description")
        .getByRole("link", { name: "portfolio", exact: true })
        .click();
      await expect(page).toHaveURL(/\/portfolio\/$/);
      const totals = page.locator(".portfolio-statistics");
      await expect(totals).toBeVisible();
      await expect(totals).toHaveAttribute("data-downloads", /^\d+$/);
      await expect(totals).toHaveAttribute("data-stars", /^\d+$/);
      await expect(totals).toHaveAttribute("data-stars", starTotal!);
      await expect(totals.locator(".number-ticker__title")).toHaveText([
        "My Package Downloads",
        "My GitHub Stars",
      ]);
      const cards = totals.locator(".number-ticker");
      const [first, second] = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y } = element.getBoundingClientRect();
          return { x, y };
        }),
      );
      expect(second!.y).toBe(first!.y);
      expect(second!.x).toBeGreaterThan(first!.x);
      for (const ticker of await cards.all()) {
        await expect(ticker).toHaveAttribute("data-state", "paused");
        expect(
          await ticker
            .locator("h3")
            .evaluate((heading) => getComputedStyle(heading).fontFamily),
        ).toContain("Audiowide");
        if (width === 1280) {
          expect(
            await ticker
              .locator("h3")
              .evaluate((heading) =>
                Number.parseFloat(getComputedStyle(heading).fontSize),
              ),
          ).toBeGreaterThanOrEqual(20);
          expect(
            await ticker
              .locator(".number-ticker__value")
              .evaluate((value) =>
                Number.parseFloat(getComputedStyle(value).fontSize),
              ),
          ).toBeGreaterThanOrEqual(40);
        }
        const cardBounds = (await ticker.boundingBox())!;
        const cardCentre = cardBounds.x + cardBounds.width / 2;
        for (const selector of [
          ".number-ticker__title",
          ".number-ticker__digits",
        ]) {
          const content = ticker.locator(selector);
          const bounds = (await content.boundingBox())!;
          expect(
            Math.abs(bounds.x + bounds.width / 2 - cardCentre),
          ).toBeLessThan(1);
        }
        const digits = ticker.locator(".number-ticker__digits");
        expect(
          await digits.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ).toBe(true);
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
      await expect(
        page.locator(".portfolio__open-source .portfolio-card").first(),
      ).toBeVisible();
      const aligned = await page.evaluate(() => {
        const tickers = document
          .querySelector(".portfolio-statistics__totals")!
          .getBoundingClientRect();
        const project = document
          .querySelector(".portfolio__open-source .portfolio-card")!
          .getBoundingClientRect();
        return {
          left: Math.abs(tickers.left - project.left),
          right: Math.abs(tickers.right - project.right),
        };
      });
      expect(aligned.left).toBeLessThan(1);
      expect(aligned.right).toBeLessThan(1);
    });
  }
}

for (const width of [320, 375, 1280]) {
  test(`Grouping separators remain fully visible and on the number baseline at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/portfolio/");
    await expect(page.locator(".number-ticker")).toHaveCount(2);
    await expect(page.locator(".number-ticker__digit").first()).toHaveCSS(
      "display",
      "flex",
    );
    await page.evaluate(() => document.fonts.ready);
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const separators = await page
        .locator(".number-ticker__cell--separator")
        .evaluateAll((cells) =>
          cells.map((cell) => {
            const digit = cell.querySelector(".number-ticker__digit")!;
            const style = getComputedStyle(digit);
            const canvas = document.createElement("canvas").getContext("2d");
            if (!canvas) throw new Error("Missing font measurement context");
            canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const metrics = canvas.measureText(digit.textContent!);
            const range = document.createRange();
            range.selectNodeContents(digit);
            const text = range.getBoundingClientRect();
            range.selectNodeContents(
              cell.parentElement!.querySelector(
                ".number-ticker__cell:not(.number-ticker__cell--separator) .number-ticker__digit",
              )!,
            );
            const number = range.getBoundingClientRect();
            const bounds = cell.getBoundingClientRect();
            return {
              character: digit.textContent,
              left: text.left - metrics.actualBoundingBoxLeft - bounds.left,
              right: bounds.right - text.left - metrics.actualBoundingBoxRight,
              baselineOffset: text.top - number.top,
            };
          }),
        );
      expect(separators).toHaveLength(3);
      for (const separator of separators) {
        expect(separator.character).toBe(",");
        expect(separator.left).toBeGreaterThanOrEqual(-0.5);
        expect(separator.right).toBeGreaterThanOrEqual(-0.5);
        expect(Math.abs(separator.baselineOffset)).toBeLessThan(1);
      }
      expect(
        await page
          .locator(".number-ticker__digits")
          .evaluateAll((elements) =>
            elements.every(
              (element) => element.scrollWidth <= element.clientWidth,
            ),
          ),
      ).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  });
}

for (const path of ["/about/", "/portfolio/"]) {
  test(`Statistics info tooltips support hover, keyboard and Escape on ${path}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const downloads = page.getByRole("button", {
      name: "About package downloads",
      exact: true,
    });
    const stars = page.getByRole("button", {
      name: "About GitHub stars",
      exact: true,
    });
    await expect(downloads).toBeEnabled();
    await expect(downloads.locator("svg path")).toHaveCount(1);
    await expect(stars.locator("svg path")).toHaveCount(1);
    await downloads.hover();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Verified total:");
    await expect(tooltip).toContainText("not unique people");
    await expect(tooltip).toContainText("lifetime averages, not a live feed");
    await expect(downloads).toHaveAccessibleDescription(
      await tooltip.innerText(),
    );
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await page.mouse.move(0, 0);
    await stars.focus();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(
      "listed organisation-owned repositories",
    );
    await expect(tooltip).toContainText("one increase every 15 seconds");
    await expect(stars).toHaveAccessibleDescription(await tooltip.innerText());
    await expect(tooltip).toHaveAttribute("data-positioned", "true");
    expect(
      await tooltip.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth;
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(stars).toBeFocused();
    if (path === "/about/") {
      for (const [label, explanation] of [
        ["About GitHub followers", "people following my GitHub account"],
        ["About GitHub watchers", "watch subscriptions"],
      ]) {
        const button = page.getByRole("button", { name: label, exact: true });
        await expect(button.locator("svg path")).toHaveCount(1);
        await button.focus();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText(explanation);
        await expect(tooltip).toContainText("build snapshot");
        await expect(button).toHaveAccessibleDescription(
          await tooltip.innerText(),
        );
        await page.keyboard.press("Escape");
        await expect(tooltip).toHaveCount(0);
      }
    }
  });
}

test("Portfolio uses lifetime download rates and a visible fifteen-second star cadence", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const now = Date.now();
  await page.clock.install({ time: new Date(now - 10_000) });
  await page.clock.pauseAt(new Date(now));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/portfolio/", { waitUntil: "domcontentloaded" });
  const downloads = page.locator(".number-ticker").first();
  await expect(downloads).toHaveAttribute("data-state", "running");
  const value = Number(await downloads.getAttribute("data-value"));
  const rate = Number(await downloads.getAttribute("data-rate"));
  expect(rate).toBeGreaterThan(0);
  const stars = page.locator(".number-ticker").last();
  const starValue = Number(await stars.getAttribute("data-value"));
  const starRate = Number(await stars.getAttribute("data-rate"));
  expect(starRate).toBe(1 / 15);
  await page.clock.runFor(14_000);
  await expect(stars).toHaveAttribute("data-value", String(starValue));
  await page.clock.runFor(2000);
  await expect(downloads).toHaveAttribute(
    "data-value",
    String(value + Math.trunc(16 * rate)),
  );
  await expect(stars).toHaveAttribute("data-value", String(starValue + 1));
  await page.clock.runFor(15_000);
  await expect(stars).toHaveAttribute("data-value", String(starValue + 2));
  await expect(
    page.locator(".portfolio-statistics").getByRole("button"),
  ).toHaveCount(2);
});
