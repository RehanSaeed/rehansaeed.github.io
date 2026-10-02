import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contentPublicDir } from "./modules/blog-content/paths";
import site from "./site.json";

const contentPublicPath = fileURLToPath(
  new URL(contentPublicDir, import.meta.url),
);
// An unknown URL, prerendered as dist/404.html.
const notFoundRoute = "/404-not-found/";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  ssr: true,

  modules: ["@nuxt/content", "@nuxt/image"],

  // Components are imported explicitly with their u- names, as in Gridsome. Only the Nuxt Content
  // prose overrides are auto-registered.
  components: [{ path: "~/components/content", global: true }],

  // Global, as in Gridsome's main.js, so rehype-katex output is styled on every page.
  css: [
    "@fontsource/audiowide/latin-400.css",
    "~/assets/style/index.scss",
    "katex/dist/katex.min.css",
  ],

  app: {
    head: {
      htmlAttrs: { lang: site.language },
      // Gridsome falls back to the site name for pages without a title (the streaming pages).
      title: site.name,
      titleTemplate: `%s - ${site.name}`,
      meta: [
        // Colour Scheme
        { name: "color-scheme", content: "dark light" },
        {
          name: "theme-color",
          content: "#6b17e8",
          media: "(prefers-color-scheme: light)",
        },
        {
          name: "theme-color",
          content: "#ccbdff",
          media: "(prefers-color-scheme: dark)",
        },
        // Windows Meta Tags
        { name: "msapplication-TileColor", content: "#6b17e8" },
        { name: "msapplication-TileImage", content: `${site.url}/favicon.png` },
        // Referrer
        { name: "referrer", content: "no-referrer-when-downgrade" },
      ],
      link: [
        // Favicons
        { rel: "icon", type: "image/svg+xml", href: `${site.url}/favicon.svg` },
        {
          rel: "alternate icon" as "icon",
          href: `${site.url}/favicon.ico`,
          sizes: "any",
        },
        // Apple MacOS Meta Tags
        { rel: "mask-icon", color: "#6b17e8", href: `${site.url}/favicon.svg` },
        // Search
        {
          rel: "search",
          type: "application/opensearchdescription+xml",
          href: `${site.url}/opensearch.xml`,
          title: site.name,
        },
        // Feeds
        {
          rel: "alternate",
          type: "application/atom+xml",
          href: `${site.url}/atom.xml`,
          title: site.name,
        },
        {
          rel: "alternate",
          type: "application/json",
          href: `${site.url}/feed.json`,
          title: site.name,
        },
        {
          rel: "alternate",
          type: "application/rss+xml",
          href: `${site.url}/rss.xml`,
          title: site.name,
        },
        // Webmention
        { rel: "webmention", href: site.webmention.webmentionUrl },
        { rel: "pingback", href: site.webmention.pingbackUrl },
      ],
      script: [
        {
          // Dark / light detection that runs before Vue loads, so there is no flash of the wrong
          // theme. Borrowed from overreacted.io.
          tagPosition: "bodyOpen",
          innerHTML: `(function () {
  function setTheme(newTheme) {
    window.__theme = newTheme;
    preferredTheme = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
    window.dispatchEvent(new CustomEvent("__themeChanged", { detail: newTheme }));
  }

  var preferredTheme;
  try {
    preferredTheme = localStorage.getItem("theme");
  } catch (err) {}

  window.__setPreferredTheme = function (newTheme) {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (err) {}
  };

  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkQuery.addListener(function (e) {
    window.__setPreferredTheme(e.matches ? "dark" : "light");
  });

  setTheme(preferredTheme || (darkQuery.matches ? "dark" : "light"));
})();`,
        },
      ],
    },
  },

  content: {
    build: {
      markdown: {
        // Gridsome never derived title/description from the first heading/paragraph.
        contentHeading: false,
        remarkPlugins: {
          // Not enabled in Gridsome; would turn ":word:" text into emoji.
          "remark-emoji": false,
        },
        highlight: {
          // Closest matches to the old Prism "vs" (light) and "okaidia" (dark) colours. The dark
          // variables are switched on by [data-theme="dark"] in _code.scss.
          theme: { default: "light-plus", dark: "monokai" },
          langs: [
            "cs",
            "css",
            "dockerfile",
            "http",
            "ini",
            "js",
            "json",
            "powershell",
            "sql",
            "xml",
            "yaml",
          ],
        },
      },
    },
    renderer: {
      // Heading anchors are added at build time by rehypeHeadingAnchors (modules/blog-content).
      anchorLinks: false,
    },
    experimental: {
      // Node >= 22.5 built-in node:sqlite, avoiding the better-sqlite3 native build.
      sqliteConnector: "native",
    },
  },

  devServer: {
    port: 8080,
  },

  hooks: {
    // @nuxt/image drops `dirs` that don't exist when it is set up, which is before the local
    // blog-content module copies post images into contentPublicDir.
    "modules:before": () => {
      mkdirSync(contentPublicPath, { recursive: true });
    },
    // Nuxt prerenders static page routes by their path. Give them the canonical trailing slash, as in
    // Gridsome, so "/about" and the crawled "/about/" aren't both rendered to dist/about/index.html.
    "pages:extend": (pages) => {
      for (const page of pages) {
        if (page.path !== "/" && !page.path.includes(":")) {
          page.path = page.path.replace(/\/?$/, "/");
        }
      }
    },
    // GitHub Pages serves 404.html for unknown URLs. Nuxt prerenders it as an empty SPA shell; Gridsome
    // server rendered the not found page instead, so write the rendered error page there.
    "nitro:init": (nitro) => {
      nitro.hooks.hook("prerender:generate", (route) => {
        if (route.route === "/404.html") {
          route.skip = true;
        } else if (route.route === notFoundRoute) {
          if (route.error?.statusCode === 404) {
            delete route.error;
          }
          route.fileName = "/404.html";
        }
      });
    },
  },

  image: {
    // Post images copied by modules/blog-content, so IPX can serve responsive sizes of them.
    dirs: [contentPublicPath],
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
      routes: ["/", "/flexsearch.json", notFoundRoute],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: site.url,
    },
  },
});
