<template>
  <u-intersect root-margin="200px" @enterFirstTime="loadMap">
    <figure
      class="location-map"
      :class="{ 'location-map--interactive': mapReady }">
      <div class="location-map__viewport">
        <div
          ref="mapContainer"
          class="location-map__canvas"
          role="region"
          aria-label="Interactive map showing London and your approximate location when available"
          :aria-hidden="!mapReady"
          :inert="!mapReady" />
        <svg
          class="location-map__illustration"
          viewBox="0 0 640 400"
          role="img"
          :aria-hidden="mapReady"
          aria-label="Map of the British Isles with my avatar marking London, United Kingdom">
          <defs>
            <clipPath :id="avatarClipId">
              <circle cx="0" cy="-62" r="31" />
            </clipPath>
          </defs>
          <path
            class="location-map__grid"
            d="M0 100H640M0 200H640M0 300H640M160 0V400M320 0V400M480 0V400" />
          <!-- Public-domain Natural Earth 1:110m country outlines, projected from
           longitude -15..15 and latitude 60..47 into this viewBox.
           https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson -->
          <g class="location-map__land">
            <path
              d="M555.3 35.2L564.7 17.5L582.4 -3.6L589.5 -39.8L575.8 -55.4L574.5 -96.3L588.4 -125.1L609.5 -124.6L617.0 -136.8L609.2 -147.3L642.3 -190.6L663.7 -224.7L677.7 -246.6L698.2 -246.5L703.9 -263.6L744.1 -258.7L747.2 -278.9L760.4 -280.2L788.9 -265.1L822.2 -244.2L822.7 -196.8L829.9 -184.8L793.2 -176.1L772.6 -154.6L775.9 -135.8L741.9 -111.1L700.8 -84.6L685.2 -41.3L700.4 -19.6L720.8 -2.5L701.2 32.2L679.0 39.4L670.9 91.0L658.8 119.9L632.9 116.9L620.8 141.3L596.1 142.7L589.3 113.6L571.5 78.7L555.3 35.2Z" />
            <path
              d="M821.0 187.3L821.9 200.9L827.8 212.6L827.7 224.9L814.9 231.2L821.5 245.4L821.9 259.1L832.6 286.0L830.4 294.6L819.8 298.2L800.4 323.8L805.9 337.6L801.2 335.8L781.0 324.0L765.6 328.3L755.5 325.2L742.9 331.8L732.2 320.9L723.4 325.1L722.2 323.2L712.4 308.0L696.5 306.2L694.5 296.5L679.9 293.1L676.7 301.1L665.1 294.7L666.4 286.2L650.5 283.5L640.4 273.6L631.6 254.0L633.3 243.4L628.0 226.9L620.3 216.0L626.2 207.7L621.2 192.1L635.8 183.1L669.1 168.8L696.0 158.4L717.2 163.6L718.9 171.1L739.4 171.5L765.7 175.0L804.9 174.5L815.9 177.8L821.0 187.3Z" />
            <path
              d="M682.2 365.4L680.6 378.0L668.6 378.1L672.7 384.7L665.6 404.5L661.6 409.7L642.9 410.5L632.2 417.5L614.5 415.1L584.0 407.2L579.3 396.4L558.2 401.8L555.7 407.7L542.8 403.3L531.9 402.4L522.2 396.8L525.5 389.3L524.7 383.8L531.1 382.1L541.9 390.7L544.9 382.6L563.8 383.9L579.0 378.4L589.2 379.3L595.9 385.6L597.9 380.4L594.9 360.3L602.5 356.4L610.0 342.2L625.9 352.1L637.9 339.6L645.4 337.3L662.0 346.6L672.0 345.1L681.8 350.9L680.1 354.8L682.2 365.4Z" />
            <path
              d="M524.7 383.8L525.5 389.3L522.2 396.8L531.9 402.4L542.8 403.3L541.1 415.9L531.7 421.1L515.9 417.2L511.3 429.6L501.1 430.6L497.4 425.7L485.5 436.2L475.2 437.6L466.0 431.0L458.7 417.5L448.5 422.4L448.8 408.4L464.4 391.1L463.7 383.3L473.4 386.2L479.3 380.9L497.4 381.1L501.8 374.4L524.7 383.8Z" />
            <path
              d="M448.9 303.8L453.2 310.7L452.0 324.2L445.8 324.8L441.0 322.2L443.4 304.9L448.9 303.8Z" />
            <path
              d="M640.4 273.6L650.5 283.5L666.4 286.2L665.1 294.7L676.7 301.1L679.9 293.1L694.5 296.5L696.5 306.2L712.4 308.0L722.2 323.2L715.8 323.2L712.5 328.8L707.6 330.1L706.2 337.1L702.2 338.6L701.6 341.4L694.3 344.6L684.8 344.1L681.8 350.9L672.0 345.1L662.0 346.6L645.4 337.3L637.9 339.6L625.9 352.1L610.0 342.2L598.0 329.0L587.1 321.6L584.9 308.6L581.1 299.5L596.6 292.8L604.5 285.1L619.9 279.2L625.2 273.3L630.8 276.9L640.4 273.6Z" />
            <path
              d="M187.8 188.7L171.7 182.3L158.5 182.8L162.9 166.3L158.5 149.8L176.3 148.5L199.2 167.6L187.8 188.7ZM254.0 202.9L257.2 185.1L242.9 166.1L242.6 165.7L216.7 160.3L211.6 152.0L219.3 138.2L212.3 129.7L200.8 144.3L199.6 114.6L188.8 98.9L196.5 67.1L213.1 42.2L230.2 44.6L255.9 42.0L233.1 75.3L254.8 71.1L278.2 71.2L272.6 96.3L253.5 123.9L275.5 125.8L277.2 129.1L296.2 165.4L310.8 170.3L323.9 205.4L330.0 217.5L355.9 223.4L353.3 243.1L342.4 252.1L350.9 268.0L331.7 284.1L303.2 283.8L266.9 292.3L256.9 286.2L242.8 300.7L223.1 297.2L208.1 308.9L196.8 302.8L228.1 270.5L247.1 263.8L213.7 258.7L207.6 246.4L229.9 236.9L218.2 220.3L222.3 200.2L254.0 202.9Z" />
            <path
              d="M187.8 188.7L191.3 210.7L175.2 238.2L137.4 256.3L107.2 251.7L124.5 219.5L113.3 188.3L142.3 164.2L158.5 149.8L162.9 166.3L158.5 182.8L171.7 182.3L187.8 188.7Z" />
            <path
              d="M452.0 324.2L462.0 332.2L492.8 337.9L482.0 359.0L479.3 380.9L473.4 386.2L463.7 383.3L464.4 391.1L448.8 408.4L448.5 422.4L458.7 417.5L466.0 431.0L465.1 439.7L471.4 451.3L464.0 460.7L469.5 484.5L481.1 488.4L478.6 501.7L459.3 519.1L417.2 510.8L386.1 520.8L383.7 539.3L359.0 543.3L335.0 529.4L327.2 536.0L287.9 522.0L279.4 510.1L290.5 491.6L294.5 430.3L272.5 398.0L256.8 382.5L224.2 370.6L222.0 348.2L249.7 341.5L285.5 349.4L278.8 314.6L298.9 327.8L348.6 303.8L355.0 278.6L373.6 272.4L376.7 283.2L386.6 283.7L396.5 296.0L411.4 310.5L422.4 308.1L441.0 322.2L445.8 324.8L452.0 324.2Z" />
            <path
              d="M451.3 283.0L448.9 303.8L443.4 304.9L441.0 322.2L422.4 308.1L411.4 310.5L396.5 296.0L386.6 283.7L376.7 283.2L373.6 272.4L390.7 266.3L406.3 268.7L426.1 262.3L439.6 275.8L451.3 283.0Z" />
            <path
              d="M467.3 200.5L471.3 211.0L466.0 239.1L460.6 250.7L447.8 250.7L451.3 283.0L439.6 275.8L426.1 262.3L406.3 268.7L390.7 266.3L401.7 257.8L420.4 212.6L449.6 199.7L467.3 200.5Z" />
            <path
              d="M621.2 192.1L626.2 207.7L620.3 216.0L628.0 226.9L633.3 243.4L631.6 254.0L640.4 273.6L630.8 276.9L625.2 273.3L619.9 279.2L604.5 285.1L596.6 292.8L581.1 299.5L584.9 308.6L587.1 321.6L598.0 329.0L610.0 342.2L602.5 356.4L594.9 360.3L597.9 380.4L595.9 385.6L589.2 379.3L579.0 378.4L563.8 383.9L544.9 382.6L541.9 390.7L531.1 382.1L524.7 383.8L501.8 374.4L497.4 381.1L479.3 380.9L482.0 359.0L492.8 337.9L462.0 332.2L452.0 324.2L453.2 310.7L448.9 303.8L451.3 283.0L447.8 250.7L460.6 250.7L466.0 239.1L471.3 211.0L467.3 200.5L471.5 194.0L489.3 192.4L493.3 199.1L507.7 184.0L502.9 172.4L501.9 155.0L518.0 159.1L531.7 154.4L532.0 166.3L553.6 173.4L553.4 184.3L575.1 178.6L587.1 170.1L611.1 182.3L621.2 192.1Z" />
            <path
              d="M531.7 154.4L518.0 159.1L501.9 155.0L493.2 137.9L492.6 106.5L496.1 98.2L502.3 88.9L521.1 87.0L528.5 78.5L545.7 69.8L545.0 85.7L538.7 95.7L541.2 104.3L552.8 109.0L547.6 120.6L541.2 117.2L525.9 139.4L531.7 154.4ZM583.9 119.6L590.7 135.1L577.9 160.0L555.6 142.6L552.6 129.8L583.9 119.6Z" />
            <path
              d="M983.5 -294.1L947.2 -281.8L930.0 -278.9L939.0 -300.5L911.6 -312.7L878.5 -302.3L868.0 -279.8L847.7 -266.1L824.8 -273.6L796.9 -272.1L773.2 -288.3L760.4 -280.2L747.2 -278.9L744.1 -258.7L703.9 -263.6L698.2 -246.5L677.7 -246.6L663.7 -224.7L642.3 -190.6L609.2 -147.3L617.0 -136.8L609.5 -124.6L588.4 -125.1L574.5 -96.3L575.8 -55.4L589.5 -39.8L582.4 -3.6L564.7 17.5L555.3 35.2L540.9 16.3L498.8 51.9L470.4 59.1L440.9 43.4L433.2 10.4L426.5 -60.6L446.1 -80.4L502.5 -106.3L544.6 -138.0L583.6 -180.9L634.9 -240.3L670.6 -263.5L729.3 -302.1L776.1 -315.5L811.2 -313.9L843.7 -339.4L882.6 -338.0L920.9 -344.2L987.6 -321.7L960.1 -313.4L983.5 -294.1Z" />
          </g>
          <g class="location-map__labels" aria-hidden="true">
            <text x="84" y="286">Ireland</text>
            <text x="193" y="104">United</text>
            <text x="193" y="124">Kingdom</text>
            <text x="342" y="375">France</text>
            <text class="location-map__sea-label" x="364" y="135">
              North Sea
            </text>
          </g>
          <!-- East London: 51.54 N, 0.005 W, using the same projection as the land. -->
          <g class="location-map__pin" transform="translate(319.9 260.3)">
            <circle class="location-map__halo" r="13" />
            <circle r="4" />
            <path d="M0 0C-8-16-36-40-36-62a36 36 0 1 1 72 0C36-40 8-16 0 0Z" />
            <image
              href="/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png"
              :clip-path="`url(#${avatarClipId})`"
              x="-31"
              y="-93"
              width="62"
              height="62" />
          </g>
          <text class="location-map__city" x="349" y="279">London</text>
        </svg>
      </div>
      <div class="location-map__marker-template" aria-hidden="true">
        <div ref="markerTemplate" class="location-map__marker">
          <svg viewBox="0 0 72 98" aria-hidden="true">
            <path
              d="M36 98C28 82 0 58 0 36a36 36 0 1 1 72 0C72 58 44 82 36 98Z" />
          </svg>
          <picture>
            <source
              type="image/avif"
              srcset="/images/author/Muhammad-Rehan-Saeed/Logo-192x192.avif" />
            <img
              src="/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png"
              alt=""
              width="62"
              height="62" />
          </picture>
        </div>
        <div
          ref="visitorTemplate"
          class="location-map__visitor"
          role="img"
          aria-label="Your approximate location">
          <svg viewBox="0 0 72 98" aria-hidden="true">
            <path
              d="M36 98C28 82 0 58 0 36a36 36 0 1 1 72 0C72 58 44 82 36 98Z" />
            <circle cx="36" cy="36" r="28" />
            <text x="36" y="42" text-anchor="middle">You</text>
          </svg>
          <span>You (approx.)</span>
        </div>
      </div>
      <figcaption class="location-map__caption">
        I'm from London<span v-if="distanceMiles !== undefined"
          >, roughly
          <em>{{ distanceMiles.toLocaleString("en-GB") }} miles</em> away from
          your current location, according to your IP address</span
        >.
        <small v-if="!mapReady">
          Map data:
          <a href="https://www.naturalearthdata.com/">Natural Earth</a>
        </small>
      </figcaption>
      <p v-if="mapStatus" class="location-map__notice" role="status">
        {{ mapStatus }}
      </p>
      <p v-if="locationStatus" class="location-map__notice" role="status">
        {{ locationStatus }}
      </p>
    </figure>
  </u-intersect>
