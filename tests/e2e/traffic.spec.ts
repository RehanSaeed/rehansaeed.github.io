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
      chart.getByRole("heading", { name: "Article traffic" }),
    ).toBeVisible();
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toContainText("360 page views");
    await expect(chart).toContainText(
      "Traffic before 15 Jan 2024 is unavailable.",
    );
    await expect(chart).toContainText("not unique visitors");
    await expect(chart).toContainText("Europe/London");
    const slider = chart.getByRole("slider", { name: "Inspect a month" });
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Mar 2024: 240 page views",
    );
    await slider.focus();
    await slider.press("Home");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Jan 2024: 120 page views",
    );
    await slider.press("ArrowRight");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Feb 2024: 0 page views",
    );
    await chart.locator("summary").click();
    const table = chart.getByRole("table", {
      name: "Monthly page views for this article",
    });
    await expect(table.getByRole("row")).toHaveCount(4);
    await expect(table.getByRole("row").nth(2)).toContainText("Feb 2024");
    await expect(table.getByRole("row").nth(2)).toContainText("0");
    const polyline = chart.locator("polyline");
    expect(await polyline.getAttribute("points")).not.toMatch(/NaN|Infinity/);
    const bounds = await chart.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    await expect(chart.locator("svg")).toHaveAttribute("aria-hidden", "true");
    const plot = await chart.locator("svg").boundingBox();
    await page.mouse.move(plot!.x + 1, plot!.y + 20);
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      "Jan 2024: 120 page views",
    );
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

test("A single zero month has a valid plot without an unnecessary slider", async ({
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
  await expect(chart).toContainText("0 page views");
  await expect(chart.getByRole("slider")).toHaveCount(0);
  await expect(chart.locator("polyline")).toHaveAttribute("points", "300,196");
  await expect(chart.locator("circle")).toHaveAttribute("cx", "300");
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
  const slider = chart.getByRole("slider");
  await expect(slider).toHaveAttribute("max", String(months.length - 1));
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    "Oct 2026: 15,200 page views",
  );
  await chart.locator("summary").click();
  await expect(chart.getByRole("table").getByRole("row")).toHaveCount(
    months.length + 1,
  );
  const bounds = await chart.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
  await chart.screenshot({ path: info.outputPath("traffic-history-dark.png") });
});
