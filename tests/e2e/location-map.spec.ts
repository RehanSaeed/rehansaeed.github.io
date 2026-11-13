import { test as unitTest, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";
import { distanceInMiles } from "../../shared/utils/location";
import { delayClientScripts, expect, test } from "./fixtures";

const photo = "/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png";
const geoUrl = "https://get.geojs.io/v1/ip/geo.json";

test.beforeEach(async ({ page }) => {
  await page.route(geoUrl, (route) =>
    route.fulfill({ status: 503, body: "Location service unavailable" }),
  );
});

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

const expectPinInsideMap = async (page: Page, selector: string) => {
  const figure = page.locator(".location-map");
  await expect
    .poll(async () => {
      const canvas = await figure.locator(".maplibregl-canvas").boundingBox();
      const pin = await figure
        .locator(`.maplibregl-marker${selector}`)
        .boundingBox();
      if (!canvas || !pin) {
        return false;
      }
      return (
        pin.x >= canvas.x &&
        pin.x + pin.width <= canvas.x + canvas.width &&
        pin.y >= canvas.y &&
        pin.y + pin.height <= canvas.y + canvas.height
      );
    })
    .toBe(true);
};

const expectCaptionAlignedWithCopy = async (page: Page, figure: Locator) => {
  const paragraph = (await page
    .locator(".about__description")
    .first()
    .boundingBox())!;
  const caption = (await figure.locator("figcaption").boundingBox())!;
  expect(caption.x).toBeCloseTo(paragraph.x, 0);
  expect(caption.width).toBeCloseTo(paragraph.width, 0);
};

const expectLocationsFillView = async (
  page: Page,
  visitor: [number, number],
) => {
  const london: [number, number] = [-0.005, 51.54];
  const worldSizeAtMaxZoom = 512 * 2 ** 12;
  const mercatorY = (latitude: number) =>
    Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) /
    (2 * Math.PI);
  const cappedDx =
    (Math.abs(visitor[0] - london[0]) / 360) * worldSizeAtMaxZoom;
  const cappedDy =
    Math.abs(mercatorY(visitor[1]) - mercatorY(london[1])) * worldSizeAtMaxZoom;
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
      if (cappedDx === 0 && cappedDy === 0) {
        return dx < 1 && dy < 1;
      }
      return (
        Math.max(dx / (canvas.width - 96), dy / (canvas.height - 128)) > 0.9 ||
        // Nearby locations can reach the zoom cap before filling a wide map.
        (Math.abs(dx - cappedDx) < 1 && Math.abs(dy - cappedDy) < 1)
      );
    })
    .toBe(true);
};

const expectLandPalette = async (page: Page) => {
  const canvas = page.locator(".location-map .maplibregl-canvas");
  const expected = await page
    .locator(".location-map__land")
    .evaluate((element) =>
      getComputedStyle(element).fill.match(/\d+/g)!.map(Number),
    );
  await expect
    .poll(async () => {
      const pixel = await sharp(await canvas.screenshot())
        .extract({ left: 16, top: 16, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer();
      return Math.max(
        ...pixel.map((value, index) => Math.abs(expected[index]! - value)),
      );
    })
    .toBeLessThan(3);
};

const expectDottedConnection = async (page: Page) => {
  const figure = page.locator(".location-map");
  const canvas = figure.locator(".maplibregl-canvas");
  const author = figure.locator(".maplibregl-marker.location-map__marker");
  const visitor = figure.locator(".maplibregl-marker.location-map__visitor");
  const land = await figure
    .locator(".location-map__land")
    .evaluate((element) =>
      getComputedStyle(element).fill.match(/\d+/g)!.map(Number),
    );
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
        const surface = [...background].every(
          (channel, index) => Math.abs(channel - land[index]!) < 3,
        )
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
          if (contrast >= 3) {
            visible = true;
          }
        }
        if (visible) {
          surface.dots++;
        } else {
          surface.gaps++;
        }
      }
      return Object.values(samples).every(
        ({ dots, gaps }) => dots > 3 && gaps > 3,
      );
    })
    .toBe(true);
};

