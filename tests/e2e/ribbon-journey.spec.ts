import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const openRibbon = async (page: Page) => {
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const root = document.querySelector("#__nuxt");
    return root && Boolean(Reflect.get(root, "__vue_app__"));
  });
};

const isolatedScene = {
  style: ".about > :not(.ribbon-journey) { visibility: hidden; }",
};

test("The ribbon renders real WebGL and changes chapter with the story", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRibbon(page);
  const scene = page.locator(".ribbon-journey");
  await expect(scene).toHaveAttribute("data-state", "ready");
  await expect(scene).toHaveAttribute("aria-hidden", "true");
  await expect(scene).toHaveCSS("pointer-events", "none");
  const canvas = scene.locator("canvas");
  const dimensions = await canvas.evaluate((element: HTMLCanvasElement) => ({
    width: element.width,
    height: element.height,
    displayWidth: element.clientWidth,
    displayHeight: element.clientHeight,
    webgl: element.getContext("webgl2") !== null,
    dpr: Math.min(window.devicePixelRatio, 1.5),
  }));
  expect(dimensions.webgl).toBe(true);
  expect(dimensions.width).toBeCloseTo(
    dimensions.displayWidth * dimensions.dpr,
    0,
  );
  expect(dimensions.height).toBeCloseTo(
    dimensions.displayHeight * dimensions.dpr,
    0,
  );
  const first = await canvas.screenshot(isolatedScene);
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-chapter", "github");
  await expect
    .poll(async () => first.equals(await canvas.screenshot(isolatedScene)))
    .toBe(false);
  await page.locator("#awards").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-chapter", "awards");
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(scene).toHaveAttribute("data-state", "ready");
});

test("Reduced motion keeps a static sculpture even while scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openRibbon(page);
  const scene = page.locator(".ribbon-journey");
  await expect(scene).toHaveAttribute("data-state", "ready");
  const canvas = scene.locator("canvas");
  const first = await canvas.screenshot(isolatedScene);
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-chapter", "github");
  expect(first.equals(await canvas.screenshot(isolatedScene))).toBe(true);
});

test("Context loss shows the static ribbon without affecting the article", async ({
  page,
}) => {
  await openRibbon(page);
  const scene = page.locator(".ribbon-journey");
  await expect(scene).toHaveAttribute("data-state", "ready");
  await scene.locator("canvas").evaluate((element: HTMLCanvasElement) => {
    const extension = element
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) {
      throw new Error("Context-loss extension is unavailable");
    }
    extension.loseContext();
  });
  await expect(scene).toHaveAttribute("data-state", "unavailable");
  await expect(scene.locator("svg")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hello, I'm Rehan.",
  );
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
});

test("Forced colors hides decoration and retains the map and story", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 720, height: 500 });
  await openRibbon(page);
  await expect(page.locator(".ribbon-journey")).toBeHidden();
  for (const id of [
    "location",
    "youtube",
    "github",
    "awards",
    "stackoverflow",
    "microsoft-mvp",
  ]) {
    await expect(page.locator(`#${id} h2`)).toBeVisible();
  }
  await expect(page.locator(".location-map")).toHaveCount(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(720);
});

test("Missing WebGL preserves the server-rendered ribbon and content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (!original || typeof original.value !== "function") {
      throw new Error("Canvas getContext is unavailable.");
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
              original.value as (...args: unknown[]) => unknown,
              this,
              [type, ...args],
            );
      },
    });
  });
  await openRibbon(page);
  const scene = page.locator(".ribbon-journey");
  await expect(scene).toHaveAttribute("data-state", "unavailable");
  await expect(scene.locator("svg")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeVisible();
});
