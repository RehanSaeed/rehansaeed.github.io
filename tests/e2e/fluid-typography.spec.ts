import { expect, test } from "./fixtures";

for (const defaultFontSize of [16, 32]) {
  for (const fallback of [false, true]) {
    test(`Fluid typography ${fallback ? "fallback" : "enhancement"} with a ${defaultFontSize}px default font`, async ({
      page,
      browserName,
    }) => {
      test.skip(
        defaultFontSize !== 16 && browserName !== "chromium",
        "Changing the browser's default font size requires Chromium CDP.",
      );
      if (defaultFontSize !== 16) {
        const session = await page.context().newCDPSession(page);
        await session.send("Page.setFontSizes", {
          fontSizes: { standard: defaultFontSize },
        });
      }
      await page.goto("/");

      const supportsProgress = await page.evaluate(() =>
        CSS.supports("font-size", "calc(1em * progress(100vw, 1em, 2em))"),
      );
      if (fallback) {
        const removed = await page.evaluate(() => {
          let removed = 0;
          const removeEnhancement = (
            sheet: CSSStyleSheet | CSSGroupingRule,
          ) => {
            for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
              const rule = sheet.cssRules[index];
              if (
                rule instanceof CSSSupportsRule &&
                rule.conditionText.includes("progress(")
              ) {
                sheet.deleteRule(index);
                removed++;
              } else if (rule instanceof CSSGroupingRule) {
                removeEnhancement(rule);
              }
            }
          };
          for (const sheet of document.styleSheets) {
            removeEnhancement(sheet);
          }
          return removed;
        });
        expect(removed).toBeGreaterThan(0);
      }

      await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.id = "fluid-typography-probe";
        probe.style.width = "var(--global-space-fluid-6)";
        probe.append(document.createElement("h2"));
        document.body.append(probe);
      });
      const measure = () =>
        page.evaluate(() => {
          const probe = document.getElementById("fluid-typography-probe")!;
          const root = getComputedStyle(document.documentElement);
          return {
            root: Number.parseFloat(root.fontSize),
            heading: Number.parseFloat(
              getComputedStyle(probe.firstElementChild!).fontSize,
            ),
            spacing: Number.parseFloat(getComputedStyle(probe).width),
            token: root.getPropertyValue("--global-font-size-default"),
          };
        });

      const minimumWidth = defaultFontSize * 36;
      const maximumWidth = defaultFontSize * 100;
      for (const width of [
        320,
        minimumWidth - 1,
        minimumWidth,
        minimumWidth + 1,
        (minimumWidth + maximumWidth) / 2,
        maximumWidth - 1,
        maximumWidth,
        maximumWidth + 1,
        maximumWidth + 320,
      ]) {
        await page.setViewportSize({ width, height: 900 });
        const progress = Math.min(
          1,
          Math.max(0, (width - minimumWidth) / (maximumWidth - minimumWidth)),
        );
        const expected = defaultFontSize * (1 + progress * 0.25);
        // Firefox also quantizes viewport arithmetic near the breakpoints.
        const fontTolerance = 0.05;
        await expect
          .poll(async () => Math.abs((await measure()).root - expected))
          .toBeLessThan(fontTolerance);
        const actual = await measure();
        if (progress === 0 || progress === 0.5 || progress === 1) {
          expect(actual.root).toBeCloseTo(expected, 2);
        }
        expect(Math.abs(actual.heading - actual.root * 1.602)).toBeLessThan(
          fontTolerance,
        );
        expect(actual.token.includes("progress(")).toBe(
          supportsProgress && !fallback,
        );

        const style = await page.addStyleTag({
          content: `:root {
            --global-font-size-default: clamp(1rem, 0.859375rem + 0.390625vw, 1.25rem) !important;
          }`,
        });
        const original = await measure();
        expect(Math.abs(actual.root - original.root)).toBeLessThan(
          fontTolerance,
        );
        expect(Math.abs(actual.heading - original.heading)).toBeLessThan(
          fontTolerance * 1.602 + 0.02,
        );
        expect(Math.abs(actual.spacing - original.spacing)).toBeLessThan(
          fontTolerance * 4.5 + 0.02,
        );
        await style.evaluate((element) => element.remove());
      }
    });
  }
}
