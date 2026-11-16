import { expect, test } from "./fixtures";

const paths = ["/", "/ai-learnings-from-upgrading-my-blog/"];

for (const path of paths) {
  const expectedWaveCount = path === "/" ? 0 : 1;
  for (const width of [320, 390, 768, 1280]) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`Keyboard entry stays clear at ${width}px in ${colorScheme} on ${path}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await expect(
          page.getByRole("button", { name: "Open search", exact: true }),
        ).toBeEnabled();
        await page.evaluate(() => document.fonts.ready);

        const skip = page.getByRole("link", { name: "Skip to content" });
        await page.keyboard.press("Tab");
        await expect(skip).toBeFocused();
        await expect(skip).toBeInViewport({ ratio: 1 });
        await expect(skip).toHaveCSS("outline-style", "solid");
        await expect(skip).toHaveCSS("outline-width", "2px");
        const entry = await skip.evaluate((link) => {
          const box = link.getBoundingClientRect();
          const controls = [
            ...document.querySelectorAll<HTMLElement>(
              ".navigation a, .navigation button",
            ),
          ].filter((control) => control.getBoundingClientRect().width > 0);
          const points: [number, number][] = [
            [box.left + 1, box.top + 1],
            [box.right - 1, box.top + 1],
            [box.left + 1, box.bottom - 1],
            [box.right - 1, box.bottom - 1],
            [box.left + box.width / 2, box.top + box.height / 2],
          ];
          return {
            unobscured: points.every(
              ([x, y]) =>
                document.elementFromPoint(x, y)?.closest("a") === link,
            ),
            overlapsNavigation: controls.some((control) => {
              const other = control.getBoundingClientRect();
              return (
                box.left < other.right &&
                box.right > other.left &&
                box.top < other.bottom &&
                box.bottom > other.top
              );
            }),
          };
        });
        expect(entry.unobscured).toBe(true);
        expect(entry.overlapsNavigation).toBe(false);

        await page.keyboard.press("Enter");
        const main = page.locator("main#main");
        await expect(main).toBeFocused();
        await expect(main.locator("h1").first()).toBeInViewport();
        await page.keyboard.press("Tab");
        await expect(main.locator(":focus-visible")).toHaveCount(1);
      });
    }
  }

  for (const width of [320, 375, 390, 414, 768, 1280]) {
    test(`Navigation and full-bleed content fit ${width}px on ${path}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(
        page.getByRole("button", { name: "Open search", exact: true }),
      ).toBeEnabled();
      await page.addStyleTag({
        content: "html { overflow-y: scroll; scrollbar-gutter: stable; }",
      });
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const navigation = document.querySelector(".navigation")!;
        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          controls: [
            ...navigation.querySelectorAll<HTMLElement>(
              "a, button:not(dialog button)",
            ),
          ]
            .filter((control) => getComputedStyle(control).display !== "none")
            .map((control) => {
              const box = control.getBoundingClientRect();
              return { left: box.left, right: box.right, width: box.width };
            }),
          waves: [...document.querySelectorAll(".post-page__arrows")].map(
            (wave) => {
              const box = wave.getBoundingClientRect();
              return { left: box.left, right: box.right };
            },
          ),
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
      for (const control of layout.controls) {
        expect(control.width).toBeGreaterThanOrEqual(20);
        expect(control.left).toBeGreaterThanOrEqual(0);
        expect(control.right).toBeLessThanOrEqual(layout.clientWidth);
      }
      expect(layout.waves).toHaveLength(expectedWaveCount);
      for (const wave of layout.waves) {
        expect(wave.left).toBeCloseTo(0, 0);
        expect(wave.right).toBeCloseTo(layout.clientWidth, 0);
      }
    });
  }
}

for (const width of [390, 1280]) {
  test(`Skip link retains a native focus indicator in forced colours at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport({ ratio: 1 });
    await expect(skip).toHaveCSS("outline-style", "solid");
    await expect(skip).toHaveCSS("outline-width", "2px");
    await expect(skip).toHaveCSS("forced-color-adjust", "auto");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });
}