</template>

<script setup lang="ts">
import type {
  ExpressionSpecification,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
} from "maplibre-gl";
import { z } from "zod";
import { distanceInMiles } from "#shared/utils/location";

const london: [number, number] = [-0.005, 51.54];
const europe: [[number, number], [number, number]] = [
  [-14, 34],
  [36, 65],
];
const coordinate = (min: number, max: number) =>
  z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max));
const locationSchema = z.object({
  longitude: coordinate(-180, 180),
  latitude: coordinate(-85, 85),
});
const avatarClipId = `${useId()}-location-avatar`;
const mapContainer = ref<HTMLDivElement>();
const markerTemplate = ref<HTMLDivElement>();
const visitorTemplate = ref<HTMLDivElement>();
const mapReady = ref(false);
const mapStatus = ref("");
const locationStatus = ref("");
const distanceMiles = ref<number>();
let map: MapLibreMap | undefined;
let marker: MapLibreMarker | undefined;
let visitorMarker: MapLibreMarker | undefined;
let visitorLocation: [number, number] | undefined;
let locationController: AbortController | undefined;
let resizeObserver: ResizeObserver | undefined;
let reduceMotion = false;
let styleReady = false;
let userMovedMap = false;
let disposed = false;

function mapStyle() {
  return document.documentElement.dataset.theme === "dark"
    ? "https://tiles.openfreemap.org/styles/dark"
    : "https://tiles.openfreemap.org/styles/positron";
}