const mockOpenFreeMap = async (page: Page, showWater = false) => {
  const styles: string[] = [];
  await page.route("https://tiles.openfreemap.org/styles/*", (route) => {
    expect(route.request().headers()["referer"]).toBeUndefined();
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
              features: [
                ...(
                  [
                    ["park", 5],
                    ["wood", 20],
                  ] as const
                ).map(([surface, west]) => ({
                  type: "Feature",
                  properties: { surface },
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [west, 40],
                        [west + 10, 40],
                        [west + 10, 45],
                        [west, 45],
                        [west, 40],
                      ],
                    ],
                  },
                })),
                {
                  type: "Feature",
                  properties: { surface: "road" },
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [5, 50],
                      [30, 50],
                    ],
                  },
                },
                ...(showWater
                  ? [
                      {
                        type: "Feature",
                        properties: { surface: "water" },
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
                  : []),
              ],
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
            id: "water",
            type: "fill",
            source: "mock-map-data",
            filter: ["==", ["get", "surface"], "water"],
            paint: {
              "fill-color": style === "dark" ? "#4b416e" : "#c5a5ef",
            },
          },
          {
            id: "park",
            type: "fill",
            source: "mock-map-data",
            filter: ["==", ["get", "surface"], "park"],
            paint: { "fill-color": "#888888" },
          },
          {
            id: "landcover_wood",
            type: "fill",
            source: "mock-map-data",
            filter: ["==", ["get", "surface"], "wood"],
            paint: { "fill-color": "#888888" },
          },
          {
            id: "road-casing",
            type: "line",
            source: "mock-map-data",
            filter: ["==", ["get", "surface"], "road"],
            paint: { "line-color": "#e9c179", "line-width": 8 },
          },
          {
            id: "road",
            type: "line",
            source: "mock-map-data",
            filter: ["==", ["get", "surface"], "road"],
            paint: { "line-color": "#ffffff", "line-width": 4 },
          },
          { id: "places", type: "circle", source: "mock-map-data" },
        ],
      },
    });
  });
  return styles;
};

const requireWebGL = async (page: Page) => {
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  const hasWebGL = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return context !== null;
  });
  // Renderer cases require WebGL; the fallback has separate coverage.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!hasWebGL, "This browser does not support WebGL 2.");
};

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
        name: "Map of the British Isles with my avatar marking East London, United Kingdom",
      });
      await expect(map).toBeVisible();
      await expect(figure.locator("figcaption")).toContainText(
        "I'm from East London.",
      );
      await expect(figure.locator("figcaption")).not.toContainText(
        "United Kingdom",
      );
      const caption = figure.locator("figcaption");
      await expect(caption.locator(".location-map__caption-text")).toHaveCSS(
        "font-style",
        "italic",
      );
      await expect(caption).toHaveCSS("text-align", "start");
      await expect(caption).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(caption.locator("small")).toHaveCSS("font-style", "normal");
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
      const cardBounds = (await page
        .locator(".about__container")
        .boundingBox())!;
      expect(bounds!.x).toBeCloseTo(cardBounds.x, 0);
      expect(bounds!.width).toBeCloseTo(cardBounds.width, 0);
      const captionBounds = (await caption.boundingBox())!;
      const cardPadding = await page
        .locator(".about__container")
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingInlineStart),
        );
      await expectCaptionAlignedWithCopy(page, figure);
      expect(captionBounds.x).toBeGreaterThanOrEqual(
        cardBounds.x + cardPadding - 1,
      );
      expect(captionBounds.x + captionBounds.width).toBeLessThanOrEqual(
        cardBounds.x + cardBounds.width - cardPadding + 1,
      );
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
      "I'm from East London.",
    );
    await expect(
      page.getByRole("img", {
        name: "Map of the British Isles with my avatar marking East London, United Kingdom",
      }),
    ).toBeVisible();
    await expect(page.locator(".location-map__pin image")).toHaveAttribute(
      "href",
      photo,
    );
  });
});

