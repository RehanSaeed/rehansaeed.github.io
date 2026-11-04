import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      status: 503,
      body: "Map unavailable during portrait tests",
    }),
  );
});

test("Portrait pixels render and become chapter compositions without intercepting links", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/about/");
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".particle-portrait")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await expect(page.locator(".about")).toHaveClass(/about--particles/);
  await expect(page.locator("[data-particle-chapter]")).toHaveCount(7);
  await expect(page.locator(".particle-portrait canvas")).toHaveJSProperty(
    "width",
    1440,
  );
  await page
    .getByRole("link", { name: "Explore the work", exact: true })
    .click();
  await expect(page).toHaveURL(/#youtube$/);
  await expect(
    page.locator('[data-particle-chapter="broadcast"]'),
  ).toBeVisible();
  const accent = await page
    .locator(".particle-portrait canvas")
    .evaluate((canvas) => getComputedStyle(canvas).color);
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(page.locator(".particle-portrait canvas")).not.toHaveCSS(
    "color",
    accent,
  );
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".about")).not.toHaveClass(/about--particles/);
  await page.emulateMedia({ forcedColors: "none" });
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  expect(errors).toEqual([]);
});

test("Reduced motion has no continuous rendering and survives preference changes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame.bind(window);
    const counts = { value: 0 };
    Reflect.set(window, "__portraitFrameCount", counts);
    window.requestAnimationFrame = (callback) =>
      original((time) => {
        counts.value++;
        callback(time);
      });
  });
  await page.goto("/about/");
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  // Two consecutive stationary sampling intervals must not contain a render loop.
  await expect
    .poll(async () => {
      const counts: number[] = [];
      for (let sample = 0; sample < 3; sample++) {
        counts.push(
          await page.evaluate(() => {
            const counter: unknown = Reflect.get(
              window,
              "__portraitFrameCount",
            );
            return typeof counter === "object" && counter !== null
              ? Number(Reflect.get(counter, "value"))
              : -1;
          }),
        );
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 120)),
        );
      }
      return counts.every((count) => count >= 0 && count === counts[0]);
    })
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".about")).toHaveClass(/about--particles/);
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".about")).not.toHaveClass(/about--motion/);
  await expect(page.locator(".about")).toHaveClass(/about--particles/);
});

test("Context loss restores the original portrait and all editorial content", async ({
  page,
}) => {
  await page.goto("/about/");
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "ready",
  );
  await page.locator(".particle-portrait canvas").evaluate((canvas) => {
    const context = (canvas as HTMLCanvasElement).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_lose_context");
    if (!extension) {
      throw new Error("The browser must support the context-loss regression");
    }
    extension.loseContext();
  });
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".about")).not.toHaveClass(/about--particles/);
  await expect(page.locator(".about__portrait img")).toBeVisible();
  await expect(page.locator(".about__portrait img")).toHaveCSS(
    "width",
    "280px",
  );
  await expect(
    page.getByRole("heading", { name: "London", exact: true }),
  ).toBeVisible();
});

test("Unavailable WebGL leaves the original portrait and native chapter content", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/about/");
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".about")).not.toHaveClass(/about--particles/);
  await expect(page.locator(".about__portrait img")).toBeVisible();
  await expect(page.locator(".about__particle-window").first()).toBeHidden();
  await expect(page.locator(".about > section[id]")).toHaveCount(6);
  await expect(page.locator(".location-map")).toBeVisible();
});

test("Forced colors and 200 percent equivalent viewport retain readable native content", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 640, height: 450 });
  await page.goto("/about/");
  await expect(page.locator(".particle-portrait")).toHaveAttribute(
    "data-state",
    "fallback",
  );
  await expect(page.locator(".particle-portrait")).toBeHidden();
  await expect(page.locator(".about__portrait img")).toBeVisible();
  const link = page.getByRole("link", {
    name: "Explore the work",
    exact: true,
  });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#youtube$/);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(640);
});
