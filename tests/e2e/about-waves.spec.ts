import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Map unavailable during wave tests" }),
  );
});

test("Wave sculpture renders and follows the About chapters without intercepting input", async ({
  page,
}) => {
  const consoleMessages: string[] = [];
  page.on("console", (message) => consoleMessages.push(message.text()));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const stage = page.locator(".wave-sculpture");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveClass(/wave-sculpture--ready/);
  await expect(stage).toHaveAttribute("aria-hidden", "true");
  await expect(stage).toHaveCSS("pointer-events", "none");
  const canvas = stage.locator("canvas");
  expect(
    await canvas.evaluate(
      (element: HTMLCanvasElement) => element.width > 0 && element.height > 0,
    ),
  ).toBe(true);
  const pause = page.locator(".about__hero").getByRole("button", {
    name: "Pause artwork",
    exact: true,
  });
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-wave-state", "paused");
  await page
    .getByRole("button", { name: "Resume artwork", exact: true })
    .click();
  await expect(stage).toHaveAttribute("data-wave-state", "running");
  await page.locator("#github").scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-wave-chapter", "3");
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(stage).toHaveClass(/wave-sculpture--ready/);
  await expect(
    page.getByRole("heading", { name: "GitHub", exact: true }),
  ).toBeVisible();
  expect(
    consoleMessages.filter((message) => message.includes("THREE.Color")),
  ).toEqual([]);
});

test("Reduced motion and forced colours retain a static, semantic About page", async ({
  page,
}) => {
  await page.goto("/about/");
  const stage = page.locator(".wave-sculpture");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute("data-wave-state", "reduced-motion");
  await expect(stage).toHaveClass(/wave-sculpture--ready/);
  const layout = () =>
    page.locator(".about__hero, .about__section").evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        return { top: bounds.top + window.scrollY, height: bounds.height };
      }),
    );
  const originalLayout = await layout();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(stage).toHaveAttribute("data-wave-state", "running");
  expect(await layout()).toEqual(originalLayout);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-wave-state", "reduced-motion");
  expect(await layout()).toEqual(originalLayout);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(stage).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "London", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
  await expect(
    page.getByRole("heading", { name: "YouTube", exact: true }),
  ).toBeInViewport();
});

test("Preferences recover without native media change events", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const media = matchMedia(query);
      media.addEventListener = [
        "(prefers-reduced-motion: reduce)",
        "(forced-colors: active)",
      ].includes(query)
        ? () => {
            // Reproduce updated CSS and matches without a native change event.
          }
        : media.addEventListener.bind(media);
      return media;
    };
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about/");
  const stage = page.locator(".wave-sculpture");
  await expect(stage).toHaveAttribute("data-wave-state", "running");
  await expect(stage).toHaveClass(/wave-sculpture--ready/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-wave-state", "reduced-motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(stage).toHaveAttribute("data-wave-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-wave-state", "reduced-motion");
  await page.emulateMedia({ forcedColors: "active" });
  await expect(stage).toHaveAttribute("data-wave-state", "static");
  await expect(stage).toBeHidden();
  await page.emulateMedia({ forcedColors: "none" });
  await expect(stage).toHaveAttribute("data-wave-state", "reduced-motion");
  await expect(stage).toBeVisible();
});

test("WebGL failure preserves static artwork and the original profile", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/about/");
  const stage = page.locator(".wave-sculpture");
  await expect(stage).toHaveAttribute("data-wave-state", "unavailable");
  await expect(stage.locator(".wave-sculpture__fallback")).toBeVisible();
  await expect(
    page.locator(".about").getByRole("heading", { level: 1 }),
  ).toHaveText("Hello, I'm Rehan.");
  await expect(page.locator(".location-map")).toHaveCount(1);
  await expect(page.locator(".about__credential-year")).toHaveCount(7);
});

test("Context loss returns to static artwork without hiding content", async ({
  page,
}) => {
  await page.goto("/about/");
  const stage = page.locator(".wave-sculpture");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveClass(/wave-sculpture--ready/);
  const hasContextLoss = await stage
    .locator("canvas")
    .evaluate((element: HTMLCanvasElement) => {
      const context = element.getContext("webgl2");
      const extension = context?.getExtension("WEBGL_lose_context");
      extension?.loseContext();
      return Boolean(extension);
    });
  expect(hasContextLoss, "Context-loss test requires WEBGL_lose_context").toBe(
    true,
  );
  await expect(stage).toHaveAttribute("data-wave-state", "unavailable");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(stage).toHaveAttribute("data-wave-state", "unavailable");
  await expect(stage.locator(".wave-sculpture__fallback")).toBeVisible();
  await expect(
    page.locator(".about").getByRole("heading", { level: 1 }),
  ).toBeVisible();
});