for (const viewport of [
  { width: 412, height: 823 },
  { width: 1350, height: 940 },
  { width: 1350, height: 2200 },
]) {
  test(`The introductory map defers loading before engagement at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const mapRequests: string[] = [];
    page.on("request", (request) => {
      if (/maplibre-gl|openfreemap|geojs/.test(request.url())) {
        mapRequests.push(request.url());
      }
    });
    const styles = await mockOpenFreeMap(page);
    await page.goto("/about/", { waitUntil: "load" });
    const figure = page.locator(".location-map");
    await expect(
      page.getByRole("button", { name: "Open search" }),
    ).toBeEnabled();
    expect(
      await figure.evaluate((element) => ({
        before: element.previousElementSibling?.textContent,
        after: element.nextElementSibling?.textContent,
      })),
    ).toEqual({
      before: expect.stringContaining("I am a professional Software Developer"),
      after: expect.stringContaining("I occasionally appear on"),
    });
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => {
            resolve(null);
          });
        }),
    );
    expect(styles).toEqual([]);
    expect(mapRequests).toEqual([]);
    await expect(figure).not.toHaveClass(/location-map--interactive/);
    await expect(figure).toHaveAttribute("tabindex", "0");
  });
}

test("An initially visible map activates on a small scroll without leaving the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1350, height: 2200 });
  const styles = await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "load" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await expect(page.getByRole("button", { name: "Open search" })).toBeEnabled();
  await expect(figure).toBeInViewport();
  expect(styles).toEqual([]);

  await page.mouse.wheel(0, 1);
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect(figure).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  expect(styles).toEqual(["positron"]);
});

test("Pre-hydration scrolling does not activate a map left offscreen", async ({
  page,
}) => {
  const styles = await mockOpenFreeMap(page);
  const scripts = await delayClientScripts(page);
  try {
    await page.goto("/about/", { waitUntil: "commit" });
    const figure = page.locator(".location-map");
    await figure.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(styles).toEqual([]);
    scripts.resume();
    await requireWebGL(page);
    await expect(
      page.getByRole("button", { name: "Open search" }),
    ).toBeEnabled();
    await expect(figure).not.toHaveClass(/location-map--interactive/);
    expect(styles).toEqual([]);

    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveClass(/location-map--interactive/);
    expect(styles).toEqual(["positron"]);
  } finally {
    await scripts.dispose();
  }
});

for (const { activation, engage, outline } of [
  {
    activation: "keyboard",
    engage: (figure: Locator) => figure.focus(),
    outline: "solid",
  },
  {
    activation: "pointer",
    engage: (figure: Locator) => figure.click(),
    outline: "none",
  },
]) {
  test(`An initially visible map loads on ${activation} engagement without scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1350, height: 2200 });
    const styles = await mockOpenFreeMap(page);
    await page.goto("/about/", { waitUntil: "load" });
    await requireWebGL(page);
    const figure = page.locator(".location-map");
    const viewport = figure.locator(".location-map__viewport");
    await expect(figure).toBeInViewport();
    const initialBounds = await viewport.boundingBox();
    expect(styles).toEqual([]);

    await engage(figure);
    await expect(figure).toBeFocused();
    await expect(figure).toHaveCSS("outline-style", outline);
    // Overlapping entry events must not construct two maps.
    await figure.dispatchEvent("pointerdown");
    await expect(figure).toHaveClass(/location-map--interactive/);
    expect(styles).toEqual(["positron"]);
    expect(await viewport.boundingBox()).toEqual(initialBounds);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(figure).toBeFocused();
    await expect(figure.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  });
}

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
    "Map showing East London, the UK and Europe",
  );
  const pin = figure.locator(".maplibregl-marker.location-map__marker");
  await expect(pin).toHaveCount(1);
  await expect(pin).toHaveCSS("display", "grid");
  const avatar = pin.locator(".location-map__avatar");
  await expect(avatar).toHaveAttribute("src", /Logo-192x192\.png/);
  await expect(pin.locator('source[type="image/avif"]')).toHaveAttribute(
    "srcset",
    /\/_ipx\/.*Logo-192x192\.png/,
  );
  await avatar.evaluate((image: HTMLImageElement) => image.decode());
  expect(
    await avatar.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThanOrEqual(62);
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
  await expectLandPalette(page);
  await expect(figure.getByRole("status")).toHaveText(
    "Your approximate location is unavailable. Showing East London and Europe.",
  );

  await page.getByRole("button", { name: "Toggle dark/light" }).click();
  await expect.poll(() => styles).toEqual(["positron", "dark"]);
  await expect(pin).toBeVisible();
  await expectLandPalette(page);
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

test("Natural parks and woodland retain differentiated road colours in both themes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const styles = await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  for (const theme of ["positron", "dark"]) {
    await expect.poll(() => styles.at(-1)).toBe(theme);
    await expectLandPalette(page);
    const colours = await figure.evaluate((element) => {
      const context = document.createElement("canvas").getContext("2d")!;
      const css = getComputedStyle(element);
      return [
        css.getPropertyValue("--location-map-park-color").trim(),
        css.getPropertyValue("--location-map-wood-color").trim(),
        "#e9c179",
        "#ffffff",
      ].map((colour) => {
        context.fillStyle = colour;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      });
    });
    await expect
      .poll(async () => {
        const pixels = await sharp(
          await figure.locator(".maplibregl-canvas").screenshot(),
        )
          .removeAlpha()
          .raw()
          .toBuffer();
        return colours.every((colour) => {
          let count = 0;
          for (let offset = 0; offset < pixels.length; offset += 3) {
            if (
              colour.every(
                (channel, index) =>
                  Math.abs(pixels[offset + index]! - channel) < 3,
              )
            ) {
              count++;
            }
          }
          return count > 40;
        });
      })
      .toBe(true);
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
  }
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
    "The interactive map could not load. Showing a static map of East London.",
  );
  await expect(figure.getByRole("status")).toHaveCSS("position", "absolute");
  await expect(figure.getByRole("status")).toHaveCSS(
    "clip",
    "rect(0px, 0px, 0px, 0px)",
  );
  await expect(figure.locator("figcaption")).not.toContainText(
    "could not load",
  );
  await expect(figure).not.toHaveClass(/location-map--interactive/);
  await expect(figure.locator(".location-map__illustration")).toBeVisible();
  await expect(figure.locator(".maplibregl-canvas")).toHaveCount(0);
  await expect(figure.locator(".location-map__pin image")).toHaveAttribute(
    "href",
    photo,
  );
});

