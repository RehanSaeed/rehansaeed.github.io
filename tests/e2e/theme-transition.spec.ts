import type { E2EFixtures } from "./fixtures";
import { delayClientScripts, expect, test } from "./fixtures";

test.use({ reducedMotion: "no-preference" });

for (const theme of ["light", "dark"] as const) {
  for (const saved of [false, true]) {
    async function verifyInitialThemeTiming({
      page,
    }: Pick<E2EFixtures, "page">) {
      const hydrationWarnings: string[] = [];
      page.on("console", (message) => {
        if (
          ["error", "warning"].includes(message.type()) &&
          /hydration/i.test(message.text())
        ) {
          hydrationWarnings.push(message.text());
        }
      });
      await page.emulateMedia({
        colorScheme: saved ? (theme === "dark" ? "light" : "dark") : theme,
      });
      if (saved) {
        await page.addInitScript((theme) => {
          localStorage.setItem("theme", theme);
        }, theme);
      }
      await page.route(
        (url) => url.pathname === "/",
        async (route) => {
          const response = await route.fetch();
          // Sample during parsing, before a body script or hydration can repair the theme.
          const body = (await response.text()).replace(
            "</head>",
            `<script>document.documentElement.setAttribute("data-initial-theme", document.documentElement.getAttribute("data-theme") || "missing");</script></head>`,
          );
          await route.fulfill({ response, body });
        },
      );
      const scripts = await delayClientScripts(page);
      try {
        for (const refresh of [false, true]) {
          if (refresh) {
            await page.reload({ waitUntil: "commit" });
          } else {
            await page.goto("/", { waitUntil: "commit" });
          }
          const html = page.locator("html");
          await expect(html).toHaveAttribute("data-initial-theme", theme);
          await expect(html).toHaveAttribute("data-theme", theme);
          await expect(
            page.getByRole("button", { name: "Toggle dark/light" }),
          ).toBeDisabled();
          const initial = await page.locator("body").evaluate((body) => {
            const script = Array.from(
              document.head.querySelectorAll("script"),
            ).find((script) =>
              script.textContent.includes("__NUXT_COLOR_MODE__"),
            );
            const styles = Array.from(
              document.head.querySelectorAll('style, link[rel="stylesheet"]'),
            );
            const charset = document.head.querySelector("meta[charset]");
            return {
              charsetBeforeTheme:
                !!script &&
                !!charset &&
                !!(
                  charset.compareDocumentPosition(script) &
                  Node.DOCUMENT_POSITION_FOLLOWING
                ),
              themeBeforeStyles:
                !!script &&
                styles.length > 0 &&
                styles.every(
                  (style) =>
                    !!(
                      script.compareDocumentPosition(style) &
                      Node.DOCUMENT_POSITION_FOLLOWING
                    ),
                ),
              background: getComputedStyle(body).backgroundColor,
              transitions: document
                .getAnimations()
                .filter((animation) => animation instanceof CSSTransition)
                .map((animation) => animation.transitionProperty),
            };
          });
          expect(initial.charsetBeforeTheme).toBe(true);
          expect(initial.themeBeforeStyles).toBe(true);
          expect(initial.background).toBe(
            theme === "dark" ? "rgb(14, 38, 58)" : "rgb(249, 250, 251)",
          );
          expect(initial.transitions).toEqual([]);
        }
        scripts.resume();
        await expect(
          page.getByRole("button", { name: "Toggle dark/light" }),
        ).toBeEnabled();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(hydrationWarnings).toEqual([]);
      } finally {
        await scripts.dispose();
      }
    }

    test(`${saved ? "Saved" : "System"} ${theme} theme is applied before body parsing on load and refresh`, async ({
      page,
    }) => {
      await expect(
        verifyInitialThemeTiming({
          page,
        }),
      ).resolves.toBeUndefined();
    });
  }
}

for (const initialTheme of ["light", "dark"] as const) {
  test(`Chevron backgrounds stay in sync when switching from ${initialTheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: initialTheme });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle dark/light" });
    await expect(toggle).toBeEnabled();
    await toggle.focus();
    await expect(toggle).toHaveAccessibleDescription(
      initialTheme === "light" ? "Enable dark theme" : "Enable light theme",
    );

    await page.evaluate(async () => {
      for (const arrow of document.querySelectorAll(".arrows__arrow")) {
        getComputedStyle(arrow).getPropertyValue("background-color");
        getComputedStyle(arrow, "::after").getPropertyValue("background-color");
      }
      await Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === "background-color",
          )
          .map((animation) => animation.finished),
      );
    });

    const samples = await toggle.evaluate(async (button: HTMLButtonElement) => {
      const arrows = Array.from(document.querySelectorAll(".arrows__arrow"));
      // Firefox can still be transitioning from the initial transparent body.
      for (const animation of document.getAnimations()) {
        if (
          animation instanceof CSSTransition &&
          animation.transitionProperty === "background-color"
        ) {
          animation.finish();
        }
      }
      const initialBackground = getComputedStyle(document.body).backgroundColor;
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
      button.click();
      await changed;
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
      for (const transition of transitions) {
        transition.pause();
      }

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
      for (const transition of transitions) {
        transition.finish();
      }
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
