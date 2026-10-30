import { Renderer, type Node } from "@takumi-rs/core";
import type { OgImageRenderEventContext } from "nuxt-og-image";
import { fitOgTitleLines } from "../utils/og-title-lines";

declare module "nitropack" {
  interface NitroRuntimeHooks {
    "nuxt-og-image:takumi:nodes": (
      nodes: Node,
      context: OgImageRenderEventContext,
    ) => Promise<void>;
  }
}

export default defineNitroPlugin((nitro) => {
  let renderer: Promise<Renderer> | undefined;
  nitro.hooks.hook("nuxt-og-image:takumi:nodes", async (nodes, context) => {
    if (context.options.component !== "BlogTakumi") {
      return;
    }
    renderer ??= (async () => {
      const font = await useStorage("assets:og-font").getItemRaw<Uint8Array>(
        "audiowide-latin-400-normal.woff",
      );
      if (!font) {
        throw new Error("Missing Audiowide social card font");
      }
      const instance = new Renderer();
      await instance.registerFont({
        name: "Audiowide",
        data: font,
        weight: 400,
      });
      return instance;
    })();
    await fitOgTitleLines(nodes, await renderer);
  });
});