test("The interactive map and distance load with the required hosting CSP origins", async ({
  page,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(`Map CSP violation: ${event.blockedURI}`);
    });
  });
  page.on("console", (message) => {
    if (message.text().startsWith("Map CSP violation:")) {
      violations.push(message.text());
    }
  });
  await page.route("**/about/", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com/analytics.js https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com https://webmention.io https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://tiles.openfreemap.org https://get.geojs.io; img-src 'self' data: https:; font-src 'self' data:; worker-src 'self'",
      },
    });
  });
  await page.route(geoUrl, (route) =>
    route.fulfill({ json: { longitude: "2.3522", latitude: "48.8566" } }),
  );
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  await requireWebGL(page);
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveClass(/location-map--interactive/);
  await expect(figure.locator("figcaption")).toContainText(
    "according to your IP address",
  );
  expect(violations).toEqual([]);
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
    await expectLandPalette(page);
    await testInfo.attach("Interactive London photo map", {
      body: await figure.screenshot(),
      contentType: "image/png",
    });
  });
}

const expectConnectionForPlace = async (page: Page, place: string) => {
  if (place === "New York") {
    await expectDottedConnection(page);
  }
};

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
      `I'm from East London, roughly ${miles} miles away from your current location, according to your IP address.`,
    );
    await expect(figure.locator("figcaption em")).toHaveText(`${miles} miles`);
    await expectCaptionAlignedWithCopy(page, figure);
    await expect(figure.locator("figcaption")).toHaveAttribute(
      "aria-live",
      "polite",
    );
    await expect(figure.locator("figcaption")).toHaveAttribute(
      "aria-atomic",
      "true",
    );
    await expect(figure.getByRole("status")).toHaveCount(0);
    await expect(figure).not.toContainText("Approximate location via");
    await expectPinInsideMap(page, ".location-map__marker");
    await expectPinInsideMap(page, ".location-map__visitor");
    await expectLocationsFillView(page, [Number(longitude), Number(latitude)]);
    await expectConnectionForPlace(page, place);
    await expect(figure).toContainText("GeoJS");
    expect(lookups).toEqual([geoUrl]);
    await page.setViewportSize({ width: 375, height: 900 });
    await expectCaptionAlignedWithCopy(page, figure);
    await expectPinInsideMap(page, ".location-map__marker");
    await expectPinInsideMap(page, ".location-map__visitor");
    await expectLocationsFillView(page, [Number(longitude), Number(latitude)]);
    await page.getByRole("button", { name: "Toggle dark/light" }).click();
    await expect(
      figure.locator(".maplibregl-marker.location-map__visitor"),
    ).toHaveCount(1);
    await expectConnectionForPlace(page, place);
  });
}

