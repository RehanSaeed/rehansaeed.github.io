import { expect, test } from "@playwright/test";

const url = process.env.TRAFFIC_DESIGNS_URL;
test.skip(
  !url,
  "Start scripts/traffic-designs.mjs and set TRAFFIC_DESIGNS_URL.",
);

test("Twelve real-component treatments and their controls work without external requests", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("http") && !request.url().startsWith(url!))
      external.push(request.url());
  });
  await page.goto(url!, { waitUntil: "domcontentloaded" });
  const frame = page.frameLocator("#selected");
  await expect(
    frame.getByRole("heading", { name: "Article Traffic", exact: true }),
  ).toBeVisible();
  const treatments = page.locator(".samples button");
  await expect(treatments).toHaveCount(12);
  await expect(frame.locator(".post-traffic__axis-labels")).toHaveCount(0);
  const layouts = [
    "classic",
    "area",
    "fade",
    "center",
    "split",
    "inline",
    "footer-dates",
    "compact",
    "tall",
    "tiles",
    "clean",
    "step",
  ];
  const fingerprints = new Set<string>();
  for (const [index, layout] of layouts.entries()) {
    await treatments.nth(index).click();
    await expect(frame.locator("body")).toHaveAttribute("data-layout", layout);
    await expect(treatments.nth(index)).toHaveAttribute("aria-pressed", "true");
    fingerprints.add(
      await frame.locator(".post-traffic").evaluate((card) => {
        const bounds = (selector: string) => {
          const rect = card.querySelector(selector)!.getBoundingClientRect();
          return [rect.x, rect.y, rect.width, rect.height].map(Math.round);
        };
        const property = (selector: string, key: string) =>
          getComputedStyle(card.querySelector(selector)!).getPropertyValue(key);
        return JSON.stringify({
          total: bounds(".post-traffic__total"),
          range: bounds(".post-traffic__range"),
          plot: bounds(".post-traffic__plot"),
          fill: property(".post-traffic__preview-area", "fill"),
          fillDisplay: property(".post-traffic__preview-area", "display"),
          line: property(".post-traffic__line", "visibility"),
          lineWidth: property(".post-traffic__line", "stroke-width"),
          grid: property(".post-traffic__gridline", "opacity"),
        });
      }),
    );
  }
  expect(fingerprints.size).toBe(12);
  await page.getByLabel("Theme").selectOption("dark");
  await expect(frame.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Fill", { exact: true }).selectOption("none");
  await expect(frame.locator(".post-traffic__preview-area")).toBeHidden();
  await page.getByLabel("Fill", { exact: true }).selectOption("solid");
  await page.getByLabel("Opacity").press("Home");
  await expect(frame.locator(".post-traffic__preview-area")).toHaveCSS(
    "opacity",
    "0.05",
  );
  await page.getByLabel("Points", { exact: true }).uncheck();
  await expect(frame.locator("body")).toHaveAttribute("data-points", "false");
  await page.getByLabel("Grid", { exact: true }).uncheck();
  await expect(frame.locator(".post-traffic__gridline").first()).toHaveCSS(
    "opacity",
    "0",
  );
  await page.getByLabel("Update label").selectOption("inside");
  await expect(frame.locator(".post-traffic__events")).toBeHidden();
  await expect(frame.locator(".post-traffic__preview-event")).toHaveText(
    "Latest update 12 Jun 2025",
  );
  await frame.getByRole("button", { name: "Engagement", exact: true }).click();
  await expect(frame.locator(".post-traffic__axis-labels")).toHaveCount(0);
  await expect(frame.locator(".post-traffic__plot")).toHaveAttribute(
    "aria-label",
    /^Monthly average engagement per view/,
  );
  await expect(frame.locator(".post-traffic__chart")).toHaveCount(1);
  await expect(frame.locator(".post-traffic__preview-event")).toHaveCount(1);
  for (const [index, layout] of layouts.entries()) {
    await treatments.nth(index).click();
    await expect(frame.locator("body")).toHaveAttribute("data-layout", layout);
    await expect(frame.locator(".post-traffic__engagement-line")).toHaveCount(
      1,
    );
    const totalFontSize = await frame
      .locator(".post-traffic__total dd")
      .evaluate((element) => getComputedStyle(element).fontSize);
    await expect(frame.locator(".post-traffic__engagement dd")).toHaveCSS(
      "font-size",
      totalFontSize,
    );
    await expect(frame.locator(".post-traffic__axis-labels")).toHaveCount(0);
    await expect(frame.locator(".post-traffic__preview-area")).toHaveAttribute(
      "d",
      /^M [\d.]+ 196 L [\d.]+ [\d.]+/,
    );
    await expect(frame.locator(".post-traffic__preview-event")).toHaveCount(1);
  }
  await page.getByLabel("Update label").selectOption("below");
  await expect(frame.locator(".post-traffic__events")).toBeVisible();
  await expect(frame.locator(".post-traffic__preview-event")).toHaveCount(0);
  await frame.getByRole("button", { name: "Traffic", exact: true }).click();
  await page.getByLabel("Show all twelve").check();
  const comparisons = page.locator(".comparison iframe");
  await expect(comparisons).toHaveCount(12);
  for (let index = 0; index < 12; index++)
    await expect(
      comparisons.nth(index).contentFrame().locator(".post-traffic__point"),
    ).toHaveCount(57);
  expect(external).toEqual([]);
});

