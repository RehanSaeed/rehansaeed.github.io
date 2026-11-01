import { test as unitTest, type Page } from "@playwright/test";
import sharp from "sharp";
import { distanceInMiles } from "../../shared/utils/location";
import { expect, test } from "./fixtures";

const photo = "/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png";
const geoUrl = "https://get.geojs.io/v1/ip/geo.json";

unitTest(
  "Great-circle miles between London and New York are approximate",
  () => {
    expect(distanceInMiles([-0.1278, 51.5074], [-74.006, 40.7128])).toBeCloseTo(
      3461.18,
      2,
    );
  },
);

unitTest("Great-circle miles handle identical and antipodal points", () => {
  expect(distanceInMiles([0, 0], [0, 0])).toBe(0);
  expect(distanceInMiles([0, 0], [180, 0])).toBeCloseTo(12436.82, 2);
  expect(distanceInMiles([180, 0], [0, 0])).toBeCloseTo(12436.82, 2);
});

test.beforeEach(async ({ page }) => {
  await page.route(geoUrl, (route) =>
    route.fulfill({ status: 503, body: "Location service unavailable" }),
  );
});

async function expectPinInsideMap(page: Page, selector: string) {
  const figure = page.locator(".location-map");
  await expect
    .poll(async () => {
      const canvas = await figure.locator(".maplibregl-canvas").boundingBox();
      const pin = await figure
        .locator(`.maplibregl-marker${selector}`)
        .boundingBox();
      if (!canvas || !pin) return false;
      return (
        pin.x >= canvas.x &&
        pin.x + pin.width <= canvas.x + canvas.width &&
        pin.y >= canvas.y &&
        pin.y + pin.height <= canvas.y + canvas.height
      );
    })
    .toBe(true);
}

async function expectLocationsFillView(page: Page, coincident: boolean) {
  const figure = page.locator(".location-map");
  await expect
    .poll(async () => {
      const canvas = (await figure
        .locator(".maplibregl-canvas")
        .boundingBox())!;
      const author = (await figure
        .locator(".maplibregl-marker.location-map__marker")
        .boundingBox())!;
      const visitor = (await figure
        .locator(".maplibregl-marker.location-map__visitor")
        .boundingBox())!;
      const dx = Math.abs(
        author.x + author.width / 2 - visitor.x - visitor.width / 2,
      );
      const dy = Math.abs(
        author.y + author.height - visitor.y - visitor.height,
      );
      if (coincident) return dx < 1 && dy < 1;
      return (
        Math.max(dx / (canvas.width - 96), dy / (canvas.height - 128)) > 0.9
      );
    })
    .toBe(true);
}

