import { join } from "node:path";
import { defineNuxtModule, useLogger } from "nuxt/kit";
import { prepareImageCache } from "./cache";

export default defineNuxtModule({
  meta: { name: "image-cache" },
  async setup(_options, nuxt) {
    if (nuxt.options.dev || !nuxt.options._generate) return;

    const cache = await prepareImageCache(nuxt.options.rootDir);
    const logger = useLogger("image-cache");
    logger.info(
      cache.hit
        ? "Reusing responsive images from the previous build."
        : "Image inputs changed; generating a fresh responsive image cache.",
    );
    nuxt.hook("nitro:config", (config) => {
      config.publicAssets ||= [];
      config.publicAssets.push({
        dir: join(cache.publicDir, "_ipx"),
        baseURL: "/_ipx",
        // New sizes must still reach IPX rather than being excluded by the crawler.
        fallthrough: true,
      });
    });
    nuxt.hook("nitro:init", (nitro) => {
      nitro.hooks.hook("prerender:done", async ({ failedRoutes }) => {
        if (failedRoutes.length) return;
        await cache.save(nitro.options.output.publicDir);
      });
    });
  },
});
