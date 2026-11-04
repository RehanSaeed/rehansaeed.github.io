import { expect, test } from "./fixtures";

const examples = [
  ["L", "/asp-net-core-fluent-interface-extensions/"],
  ["A", "/asp-net-mvc-boilerplate/"],
  ["T", "/asp-net-core-caching-in-practice/"],
  ["W", "/ai-gone-rogue/"],
  ["I", "/a-simple-and-fast-object-mapper/"],
  ["S", "/reactive-extensions-part2-wrapping-events/"],
] as const;

for (const width of [375, 640, 1280]) {
  for (const appearance of ["light", "dark", "high-contrast"] as const) {
    for (const [letter, path] of examples) {
      test(`Post drop cap ${letter} has breathing room at ${width}px in ${appearance}`, async ({
        page,
        browserName,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({
          colorScheme: appearance === "dark" ? "dark" : "light",
          forcedColors: appearance === "high-contrast" ? "active" : "none",
        });
        await page.goto(path);
        const paragraph = page.locator(".post__content > p").first();
        await expect(paragraph).toHaveText(new RegExp(`^${letter}`));
        await expect(paragraph).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const measure = () =>
          paragraph.evaluate((element) => {
            const dropCap = getComputedStyle(element, "::first-letter");
            const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
            );
            const text = walker.nextNode();
            if (!text || (text.textContent?.length ?? 0) < 2) {
              throw new Error("Expected an introduction starting with text");
            }
            const range = document.createRange();
            range.setStart(text, 1);
            range.setEnd(text, 2);
            return {
              margin: Number.parseFloat(dropCap.marginInlineEnd),
              rootFontSize: Number.parseFloat(
                getComputedStyle(document.documentElement).fontSize,
              ),
              native:
                CSS.supports("initial-letter", "2") ||
                CSS.supports("-webkit-initial-letter", "2"),
              initialLetter:
                dropCap.getPropertyValue("initial-letter") ||
                dropCap.getPropertyValue("-webkit-initial-letter"),
              float: dropCap.cssFloat,
              nextLetterX: range.getBoundingClientRect().x,
            };
          });
        const spacing = await measure();
        expect(spacing.margin).toBeCloseTo(spacing.rootFontSize * 0.75, 1);
        expect(/^2(?: 2)?$/.test(spacing.initialLetter)).toBe(spacing.native);
        expect({
          native: spacing.native,
          floated: /^(?:left|inline-start)$/.test(spacing.float),
        }).not.toEqual({ native: false, floated: false });

        const unspaced = await page.addStyleTag({
          content: `.post__content > p:first-of-type::first-letter {
            margin-inline-end: 0 !important;
          }`,
        });
        const withoutMargin = await measure();
        await unspaced.evaluate((element) =>
          element.parentNode?.removeChild(element),
        );
        // WebKit truncates native initial-letter margins to whole CSS pixels.
        const expectedOffsets = {
          chromium: spacing.margin,
          firefox: spacing.margin,
          webkit: Math.floor(spacing.margin),
        };
        expect(spacing.nextLetterX - withoutMargin.nextLetterX).toBeCloseTo(
          expectedOffsets[browserName],
          1,
        );
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
      });
    }
  }
}