function removeMap() {
  locationController?.abort();
  visitorMarker?.remove();
  visitorMarker = undefined;
  marker?.remove();
  marker = undefined;
  const previous = map;
  map = undefined;
  previous?.remove();
  mapReady.value = false;
  styleReady = false;
  locationStatus.value = "";
  distanceMiles.value = undefined;
  resizeObserver?.disconnect();
}

function failMap(error: unknown) {
  console.error(
    "[location-map] Could not load the interactive London map.",
    error,
  );
  mapStatus.value =
    "The interactive map could not load. Showing a static map of London.";
  removeMap();
}

function frameMap(animate: boolean) {
  if (!map || userMovedMap) return;
  map.fitBounds(
    visitorLocation
      ? [
          [
            Math.min(london[0], visitorLocation[0]),
            Math.min(london[1], visitorLocation[1]),
          ],
          [
            Math.max(london[0], visitorLocation[0]),
            Math.max(london[1], visitorLocation[1]),
          ],
        ]
      : europe,
    {
      padding: {
        top: visitorLocation ? 104 : 48,
        bottom: 24,
        left: 48,
        right: 48,
      },
      maxZoom: visitorLocation ? 12 : 3.2,
      pitch: 0,
      bearing: 0,
      duration: animate && !reduceMotion ? 3000 : 0,
    },
  );
}

