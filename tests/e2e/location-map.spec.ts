import { expect, test } from "./fixtures";

for (const width of [320, 375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`London location map at ${width}px in ${colorScheme} mode`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/about/", { waitUntil: "domcontentloaded" });

      const figure = page.locator(".location-map");
      const map = page.getByRole("img", {
        name: "Map of the British Isles with my avatar marking London, United Kingdom",
      });
      await expect(map).toBeVisible();
      await expect(figure.locator("figcaption")).toContainText(
        "I'm from London.",
      );
      await expect(figure.locator("figcaption")).toContainText(
        "United Kingdom",
      );
      await expect(
        figure.getByRole("link", { name: "Natural Earth" }),
      ).toHaveAttribute("href", "https://www.naturalearthdata.com/");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorScheme,
      );

      const avatar = map.locator("image");
      await expect(avatar).toHaveAttribute(
        "href",
        "/images/author/Muhammad-Rehan-Saeed/Logo.svg",
      );
      const avatarResponse = await page.request.get(
        (await avatar.getAttribute("href"))!,
      );
      expect(avatarResponse.ok()).toBe(true);
      expect(avatarResponse.headers()["content-type"]).toContain(
        "image/svg+xml",
      );
      expect(await avatarResponse.text()).toContain(
        "<title>Muhammad Rehan Saeed</title>",
      );

      const pin = map.locator(".location-map__pin");
      const position = await pin.evaluate((element: SVGGElement) => {
        const matrix = element.transform.baseVal.consolidate()!.matrix;
        return { x: matrix.e, y: matrix.f };
      });
      expect(position.x).toBeCloseTo(((-0.1278 + 15) / 30) * 640, 1);
      expect(position.y).toBeCloseTo(((60 - 51.5074) / 13) * 400, 1);
      const colours = await pin.evaluate((element) => {
        const reference = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        reference.setAttribute("fill", "var(--global-accent-color)");
        element.append(reference);
        const actual = getComputedStyle(element).fill;
        const expected = getComputedStyle(reference).fill;
        reference.remove();
        return { actual, expected };
      });
      expect(colours.actual).toBe(colours.expected);

      await figure.scrollIntoViewIfNeeded();
      const bounds = await figure.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      const layout = await figure.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(layout.scrollWidth).toBe(layout.clientWidth);
      await testInfo.attach("London location map", {
        body: await figure.screenshot(),
        contentType: "image/png",
      });
    });
  }
}

test.describe("Without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("The London map and location are server-rendered", async ({ page }) => {
    await page.goto("/about/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".location-map")).toContainText(
      "I'm from London.",
    );
    await expect(
      page.getByRole("img", {
        name: "Map of the British Isles with my avatar marking London, United Kingdom",
      }),
    ).toBeVisible();
    await expect(page.locator(".location-map__pin image")).toHaveAttribute(
      "href",
      "/images/author/Muhammad-Rehan-Saeed/Logo.svg",
    );
  });
});
