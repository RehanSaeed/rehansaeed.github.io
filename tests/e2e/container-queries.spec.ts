import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const largeDefaultFontSize = 32;

type SiteCase = {
  /** Inline size applied to the site container, in CSS pixels. */
  width: number;
  /** Whether the navigation should stick to the top of the viewport. */
  sticky: boolean;
  /** Whether the compact layout without main padding should apply. */
  compact: boolean;
};

const siteCase = (width: number, emSize: number): SiteCase => ({
  width,
  sticky: width >= 75 * emSize,
  compact: width <= 36 * emSize,
});

const resizeSite = async (page: Page, width: number) => {
  await page.locator(".site-shell").evaluate((element, width) => {
    element.style.inlineSize = `${width}px`;
  }, width);
};

const pixels = (locator: Locator, property: "paddingInlineStart") =>
  locator.evaluate(
    (element, property) =>
      Number.parseFloat(getComputedStyle(element)[property]),
    property,
  );

const expectSiteLayout = async (page: Page, { sticky, compact }: SiteCase) => {
  await expect(page.locator(".navigation")).toHaveCSS(
    "position",
    sticky ? "sticky" : "static",
  );
  expect((await pixels(page.locator("#main"), "paddingInlineStart")) > 0).toBe(
    !compact,
  );
};

