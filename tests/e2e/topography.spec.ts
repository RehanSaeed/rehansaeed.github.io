import sharp from "sharp";
import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

// Compare the drawing independently; HTML overlay layout is checked separately.
const captureDrawing = (drawing: Locator) =>
  drawing.screenshot({
    style: ".navigation, .topography__title { opacity: 0 !important; }",
  });

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      status: 503,
      body: "Map unavailable during artwork tests",
    }),
  );
});

test("the live contour sculpture changes with chapters and the site theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const scene = page.locator(".topography");
  const canvas = scene.locator("canvas");
  await expect(scene).toHaveAttribute("data-scene", "ready");
  await expect(canvas).toHaveCSS("pointer-events", "none");
  await expect(scene).toContainText(
    "Abstract artwork, not geography or achievement data.",
  );
  const overhead = await captureDrawing(canvas);
  const statistics = await sharp(overhead).stats();
  expect(
    Math.max(...statistics.channels.map((channel) => channel.stdev)),
  ).toBeGreaterThan(10);
  expect(
    await canvas.evaluate(
      (element: HTMLCanvasElement) =>
        element.width / element.getBoundingClientRect().width,
    ),
  ).toBeLessThanOrEqual(1.51);
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(scene.locator(".topography__chapter")).toHaveText("GitHub");
  await expect
    .poll(async () => (await captureDrawing(canvas)).equals(overhead))
    .toBe(false);
  const light = await captureDrawing(canvas);
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect
    .poll(async () => (await captureDrawing(canvas)).equals(light))
    .toBe(false);
  await expect(page.locator(".location-map")).toHaveCount(1);
});

