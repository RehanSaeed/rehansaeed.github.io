import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const photo = "/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png";
const unavailable =
  "Interactive map unavailable. Showing a static map of London.";

async function mockMapbox(page: Page) {
  const styles: string[] = [];
  await page.route("https://api.mapbox.com/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/styles/v1/mapbox/")) {
      const style = url.pathname.split("/").at(-1)!;
      styles.push(style);
      return route.fulfill({
        json: {
          version: 8,
          sources: {
            "mock-map-data": {
              type: "geojson",
              data: { type: "FeatureCollection", features: [] },
              attribution: "Mock map data",
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color":
                  style === "dark-v11" ? "#102737" : "#ede8fa",
              },
            },
            { id: "places", type: "circle", source: "mock-map-data" },
          ],
        },
      });
    }
    return route.fulfill({ json: {} });
  });
  await page.route("https://events.mapbox.com/**", (route) =>
    route.fulfill({ status: 204 }),
  );
  return styles;
}

async function requireConfiguredMapbox(page: Page) {
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  test.skip(
    (await page.getByText(unavailable, { exact: true }).count()) > 0,
    "This build has no Mapbox public token configured.",
  );
  const hasWebGL = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return context !== null;
  });
  test.skip(!hasWebGL, "This browser does not support WebGL 2.");
}

for (const width of [320, 375, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`London location map at ${width}px in ${colorScheme} mode`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.route("https://api.mapbox.com/**", (route) =>
        route.fulfill({ status: 401, json: { message: "Invalid token" } }),
      );
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
      await expect(avatar).toHaveAttribute("href", photo);
      const avatarResponse = await page.request.get(photo);
      expect(avatarResponse.ok()).toBe(true);
      expect(avatarResponse.headers()["content-type"]).toContain("image/png");
      await avatar.evaluate(async (element: SVGImageElement) => {
        const image = new Image();
        image.src = element.href.baseVal;
        await image.decode();
      });

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
      photo,
    );
  });
});

test("Mapbox loads on approach, centres the photo pin and follows the theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const styles = await mockMapbox(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireConfiguredMapbox(page);
  expect(styles).toEqual([]);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect.poll(() => styles).toEqual(["light-v11"]);
  const canvas = figure.locator(".mapboxgl-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute(
    "aria-label",
    "Map of London, United Kingdom",
  );
  const pin = figure.locator(".mapboxgl-marker");
  await expect(pin).toHaveCount(1);
  const avatar = pin.locator("img");
  await expect(avatar).toHaveAttribute("src", photo);
  await avatar.evaluate((image: HTMLImageElement) => image.decode());
  expect(
    await avatar.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(192);
  await expect(avatar).toHaveCSS("border-radius", "50%");
  await expect(figure.locator(".mapboxgl-ctrl-logo")).toBeVisible();
  await expect(figure.locator(".mapboxgl-ctrl-attrib")).toBeVisible();
  await expect(figure.locator(".mapboxgl-ctrl-attrib")).toContainText(
    "Mock map data",
  );
  await expect(figure.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  const canvasBounds = await canvas.boundingBox();
  const pinBounds = await pin.boundingBox();
  expect(
    Math.abs(
      pinBounds!.x +
        pinBounds!.width / 2 -
        canvasBounds!.x -
        canvasBounds!.width / 2,
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      pinBounds!.y +
        pinBounds!.height -
        canvasBounds!.y -
        canvasBounds!.height / 2,
    ),
  ).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect.poll(() => styles).toEqual(["light-v11", "dark-v11"]);
  await expect(pin).toBeVisible();
  await page
    .locator("nav")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".mapboxgl-map")).toHaveCount(0);
});

test("The animated fly-in ends with the photo pin over London", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockMapbox(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireConfiguredMapbox(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect
    .poll(
      async () => {
        const canvas = await figure.locator(".mapboxgl-canvas").boundingBox();
        const pin = await figure.locator(".mapboxgl-marker").boundingBox();
        if (!canvas || !pin) return Infinity;
        return Math.hypot(
          pin.x + pin.width / 2 - canvas.x - canvas.width / 2,
          pin.y + pin.height - canvas.y - canvas.height / 2,
        );
      },
      { timeout: 10_000 },
    )
    .toBeLessThan(2);
});

test("A Mapbox failure keeps the photo fallback and announces the problem", async ({
  page,
}) => {
  await page.route("https://api.mapbox.com/**", (route) =>
    route.fulfill({ status: 401, json: { message: "Invalid token" } }),
  );
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireConfiguredMapbox(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole("status")).toHaveText(
    "The interactive map could not load. Showing a static map of London.",
  );
  await expect(figure).not.toHaveClass(/location-map--interactive/);
  await expect(figure.locator(".location-map__illustration")).toBeVisible();
  await expect(figure.locator(".mapboxgl-canvas")).toHaveCount(0);
  await expect(figure.locator(".location-map__pin image")).toHaveAttribute(
    "href",
    photo,
  );
});
