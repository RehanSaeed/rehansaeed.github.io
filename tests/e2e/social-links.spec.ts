import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

async function layout(links: Locator) {
  return links.evaluateAll((elements) => {
    const origin = elements[0];
    if (!(origin instanceof HTMLElement)) {
      throw new Error("Expected at least one social link.");
    }
    return elements.map((element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error("Expected a social link to be an HTML element.");
      }
      return {
        left: element.offsetLeft - origin.offsetLeft,
        top: element.offsetTop - origin.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
    });
  });
}

test.use({ reducedMotion: "no-preference" });

for (const { name, path, selector } of [
  { name: "Home", path: "/", selector: ".main .social" },
  { name: "Footer", path: "/", selector: ".footer .social" },
  { name: "About", path: "/about/", selector: ".about__social-links" },
]) {
  test(`${name} social buttons grow by 50% with easing without shifting neighbours`, async ({
    page,
  }) => {
    await page.goto(path);
    const links = page.locator(selector).getByRole("link");
    await expect(links).toHaveCount(9);

    for (const link of await links.all()) {
      await link.scrollIntoViewIfNeeded();
      const icon = link.locator("svg.icon");
      const original = await icon.boundingBox();
      expect(original).not.toBeNull();
      const originalLayout = await layout(links);
      await expect(link).toHaveCSS("transition-timing-function", "ease");
      const transformDuration = await link.evaluate((element) => {
        const style = getComputedStyle(element);
        const properties = style.transitionProperty.split(", ");
        const durations = style.transitionDuration.split(", ");
        return parseFloat(
          durations[properties.indexOf("transform") % durations.length]!,
        );
      });
      expect(transformDuration).toBeGreaterThan(0);

      await link.hover();
      await expect(link).toHaveCSS("transform", "matrix(1.5, 0, 0, 1.5, 0, 0)");
      const hovered = await icon.boundingBox();
      expect(hovered?.width).toBeCloseTo(original!.width * 1.5, 1);
      expect(hovered?.height).toBeCloseTo(original!.height * 1.5, 1);
      expect(await layout(links)).toEqual(originalLayout);

      await page.mouse.move(0, 0);
      await expect(link).toHaveCSS("transform", "none");
      const restored = await icon.boundingBox();
      expect(restored?.width).toBeCloseTo(original!.width, 1);
      expect(restored?.height).toBeCloseTo(original!.height, 1);
    }
  });
}
