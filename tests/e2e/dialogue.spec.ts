import type { E2EFixtures } from "./fixtures";
import { expect, test } from "./fixtures";

const dialogs = [
  { title: "Search", trigger: "Open search" },
  { title: "Share", trigger: "Share" },
  { title: "Buy me a Coffee", trigger: "Buy me a Coffee" },
];

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`Dialogs with ${reducedMotion} motion`, () => {
    test.use({ reducedMotion });

    for (const { title, trigger } of dialogs) {
      async function verifyDialogFocusRestoration({
        page,
      }: Pick<E2EFixtures, "page">) {
        // Exercise the share dialog rather than the platform's native share UI.
        await page.addInitScript(() => {
          Object.defineProperty(navigator, "share", { value: undefined });
        });
        await page.goto("/");
        if (title !== "Search") {
          await page.locator(".post-card__title").first().click();
        }
        const opener = page
          .getByRole("button", { name: trigger, exact: true })
          .first();
        const dialog = page.getByRole("dialog", { name: title, exact: true });
        const closedDialog = page.getByRole("dialog", {
          name: title,
          exact: true,
          includeHidden: true,
        });

        await opener.click();
        await expect(dialog).toBeVisible();
        await page
          .getByRole("button", { name: `Close ${title}`, exact: true })
          .click();
        await expect(closedDialog).toBeHidden();
        await expect(opener).toBeFocused();

        await opener.click();
        await expect(dialog).toBeVisible();
        // Check absence after the tooltip's opening delay, not just immediately.
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(350);
        await expect(page.getByRole("tooltip")).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(closedDialog).toBeHidden();
        await expect(opener).toBeFocused();

        await opener.press("Enter");
        await expect(dialog).toBeVisible();
        // Keyboard reopening must not schedule a delayed tooltip either.
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(350);
        await expect(page.getByRole("tooltip")).toHaveCount(0);
        const close = dialog.getByRole("button", {
          name: `Close ${title}`,
          exact: true,
        });
        await close.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        await expect(close).toBeFocused();
        const tooltip = page.getByRole("tooltip", {
          name: `Close ${title}`,
          exact: true,
        });
        await expect(tooltip).toBeVisible();
        await expect(close).toHaveAccessibleDescription(`Close ${title}`);
        await page.keyboard.press("Escape");
        await expect(tooltip).toBeHidden();
        await expect(dialog).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(closedDialog).toBeHidden();
        await expect(opener).toBeFocused();
      }

      test(`${title} closes and reopens with keyboard focus restored`, async ({
        page,
      }) => {
        await expect(
          verifyDialogFocusRestoration({
            page,
          }),
        ).resolves.toBeUndefined();
      });
    }
  });
}

test.describe("Dialog transitions", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a queued close event does not close a reopened dialog", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Open search", exact: true })
      .click();
    const dialog = page.locator(".search-dialogue");
    await expect(dialog).toBeVisible();
    await dialog.evaluate(async (element: HTMLDialogElement) => {
      const closed = new Promise<void>((resolve) => {
        element.addEventListener(
          "close",
          () => {
            resolve();
          },
          { once: true },
        );
      });
      element.close();
      element.showModal();
      await closed;
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    await expect(dialog).toHaveJSProperty("open", true);
    await expect(dialog).toBeVisible();

    await dialog.evaluate((element: HTMLDialogElement) => {
      element.close();
    });
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeFocused();
  });

  test("animates the dialog and backdrop on entrance and exit", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Open search", exact: true }),
    ).toBeEnabled();
    const dialog = page.locator(".search-dialogue");
    const frames = await dialog.evaluate(async (element: HTMLDialogElement) => {
      const sample = async () => {
        // Vue applies transition targets over two animation frames.
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const animations = element.getAnimations({ subtree: true });
        for (const animation of animations) {
          animation.pause();
          const duration = animation.effect!.getComputedTiming().duration;
          if (typeof duration === "number") {
            animation.currentTime = duration / 2;
          }
        }
        return {
          animations,
          opacity: Number(getComputedStyle(element).opacity),
          backdropOpacity: Number(
            getComputedStyle(element, "::backdrop").opacity,
          ),
          display: getComputedStyle(element).display,
          translateY: Number.parseFloat(
            getComputedStyle(element).translate.split(" ")[1]!,
          ),
          scale: getComputedStyle(element).scale,
          easing: animations
            .filter(
              (animation) =>
                animation instanceof CSSTransition &&
                animation.transitionProperty === "translate",
            )
            .map((animation) => animation.effect!.getTiming().easing),
          open: element.open,
        };
      };

      document.querySelector<HTMLButtonElement>(".search-button")!.click();
      const { animations: entranceAnimations, ...entrance } = await sample();
      for (const animation of entranceAnimations) {
        animation.finish();
      }
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      element.querySelector<HTMLButtonElement>(".dialog__close")!.click();
      const { animations: exitAnimations, ...exit } = await sample();
      for (const animation of exitAnimations) {
        animation.finish();
      }
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const closedDisplay = getComputedStyle(element).display;
      return { entrance, exit, closedDisplay, closed: !element.open };
    });

    for (const frame of [frames.entrance, frames.exit]) {
      expect(frame.opacity).toBeGreaterThan(0);
      expect(frame.opacity).toBeLessThan(1);
      expect(frame.backdropOpacity).toBeGreaterThan(0);
      expect(frame.backdropOpacity).toBeLessThan(1);
      expect(frame.display).not.toBe("none");
      expect(frame.open).toBe(true);
      expect(frame.translateY).toBeGreaterThan(5);
      expect(frame.translateY).toBeLessThan(96);
      expect(frame.scale).toBe("none");
    }
    expect(frames.entrance.easing).toEqual([
      "cubic-bezier(0.215, 0.61, 0.355, 1)",
    ]);
    expect(frames.exit.easing).toEqual([
      "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
    ]);
    expect(frames.closedDisplay).toBe("none");
    expect(frames.closed).toBe(true);
  });

  test("skips transitions when reduced motion is requested", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Open search", exact: true })
      .click();
    const dialog = page.locator(".search-dialogue");
    const open = await dialog.evaluate((element) => ({
      opacity: getComputedStyle(element).opacity,
      translate: getComputedStyle(element).translate,
      scale: getComputedStyle(element).scale,
      animations: element.getAnimations().length,
    }));

    expect(open).toEqual({
      opacity: "1",
      translate: "none",
      scale: "none",
      animations: 0,
    });
    await page
      .getByRole("button", { name: "Close Search", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    expect(
      await dialog.evaluate((element: HTMLDialogElement) => ({
        open: element.open,
        display: getComputedStyle(element).display,
        animations: element.getAnimations().length,
      })),
    ).toEqual({ open: false, display: "none", animations: 0 });
  });
});
