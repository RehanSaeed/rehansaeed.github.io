import { expect, test } from "./fixtures";
import type { Locator } from "@playwright/test";
import type { TrafficSnapshot } from "../../shared/utils/traffic";
import {
  trafficMonths,
  trafficDays,
  formatTrafficDuration,
} from "../../shared/utils/traffic";

const path = "/optimally-configuring-open-telemetry-tracing-for-asp-net-core/";
const snapshot: TrafficSnapshot = {
  updated: "2026-10-25T06:00:00Z",
  timeZone: "Europe/London",
  posts: {
    [path]: {
      startDate: "2024-01-15",
      endDate: "2024-03-28",
      months: [
        { month: "2024-01", views: 120 },
        { month: "2024-02", views: 0 },
        { month: "2024-03", views: 240 },
      ],
    },
  },
};

async function expectAlignedScale(chart: Locator) {
  const edges = await chart
    .locator(".post-traffic__scale span")
    .evaluateAll((ticks) =>
      ticks.map((tick) => tick.getBoundingClientRect().right),
    );
  expect(edges).toHaveLength(5);
  expect(Math.max(...edges) - Math.min(...edges)).toBeLessThan(0.5);
}

async function expectPointTooltip(
  chart: Locator,
  date: string,
  views: number,
  engagement?: string,
) {
  const tooltip = chart
    .page()
    .getByRole("tooltip")
    .filter({
      has: chart.page().locator(".post-traffic__tooltip"),
    });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveClass("tooltip");
  await expect(tooltip).toHaveAttribute("data-positioned", "true");
  await expect(chart.locator(".post-traffic__point--selected")).toHaveAttribute(
    "aria-describedby",
    (await tooltip.getAttribute("id"))!,
  );
  await expect(tooltip.locator(".tooltip__arrow")).toHaveCount(1);
  await expect
    .poll(() => tooltip.evaluate((element) => element.matches(":popover-open")))
    .toBe(true);
  await expect(tooltip.locator(".post-traffic__tooltip-date")).toHaveText(date);
  await expect(tooltip.locator(".post-traffic__tooltip-metrics dt")).toHaveText(
    ["Page views", ...(engagement === undefined ? [] : ["Engagement / view"])],
  );
  await expect(tooltip.locator(".post-traffic__tooltip-metrics dd")).toHaveText(
    [
      new Intl.NumberFormat("en-GB").format(views),
      ...(engagement === undefined ? [] : [engagement]),
    ],
  );
  const bounds = await tooltip.boundingBox();
  const viewportWidth = await tooltip.evaluate(
    (element) => element.ownerDocument.documentElement.clientWidth,
  );
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewportWidth + 1);
}

