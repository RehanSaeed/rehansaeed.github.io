// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const site = require("./site.json");
const { marked } = require("marked");

module.exports = {
  siteName: site.name,
  // siteDescription: site.description,
  siteUrl: site.url,

  templates: {
    post: "/:permalink",
    tag: "/tag/:title",
    portfolio: "/:permalink",
  },

  plugins: [
    // https://github.com/krmax44/gridsome-plugin-bundle-analyzer
    {
      use: "gridsome-plugin-bundle-analyzer",
      options: {
        onlyProduction: true,
        analyzerOptions: {
          analyzerMode: "static",
          openAnalyzer: false,
        },
      },
    },
    // https://gridsome.org/plugins/@gridsome/plugin-critical
    {
      use: "@gridsome/plugin-critical",
      options: {
        paths: ["/*"],
        width: 1300,
        height: 900,
      },
    },
    // https://gridsome.org/plugins/@gridsome/plugin-google-analytics
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: site.googleAnalyticsId,
      },
    },
    // https://gridsome.org/plugins/@gridsome/plugin-sitemap
    {
      use: "@gridsome/plugin-sitemap",
      options: {
        cacheTime: 600000, // default
        // exclude: ['/exclude-me'],
        config: {
          // '/articles/*': {
          //   changefreq: 'weekly',
          //   priority: 0.5
          // },
          // '/about': {
          //   changefreq: 'monthly',
          //   priority: 0.7
          // }
        },
      },
    },
    // https://gridsome.org/plugins/@gridsome/source-filesystem
    {
      // Create posts from markdown files
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "post",
        path: "content/posts/**/*.md",
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: "tag",
            create: true,
          },
        },
      },
    },
    // https://gridsome.org/plugins/@gridsome/source-filesystem
    {
      // Create posts from markdown files
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "portfolio",
        path: "content/portfolio/**/*.md",
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: "tag",
            create: true,
          },
        },
      },
    },
    // https://gridsome.org/plugins/gridsome-plugin-brotli
    // {
    //   use: "gridsome-plugin-brotli",
    //   options: {
    //     extensions: ["css", "html", "js", "svg", "json"],
    //   },
    // },
    // https://github.com/Microflash/gridsome-plugin-feed
    {
      use: "@microflash/gridsome-plugin-feed",
      options: {
        // Required: array of `GraphQL` type names you wish to include
        contentTypes: ["post"],
        // Optional: any properties you wish to set for `Feed()` constructor
        // See https://www.npmjs.com/package/feed#example for available properties
        feedOptions: {
          title: site.name,
          description: site.description,
          id: site.url,
          link: site.url,
          language: site.language,
          image: site.url + "/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg",
          favicon: site.url + "/favicon.ico",
          copyright: `Copyright © ${new Date().getFullYear()} ${
            site.author.name
          }`,
          feedLinks: {
            atom: site.url + "/atom.xml",
            json: site.url + "/feed.json",
            rss: site.url + "/rss.xml",
          },
          author: {
            name: site.author.name,
            link: site.url,
          },
        },
        atom: {
          enabled: true,
          output: "/atom.xml",
        },
        json: {
          enabled: true,
          output: "/feed.json",
        },
        rss: {
          enabled: true,
          output: "/rss.xml",
        },
        // Optional: the maximum number of items to include in your feed
        maxItems: 300,
        // Optional: an array of properties passed to `Feed.addItem()` that will be parsed for
        // URLs in HTML (ensures that URLs are full `http` URLs rather than site-relative).
        // To disable this functionality, set to `null`.
        htmlFields: ["description", "content"],
        // Optional: if you wish to enforce trailing slashes for site URLs
        enforceTrailingSlashes: false,
        // Optional: a method that accepts a node and returns true (include) or false (exclude)
        // Example: only past-dated nodes: `filterNodes: (node) => node.date <= new Date()`
        filterNodes: (node) => {
          return node.published;
        },
        // Optional: a method that accepts a node and returns an object for `Feed.addItem()`
        // See https://www.npmjs.com/package/feed#example for available properties
        // NOTE: `date` field MUST be a Javascript `Date` object
        nodeToFeedItem: (node) => {
          return {
            title: node.title,
            id: site.url + node.permalink,
            link: site.url + node.permalink,
            description: node.description,
            content: marked(node.content),
            author: [
              {
                name: node.author.name,
                link: site.url,
              },
            ],
            date: new Date(node.date),
            categories: node.tags,
            image: site.url + node.heroImage,
          };
        },
      },
    },
    // https://gridsome.org/plugins/gridsome-plugin-flexsearch
    {
      use: "gridsome-plugin-flexsearch",
      options: {
        collections: [
          {
            typeName: "post",
            indexName: "post",
            fields: ["title", "description", "heroImage", "permalink"],
          },
          {
            typeName: "portfolio",
            indexName: "portfolio",
            fields: ["title", "description", "heroImage", "permalink"],
          },
        ],
        searchFields: ["title", "description"],
      },
    },
    // https://gridsome.org/plugins/gridsome-plugin-pwa
    {
      use: "gridsome-plugin-pwa",
      options: {
        // Service Worker
        disableServiceWorker: false,
        serviceWorkerPath: "service-worker.js",
        cachedFileTypes: "js,json,css,html,png,jpg,jpeg,svg,gif",
        disableTemplatedUrls: true,
        modifyServiceWorkerConfig: (config) => {
          config.globIgnores.push("images/items/**/*");
          config.globIgnores.push("images/reactions/**/*");
          config.globIgnores.push("images/thumbnails/**/*");
        },

        // Manifest
        manifestPath: "manifest.webmanifest",
        id: "https://rehansaeed.com/",
        title: site.name,
        shortName: site.shortName,
        description: site.description,
        categories: ["education"],
        lang: "en-GB",
        dir: "ltr",
        startUrl: "/",
        display: "minimal-ui",
        statusBarStyle: "default",
        backgroundColor: "#f2f4f7",
        themeColor: "#6b17e8",
        icon: "static/favicon.png",
        maskableIcon: true,
        shortcuts: [
          {
            name: "Blog",
            short_name: "Blog",
            description: "Read the latest blog posts.",
            url: "/",
            icons: [{ src: "/images/icons/blog.png", sizes: "192x192" }],
          },
          {
            name: "Portfolio",
            short_name: "Portfolio",
            description: "View the portfolio of my projects.",
            url: "/portfolio/",
            icons: [{ src: "/images/icons/portfolio.png", sizes: "192x192" }],
          },
          {
            name: "About",
            short_name: "About",
            description: "About Muhammad Rehan Saeed.",
            url: "/about/",
            icons: [{ src: "/images/icons/about.png", sizes: "192x192" }],
          },
        ],
        screenshots: [
          {
            src: "/images/screenshots/screenshot1-1172x1820.png",
            sizes: "1172x1820",
            type: "image/png",
          },
          {
            src: "/images/screenshots/screenshot2-1172x1820.png",
            sizes: "1172x1820",
            type: "image/png",
          },
          {
            src: "/images/screenshots/screenshot3-1172x1820.png",
            sizes: "1172x1820",
            type: "image/png",
          },
        ],
      },
    },
    // https://gridsome.org/plugins/gridsome-plugin-robots
    {
      use: "gridsome-plugin-robots",
      options: {
        host: site.url,
        sitemap: `${site.url}/sitemap.xml`,
        policy: [{ userAgent: "*", allow: "/" }],
      },
    },
    {
      use: "gridsome-source-static-meta",
      options: {
        path: "site.json",
      },
    },
  ],

  transformers: {
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      anchorClassName: "icon icon-link",
      plugins: [
        // https://github.com/sammndhr/gridsome-remark-embed-snippet
        ["gridsome-remark-embed-snippet", {}],
        // https://github.com/remarkjs/remark-autolink-headings
        [
          "remark-autolink-headings",
          {
            content: {
              type: "element",
              tagName: "svg",
              properties: {
                xmlns: "http://www.w3.org/2000/svg",
                "xmlns:xlink": "http://www.w3.org/1999/xlink",
                viewBox: "0 0 16 16",
                version: "1.1",
                width: 22,
                height: 22,
                "aria-hidden": "true",
              },
              children: [
                {
                  type: "element",
                  tagName: "path",
                  properties: {
                    fill: "currentColor",
                    "fill-rule": "evenodd",
                    d: "M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z",
                  },
                },
              ],
            },
          },
        ],
        // https://github.com/nevenall/remark-containers
        [
          "remark-containers",
          {
            default: false,
            custom: [
              {
                type: "tip",
                element: "div",
                transform: function (node, config, tokenize) {
                  return transformContainer(node, config, "tip", "p", "Tip");
                },
              },
              {
                type: "warning",
                element: "div",
                transform: function (node, config, tokenize) {
                  return transformContainer(
                    node,
                    config,
                    "warning",
                    "p",
                    "Warning"
                  );
                },
              },
              {
                type: "danger",
                element: "div",
                transform: function (node, config, tokenize) {
                  return transformContainer(
                    node,
                    config,
                    "danger",
                    "p",
                    "Warning"
                  );
                },
              },
              {
                type: "details",
                element: "details",
                transform: function (node, config, tokenize) {
                  return transformContainer(
                    node,
                    config,
                    "details",
                    "summary",
                    "Details"
                  );
                },
              },
            ],
          },
        ],
        // https://github.com/zestedesavoir/zmarkdown/tree/master/packages/remark-kbd
        ["remark-kbd", {}],
        // https://github.com/remarkjs/remark-toc
        ["remark-toc", {}],
        // https://github.com/Braincoke/gridsome-plugin-remark-mermaid
        [
          "gridsome-plugin-remark-mermaid",
          {
            theme: "neutral",
          },
        ],
        // https://github.com/pchorus/gridsome-remark-katex
        ["gridsome-remark-katex", {}],
        // https://github.com/DavidCouronne/gridsome-plugin-remark-prismjs-all
        [
          "gridsome-plugin-remark-prismjs-all",
          {
            highlightClassName: "line-highlight",
            codeTitleClassName: "code-title",
            // Class prefix for <pre> tags containing syntax highlighting;
            // defaults to 'language-' (eg <pre class="language-js">).
            // If your site loads Prism into the browser at runtime,
            // (eg for use with libraries like react-live),
            // you may use this to prevent Prism from re-processing syntax.
            // This is an uncommon use-case though;
            // If you're unsure, it's best to use the default value.
            // classPrefix: "language-",
            // This lets you set up language aliases.  For example,
            // setting this to '{ sh: "bash" }' will let you use
            // the language "sh" which will highlight using the
            // bash highlighter.
            // aliases: {},
            // This toggles the display of line numbers globally alongside the code.
            // To use it, add the following line in src/layouts/index.js
            // right after importing the prism color scheme:
            //  `require("prismjs/plugins/line-numbers/prism-line-numbers.css");`
            // Defaults to false.
            // If you wish to only show line numbers on certain code blocks,
            // leave false and use the {numberLines: true} syntax below
            showLineNumbers: false,
            // If setting this to true, the parser won't handle and highlight inline
            // code used in markdown i.e. single backtick code like `this`.
            noInlineHighlight: false,
            // This adds a new language definition to Prism or extend an already
            // existing language definition. More details on this option can be
            // found under the header "Add new language definition or extend an
            // existing language" below.
            // languageExtensions: [],
            // Customize the prompt used in shell output
            // Values below are default
            // prompt: {
            //   user: "root",
            //   host: "localhost",
            //   global: false
            // }
          },
        ],
        // https://github.com/noxify/gridsome-plugin-remark-embed
        [
          "@noxify/gridsome-plugin-remark-embed",
          {
            enabledProviders: ["Youtube"], // 'Twitter', 'Codepen'
            Youtube: {
              // margin: "25px 0 25px 0",
            },
            // Twitter: {
            //   hideMedia: false
            // },
            // Codepen: {
            //   // iframe: true
            // }
          },
        ],
        // https://github.com/remarkjs/remark-validate-links
        ["remark-validate-links", {}],
      ],
    },
  },
};

function transformContainer(node, config, type, element, defaultTitle) {
  node.data.hProperties = {
    className: `custom-block ${type}`,
  };
  node.children.splice(0, 0, {
    type: "paragraph",
    data: {
      hName: element,
      hProperties: {
        className: "custom-block-title",
      },
    },
    children: [{ type: "text", value: config || defaultTitle }],
  });
}
