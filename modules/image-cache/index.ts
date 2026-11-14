import { join } from "node:path";
import imageModule from "@nuxt/image";
import { z } from "zod";
import { defineNuxtModule, useLogger } from "nuxt/kit";
import { imageCacheDirectory, prepareImageCache } from "./cache";

const sourceDirsSchema = z.object({
  baseURL: z.string(),
  fs: z.union([
    z.literal(false),
    z.object({ dir: z.union([z.string(), z.array(z.string())]) }),
  ]),
});

export default defineNuxtModule({
  meta: { name: "image-cache" },
  setup(_options, nuxt) {
    if (nuxt.options.dev || !nuxt.options.nitro.static) {
      return;
    }

    nuxt.hook("nitro:config", (config) => {
      config.publicAssets ||= [];
      config.publicAssets.push({
        dir: join(nuxt.options.rootDir, imageCacheDirectory, "public", "_ipx"),
        baseURL: "/_ipx",
        maxAge: 0,
        // New sizes must still reach IPX rather than being excluded by the crawler.
        fallthrough: true,
      });
    });
    nuxt.hook("nitro:init", async (nitro) => {
      // @nuxt/image resolves ipxStatic, aliases and source directories in its
      // earlier nitro:init hook. _config is used by prerendering.
      const ipx: unknown = nitro.options._config.runtimeConfig?.ipx;
      const sources = sourceDirsSchema.optional().parse(ipx);
      const image = await imageModule.getOptions!({}, nuxt);
      const bypassReason =
        !sources || sources.baseURL !== "/_ipx"
          ? "Responsive image caching requires the local /_ipx provider."
          : Object.keys(image.providers).length > 0
            ? "Custom image provider implementations cannot be fingerprinted safely."
            : undefined;
      const cache = await prepareImageCache(
        nuxt.options.rootDir,
        {
          image,
          ipx,
          baseURL: nuxt.options.app.baseURL,
          environment: Object.fromEntries(
            Object.entries(process.env).filter(
              ([key]) =>
                /^(?:(?:NUXT|NITRO)_)?IPX_/.test(key) ||
                key.startsWith("VIPS_") ||
                key.startsWith("SHARP_"),
            ),
          ),
        },
        sources?.fs ? [sources.fs.dir].flat() : [],
        bypassReason,
      );
      const logger = useLogger("image-cache");
      if (cache.disabledReason) {
        logger.warn(
          `${cache.disabledReason} Responsive image cache reuse is disabled.`,
        );
      } else {
        logger.info(
          cache.hit
            ? "Reusing responsive images from the previous build."
            : "Image inputs changed; generating a fresh responsive image cache.",
        );
      }
      // Restored public assets are copied after prerendering, before compilation completes.
      nitro.hooks.hook("compiled", async () => {
        await cache.save(nitro.options.output.publicDir);
      });
    });
  },
});