for (const width of [375, 1280]) {
  test(`Traffic history is labelled, accessible and usable at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({ json: snapshot }),
    );
    await Promise.all([
      page.waitForResponse("**/post-traffic.json"),
      page.goto(path, { waitUntil: "domcontentloaded" }),
    ]);
    const chart = page.locator(".post-traffic");
    await expect(
      chart.getByRole("heading", { name: "Article Traffic", exact: true }),
    ).toBeVisible();
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator(".post-traffic__total dd")).toHaveText("360");
    await expect(chart.locator(".post-traffic__total dt")).toHaveText(
      "Page views",
    );
    await expect(chart.locator(".post-traffic__engagement dt")).toHaveText(
      "Average engagement per view",
    );
    await expect(chart.locator(".post-traffic__engagement dd")).toHaveText(
      "Unavailable",
    );
    await expect(chart.locator("h2")).toHaveCSS("text-align", "center");
    await expect(chart.locator(".post-traffic__total dd")).toHaveCSS(
      "font-family",
      /Audiowide/,
    );
    const totalFontSize = await chart
      .locator(".post-traffic__total dd")
      .evaluate((element) => getComputedStyle(element).fontSize);
    await expect(chart.locator(".post-traffic__engagement dd")).toHaveCSS(
      "font-family",
      /Audiowide/,
    );
    await expect(chart.locator(".post-traffic__engagement dd")).toHaveCSS(
      "font-size",
      totalFontSize,
    );
    for (const stat of ["total", "engagement"]) {
      const statistic = chart.locator(`.post-traffic__${stat}`);
      await expect(statistic).toHaveJSProperty("tagName", "DL");
      expect(
        await statistic.evaluate((element) =>
          Array.from(element.children, (child) => child.tagName),
        ),
      ).toEqual(["DT", "DD"]);
      const value = statistic.locator("dd");
      await expect(value).toHaveCSS("display", "block");
      const labelGap = await statistic.evaluate(
        (element) =>
          element.querySelector("dt")!.getBoundingClientRect().top -
          element.querySelector("dd")!.getBoundingClientRect().bottom,
      );
      expect(labelGap).toBeGreaterThanOrEqual(-0.001);
    }
    const total = await chart.locator(".post-traffic__total").boundingBox();
    const metrics = chart.locator(".post-traffic__metrics");
    await expect(metrics).toHaveCSS("display", "grid");
    await expect(metrics).toHaveCSS("text-align", "start");
    const spacing = await metrics.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        columnGap: parseFloat(style.columnGap),
        rowGap: parseFloat(style.rowGap),
        fontSize: parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ),
      };
    });
    expect(spacing.columnGap).toBeCloseTo(spacing.fontSize * 3, 2);
    expect(spacing.rowGap).toBeCloseTo(spacing.fontSize * 1.5, 2);
    const engagementBounds = await chart
      .locator(".post-traffic__engagement")
      .boundingBox();
    if (width === 375)
      expect(engagementBounds!.y - total!.y - total!.height).toBeCloseTo(
        spacing.rowGap,
        2,
      );
    else
      expect(engagementBounds!.x - total!.x - total!.width).toBeCloseTo(
        spacing.columnGap,
        2,
      );
    await expect(chart.locator(".post-traffic__range")).toHaveCount(0);
    const summary = await metrics.boundingBox();
    const controls = await chart
      .locator(".post-traffic__controls")
      .boundingBox();
    const plotBounds = await chart.locator(".post-traffic__plot").boundingBox();
    expect(controls!.y).toBeGreaterThanOrEqual(summary!.y + summary!.height);
    expect(plotBounds!.y).toBeGreaterThan(controls!.y + controls!.height);
    expect(plotBounds!.width).toBeGreaterThan(summary!.width * 0.65);
    await expect(
      chart.getByRole("button", { name: "Last month", exact: true }),
    ).toBeDisabled();
    expect(
      await chart.evaluate((element) =>
        element.previousElementSibling?.classList.contains("comments"),
      ),
    ).toBe(true);
    await expect(chart).toContainText(
      "Traffic before 15 Jan 2024, including any initial spike at publication, is unavailable.",
    );
    const warning = chart.locator(".post-traffic__warning");
    await expect(warning).toContainText(
      "This article predates the available Google Analytics history.",
    );
    await expect(warning).not.toContainText("GA4");
    const warningBounds = await warning.boundingBox();
    const metricsBounds = await metrics.boundingBox();
    expect(warningBounds!.y + warningBounds!.height).toBeLessThanOrEqual(
      metricsBounds!.y,
    );
    expect(
      await warning.evaluate((element) =>
        Boolean(
          element.compareDocumentPosition(
            element.parentElement!.querySelector(".post-traffic__metrics")!,
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    await expect(warning).toHaveClass(/custom-block warning/);
    await expect(warning).toHaveAttribute("role", "note");
    await expect(warning.locator(".custom-block-title")).toHaveText(
      "Partial traffic history",
    );
    await expect(warning.locator("time")).toHaveAttribute(
      "datetime",
      "2024-01-15",
    );
    await expect(warning).toContainText(
      "All time covers recorded history, not the article's full lifetime.",
    );
    await chart.getByRole("button", { name: "Last year", exact: true }).click();
    await expect(warning).toBeVisible();
    await chart.getByRole("button", { name: "All time", exact: true }).click();
    const source = page
      .getByRole("tooltip")
      .filter({ hasText: "Source: Google Analytics" });
    const infoButton = chart.getByRole("button", {
      name: "About article traffic",
    });
    await expect(infoButton.locator("svg > *")).not.toHaveCount(0);
    await expect(source).toBeHidden();
    const plotOffset = () =>
      chart.evaluate((card) => {
        const plot = card.querySelector(".post-traffic__plot")!;
        return plot.getBoundingClientRect().y - card.getBoundingClientRect().y;
      });
    const beforeHelp = await plotOffset();
    await infoButton.hover();
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute("role", "tooltip");
    expect(await infoButton.getAttribute("aria-expanded")).toBeNull();
    await expect(source).toContainText("not unique visitors");
    await expect(source).toContainText("Europe/London");
    expect(await plotOffset()).toBeCloseTo(beforeHelp, 3);
    await source.hover();
    await expect(source).toBeVisible();
    const helpBounds = await source.boundingBox();
    expect(helpBounds!.x).toBeGreaterThanOrEqual(0);
    expect(helpBounds!.x + helpBounds!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press("Escape");
    await expect(source).toBeHidden();
    await infoButton.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(source).toBeVisible();
    await infoButton.press("Escape");
    await expect(source).toBeHidden();
    await expect(chart.getByRole("slider")).toHaveCount(0);
    await expect(chart.getByRole("table")).toHaveCount(0);
    await expect(chart.locator("figcaption")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__axis-labels")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__scale span")).toHaveCount(5);
    await expectAlignedScale(chart);
    await expect(chart.locator(".post-traffic__dates span")).toHaveCount(3);
    await expect(chart.locator(".post-traffic__axes")).toHaveAttribute(
      "d",
      "M 4 4 V 196 H 596",
    );
    const rangeButtons = chart.getByRole("group", {
      name: "Traffic date range",
    });
    await expect(rangeButtons.locator(".button--bordered")).toHaveCount(3);
    await expect(rangeButtons.locator(".button--primary")).toHaveCount(1);
    const allTime = rangeButtons.getByRole("button", {
      name: "All time",
      exact: true,
    });
    await expect(allTime).toHaveCSS(
      "background-color",
      await chart
        .locator(".post-traffic__line")
        .evaluate((element) => getComputedStyle(element).stroke),
    );
    const selectedColour = await allTime.evaluate(
      (element) => getComputedStyle(element).color,
    );
    await allTime.hover();
    await expect(allTime).toHaveCSS("color", selectedColour);
    const point = chart.getByRole("button", {
      name: "Jan 2024: 120 page views",
      exact: true,
    });
    await point.focus();
    await expectPointTooltip(chart, "Jan 2024", 120);
    await point.press("ArrowRight");
    await expect(
      chart.getByRole("button", {
        name: "Feb 2024: 0 page views",
        exact: true,
      }),
    ).toBeFocused();
    await expectPointTooltip(chart, "Feb 2024", 0);
    await chart.locator(".post-traffic__point:focus").press("End");
    await expectPointTooltip(chart, "Mar 2024", 240);
    await chart.locator(".post-traffic__point:focus").press("Home");
    await expect(point).toBeFocused();
    await point.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await point.press("ArrowRight");
    await chart.locator(".post-traffic__point:focus").press("Escape");
    await chart.locator(".post-traffic__point:focus").press("ArrowRight");
    await expect(
      chart.getByRole("button", {
        name: "Mar 2024: 240 page views",
        exact: true,
      }),
    ).toBeFocused();
    await chart.locator(".post-traffic__point:focus").press("Escape");
    const polyline = chart.locator("polyline");
    expect(await polyline.getAttribute("points")).not.toMatch(/NaN|Infinity/);
    const bounds = await chart.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await expect(chart.locator(".post-traffic__plot svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await infoButton.focus();
    await infoButton.press("Escape");
    await point.hover();
    await expectPointTooltip(chart, "Jan 2024", 120);
    await page.getByRole("tooltip").hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await chart.screenshot({ path: info.outputPath("traffic-chart.png") });
  });
}

test("Missing configuration or an untracked article leaves no empty traffic card", async ({
  page,
}) => {
  for (const data of [null, { ...snapshot, posts: {} }]) {
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({ json: data }),
    );
    await Promise.all([
      page.waitForResponse("**/post-traffic.json"),
      page.goto(path, { waitUntil: "domcontentloaded" }),
    ]);
    await expect(page.locator(".post-traffic")).toHaveCount(0);
    await page.unroute("**/post-traffic.json");
  }
});

test("A single zero month has a valid point and nonduplicated date labels", async ({
  page,
}) => {
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({
      json: {
        ...snapshot,
        posts: {
          [path]: {
            startDate: "2024-01-15",
            endDate: "2024-01-31",
            months: [{ month: "2024-01", views: 0 }],
          },
        },
      },
    }),
  );
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const chart = page.locator(".post-traffic");
  await expect(chart.locator(".post-traffic__total dd")).toHaveText("0");
  await expect(chart.locator(".post-traffic__engagement dd")).toHaveText(
    "Unavailable",
  );
  await expect(chart.getByRole("slider")).toHaveCount(0);
  await expect(chart.locator("polyline")).toHaveAttribute("points", "300,196");
  await expect(chart.locator(".post-traffic__scale span").first()).toHaveText(
    "4",
  );
  await expectAlignedScale(chart);
  await expect(chart.locator(".post-traffic__dates span")).toHaveCount(1);
  await chart
    .getByRole("button", { name: "Jan 2024: 0 page views", exact: true })
    .focus();
  await expectPointTooltip(chart, "Jan 2024", 0);
});

test("Recorded zero engagement remains distinct from an unavailable average", async ({
  page,
}) => {
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({
      json: {
        ...snapshot,
        posts: {
          [path]: {
            ...snapshot.posts[path],
            months: [
              { month: "2024-01", views: 120, engagementSeconds: 0 },
              { month: "2024-02", views: 0, engagementSeconds: 0 },
              { month: "2024-03", views: 240, engagementSeconds: 0 },
            ],
          },
        },
      },
    }),
  );
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const chart = page.locator(".post-traffic");
  await expect(chart.locator(".post-traffic__engagement dd")).toHaveText("0s");
  await chart.getByRole("button", { name: "Engagement", exact: true }).click();
  await chart.locator(".post-traffic__point").first().focus();
  await expectPointTooltip(chart, "Jan 2024", 120, "0s");
  await chart.locator(".post-traffic__point").nth(1).focus();
  await expectPointTooltip(chart, "Feb 2024", 0, "Unavailable");
});

test.describe("Touch traffic inspection", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 900 } });

  test("Tapping a point reveals its monthly traffic", async ({ page }) => {
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({ json: snapshot }),
    );
    await Promise.all([
      page.waitForResponse("**/post-traffic.json"),
      page.goto(path, { waitUntil: "domcontentloaded" }),
    ]);
    const chart = page.locator(".post-traffic");
    const point = chart.getByRole("button", {
      name: "Mar 2024: 240 page views",
      exact: true,
    });
    await point.tap();
    await expectPointTooltip(chart, "Mar 2024", 240);
    await chart.getByRole("button", { name: "About article traffic" }).tap();
    await expect(
      page.getByRole("tooltip").filter({ hasText: "Source: Google Analytics" }),
    ).toBeVisible();
    await chart.getByRole("button", { name: "About article traffic" }).tap();
    await expect(
      page.getByRole("tooltip").filter({ hasText: "Source: Google Analytics" }),
    ).toBeHidden();
    await chart.getByRole("button", { name: "About article traffic" }).tap();
    await expect(
      page.getByRole("tooltip").filter({ hasText: "Source: Google Analytics" }),
    ).toBeVisible();
    await chart
      .getByRole("heading", { name: "Article Traffic", exact: true })
      .tap();
    await expect(
      page.getByRole("tooltip").filter({ hasText: "Source: Google Analytics" }),
    ).toBeHidden();
  });

  test("Date presets update the plot, dates, totals and weighted engagement", async ({
    page,
  }) => {
    const months = trafficMonths("2022-02-03", "2026-10-22").map(
      (month, index) => ({
        month,
        views: 1000 + index,
        engagementSeconds: (1000 + index) * (30 + (index % 30)),
      }),
    );
    const days = trafficDays("2026-09-23", "2026-10-22").map((date, index) => ({
      date,
      views: index + 1,
      engagementSeconds: (index + 1) * (index + 10),
    }));
    const october = days.filter((day) => day.date.startsWith("2026-10"));
    months[56] = {
      month: "2026-10",
      views: october.reduce((sum, day) => sum + day.views, 0),
      engagementSeconds: october.reduce(
        (sum, day) => sum + day.engagementSeconds,
        0,
      ),
    };
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({
        json: {
          ...snapshot,
          posts: {
            [path]: {
              startDate: "2022-02-03",
              endDate: "2026-10-22",
              months,
              days,
            },
          },
        },
      }),
    );
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const chart = page.locator(".post-traffic");
    await expect(chart.locator(".post-traffic__point")).toHaveCount(57);
    await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__events")).toHaveCount(0);
    for (const [name, size, firstDate, lastDate] of [
      ["Last year", 12, "Nov 2025", "Oct 2026"],
      ["Last month", 30, "23 Sept", "22 Oct"],
      ["All time", 57, "Feb 2022", "Oct 2026"],
    ] as const) {
      const button = chart.getByRole("button", { name, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(
        chart
          .getByRole("group", { name: "Traffic date range" })
          .locator('[aria-pressed="true"]'),
      ).toHaveCount(1);
      await expect(chart.locator(".post-traffic__point")).toHaveCount(size);
      await expect(chart.locator(".post-traffic__range")).toHaveCount(0);
      await expect(
        chart.locator(".post-traffic__dates span").first(),
      ).toHaveText(firstDate);
      await expect(
        chart.locator(".post-traffic__dates span").last(),
      ).toHaveText(lastDate);
      const selected = name === "Last month" ? days : months.slice(-size);
      const total = selected.reduce((sum, item) => sum + item.views, 0);
      await expect(chart.locator(".post-traffic__total dd")).toHaveText(
        new Intl.NumberFormat("en-GB").format(total),
      );
      const seconds = Math.round(
        selected.reduce((sum, item) => sum + item.engagementSeconds, 0) / total,
      );
      await expect(chart.locator(".post-traffic__engagement dd")).toHaveText(
        formatTrafficDuration(seconds),
      );
      await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
      await expect(chart.locator(".post-traffic__plot")).toHaveAttribute(
        "aria-label",
        new RegExp(name === "Last month" ? "^Daily" : "^Monthly"),
      );
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      if (name === "Last month") {
        await chart.locator(".post-traffic__point").last().focus();
        await expectPointTooltip(chart, "22 Oct 2026", 30, "39s");
        await chart.locator(".post-traffic__point").last().press("Escape");
      }
      await chart
        .getByRole("button", { name: "Engagement", exact: true })
        .click();
      await expect(chart.locator(".post-traffic__chart")).toHaveCount(1);
      await expect(chart.locator(".post-traffic__point")).toHaveCount(size);
      await expect(chart.locator(".post-traffic__plot")).toHaveAttribute(
        "aria-label",
        new RegExp(
          `^${name === "Last month" ? "Daily" : "Monthly"} average engagement per view`,
        ),
      );
      await expectAlignedScale(chart);
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(
        chart.locator(".post-traffic__dates span").first(),
      ).toHaveText(firstDate);
      await expect(
        chart.locator(".post-traffic__dates span").last(),
      ).toHaveText(lastDate);
      await chart.getByRole("button", { name: "Traffic", exact: true }).click();
    }
  });

  test("Only the latest update is annotated using real article metadata", async ({
    page,
  }) => {
    const article = "/gethashcode-made-easy/";
    const startDate = "2014-04-14";
    const endDate = "2026-10-22";
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({
        json: {
          ...snapshot,
          posts: {
            [article]: {
              startDate,
              endDate,
              months: trafficMonths(startDate, endDate).map((month) => ({
                month,
                views: 10,
              })),
            },
          },
        },
      }),
    );
    await page.goto(article, { waitUntil: "domcontentloaded" });
    const chart = page.locator(".post-traffic");
    await expect(chart.locator(".post-traffic__annotation")).toHaveCount(1);
    await expect(chart.locator(".post-traffic__events")).not.toContainText(
      "Published",
    );
    await expect(chart.locator(".post-traffic__events")).toContainText(
      "Latest update 12 Jun 2019",
    );
    await expect(chart.locator(".post-traffic__engagement dd")).toHaveText(
      "Unavailable",
    );
    const updated = chart.getByRole("button", {
      name: "Jun 2019: 10 page views. Latest update 12 Jun 2019",
      exact: true,
    });
    await updated.focus();
    await expectPointTooltip(chart, "Jun 2019", 10);
    await expect(page.locator(".post-traffic__tooltip-events")).toHaveText(
      "Latest update 12 Jun 2019",
    );
    await expect(chart.locator(".post-traffic__warning")).toHaveCount(0);
    await chart.getByRole("button", { name: "Last year", exact: true }).click();
    await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__events")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__warning")).toHaveCount(0);
  });

  test("Traffic and Engagement toggle a single chart without bridging missing averages", async ({
    page,
  }) => {
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({
        json: {
          ...snapshot,
          posts: {
            [path]: {
              ...snapshot.posts[path],
              months: [
                { month: "2024-01", views: 120, engagementSeconds: 1200 },
                { month: "2024-02", views: 0, engagementSeconds: 0 },
                { month: "2024-03", views: 240, engagementSeconds: 21600 },
              ],
            },
          },
        },
      }),
    );
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const card = page.locator(".post-traffic");
    await expect(card.locator(".post-traffic__engagement dd")).toHaveText(
      "1m 3s",
    );
    await expect(card.locator(".post-traffic__chart")).toHaveCount(1);
    await expect(card.locator(".post-traffic__engagement dd")).toHaveCSS(
      "display",
      "block",
    );
    const metrics = card.getByRole("group", { name: "Chart metric" });
    const traffic = metrics.getByRole("button", {
      name: "Traffic",
      exact: true,
    });
    const engagement = metrics.getByRole("button", {
      name: "Engagement",
      exact: true,
    });
    await expect(traffic).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator(".post-traffic__engagement-line")).toHaveCount(0);
    await engagement.focus();
    await engagement.press("Enter");
    await expect(engagement).toHaveAttribute("aria-pressed", "true");
    await expect(engagement).toHaveClass(/button--primary/);
    await expect(traffic).not.toHaveClass(/button--primary/);
    await expect(engagement).toHaveCSS("outline-style", "solid");
    await expect(engagement).toHaveCSS("outline-width", "2px");
    await expect(metrics.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(card.locator(".post-traffic__chart")).toHaveCount(1);
    await expect(card.locator("polyline.post-traffic__line")).toHaveCount(0);
    await expect(card.locator(".post-traffic__axis-labels")).toHaveCount(0);
    await expect(card.locator(".post-traffic__plot")).toHaveAttribute(
      "aria-label",
      /^Monthly average engagement per view/,
    );
    await expect(card.locator(".post-traffic__scale span")).toHaveCount(5);
    await expect(card.locator(".post-traffic__scale span").first()).toHaveText(
      formatTrafficDuration(120),
    );
    const pathData = await card
      .locator(".post-traffic__engagement-line")
      .getAttribute("d");
    expect(pathData!.match(/M /g)).toHaveLength(2);
    expect(pathData).not.toContain("L ");
    await expect(card.locator(".post-traffic__point--missing")).toHaveCount(1);
    await card.locator(".post-traffic__point").first().focus();
    await expectPointTooltip(card, "Jan 2024", 120, "10s");
    await card.locator(".post-traffic__point").nth(1).focus();
    await expectPointTooltip(card, "Feb 2024", 0, "Unavailable");
    await traffic.focus();
    await traffic.press("Space");
    await expect(traffic).toHaveAttribute("aria-pressed", "true");
    await expect(traffic).toHaveClass(/button--primary/);
    await expect(engagement).not.toHaveClass(/button--primary/);
    await expect(metrics.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(card.locator(".post-traffic__engagement-line")).toHaveCount(0);
    await expect(card.locator("polyline.post-traffic__line")).toHaveCount(1);
    await expect(page.locator(".post-traffic__tooltip")).toHaveCount(0);
  });

  test("Missing engagement and zero-view ranges are explicit without resetting the metric", async ({
    page,
  }) => {
    for (const zeroViews of [false, true]) {
      await page.route("**/post-traffic.json", (route) =>
        route.fulfill({
          json: zeroViews
            ? {
                ...snapshot,
                posts: {
                  [path]: {
                    ...snapshot.posts[path],
                    months: snapshot.posts[path]!.months.map((month) => ({
                      ...month,
                      views: 0,
                      engagementSeconds: 0,
                    })),
                  },
                },
              }
            : snapshot,
        }),
      );
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const card = page.locator(".post-traffic");
      const engagement = card.getByRole("button", {
        name: "Engagement",
        exact: true,
      });
      await engagement.click();
      await expect(engagement).toHaveAttribute("aria-pressed", "true");
      await expect(card.getByRole("status")).toHaveText(
        "Engagement is unavailable for this date range.",
      );
      await expect(card.locator(".post-traffic__chart")).toHaveCount(0);
      await card
        .getByRole("button", { name: "Last year", exact: true })
        .click();
      await expect(engagement).toHaveAttribute("aria-pressed", "true");
      await expect(card.getByRole("status")).toBeVisible();
      await card.getByRole("button", { name: "Traffic", exact: true }).click();
      await expect(card.locator(".post-traffic__point")).toHaveCount(3);
      await expect(card.getByRole("status")).toHaveCount(0);
      await page.unroute("**/post-traffic.json");
    }
  });
});

test("Unavailable or malformed snapshots show an explicit error, not fake counts", async ({
  page,
}) => {
  for (const json of [
    { invalid: true },
    { ...snapshot, posts: { [path]: { ...snapshot.posts[path], months: [] } } },
  ]) {
    await page.route("**/post-traffic.json", (route) =>
      route.fulfill({ json }),
    );
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".post-traffic").getByRole("status")).toHaveText(
      "Traffic history is currently unavailable.",
    );
    await expect(page.locator(".post-traffic svg")).toHaveCount(0);
    await page.unroute("**/post-traffic.json");
  }
});

test("A reporting endpoint failure is visible without disrupting the article", async ({
  page,
}) => {
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({ status: 503 }),
  );
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".post-traffic").getByRole("status")).toHaveText(
    "Traffic history is currently unavailable.",
  );
  await expect(page.locator(".post__content")).toBeVisible();
});

test("A decade of traffic remains usable on a narrow dark-theme screen", async ({
  page,
}, info) => {
  const oldestPath = "/just-start-the-first-blog-post/";
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  const months = trafficMonths("2014-02-01", "2026-10-22").map(
    (month, index) => ({ month, views: index * 100 }),
  );
  await page.route("**/post-traffic.json", (route) =>
    route.fulfill({
      json: {
        ...snapshot,
        posts: {
          [oldestPath]: {
            startDate: "2014-02-01",
            endDate: "2026-10-22",
            months,
          },
        },
      },
    }),
  );
  await page.goto(oldestPath, { waitUntil: "domcontentloaded" });
  const chart = page.locator(".post-traffic");
  const points = chart.locator(".post-traffic__point");
  await expect(points).toHaveCount(months.length);
  await points.first().focus();
  await points.first().press("End");
  await expect(points.last()).toBeFocused();
  await expectPointTooltip(chart, "Oct 2026", 15_200);
  const tooltip = await page.getByRole("tooltip").boundingBox();
  expect(tooltip!.x).toBeGreaterThanOrEqual(0);
  expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(376);
  const bounds = await chart.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
  await chart.screenshot({ path: info.outputPath("traffic-history-dark.png") });
});
