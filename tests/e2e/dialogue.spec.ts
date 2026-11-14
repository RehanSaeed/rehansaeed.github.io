import type { E2EFixtures } from "./fixtures";
import { expect, test } from "./fixtures";

test.use({ trace: "retain-on-failure" });

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
        await page.clock.install();
        // Exercise the share dialog rather than the platform's native share UI.
        await page.addInitScript(() => {
          Object.defineProperty(navigator, "share", { value: undefined });
        });
        // Keep dialog coverage independent of the newest post and page transitions.
        await page.goto(
          title === "Search"
            ? "/"
            : "/on-the-etiquette-of-pull-request-comments/",
        );
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
        await page.clock.fastForward(1000);
        await expect(page.getByRole("tooltip")).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(closedDialog).toBeHidden();
        await expect(opener).toBeFocused();

        await opener.press("Enter");
        await expect(dialog).toBeVisible();
        // Keyboard reopening must not schedule a delayed tooltip either.
        await page.clock.fastForward(1000);
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

  test.afterEach(async ({ page }, testInfo) => {
    if (
      testInfo.title.includes("remains interactive after client navigation") &&
      !page.isClosed()
    ) {
      await testInfo.attach("dialog-navigation-lifecycle", {
        body: JSON.stringify(
          await page.evaluate(() => {
            const events: unknown = Reflect.get(
              window,
              "dialogNavigationEvents",
            );
            const pointerEvents: unknown = Reflect.get(
              window,
              "dialogNavigationPointerEvents",
            );
            const pointerEventCounts: unknown = Reflect.get(
              window,
              "dialogNavigationPointerEventCounts",
            );
            const openerEvents: unknown = Reflect.get(
              window,
              "dialogNavigationOpenerEvents",
            );
            const close = document.querySelector(
              ".dialog[open] .dialog__close",
            );
            const box = close?.getBoundingClientRect();
            const hit = box
              ? document.elementFromPoint(
                  box.x + box.width / 2,
                  box.y + box.height / 2,
                )
              : null;
            return {
              events,
              pointerEvents,
              pointerEventCounts,
              openerEvents,
              root: document.documentElement.className,
              hit: hit?.tagName,
              hitClass: hit?.getAttribute("class"),
              tooltip: !!document.querySelector('[role="tooltip"]'),
            };
          }),
          null,
          2,
        ),
        contentType: "application/json",
      });
    }
  });

  for (const { title, trigger } of dialogs.slice(1)) {
    test(`${title} remains interactive after client navigation`, async ({
      page,
    }) => {
      // Keep native navigation and animation clocks real in this regression.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", { value: undefined });
        const events: Array<Record<string, unknown>> = [];
        Reflect.set(window, "dialogNavigationEvents", events);
        const pointerEvents: Array<Record<string, unknown>> = [];
        const pointerEventCounts: Record<string, number> = {};
        const openerEvents: Array<Record<string, unknown>> = [];
        Reflect.set(window, "dialogNavigationOpenerEvents", openerEvents);
        Reflect.set(window, "dialogNavigationPointerEvents", pointerEvents);
        Reflect.set(
          window,
          "dialogNavigationPointerEventCounts",
          pointerEventCounts,
        );
        const identities = new WeakMap<Element, number>();
        let nextIdentity = 0;
        const describeElement = (element: Element | null) => {
          if (!element) {
            return null;
          }
          if (!identities.has(element)) {
            identities.set(element, ++nextIdentity);
          }
          return {
            identity: identities.get(element),
            connected: element.isConnected,
            tag: element.tagName,
            id: element.id,
            class: element.getAttribute("class"),
          };
        };
        const openerSelector = ".post__share > button, .post__support > button";
        const controlState = () =>
          [...document.querySelectorAll<HTMLButtonElement>(openerSelector)].map(
            (button) => {
              const dialog = button.parentElement?.querySelector("dialog");
              return {
                button: describeElement(button),
                disabled: button.disabled,
                hydrating: button.classList.contains("button--hydrating"),
                dialog: describeElement(dialog ?? null),
                open: dialog?.open,
                display: dialog ? getComputedStyle(dialog).display : undefined,
              };
            },
          );
        const recordOpener = (phase: string, event: MouseEvent) => {
          if (openerEvents.length === 32) {
            openerEvents.splice(8, 1);
          }
          openerEvents.push({
            phase,
            at: performance.now(),
            eventTime: event.timeStamp,
            target: describeElement(
              event.target instanceof Element ? event.target : null,
            ),
            defaultPrevented: event.defaultPrevented,
            controls: controlState(),
            nativeShare: typeof navigator.share,
          });
        };
        for (const type of [
          "pointermove",
          "pointerdown",
          "mousedown",
          "mouseup",
          "click",
        ] as const) {
          window.addEventListener(
            type,
            (event) => {
              const close = document.querySelector(
                ".dialog[open] .dialog__close",
              );
              const opener =
                (event.target instanceof Element
                  ? event.target.closest<HTMLButtonElement>(openerSelector)
                  : null) ??
                document.querySelector<HTMLButtonElement>(openerSelector);
              const control = close ?? opener;
              if (!control) {
                return;
              }
              pointerEventCounts[type] = (pointerEventCounts[type] ?? 0) + 1;
              // Preserve the first eight samples and the latest 24 retries.
              if (pointerEvents.length === 32) {
                pointerEvents.splice(8, 1);
              }
              const box = control.getBoundingClientRect();
              const viewport = window.visualViewport;
              pointerEvents.push({
                type,
                at: performance.now(),
                eventTime: event.timeStamp,
                trusted: event.isTrusted,
                phase: close ? "modal-open" : "opener",
                controls: close ? undefined : controlState(),
                target: describeElement(
                  event.target instanceof Element ? event.target : null,
                ),
                hit: describeElement(
                  document.elementFromPoint(event.clientX, event.clientY),
                ),
                centerHit: describeElement(
                  document.elementFromPoint(
                    box.x + box.width / 2,
                    box.y + box.height / 2,
                  ),
                ),
                control: {
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  height: box.height,
                },
                client: { x: event.clientX, y: event.clientY },
                page: { x: event.pageX, y: event.pageY },
                screen: { x: event.screenX, y: event.screenY },
                scroll: { x: window.scrollX, y: window.scrollY },
                viewport: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                  offsetLeft: viewport?.offsetLeft,
                  offsetTop: viewport?.offsetTop,
                  scale: viewport?.scale,
                },
              });
            },
            { capture: true, passive: true },
          );
        }
        window.addEventListener(
          "click",
          (event) => {
            if (!document.querySelector(openerSelector)) {
              return;
            }
            recordOpener("capture", event);
            // Observe after dispatch and Vue's queued update without delaying input.
            requestAnimationFrame(() => {
              recordOpener("next-frame", event);
            });
          },
          { capture: true, passive: true },
        );
        window.addEventListener(
          "click",
          (event) => {
            if (document.querySelector(openerSelector)) {
              recordOpener("bubble", event);
            }
          },
          { passive: true },
        );
        const record = (kind: string, id?: number, details?: unknown) => {
          events.push({
            kind,
            at: performance.now(),
            root: document.documentElement.className,
            id,
            details,
            controls: controlState(),
          });
        };
        if (typeof document.startViewTransition === "function") {
          let sequence = 0;
          const start = document.startViewTransition.bind(document);
          document.startViewTransition = (update) => {
            const id = ++sequence;
            const transition = start(update);
            Reflect.set(
              window,
              "dialogNavigationFinished",
              transition.finished,
            );
            record("transition-start", id);
            const skip = transition.skipTransition.bind(transition);
            transition.skipTransition = () => {
              record("transition-skip", id);
              skip();
            };
            void transition.ready.then(
              () => {
                record("transition-ready", id);
              },
              (error: unknown) => {
                record("transition-ready-rejected", id, String(error));
              },
            );
            void transition.finished.then(
              () => {
                record("transition-finished", id);
              },
              (error: unknown) => {
                record("transition-finished-rejected", id, String(error));
              },
            );
            return transition;
          };
        }
        document.addEventListener(
          "beforetoggle",
          (event) => {
            if (event.target instanceof HTMLDialogElement) {
              record("dialog-beforetoggle", undefined, {
                newState:
                  event instanceof ToggleEvent ? event.newState : undefined,
              });
            }
          },
          true,
        );
      });
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Open search", exact: true }),
      ).toBeEnabled();
      await page.locator(".post-card__title").first().click();
      // Protocol auto-scroll during a snapshot can desynchronise Firefox's visual viewport.
      // Finish navigation before scrolling to the offscreen Share/Coffee controls.
      await expect
        .poll(() =>
          page.evaluate(() => Reflect.has(window, "dialogNavigationFinished")),
        )
        .toBe(true);
      await page.evaluate(async () => {
        const finished: unknown = Reflect.get(
          window,
          "dialogNavigationFinished",
        );
        await Promise.resolve(finished);
      });

      const opener = page
        .getByRole("button", { name: trigger, exact: true })
        .first();
      const dialog = page.getByRole("dialog", { name: title, exact: true });
      await opener.click();
      await expect(dialog).toBeVisible();
      await dialog
        .getByRole("button", { name: `Close ${title}`, exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    });
  }

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
