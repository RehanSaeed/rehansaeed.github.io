import { expect, test } from "./fixtures";
import type { TrafficSnapshot } from "../../shared/utils/traffic";
import { trafficMonths } from "../../shared/utils/traffic";

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
    await infoButton.click();
    await expect(infoButton).toHaveAttribute("aria-expanded", "true");
    await expect(source).toBeVisible();
    await expect(source).toContainText("not unique visitors");
    await expect(source).toContainText("Europe/London");
    await infoButton.click();
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