function applyMapPalette() {
  if (!map || !mapContainer.value) return;
  try {
    const theme = getComputedStyle(mapContainer.value);
    const colour = (name: string) =>
      theme.getPropertyValue(`--global-${name}-color`).trim();
    const land = theme.getPropertyValue("--location-map-land-color").trim();
    const landLabel = theme
      .getPropertyValue("--location-map-land-label-color")
      .trim();
    const tint = (amount: number): ExpressionSpecification => [
      "interpolate",
      ["linear"],
      amount,
      0,
      colour("background"),
      1,
      colour("accent"),
    ];
    for (const layer of map.getStyle().layers) {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", land);
      } else if (layer.type === "fill") {
        map.setPaintProperty(
          layer.id,
          "fill-color",
          layer["source-layer"] === "water" ? tint(0.35) : land,
        );
      } else if (layer.type === "line") {
        map.setPaintProperty(
          layer.id,
          "line-color",
          layer.id === "visitor-connection" ? colour("accent") : tint(0.5),
        );
      } else if (layer.type === "symbol" && layer.layout?.["text-field"]) {
        const water = ["water_name", "waterway"].includes(
          layer["source-layer"] ?? "",
        );
        map.setPaintProperty(
          layer.id,
          "text-color",
          water ? colour("body") : landLabel,
        );
        map.setPaintProperty(
          layer.id,
          "text-halo-color",
          water ? tint(0.35) : land,
        );
      }
    }
    updateConnection();
  } catch (error) {
    failMap(error);
  }
}