test("Mobile samples retain working presets, annotations and a non-expanding help tooltip", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto(url!, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Width").selectOption("mobile");
  const frame = page.frameLocator("#selected");
  const chart = frame.locator(".post-traffic");
  await expect(chart.locator(".post-traffic__point")).toHaveCount(57);
  await expect(chart.locator(".post-traffic__annotation")).toHaveCount(1);
  await expect(chart.locator(".post-traffic__events")).not.toContainText(
    "Published",
  );
  const plotWidth = (await chart.locator(".post-traffic__plot").boundingBox())!
    .width;
  const gridWidth = (await chart.locator(".post-traffic__chart").boundingBox())!
    .width;
  expect(plotWidth).toBeGreaterThan(gridWidth * 0.55);
  const initial = await chart.locator(".post-traffic__total dd").innerText();
  await chart.getByRole("button", { name: "Last year", exact: true }).click();
  await expect(chart.locator(".post-traffic__point")).toHaveCount(12);
  await expect(chart.locator(".post-traffic__total dd")).not.toHaveText(
    initial,
  );
  await expect(chart.locator(".post-traffic__annotation")).toHaveCount(0);
  await chart.getByRole("button", { name: "Last month", exact: true }).click();
  await expect(chart.locator(".post-traffic__point")).toHaveCount(30);
  await expect(chart.locator(".post-traffic__plot")).toHaveAttribute(
    "aria-label",
    /^Daily/,
  );
  await chart.getByRole("button", { name: "Engagement", exact: true }).click();
  await expect(chart.locator(".post-traffic__point")).toHaveCount(30);
  await expect(chart.locator(".post-traffic__plot")).toHaveAttribute(
    "aria-label",
    /^Daily average engagement per view/,
  );
  const plotOffset = () =>
    chart.evaluate((card) => {
      const plot = card.querySelector(".post-traffic__plot")!;
      return plot.getBoundingClientRect().y - card.getBoundingClientRect().y;
    });
  const y = await plotOffset();
  const help = chart.getByRole("button", { name: "About article traffic" });
  await help.focus();
  const tooltip = chart.locator(".post-traffic__source");
  await expect(tooltip).toBeVisible();
  expect(await plotOffset()).toBeCloseTo(y, 3);
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  await help.press("Escape");
  await expect(tooltip).toBeHidden();
  for (let index = 0; index < 12; index++) {
    await page.locator(".samples button").nth(index).click();
    await expect(chart).toBeVisible();
    const bounds = await chart.boundingBox();
    const iframe = await page.locator("#selected").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(iframe!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      iframe!.x + iframe!.width + 1,
    );
  }
  await page.screenshot({
    path: info.outputPath("traffic-designs-mobile.png"),
    fullPage: true,
  });
});
