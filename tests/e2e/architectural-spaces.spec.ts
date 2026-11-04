import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Offline map test" }),
  );
});

test("The architectural gallery renders and moves only with ordinary scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const gallery = page.locator(".architecture");
  const canvas = gallery.locator("canvas");
  await expect(gallery).toHaveAttribute("data-scene", "ready");
  await expect(canvas).toBeVisible();
  await expect(gallery).toHaveCSS("pointer-events", "none");
  await expect(canvas).toHaveAttribute("data-progress", "0.000");
  await page.locator("#youtube").scrollIntoViewIfNeeded();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-progress")))
    .toBeGreaterThan(0.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-progress", "0.000");
  const lightScene = await canvas.screenshot();
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(gallery).toHaveAttribute("data-scene", "ready");
  await expect
    .poll(async () => (await canvas.screenshot()).equals(lightScene))
    .toBe(false);
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeVisible();
});

test("High contrast keeps a static gallery and semantic biography", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/about/");
  await expect(page.locator(".architecture")).toHaveAttribute(
    "data-scene",
    "static",
  );
  await expect(page.locator(".architecture canvas")).toBeHidden();
  await expect(
    page.getByRole("article").getByRole("heading", { level: 1 }),
  ).toHaveText("Hello, I'm Rehan.");
  await expect(page.locator(".location-map")).toHaveCount(1);
});

test("The gallery and biography stay within the viewport at 200% scaling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/about/");
  await page.addStyleTag({ content: "html { zoom: 2; }" });
  await expect(page.locator("html")).toHaveCSS("zoom", "2");
  for (const selector of [
    ".architecture__label",
    ".about__intro",
    "#youtube",
    "#awards",
  ]) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    const bounds = await element.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1280);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test("WebGL failure preserves content and reports the static fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original: unknown = Reflect.get(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (typeof original !== "function") {
      throw new TypeError("The canvas context method is unavailable.");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, ...args: unknown[]) {
        if (String(args[0]).startsWith("webgl")) {
          return null;
        }
        return Reflect.apply(original, this, args) as RenderingContext | null;
      },
    });
  });
  await page.goto("/about/");
  await expect(page.locator(".architecture")).toHaveAttribute(
    "data-scene",
    "unavailable",
  );
  await expect(page.locator(".architecture__notice")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore the work", exact: true }),
  ).toHaveAttribute("href", "#youtube");
  await expect(page.locator("#awards h2")).toHaveText("Awards");
});
