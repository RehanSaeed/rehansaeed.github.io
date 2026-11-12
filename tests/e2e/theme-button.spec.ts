import type { Locator } from "@playwright/test";
import {
  delayClientScripts,
  expect,
  getAnalyticsEvents,
  test,
} from "./fixtures";

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
    const transitions = await button.evaluate(async (element) => {
      if (!(element instanceof HTMLButtonElement)) {
        throw new Error("Expected a native theme button");
      }
      // Capture the reactive DOM commit before the next animation frame.
      const changed = new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });
      });
      element.click();
      await changed;
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

for (const saved of ["light", "dark"] as const) {
  test(`Saved ${saved} preference survives OS changes, navigation and reload`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: saved });
    await page.addInitScript((theme) => {
      if (!localStorage.getItem("theme")) {
        localStorage.setItem("theme", theme);
      }
    }, saved);
    await page.goto("/");
    const button = page.getByRole("button", { name: "Toggle dark/light" });
    await expect(button).toBeEnabled();
    await page.emulateMedia({
      colorScheme: saved === "light" ? "dark" : "light",
    });
    await expect(page.locator("html")).toHaveAttribute("data-theme", saved);
    await expectTheme(button, saved);
    await expect
      .poll(async () =>
        (await getAnalyticsEvents(page)).filter(
          (event) => event.category === "app-theme",
        ),
      )
      .toEqual([
        { category: "app-theme", action: "theme-loaded", label: saved },
      ]);
    await page.locator('.navigation__item[href="/about/"]').click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", saved);
    await expect(page.locator("img.about__github-statistics")).toHaveAttribute(
      "src",
      saved === "light"
        ? /profile-green-animate\.svg$/
        : /profile-night-green\.svg$/,
    );
    await page.reload();
    await expect(button).toBeEnabled();
    await expect(page.locator("html")).toHaveAttribute("data-theme", saved);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
      saved,
    );
  });
}

test("Unavailable theme storage still supports system mode and toggling", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Toggle dark/light" });
  await expect(button).toBeEnabled();
  await expectTheme(button, "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expectTheme(button, "light");
  await button.click();
  await expectTheme(button, "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
