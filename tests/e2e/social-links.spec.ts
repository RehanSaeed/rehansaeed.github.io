import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

async function layout(links: Locator) {
  return links.evaluateAll((elements) =>
    elements.map((element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error("Expected a social link to be an HTML element.");
      }
      return {
        left: element.offsetLeft,
        top: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
    }),
  );
}

test.use({ reducedMotion: "no-preference" });

for (const { name, path, selector } of [
  { name: "Home", path: "/", selector: ".main .social" },
  { name: "Footer", path: "/", selector: ".footer .social" },
  { name: "About", path: "/about/", selector: ".about__social-links" },
]) {
  test(`${name} social buttons grow subtly on hover without shifting neighbours`, async ({
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

      await link.hover();
      await expect(link).toHaveCSS(
        "transform",
        "matrix(1.12, 0, 0, 1.12, 0, 0)",
      );
      const hovered = await icon.boundingBox();
      expect(hovered?.width).toBeCloseTo(original!.width * 1.12, 1);
      expect(hovered?.height).toBeCloseTo(original!.height * 1.12, 1);
      expect(await layout(links)).toEqual(originalLayout);

      await page.mouse.move(0, 0);
      await expect(link).toHaveCSS("transform", "none");
      const restored = await icon.boundingBox();
      expect(restored?.width).toBeCloseTo(original!.width, 1);
      expect(restored?.height).toBeCloseTo(original!.height, 1);
    }
  });
}
