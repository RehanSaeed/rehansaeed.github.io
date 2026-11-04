import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Offline map fixture" }),
  );
});

test("The decorative mobile renders, responds to preferences and survives context loss", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const scene = page.locator(".orbital-gallery");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene).toHaveAttribute("data-state", "animated");
  const canvas = scene.locator("canvas");
  await expect(canvas).toHaveCSS("opacity", "1");
  const dimensions = await canvas.evaluate((element: HTMLCanvasElement) => ({
    width: element.width,
    height: element.height,
    cssWidth: element.clientWidth,
    cssHeight: element.clientHeight,
  }));
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
  expect(dimensions.width / dimensions.cssWidth).toBeLessThanOrEqual(1.5);
  expect(dimensions.height / dimensions.cssHeight).toBeLessThanOrEqual(1.5);
  const before = await canvas.screenshot();
  await testInfo.attach("animated-before", {
    body: before,
    contentType: "image/png",
  });
  await page.locator("#youtube").scrollIntoViewIfNeeded();
  await expect(async () => {
    const after = await canvas.screenshot();
    await testInfo.attach("animated-after", {
      body: after,
      contentType: "image/png",
    });
    expect(after.equals(before)).toBe(false);
  }).toPass();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-state", "static");
  await page.locator("#the-person").scrollIntoViewIfNeeded();
  const still = await canvas.screenshot();
  await testInfo.attach("reduced-motion-before", {
    body: still,
    contentType: "image/png",
  });
  await page.mouse.move(20, 20);
  const afterPointer = await canvas.screenshot();
  await testInfo.attach("reduced-motion-after", {
    body: afterPointer,
    contentType: "image/png",
  });
  expect(afterPointer.equals(still)).toBe(true);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(scene).toHaveAttribute("data-state", "fallback");
  await expect(scene).toBeHidden();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(scene).toHaveAttribute("data-state", "static");
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const extension = element
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) {
      throw new Error("The browser must support deliberate WebGL context loss");
    }
    extension.loseContext();
  });
  await expect(scene).toHaveAttribute("data-state", "fallback");
  await expect(scene.locator(".orbital-gallery__fallback")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(scene).toHaveAttribute("data-state", "fallback");
  await expect(scene.locator(".orbital-gallery__fallback")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeVisible();
});

test("Missing WebGL leaves the gallery artwork and real biography available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (!descriptor || typeof descriptor.value !== "function") {
      throw new Error("Canvas getContext is unavailable");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ): unknown {
        return type.startsWith("webgl")
          ? null
          : Reflect.apply(
              descriptor.value as (...args: unknown[]) => unknown,
              this,
              [type, ...args],
            );
      },
    });
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".orbital-gallery")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".orbital-gallery__fallback")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hello, I'm Rehan." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .click();
  await expect(page).toHaveURL(/#youtube$/);
});

test("Gallery composition remains readable at an effective 200% zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 450 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".orbital-gallery")).toBeHidden();
  for (const id of [
    "location",
    "youtube",
    "github",
    "awards",
    "stackoverflow",
    "microsoft-mvp",
  ]) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(640);
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
});
