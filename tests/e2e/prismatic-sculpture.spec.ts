import { expect, test } from "./fixtures";
import sharp from "sharp";
import type { Page } from "@playwright/test";

const exerciseWebGLOrFallback = async (
  page: Page,
  exercise: () => Promise<void>,
) => {
  const supported = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return context !== null;
  });
  if (supported) {
    await exercise();
  } else {
    await expect(page.locator(".prism__fallback")).toBeVisible();
    await expect(page.locator(".prism__canvas")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Hello, I'm Rehan." }),
    ).toBeVisible();
    await expect(page.locator(".about > section[id]")).toHaveCount(6);
  }
};

const purplePixelCount = async (image: Buffer) => {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let index = 0; index < data.length; index += info.channels) {
    const green = data[index + 1]!;
    if (data[index]! > green * 1.1 && data[index + 2]! > green * 1.1) {
      count++;
    }
  }
  return count;
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Offline map style" }),
  );
});

test("WebGL sculpture follows chapters and palette, or retains artwork when unsupported", async ({
  page,
}) => {
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  await page.goto("/about/");
  await exerciseWebGLOrFallback(page, async () => {
    const gallery = page.locator(".prism");
    const canvas = gallery.locator("canvas");
    await expect(gallery).toHaveClass(/prism--ready/);
    await expect(canvas).toBeVisible();
    await expect(gallery).toHaveAttribute("aria-hidden", "true");
    await expect(gallery).toHaveCSS("pointer-events", "none");
    await expect(canvas).not.toHaveAttribute("style");
    const first = await canvas.screenshot();
    expect(await purplePixelCount(first)).toBeGreaterThan(500);
    await page.locator("#github").scrollIntoViewIfNeeded();
    await expect(gallery.locator(".prism__chapter")).toHaveText("Open source");
    await expect(canvas).toBeInViewport();
    expect((await canvas.screenshot()).equals(first)).toBe(false);
    const light = await canvas.screenshot();
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("#github").scrollIntoViewIfNeeded();
    await expect(gallery.locator(".prism__chapter")).toHaveText("Open source");
    await expect
      .poll(async () => (await canvas.screenshot()).equals(light))
      .toBe(false);
    await expect(page.locator(".location-map")).toHaveCount(1);
  });
});

test("Reduced motion keeps a static sculpture while scrolling chapters", async ({
  page,
}) => {
  await page.goto("/about/");
  await exerciseWebGLOrFallback(page, async () => {
    const gallery = page.locator(".prism");
    await expect(gallery).toHaveClass(/prism--ready/);
    const canvas = gallery.locator("canvas");
    const first = await canvas.screenshot();
    await page.locator("#github").scrollIntoViewIfNeeded();
    await expect(gallery.locator(".prism__chapter")).toHaveText("The person");
    expect((await canvas.screenshot()).equals(first)).toBe(true);
  });
});

test("Context loss restores the static artwork without hiding the biography", async ({
  page,
}) => {
  await page.goto("/about/");
  await exerciseWebGLOrFallback(page, async () => {
    const gallery = page.locator(".prism");
    await expect(gallery).toHaveClass(/prism--ready/);
    await gallery.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("webgl2");
      if (!context) {
        throw new Error("The sculpture must have a real WebGL context");
      }
      const extension = context.getExtension("WEBGL_lose_context");
      if (!extension) {
        throw new Error("Context loss extension is unavailable");
      }
      extension.loseContext();
    });
    await expect(gallery).not.toHaveClass(/prism--ready/);
    await expect(gallery.locator(".prism__fallback")).toBeVisible();
    await expect(gallery.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Hello, I'm Rehan." }),
    ).toBeVisible();
    await expect(page.locator("#microsoft-mvp")).toContainText(
      "Before I joined Microsoft",
    );
  });
});

test("High contrast uses the static sculpture without starting WebGL", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/about/");
  await expect(page.locator(".prism__fallback")).toBeVisible();
  await expect(page.locator(".prism__canvas")).toHaveCount(0);
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
});

test("A browser without WebGL retains the sculpture and all content", async ({
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
        contextId: string,
        ...args: unknown[]
      ): unknown {
        if (contextId === "webgl" || contextId === "webgl2") {
          return null;
        }
        return Reflect.apply(
          descriptor.value as (...args: unknown[]) => unknown,
          this,
          [contextId, ...args],
        );
      },
    });
  });
  await page.goto("/about/");
  await expect(page.locator(".prism__fallback")).toBeVisible();
  await expect(page.locator(".prism__canvas")).toHaveCount(0);
  await expect(page.locator(".about > section[id]")).toHaveCount(6);
  await expect(page.locator(".about__credential-year")).toHaveCount(7);
});

test("The sculpture rail and reading column do not overlap", async ({
  page,
}) => {
  await page.goto("/about/");
  const gallery = await page.locator(".prism").boundingBox();
  const hero = await page.locator(".about__hero").boundingBox();
  expect(gallery).not.toBeNull();
  expect(hero).not.toBeNull();
  expect(gallery!.x + gallery!.width).toBeLessThanOrEqual(hero!.x + 1);
  await page.setViewportSize({ width: 640, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640);
  await expect(page.locator(".prism")).toHaveCSS("position", "relative");
});
