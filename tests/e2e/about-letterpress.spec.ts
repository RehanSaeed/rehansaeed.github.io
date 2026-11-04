import { expect, test } from "./fixtures";

test("Dimensional chapter typography assembles while semantic content stays authoritative", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const installation = page.locator(".letterpress");
  await expect(installation).toHaveClass(/letterpress--ready/);
  await expect(installation).toHaveAttribute("aria-hidden", "true");
  await expect(
    page.getByRole("article").getByRole("heading", { level: 1 }),
  ).toHaveText("Hello, I'm Rehan.");
  const navigation = await page
    .getByRole("navigation")
    .getByRole("link", { name: "Blog", exact: true })
    .boundingBox();
  const registration = await installation
    .getByText("About / Muhammad Rehan Saeed", { exact: true })
    .boundingBox();
  expect(navigation).not.toBeNull();
  expect(registration).not.toBeNull();
  expect(registration!.x).toBeGreaterThanOrEqual(
    navigation!.x + navigation!.width,
  );
  const themeToggle = await page
    .getByRole("button", { name: "Toggle dark/light" })
    .boundingBox();
  const typeLabel = await installation
    .getByText("Type in motion", { exact: true })
    .boundingBox();
  expect(themeToggle).not.toBeNull();
  expect(typeLabel).not.toBeNull();
  expect(typeLabel!.x + typeLabel!.width).toBeLessThanOrEqual(themeToggle!.x);
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(installation).toContainText("04 / Open source");
  await expect(
    page.getByRole("heading", { name: "GitHub", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".location-map")).toHaveCount(1);
  await page.locator("#awards").scrollIntoViewIfNeeded();
  await expect(installation).toContainText("05 / Community");
});

test("Reduced motion renders a static relief and theme changes redraw it", async ({
  page,
}) => {
  const colorWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("THREE.Color")) {
      colorWarnings.push(message.text());
    }
  });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/about/");
  const installation = page.locator(".letterpress");
  await expect(installation).toHaveClass(/letterpress--ready/);
  const canvas = installation.locator("canvas");
  const initial = await canvas.screenshot();
  expect(await canvas.screenshot()).toEqual(initial);
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(initial))
    .toBe(false);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(canvas).toBeHidden();
  await expect(installation.locator(".letterpress__fallback")).toBeVisible();
  await expect(
    page.getByRole("article").getByRole("heading", { level: 1 }),
  ).toBeVisible();
  expect(colorWarnings).toEqual([]);
});

test("Unavailable WebGL leaves the static heading installation and all content usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext: unknown = Reflect.get(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (typeof getContext !== "function") {
      throw new Error("The browser must expose the canvas context method.");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, ...args: unknown[]) {
        if (String(args[0]).startsWith("webgl")) {
          return null;
        }
        const result: unknown = Reflect.apply(getContext, this, args);
        return result;
      },
    });
  });
  await page.goto("/about/");
  await expect(page.locator(".letterpress__fallback")).toBeVisible();
  await expect(page.locator(".letterpress")).not.toHaveClass(
    /letterpress--ready/,
  );
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

test("Context loss exposes a readable fallback and recovery restores the relief", async ({
  page,
}) => {
  await page.goto("/about/");
  const installation = page.locator(".letterpress");
  await expect(installation).toHaveClass(/letterpress--ready/);
  await installation.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const extension = canvas
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) {
      throw new Error(
        "The browser must support the context-loss regression test.",
      );
    }
    Reflect.set(canvas, "restoreLetterpressContext", () => {
      extension.restoreContext();
    });
    extension.loseContext();
  });
  await expect(installation).not.toHaveClass(/letterpress--ready/);
  await expect(installation.locator(".letterpress__fallback")).toBeVisible();
  await installation.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const restore: unknown = Reflect.get(canvas, "restoreLetterpressContext");
    if (typeof restore !== "function") {
      throw new Error("The lost context must have a restoration callback.");
    }
    Reflect.apply(restore, undefined, []);
  });
  await expect(installation).toHaveClass(/letterpress--ready/);
});

test("The letterpress does not introduce horizontal overflow in compact viewports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto("/about/");
  await expect(page.locator(".letterpress")).toHaveClass(/letterpress--ready/);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(720);
  await expect(page.locator(".letterpress")).toHaveCSS("position", "relative");
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "YouTube", level: 2 }),
  ).toBeInViewport();
});
