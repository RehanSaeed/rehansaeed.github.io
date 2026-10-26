import { expect, test } from "./fixtures";
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
    await expect(chart.locator(".post-traffic__total strong")).toHaveText(
      "360",
    );
    await expect(chart.locator(".post-traffic__total span")).toHaveText(
      "page views",
    );
    await expect(chart.locator(".post-traffic__engagement")).toHaveText(
      "Unavailable average engagement per view",
    );
    await expect(chart.locator("h2")).toHaveCSS("text-align", "center");
    await expect(chart.locator(".post-traffic__total strong")).toHaveCSS(
      "font-family",
      /Audiowide/,
    );
    const total = await chart.locator(".post-traffic__total").boundingBox();
    const range = await chart.locator(".post-traffic__range").boundingBox();
    if (width === 375)
      expect(range!.y).toBeGreaterThanOrEqual(total!.y + total!.height);
    else expect(range!.x).toBeGreaterThan(total!.x + total!.width);
    const summary = await chart.locator(".post-traffic__summary").boundingBox();
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
      "Traffic before 15 Jan 2024 is unavailable.",
    );
    const source = chart.locator(".post-traffic__source");
    const infoButton = chart.getByRole("button", {
      name: "About article traffic",
    });
    await expect(infoButton.locator("svg > *")).not.toHaveCount(0);
    await expect(source).toBeHidden();
    const beforeHelp = await chart.locator(".post-traffic__plot").boundingBox();
    await infoButton.hover();
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute("role", "tooltip");
    expect(await infoButton.getAttribute("aria-expanded")).toBeNull();
    await expect(source).toContainText("not unique visitors");
    await expect(source).toContainText("Europe/London");
    const afterHelp = await chart.locator(".post-traffic__plot").boundingBox();
    expect(afterHelp!.y).toBe(beforeHelp!.y);
    await source.hover();
    await expect(source).toBeVisible();
    const helpBounds = await source.boundingBox();
    expect(helpBounds!.x).toBeGreaterThanOrEqual(0);
    expect(helpBounds!.x + helpBounds!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press("Escape");
    await expect(source).toBeHidden();
    await infoButton.focus();
    await expect(source).toBeVisible();
    await infoButton.press("Escape");
    await expect(source).toBeHidden();
    await expect(chart.getByRole("slider")).toHaveCount(0);
    await expect(chart.getByRole("table")).toHaveCount(0);
    await expect(chart.locator("figcaption")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__scale span")).toHaveCount(5);
    await expect(chart.locator(".post-traffic__dates span")).toHaveCount(3);
    await expect(chart.locator(".post-traffic__axes")).toHaveAttribute(
      "d",
      "M 4 4 V 196 H 596",
    );
    const point = chart.getByRole("button", {
      name: "Jan 2024: 120 page views",
      exact: true,
    });
    await point.focus();
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Jan 2024: 120 page views",
    );
    await point.press("ArrowRight");
    await expect(
      chart.getByRole("button", {
        name: "Feb 2024: 0 page views",
        exact: true,
      }),
    ).toBeFocused();
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Feb 2024: 0 page views",
    );
    await chart.locator(".post-traffic__point:focus").press("End");
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Mar 2024: 240 page views",
    );
    await chart.locator(".post-traffic__point:focus").press("Home");
    await expect(point).toBeFocused();
    await point.press("Escape");
    await expect(chart.getByRole("tooltip")).toHaveCount(0);
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
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Jan 2024: 120 page views",
    );
    await chart.getByRole("tooltip").hover();
    await expect(chart.getByRole("tooltip")).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(chart.getByRole("tooltip")).toHaveCount(0);
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
  await expect(chart.locator(".post-traffic__total strong")).toHaveText("0");
  await expect(chart.locator(".post-traffic__engagement strong")).toHaveText(
    "Unavailable",
  );
  await expect(chart.getByRole("slider")).toHaveCount(0);
  await expect(chart.locator("polyline")).toHaveAttribute("points", "300,196");
  await expect(chart.locator(".post-traffic__dates span")).toHaveCount(1);
  await chart
    .getByRole("button", { name: "Jan 2024: 0 page views", exact: true })
    .focus();
  await expect(chart.getByRole("tooltip")).toHaveText("Jan 2024: 0 page views");
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
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Mar 2024: 240 page views",
    );
    await chart.getByRole("button", { name: "About article traffic" }).tap();
    await expect(chart.locator(".post-traffic__source")).toBeVisible();
    await chart
      .getByRole("heading", { name: "Article Traffic", exact: true })
      .tap();
    await expect(chart.locator(".post-traffic__source")).toBeHidden();
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
    for (const [name, size, start] of [
      ["Last year", 12, "2025-11-01"],
      ["Last month", 30, "2026-09-23"],
      ["All time", 57, "2022-02-03"],
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
      await expect(
        chart.locator(".post-traffic__range time").first(),
      ).toHaveAttribute("datetime", start);
      const selected = name === "Last month" ? days : months.slice(-size);
      const total = selected.reduce((sum, item) => sum + item.views, 0);
      await expect(chart.locator(".post-traffic__total strong")).toHaveText(
        new Intl.NumberFormat("en-GB").format(total),
      );
      const seconds = Math.round(
        selected.reduce((sum, item) => sum + item.engagementSeconds, 0) / total,
      );
      await expect(
        chart.locator(".post-traffic__engagement strong"),
      ).toHaveText(formatTrafficDuration(seconds));
      await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
      await expect(chart.locator(".post-traffic__plot")).toHaveAttribute(
        "aria-label",
        new RegExp(name === "Last month" ? "^Daily" : "^Monthly"),
      );
      await expect(chart.getByRole("tooltip")).toHaveCount(0);
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
    await expect(chart.locator(".post-traffic__engagement strong")).toHaveText(
      "Unavailable",
    );
    const updated = chart.getByRole("button", {
      name: "Jun 2019: 10 page views. Latest update 12 Jun 2019",
      exact: true,
    });
    await updated.focus();
    await expect(chart.getByRole("tooltip")).toHaveText(
      "Jun 2019: 10 page views. Latest update 12 Jun 2019",
    );
    await chart.getByRole("button", { name: "Last year", exact: true }).click();
    await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
    await expect(chart.locator(".post-traffic__events")).toHaveCount(0);
  });

  test("Engagement can share the views chart or use a separate chart without bridging missing averages", async ({
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
    await expect(card.locator(".post-traffic__engagement strong")).toHaveText(
      "1m 3s",
    );
    await expect(card.locator(".post-traffic__chart")).toHaveCount(1);
    await expect(
      card.locator(".post-traffic__scale--secondary span"),
    ).toHaveCount(5);
    const pathData = await card
      .locator(".post-traffic__engagement-line")
      .getAttribute("d");
    expect(pathData!.match(/M /g)).toHaveLength(2);
    expect(pathData).not.toContain("L ");
    await card
      .getByRole("combobox", { name: "Engagement chart layout" })
      .selectOption("separate");
    await expect(card.locator(".post-traffic__chart")).toHaveCount(2);
    await expect(card.locator(".post-traffic__scale--secondary")).toHaveCount(
      0,
    );
    const engagementChart = card.locator(".post-traffic__chart").nth(1);
    await expect(
      engagementChart.locator(".post-traffic__engagement-line"),
    ).toHaveAttribute("d", pathData!);
    await expect(
      engagementChart.locator(".post-traffic__point--missing"),
    ).toHaveCount(1);
    await engagementChart.locator(".post-traffic__point").first().focus();
    await expect(engagementChart.getByRole("tooltip")).toHaveText(
      "Jan 2024: 120 page views. 10s average engagement per view",
    );
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
  await expect(chart.getByRole("tooltip")).toHaveText(
    "Oct 2026: 15,200 page views",
  );
  const tooltip = await chart.getByRole("tooltip").boundingBox();
  expect(tooltip!.x).toBeGreaterThanOrEqual(0);
  expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(376);
  const bounds = await chart.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
  await chart.screenshot({ path: info.outputPath("traffic-history-dark.png") });
});