function updateConnection() {
  if (!map || !visitorLocation || !styleReady) return;
  const id = "visitor-connection";
  if (map.getSource(id)) return;
  map.addSource(id, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [london, visitorLocation],
      },
    },
  });
  map.addLayer(
    {
      id,
      source: id,
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": getComputedStyle(map.getContainer())
          .getPropertyValue("--global-accent-color")
          .trim(),
        "line-width": 2,
        "line-dasharray": [0.1, 2],
      },
    },
    map.getStyle().layers.find((layer) => layer.type === "symbol")?.id,
  );
}

async function loadVisitorLocation(maplibregl: typeof import("maplibre-gl")) {
  const controller = new AbortController();
  locationController = controller;
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Location service returned HTTP ${response.status}.`);
    }
    const location = locationSchema.parse(await response.json());
    if (disposed || !map) return;
    visitorLocation = [location.longitude, location.latitude];
    distanceMiles.value = Math.round(distanceInMiles(london, visitorLocation));
    const element = visitorTemplate.value?.cloneNode(true);
    if (!(element instanceof HTMLElement)) {
      throw new Error("Could not create the visitor marker.");
    }
    visitorMarker = new maplibregl.Marker({ element, anchor: "bottom" })
      .setLngLat(visitorLocation)
      .addTo(map);
    updateConnection();
    frameMap(true);
  } catch (error) {
    if (disposed || !map) return;
    visitorMarker?.remove();
    visitorMarker = undefined;
    visitorLocation = undefined;
    distanceMiles.value = undefined;
    console.warn("[location-map] Could not find approximate location.", error);
    locationStatus.value =
      "Your approximate location is unavailable. Showing London and Europe.";
  } finally {
    clearTimeout(timeout);
    if (locationController === controller) locationController = undefined;
  }
}

function updateTheme() {
  if (!map) return;
  try {
    styleReady = false;
    map.setStyle(mapStyle(), { diff: false });
  } catch (error) {
    failMap(error);
  }
}

async function loadMap() {
  if (disposed) return;
  try {
    const [maplibregl, , { default: workerUrl }] = await Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl.css"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ]);
    if (disposed) return;
    if (!mapContainer.value || !markerTemplate.value) {
      throw new Error("The map container or photo marker is missing.");
    }
    maplibregl.setWorkerUrl(workerUrl);
    reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: mapStyle(),
      center: [-15, 54],
      zoom: 1.5,
      cooperativeGestures: true,
      renderWorldCopies: false,
      attributionControl: {
        customAttribution: '<a href="https://www.geojs.io/">GeoJS</a>',
      },
    });
    if (reduceMotion) frameMap(false);
    map.scrollZoom.disable();
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    const photoPin = markerTemplate.value.cloneNode(true);
    if (!(photoPin instanceof HTMLElement)) {
      throw new Error("Could not create the photo marker.");
    }
    marker = new maplibregl.Marker({ element: photoPin, anchor: "bottom" })
      .setLngLat(london)
      .addTo(map);
    map
      .getCanvas()
      .setAttribute("aria-label", "Map showing London, the UK and Europe");
    map.on("movestart", (event) => {
      if (event.originalEvent) userMovedMap = true;
    });
    map.on("style.load", () => {
      styleReady = true;
      applyMapPalette();
    });
    map.once("error", ({ error }) => failMap(error));
    map.once("load", () => {
      if (disposed || !map) return;
      mapReady.value = true;
      mapStatus.value = "";
      frameMap(true);
      void loadVisitorLocation(maplibregl);
    });
    resizeObserver = new ResizeObserver(() => {
      map?.resize();
      if (mapReady.value) frameMap(false);
    });
    resizeObserver.observe(mapContainer.value);
  } catch (error) {
    if (!disposed) failMap(error);
  }
}

onMounted(() => {
  window.addEventListener("__themeChanged", updateTheme);
});

onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener("__themeChanged", updateTheme);
  removeMap();
});
</script>

<style lang="scss">
.location-map {
  --location-map-land-color: white;
  --location-map-land-label-color: var(--global-body-color);

  inline-size: 100%;
  max-inline-size: 36rem;
  min-inline-size: 0;
  margin: 0 0 var(--global-space-fixed-5);
  overflow: hidden;
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-background-color);
}

[data-theme="dark"] .location-map {
  --location-map-land-label-color: var(--global-background-color);
}

.location-map__viewport {
  position: relative;
  aspect-ratio: 8 / 5;
}

.location-map .location-map__canvas {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.location-map--interactive {
  .location-map__canvas {
    opacity: 1;
    pointer-events: auto;
  }

  .location-map__illustration {
    visibility: hidden;
  }
}

.location-map__marker-template {
  display: none;
}

.location-map__marker {
  inline-size: 72px;
  block-size: 98px;
  pointer-events: none;

  svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    fill: var(--global-accent-color);
  }

  img {
    position: absolute;
    inset-block-start: 5px;
    inset-inline-start: 5px;
    inline-size: 62px;
    block-size: 62px;
    border-radius: 50%;
    object-fit: cover;
  }
}

.location-map__notice {
  min-inline-size: 0;
  margin: 0;
  padding: 0 var(--global-space-fixed-4) var(--global-space-fixed-4);
  font-size: var(--global-font-size-1);
}

.location-map__visitor {
  inline-size: 48px;
  block-size: 66px;
  pointer-events: none;

  svg {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    fill: var(--global-accent-color);
  }

  circle {
    fill: var(--global-content-background-color);
  }

  text {
    fill: var(--global-accent-color);
    font-size: 20px;
    font-weight: var(--global-font-weight-bold);
  }

  span {
    position: absolute;
    inset-block-end: calc(100% + 0.5rem);
    inset-inline-start: 50%;
    transform: translateX(-50%);
    padding: 0.25rem 0.5rem;
    border: var(--global-border-width-1) solid var(--global-accent-color);
    border-radius: var(--global-border-radius);
    background: var(--global-content-background-color);
    color: var(--global-body-color);
    font-size: 12px;
    white-space: nowrap;
  }
}

.location-map__illustration {
  display: block;
  inline-size: 100%;
  block-size: auto;
  background: color-mix(
    in srgb,
    var(--global-alternate-accent-color) 25%,
    var(--global-background-color)
  );
}

.location-map__grid {
  fill: none;
  stroke: var(--global-accent-color);
  stroke-opacity: 0.1;
  stroke-dasharray: 3 8;
}

.location-map__land {
  fill: var(--location-map-land-color);
  stroke: var(--global-accent-color);
  stroke-opacity: 0.3;
  stroke-linejoin: round;
}

.location-map__labels {
  fill: var(--location-map-land-label-color);
  font-size: 17px;
}

.location-map__sea-label {
  fill: var(--global-body-color);
  font-style: italic;
}

.location-map__pin {
  fill: var(--global-accent-color);
}

.location-map__halo {
  fill-opacity: 0.2;
}

.location-map__city {
  fill: var(--location-map-land-label-color);
  font-size: 24px;
  font-weight: var(--global-font-weight-bold);
}

.location-map__caption {
  display: block;
  padding: var(--global-space-fixed-4);

  small {
    display: block;
    font-size: max(12px, 0.65em);
  }
}
</style>