async function expectWhiteLand(page: Page) {
  const canvas = page.locator(".location-map .maplibregl-canvas");
  await expect
    .poll(async () => {
      const pixel = await sharp(await canvas.screenshot())
        .extract({ left: 16, top: 16, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer();
      return Math.max(...pixel.map((value) => 255 - value));
    })
    .toBeLessThan(3);
}

async function expectDottedConnection(page: Page) {
  const figure = page.locator(".location-map");
  const canvas = figure.locator(".maplibregl-canvas");
  const author = figure.locator(".maplibregl-marker.location-map__marker");
  const visitor = figure.locator(".maplibregl-marker.location-map__visitor");
  const radius = await figure.evaluate((element) =>
    Math.ceil(
      Number.parseFloat(
        getComputedStyle(element).getPropertyValue(
          "--location-map-connection-outline-width",
        ),
      ) / 2,
    ),
  );
  const luminance = (pixel: Uint8Array) =>
    [...pixel].reduce((sum, channel, index) => {
      const value = channel / 255;
      return (
        sum +
        (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][index]!
      );
    }, 0);
  await expect
    .poll(async () => {
      const bounds = (await canvas.boundingBox())!;
      const from = (await author.boundingBox())!;
      const to = (await visitor.boundingBox())!;
      const { data, info } = await sharp(await canvas.screenshot())
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const samples = {
        land: { dots: 0, gaps: 0 },
        water: { dots: 0, gaps: 0 },
      };
      const dx =
        (to.x + to.width / 2 - from.x - from.width / 2) *
        (info.width / bounds.width);
      const dy =
        (to.y + to.height - from.y - from.height) *
        (info.height / bounds.height);
      const length = Math.hypot(dx, dy);
      const normal = [-dy / length, dx / length];
      const pixelAt = (x: number, y: number) => {
        const offset =
          (Math.round(y) * info.width + Math.round(x)) * info.channels;
        return data.subarray(offset, offset + 3);
      };
      for (let step = 0; step < 80; step++) {
        const t = 0.3 + step / 200;
        const x = Math.round(
          ((from.x + from.width / 2) * (1 - t) +
            (to.x + to.width / 2) * t -
            bounds.x) *
            (info.width / bounds.width),
        );
        const y = Math.round(
          ((from.y + from.height) * (1 - t) +
            (to.y + to.height) * t -
            bounds.y) *
            (info.height / bounds.height),
        );
        const background = pixelAt(
          x + normal[0]! * (radius + 8),
          y + normal[1]! * (radius + 8),
        );
        const backgroundLuminance = luminance(background);
        const surface = [...background].every((channel) => channel > 250)
          ? samples.land
          : samples.water;
        let visible = false;
        for (let across = -radius; across <= radius; across++) {
          const foreground = luminance(
            pixelAt(x + normal[0]! * across, y + normal[1]! * across),
          );
          const contrast =
            (Math.max(foreground, backgroundLuminance) + 0.05) /
            (Math.min(foreground, backgroundLuminance) + 0.05);
          if (contrast >= 3) visible = true;
        }
        if (visible) surface.dots++;
        else surface.gaps++;
      }
      return Object.values(samples).every(
        ({ dots, gaps }) => dots > 3 && gaps > 3,
      );
    })
    .toBe(true);
}

async function mockOpenFreeMap(page: Page, showWater = false) {
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
            data: {
              type: "FeatureCollection",
              features: showWater
                ? [
                    {
                      type: "Feature",
                      properties: {},
                      geometry: {
                        type: "Polygon",
                        coordinates: [
                          [
                            [-180, -85],
                            [-40, -85],
                            [-40, 85],
                            [-180, 85],
                            [-180, -85],
                          ],
                        ],
                      },
                    },
                  ]
                : [],
            },
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
          {
            // Keep this flat test surface independent of fill-layer recolouring.
            id: "water",
            type: "fill-extrusion",
            source: "mock-map-data",
            paint: {
              "fill-extrusion-color": style === "dark" ? "#4b416e" : "#c5a5ef",
              "fill-extrusion-height": 0,
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
      await expect(figure.locator("figcaption")).not.toContainText(
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
      expect(position.x).toBeCloseTo(((-0.005 + 15) / 30) * 640, 1);
      expect(position.y).toBeCloseTo(((60 - 51.54) / 13) * 400, 1);
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

test("The free map loads on approach, shows Europe and follows the purple theme", async ({
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
    "Map showing London, the UK and Europe",
  );
  const pin = figure.locator(".maplibregl-marker.location-map__marker");
  await expect(pin).toHaveCount(1);
  await expect(pin).toHaveCSS("display", "grid");
  const avatar = pin.locator(".location-map__avatar");
  await expect(avatar).toHaveAttribute("src", photo);
  await avatar.evaluate((image: HTMLImageElement) => image.decode());
  expect(
    await avatar.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(192);
  await expect(avatar).toHaveCSS("border-radius", "50%");
  await expect(avatar).toHaveCSS("width", "62px");
  await expect(avatar).toHaveCSS("height", "62px");
  await expect(figure.locator(".maplibregl-ctrl-attrib")).toBeVisible();
  await expect(figure.locator(".maplibregl-ctrl-attrib")).toContainText(
    "Mock map data",
  );
  await expect(figure.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await expectPinInsideMap(page, ".location-map__marker");
  const canvasBounds = await canvas.boundingBox();
  const pinBounds = await pin.boundingBox();
  expect(pinBounds!.x + pinBounds!.width / 2).toBeLessThan(
    canvasBounds!.x + canvasBounds!.width / 2 - 10,
  );
  await expectWhiteLand(page);
  await expect(figure.getByRole("status")).toHaveText(
    "Your approximate location is unavailable. Showing London and Europe.",
  );

  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect.poll(() => styles).toEqual(["positron", "dark"]);
  await expect(pin).toBeVisible();
  await expectWhiteLand(page);
  await page
    .locator("nav")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".maplibregl-map")).toHaveCount(0);
  expect(mapboxRequests).toEqual([]);
});

test("Map credits collapse after five seconds and can be reopened", async ({
  page,
}) => {
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  const credits = figure.locator(".maplibregl-ctrl-attrib-inner");
  const toggle = figure.locator(".maplibregl-ctrl-attrib-button");
  await expect(credits).toBeVisible();
  await expect(credits).toContainText("Mock map data");
  await expect(credits.getByRole("link", { name: "GeoJS" })).toBeVisible();
  await expect(credits).toBeHidden({ timeout: 7000 });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(credits).toBeVisible();
  await toggle.click();
  await expect(credits).toBeHidden();
  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(credits).toBeVisible();
  await expect(credits).toContainText("Mock map data");
});

test("The animated fly-in ends at the regional view with London visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expectPinInsideMap(page, ".location-map__marker");
  const canvas = await figure.locator(".maplibregl-canvas").boundingBox();
  await expect
    .poll(async () => {
      const pin = await figure
        .locator(".maplibregl-marker.location-map__marker")
        .boundingBox();
      return pin!.x + pin!.width / 2;
    })
    .toBeLessThan(canvas!.x + canvas!.width / 2 - 10);
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
    const avatar = figure.locator(".maplibregl-marker .location-map__avatar");
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
    await expectPinInsideMap(page, ".location-map__marker");
    await expectWhiteLand(page);
    await testInfo.attach("Interactive London photo map", {
      body: await figure.screenshot(),
      contentType: "image/png",
    });
  });
}

for (const [place, longitude, latitude] of [
  ["Central London", "-0.1278", "51.5074"],
  ["East London", "-0.005", "51.54"],
  ["New York", "-74.0060", "40.7128"],
  ["Paris", "2.3522", "48.8566"],
  ["Sydney", "151.2093", "-33.8688"],
  ["San Francisco", "-122.4194", "37.7749"],
  ["Fiji", "178.4501", "-18.1416"],
] as const) {
  test(`An approximate visitor in ${place} is visible alongside London`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const lookups: string[] = [];
    await page.route(geoUrl, (route) => {
      lookups.push(route.request().url());
      expect(route.request().headers()["cookie"]).toBeUndefined();
      expect(route.request().headers()["referer"]).toBeUndefined();
      return route.fulfill({ json: { longitude, latitude } });
    });
    await mockOpenFreeMap(page, place === "New York");
    await page.goto("/about/", { waitUntil: "domcontentloaded" });
    await requireWebGL(page);
    const figure = page.locator(".location-map");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveClass(/location-map--interactive/);
    await expect(
      figure.getByRole("img", {
        name: "Your approximate location",
        exact: true,
      }),
    ).toContainText("You (approx.)");
    const miles = Math.round(
      distanceInMiles([-0.005, 51.54], [Number(longitude), Number(latitude)]),
    ).toLocaleString("en-GB");
    await expect(figure.locator("figcaption")).toHaveText(
      `I'm from London, roughly ${miles} miles away from your current location, according to your IP address.`,
    );
    await expect(figure.locator("figcaption em")).toHaveText(`${miles} miles`);
    await expect(figure.getByRole("status")).toHaveCount(0);
    await expect(figure).not.toContainText("Approximate location via");
    await expectPinInsideMap(page, ".location-map__marker");
    await expectPinInsideMap(page, ".location-map__visitor");
    await expectLocationsFillView(page, place === "East London");
    if (place === "New York") await expectDottedConnection(page);
    await expect(figure).toContainText("GeoJS");
    expect(lookups).toEqual([geoUrl]);
    await page.setViewportSize({ width: 375, height: 900 });
    await expectPinInsideMap(page, ".location-map__marker");
    await expectPinInsideMap(page, ".location-map__visitor");
    await expectLocationsFillView(page, place === "East London");
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(
      figure.locator(".maplibregl-marker.location-map__visitor"),
    ).toHaveCount(1);
    if (place === "New York") await expectDottedConnection(page);
  });
}

for (const location of [
  { longitude: "", latitude: "" },
  { longitude: "not a number", latitude: "51" },
  { longitude: "181", latitude: "51" },
  { longitude: "0", latitude: "91" },
  {},
]) {
  test(`Invalid IP location ${JSON.stringify(location)} keeps the regional map`, async ({
    page,
  }) => {
    await page.route(geoUrl, (route) => route.fulfill({ json: location }));
    await mockOpenFreeMap(page);
    await page.goto("/about/", { waitUntil: "domcontentloaded" });
    await requireWebGL(page);
    const figure = page.locator(".location-map");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveClass(/location-map--interactive/);
    await expect(figure.getByRole("status")).toHaveText(
      "Your approximate location is unavailable. Showing London and Europe.",
    );
    await expect(
      figure.locator(".maplibregl-marker.location-map__visitor"),
    ).toHaveCount(0);
    await expectPinInsideMap(page, ".location-map__marker");
  });
}

test("A timed-out IP lookup does not break the map", async ({ page }) => {
  await page.route(geoUrl, () => {});
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect(figure.getByRole("status")).toHaveText(
    "Your approximate location is unavailable. Showing London and Europe.",
    { timeout: 12_000 },
  );
  await expect(
    figure.locator(".maplibregl-marker.location-map__visitor"),
  ).toHaveCount(0);
});

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
