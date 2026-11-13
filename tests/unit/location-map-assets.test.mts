import assert from "node:assert/strict";
import { test } from "node:test";
import type { NuxtManifest } from "@nuxt/schema";
import { deferMapAssets } from "../../modules/location-map/assets.ts";

void test("map source identities defer hashed renderer, CSS and worker assets only", () => {
    const manifest: NuxtManifest = {
        "node_modules/maplibre-gl/dist/maplibre-gl.js": {
            file: "renderer-abc.js",
            isDynamicEntry: true,
            prefetch: true,
            preload: true,
        },
        "node_modules/maplibre-gl/dist/maplibre-gl.css": {
            file: "map-css-wrapper.js",
            css: ["map-abc.css"],
        },
        "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url": {
            file: "worker-url-abc.js",
            assets: ["worker-abc.js"],
        },
        "map-abc.css": {
            file: "map-abc.css",
            prefetch: true,
            preload: true,
        },
        "worker-abc.js": {
            file: "worker-abc.js",
            prefetch: true,
            preload: true,
        },
        "app/pages/about.vue": {
            file: "about-abc.js",
            prefetch: true,
            preload: true,
            dynamicImports: ["node_modules/maplibre-gl/dist/maplibre-gl.js"],
        },
        "app/pages/portfolio.vue": {
            file: "portfolio-abc.js",
            prefetch: true,
            preload: true,
        },
    };
    const files = deferMapAssets(manifest);
    assert.deepEqual(
        [...files].sort(),
        [
            "renderer-abc.js",
            "map-css-wrapper.js",
            "map-abc.css",
            "worker-url-abc.js",
            "worker-abc.js",
        ].sort(),
    );
    for (const resource of Object.values(manifest)) {
        if (files.has(resource.file)) {
            assert.equal(resource.prefetch, false);
            assert.equal(resource.preload, false);
        } else {
            assert.equal(resource.prefetch, true);
            assert.equal(resource.preload, true);
        }
    }
    assert.equal(manifest["app/pages/about.vue"]!.dynamicImports?.length, 1);
});

void test("map assets are recognised from Windows source paths without touching shared imports", () => {
    const manifest: NuxtManifest = {
        "_anonymous-renderer.js": {
            src: "C:\\project\\node_modules\\maplibre-gl\\dist\\maplibre-gl.js",
            file: "opaque-renderer.js",
            imports: ["shared"],
        },
        shared: {
            file: "shared.js",
            prefetch: true,
            preload: true,
        },
    };
    assert.deepEqual([...deferMapAssets(manifest)], ["opaque-renderer.js"]);
    assert.equal(manifest.shared!.prefetch, true);
    assert.equal(manifest.shared!.preload, true);
});
