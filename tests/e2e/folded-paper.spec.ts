import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Offline map for paper tests" }),
  );
});

test("A decorative continuous sheet responds to chapters", async ({ page }) => {
  await page.emulateMedia({
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const paper = page.locator(".folded-paper");
  const canvas = paper.locator("canvas");
  await expect(paper).toHaveAttribute("data-state", "webgl");
  await expect(paper).toHaveAttribute("aria-hidden", "true");
  await expect(paper).toHaveCSS("pointer-events", "none");
  await expect(canvas).not.toHaveAttribute("tabindex");
  const before = await canvas.screenshot();
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(paper).toHaveAttribute("data-chapter", "3");
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false);
});

test("Reduced motion retains one static sculpture as chapters change", async ({
  page,
}) => {
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const paper = page.locator(".folded-paper");
  const canvas = paper.locator("canvas");
  await expect(paper).toHaveAttribute("data-state", "webgl");
  const before = await canvas.screenshot();
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(paper).toHaveAttribute("data-chapter", "3");
  expect((await canvas.screenshot()).equals(before)).toBe(true);
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false);
});

test("Context loss retains the CSS paper and semantic content", async ({
  page,
}) => {
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const paper = page.locator(".folded-paper");
  await expect(paper).toHaveAttribute("data-state", "webgl");
  await paper.locator("canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(paper).toHaveAttribute("data-state", "fallback");
  await expect(paper.locator("canvas")).toHaveCount(0);
  await expect(paper.locator(".folded-paper__fallback")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hello, I'm Rehan." }),
  ).toBeVisible();
  await expect(page.locator(".location-map")).toHaveCount(1);
});

test("Forced colours suppress WebGL and keep the article readable at zoom-equivalent width", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".folded-paper")).toBeHidden();
  await expect(page.locator(".folded-paper canvas")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Hello, I'm Rehan." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(720);
});

test("Unavailable WebGL falls back without hiding biography or links", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext: unknown = Reflect.get(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (typeof getContext !== "function") {
      throw new TypeError("Canvas context creation is unavailable");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type.startsWith("webgl")) {
          return null;
        }
        const context: unknown = Reflect.apply(getContext, this, [
          type,
          ...args,
        ]);
        return context;
      },
    });
  });
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".folded-paper")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".folded-paper__fallback")).toBeVisible();
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .click();
  await expect(page).toHaveURL(/#youtube$/);
});