test("reduced motion is static even when chapters change", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const scene = page.locator(".topography");
  await expect(scene).toHaveAttribute("data-scene", "ready");
  const canvas = scene.locator("canvas");
  // Keep both captures at the same natural sticky position.
  await page.locator("#youtube").scrollIntoViewIfNeeded();
  await expect(scene.locator(".topography__chapter")).toHaveText("YouTube");
  await expect(scene).toHaveCSS("position", "sticky");
  await expect
    .poll(() =>
      scene.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBe(0);
  const firstBounds = await canvas.boundingBox();
  expect(firstBounds).not.toBeNull();
  const first = await captureDrawing(canvas);
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(scene.locator(".topography__chapter")).toHaveText("GitHub");
  const scrolled = await captureDrawing(canvas);
  await Promise.all(
    [first, scrolled].map((body, index) =>
      testInfo.attach(
        index === 0 ? "reduced-motion-before" : "reduced-motion-scrolled",
        {
          body,
          contentType: "image/png",
        },
      ),
    ),
  );
  expect(await canvas.boundingBox()).toEqual(firstBounds);
  expect(scrolled.equals(first)).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(async () => (await captureDrawing(canvas)).equals(first))
    .toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(async () => (await captureDrawing(canvas)).equals(first))
    .toBe(true);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 640, height: 450 },
]) {
  test(`navigation does not cover the artwork or heading at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/about/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".topography")).toHaveAttribute(
      "data-scene",
      "ready",
    );
    const overlaps = () =>
      page.evaluate(() => {
        const artwork = document.querySelectorAll(
          ".topography__canvas, .topography__title, .topography__eyebrow, .about h1",
        );
        const controls = document.querySelectorAll(
          ".navigation a, .navigation button",
        );
        return Array.from(artwork).flatMap((element) => {
          const bounds = element.getBoundingClientRect();
          return Array.from(controls)
            .filter((control) => {
              const style = getComputedStyle(control);
              const target = control.getBoundingClientRect();
              return (
                style.visibility === "visible" &&
                target.width > 0 &&
                target.height > 0 &&
                target.bottom > 0 &&
                target.top < window.innerHeight &&
                bounds.left < target.right &&
                bounds.right > target.left &&
                bounds.top < target.bottom &&
                bounds.bottom > target.top
              );
            })
            .map((control) => `${element.className}: ${control.textContent}`);
        });
      });
    expect(await overlaps()).toEqual([]);
    await page.locator(".topography").scrollIntoViewIfNeeded();
    expect(await overlaps()).toEqual([]);
  });
}

test("forced colours keep keyboard navigation and restore the live artwork", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const scene = page.locator(".topography");
  await expect(scene).toHaveAttribute("data-scene", "static");
  await expect(scene.locator("canvas")).toBeHidden();
  await expect(scene.locator("svg")).toBeVisible();
  const drawing = await scene.locator("svg").screenshot({
    style: ".topography__title { opacity: 0 !important; }",
  });
  const statistics = await sharp(drawing).stats();
  expect(
    Math.max(...statistics.channels.map((channel) => channel.stdev)),
  ).toBeGreaterThan(10);
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeInViewport();
  await scene.scrollIntoViewIfNeeded();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(scene).toHaveAttribute("data-scene", "ready");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(scene).toHaveAttribute("data-scene", "static");
  await expect(scene.locator("svg")).toBeVisible();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(scene).toHaveAttribute("data-scene", "ready");
});

test("context loss explicitly falls back without hiding the profile", async ({
  page,
}) => {
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const scene = page.locator(".topography");
  await expect(scene).toHaveAttribute("data-scene", "ready");
  await scene.locator("canvas").evaluate((element: HTMLCanvasElement) => {
    const extension = element
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) {
      throw new Error(
        "The browser must support the context-loss regression test.",
      );
    }
    extension.loseContext();
  });
  await expect(scene).toHaveAttribute("data-scene", "unavailable");
  await expect(scene.locator("svg")).toBeVisible();
  await expect(scene).toContainText("The 3D artwork is unavailable");
  await expect(
    page.getByRole("heading", { name: "Hello, I'm Rehan." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Blog", exact: true }).first().click();
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(scene).toHaveAttribute("data-scene", "ready");
});

test("a missing WebGL implementation keeps the static drawing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original: unknown = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "getContext",
    )?.value;
    if (typeof original !== "function") {
      throw new Error("Canvas getContext is unavailable.");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ): unknown {
        if (type.startsWith("webgl")) {
          return null;
        }
        const result: unknown = Reflect.apply(original, this, [type, ...args]);
        return result;
      },
    });
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".topography")).toHaveAttribute(
    "data-scene",
    "unavailable",
  );
  await expect(page.locator(".topography__fallback")).toBeVisible();
  await expect(page.locator(".location-map")).toHaveCount(1);
});

test("the sculpture does not clip the profile at a 200% equivalent viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 450 });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".topography")).toHaveCSS("position", "relative");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640);
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeInViewport();
});

test("the artwork remains an optional drawing without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/about/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".topography")).toHaveAttribute(
      "data-scene",
      "static",
    );
    await expect(page.locator(".topography__fallback")).toBeVisible();
    await expect(page.locator(".topography")).toContainText(
      "Abstract artwork, not geography or achievement data.",
    );
    await expect(page.locator(".location-map__illustration")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Hello, I'm Rehan." }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("native keyboard focus remains visible below the sticky sculpture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .focus();
  for (let step = 0; step < 15; step++) {
    await page.keyboard.press("Tab");
    const visibleFocus = await page.evaluate(() => {
      const focused = document.activeElement;
      const sculpture = document.querySelector(".topography");
      if (!(focused instanceof HTMLElement) || !sculpture) {
        return false;
      }
      const bounds = focused.getBoundingClientRect();
      const artwork = sculpture.getBoundingClientRect();
      const visibleTop = Math.max(bounds.top, artwork.bottom, 0);
      return (
        focused.matches(":focus-visible") &&
        Math.min(bounds.bottom, window.innerHeight) > visibleTop
      );
    });
    expect(visibleFocus).toBe(true);
  }
});

test("the renderer stops drawing when static or outside the viewport", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const drawArrays: unknown = Object.getOwnPropertyDescriptor(
      WebGL2RenderingContext.prototype,
      "drawArrays",
    )?.value;
    if (typeof drawArrays !== "function") {
      throw new Error("WebGL drawArrays is unavailable.");
    }
    Reflect.set(window, "topographyDraws", 0);
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (
        this.canvas instanceof HTMLCanvasElement &&
        this.canvas.classList.contains("topography__canvas")
      ) {
        const count: unknown = Reflect.get(window, "topographyDraws");
        Reflect.set(window, "topographyDraws", Number(count) + 1);
      }
      Reflect.apply(drawArrays, this, args);
    };
  });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".topography")).toHaveAttribute(
    "data-scene",
    "ready",
  );
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, "topographyDraws"))),
    )
    .toBeGreaterThan(0);
  const counts = () =>
    page.evaluate(async () => {
      const before = Number(Reflect.get(window, "topographyDraws"));
      for (let frame = 0; frame < 8; frame++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => {
            resolve();
          }),
        );
      }
      return [before, Number(Reflect.get(window, "topographyDraws"))];
    });
  const staticCounts = await counts();
  expect(staticCounts[1]).toBe(staticCounts[0]);
  await page.locator("#microsoft-mvp").scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const offscreenCounts = await counts();
  expect(offscreenCounts[1]).toBe(offscreenCounts[0]);
  await page.locator(".topography").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page.evaluate(() => Number(Reflect.get(window, "topographyDraws"))),
    )
    .toBeGreaterThan(offscreenCounts[1]!);
});
