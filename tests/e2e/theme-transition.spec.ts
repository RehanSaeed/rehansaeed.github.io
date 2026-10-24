import { expect, test } from "./fixtures";

test.use({ reducedMotion: "no-preference" });

for (const initialTheme of ["light", "dark"] as const) {
  test(`Chevron backgrounds stay in sync when switching from ${initialTheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: initialTheme });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle dark/light" });
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute(
      "title",
      initialTheme === "light" ? "Enable dark theme" : "Enable light theme",
    );

    const samples = await toggle.evaluate((button) => {
      const arrows = Array.from(document.querySelectorAll(".arrows__arrow"));
      const initialBackground = getComputedStyle(document.body).backgroundColor;
      button.click();
      const transitions = document
        .getAnimations()
        .filter(
          (animation): animation is CSSTransition =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === "background-color",
        );
      const bodyTransition = transitions.find(
        (transition) =>
          transition.effect instanceof KeyframeEffect &&
          transition.effect.target === document.body,
      );
      const duration = bodyTransition?.effect?.getTiming().duration;
      if (typeof duration !== "number") {
        throw new Error(
          "Expected a numeric page background transition duration",
        );
      }
      for (const transition of transitions) transition.pause();

      const frames = [0.25, 0.5, 0.75].map((progress) => {
        for (const transition of transitions) {
          transition.currentTime = duration * progress;
        }
        return {
          body: getComputedStyle(document.body).backgroundColor,
          arrows: arrows.map((arrow) => ({
            isTopEdge: arrow.classList.contains("arrows__arrow-1"),
            background: getComputedStyle(arrow).backgroundColor,
            edge: getComputedStyle(arrow, "::after").backgroundColor,
          })),
        };
      });
      for (const transition of transitions) transition.finish();
      return {
        initialBackground,
        finalBackground: getComputedStyle(document.body).backgroundColor,
        frames,
      };
    });

    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      initialTheme === "light" ? "dark" : "light",
    );
    for (const frame of samples.frames) {
      expect(frame.body).not.toBe(samples.initialBackground);
      expect(frame.body).not.toBe(samples.finalBackground);
      expect(frame.arrows.length).toBeGreaterThan(0);
      for (const arrow of frame.arrows) {
        expect(arrow.edge).toBe(
          arrow.isTopEdge ? frame.body : arrow.background,
        );
      }
    }
  });
}
