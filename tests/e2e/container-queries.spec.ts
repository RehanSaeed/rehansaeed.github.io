import { expect, test } from "./fixtures";

test("Site layout follows its container rather than the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  const shell = page.locator(".site-shell");
  const navigation = page.locator(".navigation");
  const main = page.locator("#main");
  const app = page.locator("#app");

  for (const width of [575, 576, 577, 1199, 1200, 1201, 1920]) {
    await shell.evaluate((element, width) => {
      element.style.inlineSize = `${width}px`;
    }, width);
    await expect(navigation).toHaveCSS(
      "position",
      width >= 1200 ? "sticky" : "static",
    );
    if (width <= 576) {
      await expect(main).toHaveCSS("padding-inline-start", "0px");
      await expect(app).toHaveCSS("--global-line-length-min", "0");
      await expect(page.locator(".posts p").first()).toHaveCSS(
        "min-inline-size",
        "0px",
      );
    } else {
      expect(
        await main.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingInlineStart),
        ),
      ).toBeGreaterThan(0);
    }
    const columns = await page
      .locator(".navigation__items-left")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      );
    expect(columns).toBe(width >= 1200 ? 1 : 3);
    await expect(app).toHaveCSS(
      "font-size",
      await page
        .locator("html")
        .evaluate((element) => getComputedStyle(element).fontSize),
    );
  }

  await page.evaluate(() => window.scrollTo(0, 1000));
  await expect
    .poll(() =>
      page
        .locator(".scroll-indicator")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBe(0);
  await expect(navigation).toHaveCSS("position", "sticky");
  expect(
    await navigation.evaluate((element) => element.getBoundingClientRect().top),
  ).toBe(0);
});

test("Site breakpoints respect the browser's default font size", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Default font sizing requires CDP.");
  const session = await page.context().newCDPSession(page);
  await session.send("Page.setFontSizes", { fontSizes: { standard: 32 } });
  await page.setViewportSize({ width: 2600, height: 1080 });
  await page.goto("/");
  for (const width of [1152, 1153, 2399, 2400]) {
    await page.locator(".site-shell").evaluate((element, width) => {
      element.style.inlineSize = `${width}px`;
    }, width);
    await expect(page.locator(".navigation")).toHaveCSS(
      "position",
      width >= 2400 ? "sticky" : "static",
    );
    const padding = await page
      .locator("#main")
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingInlineStart),
      );
    expect(padding === 0).toBe(width <= 1152);
  }
});

test("Newsletter and webmentions adapt at their own content-width boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
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

  for (const selector of [".newsletter", ".webmentions"]) {
    const card = page.locator(selector);
    await card.scrollIntoViewIfNeeded();
    for (const offset of [-1, 0, 1, -200]) {
      const width = await card.evaluate((element, offset) => {
        const width =
          Number.parseFloat(getComputedStyle(element).fontSize) * 30 + offset;
        element.style.boxSizing = "content-box";
        element.style.inlineSize = `${width}px`;
        element.style.maxInlineSize = "none";
        return width;
      }, offset);
      const wide = offset > 0;
      if (selector === ".newsletter") {
        const areas = await card
          .locator(".newsletter__form")
          .evaluate((element) => getComputedStyle(element).gridTemplateAreas);
        expect(areas.includes("input button")).toBe(wide);
        const input = await card.locator(".newsletter__input").boundingBox();
        const button = await card.locator(".newsletter__button").boundingBox();
        expect(input).not.toBeNull();
        expect(button).not.toBeNull();
        if (wide) {
          expect(input!.y).toBeCloseTo(button!.y, 1);
        } else {
          expect(button!.y).toBeGreaterThanOrEqual(input!.y + input!.height);
        }
      } else {
        await expect(card.locator(".webmentions__help")).toHaveCSS(
          "grid-row-start",
          wide ? "1" : "2",
        );
        for (const [selector, columns] of [
          [".webmention-link", wide ? 2 : 1],
          [".webmention-reply", wide ? 3 : 2],
        ] as const) {
          const actual = await card
            .locator(selector)
            .evaluate(
              (element) =>
                getComputedStyle(element).gridTemplateColumns.split(" ").length,
            );
          expect(actual).toBe(columns);
        }
      }
      const size = await card.evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
        content: Number.parseFloat(getComputedStyle(element).width),
      }));
      expect(size.content).toBeCloseTo(width, 1);
      expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
    }
    await card.evaluate((element) => element.removeAttribute("style"));
  }

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