test.describe("High contrast and scaled layouts", () => {
  test.use({ deviceScaleFactor: 2 });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`Map controls and both pins remain usable at 200% reflow in ${colorScheme} high contrast`, async ({
      page,
    }, testInfo) => {
      // Half a 1280px desktop's CSS viewport, with twice the pixel density.
      // This covers reflow and scaling, not native browser zoom or Narrator.
      await page.setViewportSize({ width: 640, height: 450 });
      await page.emulateMedia({
        colorScheme,
        forcedColors: "active",
        reducedMotion: "reduce",
      });
      await page.route(geoUrl, (route) =>
        route.fulfill({
          json: { longitude: "178.4501", latitude: "-18.1416" },
        }),
      );
      await mockOpenFreeMap(page);
      await page.goto("/about/", { waitUntil: "domcontentloaded" });
      await requireWebGL(page);
      const figure = page.locator(".location-map");
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toHaveClass(/location-map--interactive/);
      await expectPinInsideMap(page, ".location-map__marker");
      await expectPinInsideMap(page, ".location-map__visitor");
      await expect(figure.getByRole("status")).toHaveCount(0);
      const zoom = figure.getByRole("button", { name: "Zoom in" });
      await zoom.focus();
      await expect(zoom).toBeFocused();
      await expect(zoom).not.toHaveCSS("outline-style", "none");
      const credits = figure.locator(".maplibregl-ctrl-attrib-inner");
      await expect(credits).toBeHidden({ timeout: 7000 });
      const toggle = figure.locator(".maplibregl-ctrl-attrib-button");
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(credits).toBeVisible();
      await expect(credits.getByRole("link", { name: "GeoJS" })).toBeVisible();
      const bounds = (await figure.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(640);
      await testInfo.attach("High-contrast map at double pixel density", {
        body: await figure.screenshot(),
        contentType: "image/png",
      });
    });
  }
});

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
      "Your approximate location is unavailable. Showing East London and Europe.",
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
    "Your approximate location is unavailable. Showing East London and Europe.",
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
    const getContext = Object.getOwnPropertyDescriptor(
      HTMLCanvasElement.prototype,
      "getContext",
    );
    if (!getContext || typeof getContext.value !== "function") {
      throw new Error("Canvas getContext is unavailable.");
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(
        this: HTMLCanvasElement,
        contextId: string,
        ...args: unknown[]
      ): unknown {
        if (contextId === "webgl2" || contextId === "webgl") {
          return null;
        }
        return Reflect.apply(
          getContext.value as (...args: unknown[]) => unknown,
          this,
          [contextId, ...args],
        );
      },
    });
  });
  await mockOpenFreeMap(page);
  await page.goto("/about/", { waitUntil: "domcontentloaded" });
  const figure = page.locator(".location-map");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.getByRole("status")).toHaveText(
    "The interactive map could not load. Showing a static map of East London.",
  );
  await expect(figure).not.toHaveClass(/location-map--interactive/);
  await expect(figure.locator(".location-map__illustration")).toBeVisible();
  await expect(figure.locator(".location-map__pin image")).toHaveAttribute(
    "href",
    photo,
  );
});
