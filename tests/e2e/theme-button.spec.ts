import type { Locator } from "@playwright/test";
import { delayClientScripts, expect, test } from "./fixtures";

async function settle(button: Locator) {
  await button.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
}

async function expectTheme(button: Locator, theme: "light" | "dark") {
  const active = theme === "dark" ? "sun" : "moon";
  const inactive = theme === "dark" ? "moon" : "sun";
  await expect(button).not.toHaveAttribute("title");
  await expect(button.locator(`.theme-button__${active}`)).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(button.locator(`.theme-button__${active}`)).toBeVisible();
  await expect(button.locator(`.theme-button__${inactive}`)).toBeHidden();
  await expect(button.locator("svg:visible")).toHaveCount(1);
}

test("Theme colour and shapes animate in both directions without replacing SVGs", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Toggle dark/light" });
  await expect(button).toBeEnabled();
  await expectTheme(button, "light");
  const lightColour = await button.evaluate(
    (element) => getComputedStyle(element).color,
  );
  const icons = await button.locator("svg").elementHandles();
  await expect(button.locator("svg")).toHaveCount(2);
  for (const icon of await button.locator("svg").all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon.locator("path, circle, line")).not.toHaveCount(0);
  }

  for (const theme of ["dark", "light"] as const) {
    const transitions = await button.evaluate((element) => {
      if (!(element instanceof HTMLButtonElement)) {
        throw new Error("Expected a native theme button");
      }
      // Start and pause in one browser task so even short colour transitions are captured.
      element.click();
      const animations = element.getAnimations({ subtree: true });
      const properties = animations
        .filter(
          (animation): animation is CSSTransition =>
            animation instanceof CSSTransition,
        )
        .map((animation) => animation.transitionProperty);
      // Sample deterministically, rather than relying on a screenshot's timing.
      for (const animation of animations) {
        animation.pause();
        animation.currentTime =
          Number(animation.effect!.getTiming().duration) / 2;
      }
      return {
        properties,
        colour: getComputedStyle(element).color,
        opacities: Array.from(element.querySelectorAll("svg"), (icon) =>
          Number(getComputedStyle(icon).opacity),
        ),
        transforms: Array.from(
          element.querySelectorAll("svg"),
          (icon) => getComputedStyle(icon).transform,
        ),
      };
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(transitions.properties).toEqual(
      expect.arrayContaining(["color", "opacity", "transform"]),
    );
    expect(transitions.colour).not.toBe(lightColour);
    for (const opacity of transitions.opacities) {
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    }
    for (const transform of transitions.transforms) {
      expect(transform).not.toBe("none");
      expect(transform).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
    }
    await button.evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.finish();
      }
    });
    await expectTheme(button, theme);
    expect(transitions.colour).not.toBe(
      await button.evaluate((element) => getComputedStyle(element).color),
    );
    for (const icon of icons) {
      expect(await icon.evaluate((element) => element.isConnected)).toBe(true);
    }
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      theme,
    );
  }
});

test("Rapid toggles settle on the last choice and retain keyboard focus", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Toggle dark/light" });
  await expect(button).toBeEnabled();
  await button.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  await settle(button);
  await expectTheme(button, "dark");
  await expect(button).toBeFocused();
  await page.reload();
  await expectTheme(button, "dark");
});

test("Reduced motion switches instantly and system changes keep the toggle in sync", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Toggle dark/light" });
  await expect(button).toBeEnabled();
  await expectTheme(button, "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expectTheme(button, "dark");
  await button.click();
  await expectTheme(button, "light");
  expect(
    await button.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("A saved dark theme displays the sun before hydration", async ({
  page,
}) => {
  await page.emulateMedia({
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
  });
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/", { waitUntil: "commit" });
    const button = page.getByRole("button", { name: "Toggle dark/light" });
    await expect(button).toBeDisabled();
    await expect(button.locator(".theme-button__sun")).toBeVisible();
    await expect(button.locator(".theme-button__moon")).toBeHidden();
    const initialColour = await button.evaluate(
      (element) => getComputedStyle(element).color,
    );
    await expect(button).toHaveCSS("transform", "none");
    scripts.resume();
    await expect(button).toBeEnabled();
    await expectTheme(button, "dark");
    await expect(button).toHaveCSS("color", initialColour);
    expect(
      await button.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
  } finally {
    await scripts.dispose();
  }
});
