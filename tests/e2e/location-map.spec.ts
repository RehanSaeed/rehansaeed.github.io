import type { Page } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";

const photo = "/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png";
async function mockOpenFreeMap(page: Page) {
  const styles: string[] = [];
  await page.route("https://tiles.openfreemap.org/styles/*", (route) => {
    const url = new URL(route.request().url());
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
              "background-color": style === "dark" ? "#102737" : "#ede8fa",
            },
          },
          { id: "places", type: "circle", source: "mock-map-data" },
        ],
      },
    });
  });
  return styles;
}

async function requireWebGL(page: Page) {
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
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
      await page.route("https://tiles.openfreemap.org/**", (route) =>
        route.fulfill({ status: 503, body: "Map service unavailable" }),
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
      await figure.scrollIntoViewIfNeeded();

      const avatar = map.locator("image");
      await expect(avatar).toHaveAttribute("href", photo);
      const avatarResponse = await page.request.get(photo);
      expect(avatarResponse.ok()).toBe(true);
      expect(avatarResponse.headers()["content-type"]).toContain("image/png");
      const avatarMetadata = await sharp(
        await avatarResponse.body(),
      ).metadata();
      expect([avatarMetadata.width, avatarMetadata.height]).toEqual([192, 192]);

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

test("The free map loads on approach, centres the photo pin and follows the theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const mapboxRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith(".mapbox.com")) {
      mapboxRequests.push(request.url());
    }
  });
  const styles = await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  expect(styles).toEqual([]);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect.poll(() => styles).toEqual(["positron"]);
  const canvas = figure.locator(".maplibregl-canvas");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute(
    "aria-label",
    "Map of London, United Kingdom",
  );
  const pin = figure.locator(".maplibregl-marker");
  await expect(pin).toHaveCount(1);
  const avatar = pin.locator("img");
  await expect(avatar).toHaveAttribute("src", photo);
  await avatar.evaluate((image: HTMLImageElement) => image.decode());
  expect(
    await avatar.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(192);
  await expect(avatar).toHaveCSS("border-radius", "50%");
  await expect(figure.locator(".maplibregl-ctrl-attrib")).toBeVisible();
  await expect(figure.locator(".maplibregl-ctrl-attrib")).toContainText(
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
  await expect.poll(() => styles).toEqual(["positron", "dark"]);
  await expect(pin).toBeVisible();
  await page
    .locator("nav")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".maplibregl-map")).toHaveCount(0);
  expect(mapboxRequests).toEqual([]);
});

test("The animated fly-in ends with the photo pin over London", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect
    .poll(
      async () => {
        const canvas = await figure.locator(".maplibregl-canvas").boundingBox();
        const pin = await figure.locator(".maplibregl-marker").boundingBox();
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

test("An OpenFreeMap failure keeps the photo fallback and announces the problem", async ({
  page,
}) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({ status: 503, body: "Map service unavailable" }),
  );
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole("status")).toHaveText(
    "The interactive map could not load. Showing a static map of London.",
  );
  await expect(figure).not.toHaveClass(/location-map--interactive/);
  await expect(figure.locator(".location-map__illustration")).toBeVisible();
  await expect(figure.locator(".maplibregl-canvas")).toHaveCount(0);
  await expect(figure.locator(".location-map__pin image")).toHaveAttribute(
    "href",
    photo,
  );
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`The interactive photo map fits a mobile viewport in ${colorScheme} mode`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    const styles = await mockOpenFreeMap(page);
    await page.goto("/about/", { waitUntil: "domcontentloaded" });
    await requireWebGL(page);
    const figure = page.locator(".location-map");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveClass(/location-map--interactive/);
    await expect
      .poll(() => styles)
      .toEqual([colorScheme === "dark" ? "dark" : "positron"]);
    await expect(figure.locator(".maplibregl-canvas")).toBeVisible();
    const avatar = figure.locator(".maplibregl-marker img");
    await avatar.evaluate((image: HTMLImageElement) => image.decode());
    const bounds = await figure.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
    const layout = await figure.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(layout.scrollWidth).toBe(layout.clientWidth);
    await expect(figure.locator(".maplibregl-ctrl-attrib")).toBeVisible();
    await testInfo.attach("Interactive London photo map", {
      body: await figure.screenshot(),
      contentType: "image/png",
    });
  });
}

test("A browser without WebGL keeps the self-hosted photo map", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
        if (contextId === "webgl2" || contextId === "webgl") return null;
        return Reflect.apply(getContext, this, [contextId, ...args]);
      },
    });
  });
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole("status")).toHaveText(
    "The interactive map could not load. Showing a static map of London.",
  );
  await expect(figure).not.toHaveClass(/location-map--interactive/);
  await expect(figure.locator(".location-map__illustration")).toBeVisible();
  await expect(figure.locator(".location-map__pin image")).toHaveAttribute(
    "href",
    photo,
  );
});
