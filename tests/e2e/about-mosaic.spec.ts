import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const settledScreenshot = async (canvas: Locator) => {
  let previous: Buffer | undefined;
  await expect
    .poll(async () => {
      const current = await canvas.screenshot();
      const unchanged = previous?.equals(current) ?? false;
      previous = current;
      return unchanged;
    })
    .toBe(true);
  return canvas.screenshot();
};

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Map unavailable during mosaic tests" }),
  );
  await page.route("https://get.geojs.io/**", (route) =>
    route.fulfill({
      status: 503,
      body: "Location unavailable during mosaic tests",
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test("Four ordered reliefs render existing artwork without intercepting input", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/about/");
  for (const composition of ["portrait", "broadcast", "honour", "alumni"]) {
    const relief = page.locator(`.dimensional-mosaic--${composition}`);
    await relief.scrollIntoViewIfNeeded();
    await expect(relief).toHaveAttribute("data-scene-state", "ready");
    const canvas = relief.locator("canvas");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveCSS("pointer-events", "none");
    expect(await canvas.evaluate((node) => node.tabIndex)).toBe(-1);
    expect(
      await canvas.evaluate(
        (node: HTMLCanvasElement) =>
          node.width / node.getBoundingClientRect().width,
      ),
    ).toBeLessThanOrEqual(1.51);
    await expect(
      relief.locator(".dimensional-mosaic__original img"),
    ).toHaveCount(1);
  }
  await expect(page.locator("#location .location-map")).toHaveCount(1);
  await page.getByRole("link", { name: "Portfolio", exact: true }).click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.locator(".dimensional-mosaic")).toHaveCount(0);
  await page.goBack();
  await page.locator(".dimensional-mosaic--portrait").scrollIntoViewIfNeeded();
  await expect(page.locator(".dimensional-mosaic--portrait")).toHaveAttribute(
    "data-scene-state",
    "ready",
  );
  expect(errors).toEqual([]);
});

test("Pointer depth and native scrolling change the portrait relief", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const relief = page.locator(".dimensional-mosaic--portrait");
  await expect(relief).toHaveAttribute("data-scene-state", "ready");
  const canvas = relief.locator("canvas");
  const before = await settledScreenshot(canvas);
  await relief.hover({ position: { x: 40, y: 40 } });
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false);
  const afterPointer = await settledScreenshot(canvas);
  await page.mouse.wheel(0, 180);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await canvas.screenshot()).equals(afterPointer))
    .toBe(false);
});

test("Motion and forced-colour changes suspend and restart the relief", async ({
  page,
}) => {
  await page.goto("/about/");
  const relief = page.locator(".dimensional-mosaic--portrait");
  await expect(relief).toHaveAttribute("data-scene-state", "static");
  await expect(relief.locator(".dimensional-mosaic__original")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(relief.locator("canvas")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(relief).toHaveAttribute("data-scene-state", "ready");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(relief).toHaveAttribute("data-scene-state", "static");
  await expect(relief.locator(".dimensional-mosaic__original")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(relief.locator("canvas")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(relief).toHaveAttribute("data-scene-state", "ready");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(relief).toHaveAttribute("data-scene-state", "static");
  await expect(relief.locator("canvas")).toBeHidden();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(relief).toHaveAttribute("data-scene-state", "ready");
});

test("Context loss exposes the original portrait without losing content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const relief = page.locator(".dimensional-mosaic--portrait");
  await expect(relief).toHaveAttribute("data-scene-state", "ready");
  await relief.locator("canvas").evaluate((node) => {
    node.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(relief).toHaveAttribute("data-scene-state", "fallback");
  await expect(relief.locator(".dimensional-mosaic__original")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(
    page.getByRole("heading", { name: "Hello, I'm Rehan." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore the work", exact: true }),
  ).toBeVisible();
});

test("Failed texture loading retains the accessible original artwork", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route(
    (url) =>
      url.pathname ===
      "/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg",
    (route) => route.fulfill({ status: 503, body: "Texture unavailable" }),
  );
  await page.goto("/about/");
  const relief = page.locator(".dimensional-mosaic--portrait");
  await expect(relief).toHaveAttribute("data-scene-state", "fallback");
  await expect(relief.locator(".dimensional-mosaic__original")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(
    relief.getByRole("img", { name: "Muhammad Rehan Saeed", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      relief
        .getByRole("img", { name: "Muhammad Rehan Saeed", exact: true })
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("Forced colours and 200 percent zoom retain native content and links", async ({
  page,
}) => {
  await page.emulateMedia({
    forcedColors: "active",
    reducedMotion: "no-preference",
  });
  await page.goto("/about/");
  await page.evaluate(() => {
    document.documentElement.style.setProperty("zoom", "2");
  });
  const relief = page.locator(".dimensional-mosaic--portrait");
  await expect(relief).toHaveAttribute("data-scene-state", "static");
  await expect(relief.locator("canvas")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
  await expect(
    page.getByRole("heading", { name: "YouTube", level: 2 }),
  ).toBeInViewport();
});
