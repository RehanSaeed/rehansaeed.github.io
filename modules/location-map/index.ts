import { defineNuxtModule } from "nuxt/kit";
import { deferMapAssets } from "./assets";

export default defineNuxtModule({
  meta: { name: "location-map" },
  setup(_options, nuxt) {
    let files = new Set<string>();
    nuxt.hook("build:manifest", (manifest) => {
      files = deferMapAssets(manifest);
      if (!nuxt.options.dev && files.size === 0) {
        throw new Error(
          "Could not identify the deferred MapLibre build assets.",
        );
      }
    });
    nuxt.hook("pwa:beforeBuildServiceWorker", (options) => {
      const directory = nuxt.options.app.buildAssetsDir.replace(/^\/|\/$/g, "");
      options.workbox.manifestTransforms = [
        ...(options.workbox.manifestTransforms ?? []),
        (entries) => ({
          manifest: entries.filter(
            (entry) =>
              !entry.url.startsWith(`${directory}/`) ||
              !files.has(entry.url.slice(directory.length + 1)),
          ),
          warnings: [],
        }),
      ];
    });
  },
});
