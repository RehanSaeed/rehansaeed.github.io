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
      test(`${title} closes and reopens with keyboard focus restored`, async ({
        page,
      }) => {
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
        await page.keyboard.press("Escape");
        await expect(closedDialog).toBeHidden();
        await expect(opener).toBeFocused();
      });
    }
  });
}

test.describe("Dialog transitions", () => {
  test.use({ reducedMotion: "no-preference" });

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
          translate: getComputedStyle(element).translate,
          scale: getComputedStyle(element).scale,
          open: element.open,
        };
      };

      document.querySelector<HTMLButtonElement>(".search-button")!.click();
      const { animations: entranceAnimations, ...entrance } = await sample();
      for (const animation of entranceAnimations) animation.finish();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      element.querySelector<HTMLButtonElement>(".dialog__close")!.click();
      const { animations: exitAnimations, ...exit } = await sample();
      for (const animation of exitAnimations) animation.finish();
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
      expect(frame.translate).not.toBe("0px");
      expect(Number(frame.scale)).toBeGreaterThan(0.98);
      expect(Number(frame.scale)).toBeLessThan(1);
    }
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
