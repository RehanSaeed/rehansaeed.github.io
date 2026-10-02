import { fileURLToPath } from "node:url";
import site from "./site.json";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  ssr: true,

  app: {
    head: {
      htmlAttrs: { lang: site.language },
      titleTemplate: `%s - ${site.name}`,
    },
  },

  devServer: {
    port: 8080,
  },

  devtools: { enabled: true },

  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: "append",
      },
    },
  },

  nitro: {
    output: {
      // Static output in ./dist so CI (upload-pages-artifact), Lighthouse and `npm start` keep working.
      publicDir: fileURLToPath(new URL("./dist", import.meta.url)),
    },
    prerender: {
      autoSubfolderIndex: true,
      crawlLinks: true,
      failOnError: true,
      routes: ["/"],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: site.url,
    },
  },
});