for (const testCase of [575, 576, 577, 1199, 1200, 1201, 1920].map((width) =>
  siteCase(width, 16),
)) {
  test(`Site layout follows a ${String(testCase.width)}px container on a wide viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await resizeSite(page, testCase.width);
    const app = page.locator("#app");

    await expectSiteLayout(page, testCase);
    await expect(app).toHaveCSS(
      "--global-line-length-min",
      testCase.compact ? "0" : "45ch",
    );
    const paragraphMinimum = await page
      .locator(".posts p")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).minInlineSize),
      );
    expect(paragraphMinimum > 0).toBe(!testCase.compact);
    const columns = await page
      .locator(".navigation__items-left")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(testCase.sticky ? 1 : 3);
    await expect(app).toHaveCSS(
      "font-size",
      await page
        .locator("html")
        .evaluate((element) => getComputedStyle(element).fontSize),
    );
  });
}

test("Scroll indicator and sticky navigation stay fixed to the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.evaluate(() => {
    window.scrollTo(0, 1000);
  });
  await expect
    .poll(() =>
      page
        .locator(".scroll-indicator")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBe(0);
  const navigation = page.locator(".navigation");
  await expect(navigation).toHaveCSS("position", "sticky");
  expect(
    await navigation.evaluate((element) => element.getBoundingClientRect().top),
  ).toBe(0);
});

test.describe("Larger browser default font size", () => {
  test.use({
    launchOptions: {
      firefoxUserPrefs: {
        "font.size.variable.x-western": largeDefaultFontSize,
      },
    },
  });

  test.beforeEach(async ({ page, browserName }) => {
    // Firefox receives the default font size through launch preferences.
    if (browserName === "chromium") {
      const session = await page.context().newCDPSession(page);
      await session.send("Page.setFontSizes", {
        fontSizes: { standard: largeDefaultFontSize },
      });
    }
  });

  for (const testCase of [1152, 1153, 2399, 2400].map((width) =>
    siteCase(width, largeDefaultFontSize),
  )) {
    test(`Site breakpoints scale for a ${String(testCase.width)}px container`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 2600, height: 1080 });
      await page.goto("/");
      await expect(page.locator(".site-shell")).toHaveCSS(
        "font-size",
        `${String(largeDefaultFontSize)}px`,
      );
      await resizeSite(page, testCase.width);
      await expectSiteLayout(page, testCase);
    });
  }
});

const openArticleWithMentions = async (page: Page) => {
  await page.route(/^https:\/\/webmention\.io\/api\/mentions\?/, (route) =>
    route.fulfill({
      json: {
        links: [
          {
            id: "link",
            activity: { type: "link" },
            source: "https://example.com/article",
            data: { published: "2026-01-02T00:00:00Z" },
          },
          {
            id: "reply",
            activity: { type: "reply" },
            data: {
              url: "https://example.com/reply",
              published: "2026-01-02T00:00:00Z",
              author: { name: "Reader" },
              content: "<p>A reply that must fit in its available space.</p>",
            },
          },
        ],
      },
    }),
  );
  await page.goto(
    "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/",
  );
  await expect(
    page.getByRole("button", { name: "Open search", exact: true }),
  ).toBeEnabled({ timeout: 60_000 });
  const mentions = page.locator(".webmentions");
  await mentions.scrollIntoViewIfNeeded();
  await expect(mentions).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".webmention-reply")).toHaveCount(1);
  await expect(page.locator(".webmention-link")).toHaveCount(1);
};

/** Sets the card's content box to 30em plus an offset and returns its width. */
const setContentWidth = async (card: Locator, offset: number) => {
  await card.scrollIntoViewIfNeeded();
  return card.evaluate((element, offset) => {
    const width =
      Number.parseFloat(getComputedStyle(element).fontSize) * 30 + offset;
    element.style.boxSizing = "content-box";
    element.style.inlineSize = `${String(width)}px`;
    element.style.maxInlineSize = "none";
    return width;
  }, offset);
};

const expectContentWidthWithoutOverflow = async (
  card: Locator,
  width: number,
) => {
  const size = await card.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    content: Number.parseFloat(getComputedStyle(element).width),
  }));
  expect(size.content).toBeCloseTo(width, 1);
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
};

const columnCount = (locator: Locator) =>
  locator.evaluate(
    (element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );

const contentWidthCases = [-200, -1, 0, 1].map((offset) => ({
  offset,
  wide: offset > 0,
}));

test("Newsletter adapts at its own content-width boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openArticleWithMentions(page);
  const card = page.locator(".newsletter");

  for (const { offset, wide } of contentWidthCases) {
    const width = await setContentWidth(card, offset);
    const areas = await card
      .locator(".newsletter__form")
      .evaluate((element) => getComputedStyle(element).gridTemplateAreas);
    expect(areas.includes("input button"), `offset ${String(offset)}`).toBe(
      wide,
    );
    const [input, button] = await Promise.all(
      [".newsletter__input", ".newsletter__button"].map((selector) =>
        card.locator(selector).evaluate((element) => {
          const { y, height } = element.getBoundingClientRect();
          return { y, height };
        }),
      ),
    );
    expect(Math.abs(button.y - input.y) < 0.05).toBe(wide);
    expect(button.y >= input.y + input.height).toBe(!wide);
    await expectContentWidthWithoutOverflow(card, width);
  }
});

test("Webmentions adapt at their own content-width boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openArticleWithMentions(page);
  const card = page.locator(".webmentions");

  for (const { offset, wide } of contentWidthCases) {
    const width = await setContentWidth(card, offset);
    await expect(card.locator(".webmentions__help")).toHaveCSS(
      "grid-row-start",
      wide ? "1" : "2",
    );
    expect(await columnCount(card.locator(".webmention-link"))).toBe(
      wide ? 2 : 1,
    );
    expect(await columnCount(card.locator(".webmention-reply"))).toBe(
      wide ? 3 : 2,
    );
    await expectContentWidthWithoutOverflow(card, width);
  }
});

test("Newsletter and webmentions fit common viewport widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openArticleWithMentions(page);

  for (const width of [320, 375, 768, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    for (const selector of [".newsletter", ".webmentions"]) {
      const card = page.locator(selector);
      await card.scrollIntoViewIfNeeded();
      const size = await card.evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
        width: element.getBoundingClientRect().width,
      }));
      expect(size.width).toBeGreaterThan(0);
      expect(size.width).toBeLessThanOrEqual(width);
      expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
    }
  }
});

test("Print still hides navigation and the newsletter", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".navigation")).toBeHidden();
  await expect(page.locator(".newsletter")).toBeHidden();
});
