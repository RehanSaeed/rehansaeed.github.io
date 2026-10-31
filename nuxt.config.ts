import { mkdirSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { contentPublicDir } from "./modules/blog-content/paths";
import site from "./site.json";

const contentPublicPath = fileURLToPath(
  new URL(contentPublicDir, import.meta.url),
);
// An unknown URL, prerendered as dist/404.html.
const notFoundRoute = "/404-not-found/";
const googleAnalyticsId = process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? "";
if (googleAnalyticsId && !/^G-[A-Z0-9]+$/.test(googleAnalyticsId)) {
  throw new Error(
    "NUXT_PUBLIC_GOOGLE_ANALYTICS_ID must be a GA4 G- measurement ID.",
  );
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  ssr: true,

  modules: [
    "@nuxt/content",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxtjs/seo",
    "@vite-pwa/nuxt",
    "@nuxt/a11y",
    "@nuxt/eslint",
    "@nuxt/fonts",
  ],

  icon: {
    componentName: "NuxtIcon",
    // GitHub Pages and offline navigation have no runtime icon API.
    provider: "none",
    serverBundle: false,
    customCollections: [{ prefix: "blog", dir: "./app/assets/icons" }],
    clientBundle: {
      scan: false,
      includeCustomCollections: true,
      sizeLimitKb: 48,
      icons: [
        "blog:rehan",
        "fa-brands:facebook",
        "fa-brands:github",
        "fa-brands:linkedin",
        "fa-brands:mastodon",
        "fa-brands:patreon",
        "fa-brands:paypal",
        "fa-brands:reddit",
        "fa-brands:stack-overflow",
        "fa-brands:twitch",
        "fa-brands:twitter",
        "fa-brands:youtube",
        "fa-regular:envelope",
        "fa-regular:question-circle",
        "fa-solid:rss",
        "fa-solid:share-alt",
        "fa-solid:user",
        "feather:arrow-left",
        "feather:arrow-right",
        "feather:moon",
        "feather:rotate-cw",
        "feather:search",
        "feather:sun",
        "feather:volume-2",
        "feather:volume-x",
        "feather:x",
        "lucide:house-heart",
        "simple-icons:bluesky",
        "simple-icons:buymeacoffee",
      ],
    },
  },

  fonts: {
    provider: "npm",
    families: [
      ...(["normal", "italic"] as const).map((style) => ({
        name: "Cascadia Code Variable",
        src: import.meta.resolve(
          `@fontsource-variable/cascadia-code/files/cascadia-code-latin-wght-${style}.woff2`,
        ),
        weight: "200 700",
        style,
        display: "swap" as const,
        // The shared --global-font-family-monospace variable is not auto-detected.
        global: true,
        preload: false,
      })),
      {
        name: "Audiowide",
        weights: [400],
        styles: ["normal"],
        subsets: ["latin"],
        preload: true,
        providerOptions: {
          npm: {
            package: "@fontsource/audiowide",
            file: "latin-400.css",
          },
        },
      },
    ],
  },

  scripts: {
    registry: {
      googleAnalytics: {
        proxy: false,
        bundle: false,
      },
    },
  },

  site: {
    url: site.url,
    name: site.name,
    description: site.description,
    defaultLocale: site.language,
    trailingSlash: true,
  },

  seo: {
    // Search/filter parameters do not create separate indexable blog pages.
    canonicalQueryWhitelist: [],
    // Body minification changes Shiki's hydrated style text without updating its Content payload.
    minify: { build: false, runtime: true },
  },

  robots: {
    mergeWithRobotsTxtPath: false,
    credits: false,
    blockAiBots: false,
    allow: ["/"],
  },

  sitemap: {
    zeroRuntime: true,
    xsl: false,
    credits: false,
    discoverImages: true,
    discoverVideos: false,
    exclude: [notFoundRoute, "/streaming/border", "/streaming/thumbnail"],
  },

  schemaOrg: {
    identity: {
      type: "Person",
      "@id": `${site.url}/#identity`,
      name: site.author.name,
      url: `${site.url}/about/`,
      image: `${site.url}/images/author/Muhammad-Rehan-Saeed/Logo-512x512.png`,
      sameAs: [
        site.author.gitHub.url,
        site.author.linkedIn.url,
        site.author.stackOverflow.url,
        site.author.youtube.url,
        site.author.twitch.url,
      ],
    },
  },

  ogImage: {
    zeroRuntime: true,
    buildCache: true,
    defaults: { width: 1200, height: 630, extension: "png", emojis: false },
  },

  aiReady: {
    // Pages has no request-time server, and Cloudflare caches URLs rather than Accept variants.
    contentNegotiation: false,
    botNegotiation: false,
    database: false,
    // Convert rendered content, including our build-time snippet/diagram/Markdown extensions.
    contentSource: false,
    llmsTxt: { pages: "sitemap", markdownLinks: true },
    // Static discovery must read the completed page index, not an earlier cached response.
    llmsTxtCacheSeconds: 0,
    llmsFullTxt: true,
    sitemapMd: true,
    describedby: true,
    contentSignal: { search: true, aiInput: true, aiTrain: true },
  },

  skewProtection: {
    bundleAssets: true,
    retentionDays: 30,
    maxNumberOfVersions: 10,
  },

  linkChecker: {
    runOnBuild: true,
    failOnError: true,
    fetchRemoteUrls: false,
    excludeLinks: [
      // An intentionally fictional example in the pull-request etiquette post.
      "https://rehansaeed.com/why-x-is-better-than-y",
    ],
    report: {
      json: true,
      markdown: true,
      storage: ".data/link-checker-report",
      publish: false,
    },
  },

  // Keep the existing service worker and manifest URLs so installed users get an update
  // of the old service worker rather than a second one. The whole site is precached for offline use.
  pwa: {
    strategies: "generateSW",
    registerType: "prompt",
    injectRegister: false,
    client: { installPrompt: true },
    filename: "service-worker.js",
    manifestFilename: "manifest.webmanifest",
    scope: "/",
    manifest: {
      id: "/",
      name: site.name,
      short_name: site.shortName,
      description: site.description,
      categories: ["education"],
      lang: site.language,
      dir: "ltr",
      start_url: "/",
      scope: "/",
      display: "minimal-ui",
      theme_color: "#6b17e8",
      background_color: "#f2f4f7",
      icons: [
        ...[512, 384, 192, 180, 152, 144, 128, 120, 96, 72, 48, 16].map(
          (size) => ({
            src: `/images/icons/favicon-${size}x${size}.png`,
            type: "image/png",
            sizes: `${size}x${size}`,
            purpose: "any",
          }),
        ),
        {
          src: "/images/icons/favicon-512x512.png",
          type: "image/png",
          sizes: "512x512",
          purpose: "maskable",
        },
      ],
      screenshots: [
        { page: "blog", label: "Read the latest software engineering posts" },
        { page: "portfolio", label: "Explore open-source projects" },
        { page: "about", label: "About Muhammad Rehan Saeed" },
      ].flatMap(({ page, label }) => [
        {
          src: `/images/screenshots/${page}-wide.png`,
          sizes: "1440x900",
          type: "image/png",
          form_factor: "wide" as const,
          label,
        },
        {
          src: `/images/screenshots/${page}-narrow.png`,
          sizes: "390x844",
          type: "image/png",
          form_factor: "narrow" as const,
          label,
        },
      ]),
      // Bump icon URL versions when artwork changes so installed jumplists
      // detect a manifest update; replacing bytes at the same URL is not enough.
      shortcuts: [
        {
          name: "Blog",
          short_name: "Blog",
          description: "Read the latest blog posts.",
          url: "/",
          icons: [{ src: "/images/icons/blog.png?v=2", sizes: "192x192" }],
        },
        {
          name: "Portfolio",
          short_name: "Portfolio",
          description: "View the portfolio of my projects.",
          url: "/portfolio/",
          icons: [{ src: "/images/icons/portfolio.png?v=2", sizes: "192x192" }],
        },
        {
          name: "About",
          short_name: "About",
          description: "About Muhammad Rehan Saeed.",
          url: "/about/",
          icons: [{ src: "/images/icons/about.png?v=2", sizes: "192x192" }],
        },
      ],
    },
    workbox: {
      clientsClaim: true,
      globPatterns: [
        "**/*.{js,json,css,html,png,jpg,jpeg,svg,gif,woff2,webp,avif}",
      ],
      globIgnores: [
        "images/items/**/*",
        "images/reactions/**/*",
        "images/thumbnails/**/*",
        // Originals only used by the feeds and social meta. Pages use the /_ipx/ resized copies.
        "content-images/**/*",
        "images/hero/**/*.{png,jpg,jpeg}",
        // Social cards are not needed to read the complete blog offline.
        "_og/**/*",
        "_og-static-fonts/**/*",
        // Precached as /404 and /200, which respond 404 and would fail the whole install.
        "404.html",
        "200.html",
      ],
      // Also ignore Nuxt's payload cache buster and shortcut icon URL versions offline.
      ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^_b$/, /^v$/],
      // No SPA fallback. Clean URLs resolve to their prerendered index.html.
      navigateFallback: null,
      directoryIndex: "index.html",
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ url, sameOrigin }) =>
            sameOrigin && /^\/sounds\/v\d+\/[^/]+\.wav$/.test(url.pathname),
          handler: "CacheFirst",
          options: {
            cacheName: "ui-sounds-v1",
            cacheableResponse: { statuses: [200] },
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
      ],
      // The feeds are around 1 MB each.
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
  },

  components: [
    { path: "~/components/content", global: true },
    { path: "~/components/OgImage", island: true },
    {
      path: "~/components",
      prefix: "U",
      pathPrefix: false,
      ignore: ["**/content/**", "**/OgImage/**"],
    },
  ],

  // Global so rehype-katex output is styled on every page.
  css: ["~/assets/style/index.scss", "katex/dist/katex.min.css"],

  app: {
    head: {
      htmlAttrs: { lang: site.language },
      // Fall back to the site name for pages without a title (the streaming pages).
      title: site.name,
      titleTemplate: `%s - ${site.name}`,
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "twitter:card", content: "summary_large_image" },
        // Colour Scheme
        { name: "color-scheme", content: "dark light" },
        { name: "theme-color", content: "#6b17e8" },
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
        // Progressive Web App
        { name: "application-name", content: site.name },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: site.name },
        // Windows Meta Tags
        { name: "msapplication-TileColor", content: "#6b17e8" },
        { name: "msapplication-TileImage", content: `${site.url}/favicon.png` },
        // Referrer
        { name: "referrer", content: "no-referrer-when-downgrade" },
      ],
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/images/icons/favicon-180x180.png",
        },
        // Favicons
        { rel: "icon", type: "image/svg+xml", href: `${site.url}/favicon.svg` },
        {
          rel: "alternate icon" as "icon",
          href: `${site.url}/favicon.ico`,
          sizes: "any",
        },
        // Progressive Web App
        { rel: "manifest", href: "/manifest.webmanifest" },
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
          // Resolve the theme before stylesheets and body parsing, not just before Vue loads.
          // Otherwise the initial colour change can trigger the theme transitions.
          tagPosition: "head",
          tagPriority: 0,
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
    setTheme(e.matches ? "dark" : "light");
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
        // Do not derive title/description from the first heading/paragraph.
        contentHeading: false,
        remarkPlugins: {
          // Keep literal ":word:" text instead of turning it into emoji.
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
    // Nuxt prerenders static page routes by their path. Give them the canonical trailing slash so
    // "/about" and the crawled "/about/" aren't both rendered to dist/about/index.html.
    "pages:extend": (pages) => {
      for (const page of pages) {
        if (page.path !== "/" && !page.path.includes(":")) {
          page.path = page.path.replace(/\/?$/, "/");
        }
      }
    },
    // @vite-pwa/nuxt's default manifest transform turns "about/index.html" into "about", but pages
    // use trailing slashes ("/about/"), which then misses the precache when offline. Run first so
    // these entries become "about/" and the module's transform skips them.
    "pwa:beforeBuildServiceWorker": (options) => {
      options.workbox.manifestTransforms = [
        (entries) => {
          for (const entry of entries) {
            entry.url = entry.url.replace(/\/index\.html$/, "/");
          }
          return {
            manifest: entries.filter((entry) => {
              const url = decodeURIComponent(entry.url);
              if (url.startsWith("_ipx/")) {
                return (
                  !/\.(png|jpe?g|webp|avif)$/i.test(url) ||
                  /^_ipx\/[^/]*\bf_avif(?:[,/&]|$)/.test(url)
                );
              }
              // Icons and installation screenshots still need their PNG URLs.
              return (
                !/\.(png|jpe?g|webp)$/i.test(url) ||
                url === "favicon.png" ||
                url.startsWith("images/icons/") ||
                url.startsWith("images/screenshots/")
              );
            }),
          };
        },
        ...(options.workbox.manifestTransforms ?? []),
      ];
    },
    "nitro:config": (nitro) => {
      // Nuxt Scripts beta.16 passes a raw Windows path to Nitro's ESM driver import.
      const cache = nitro.storage?.["nuxt-scripts-cache"];
      if (
        process.platform === "win32" &&
        typeof cache?.driver === "string" &&
        isAbsolute(cache.driver)
      ) {
        cache.driver = pathToFileURL(cache.driver).href;
      }
    },
    // GitHub Pages serves 404.html for unknown URLs. Nuxt prerenders it as an empty SPA shell,
    // so write the server-rendered error page there instead.
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

  $production: {
    sourcemap: { client: false },
  },

  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: "append",
      },
    },
  },

  nitro: {
    serverAssets: [
      {
        baseName: "og-font",
        dir: dirname(
          fileURLToPath(
            import.meta
              .resolve("@fontsource/audiowide/files/audiowide-latin-400-normal.woff"),
          ),
        ),
      },
    ],
    output: {
      // Static output in ./dist so CI (upload-pages-artifact), Lighthouse and `npm start` keep working.
      publicDir: fileURLToPath(new URL("./dist", import.meta.url)),
    },
    prerender: {
      concurrency: 4,
      autoSubfolderIndex: true,
      crawlLinks: true,
      failOnError: true,
      ignore: ["/404-not-found.md", "/404.md", "/200.md"],
      routes: [
        "/",
        "/flexsearch.json",
        "/rss.xml",
        "/feed/index.xml",
        "/atom.xml",
        "/atom.xml.atom",
        "/feed.json",
        notFoundRoute,
      ],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: site.url,
      googleAnalyticsId,
    },
  },
});
