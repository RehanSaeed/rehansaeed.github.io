// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const site = require('./site.json');
const marked = require('marked');

module.exports = {
  siteName: site.name,
  siteDescription: site.description,
  siteUrl: site.url,

  templates: {
    post: "/:permalink",
    tag: "/tag/:title",
    portfolio: "/:permalink"
  },

  plugins: [
    // https://gridsome.org/plugins/@gridsome/plugin-google-analytics
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: site.googleAnalyticsId,
      }
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
        }
      }
    },
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
            create: true
          }
        }
      }
    },
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
            create: true
          }
        }
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-brotli
    {
      use: "gridsome-plugin-brotli",
      options: {
        extensions: ["css", "html", "js", "svg", "json"]
      }
    },
    {
      use: 'gridsome-plugin-feed',
      options: {
        // Required: array of `GraphQL` type names you wish to include
        contentTypes: ['post'],
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
          copyright: `Copyright © ${new Date().getFullYear()} ${site.author.name}`,
          feedLinks: {
            atom: site.url + "/atom.xml",
            json: site.url + "/feed.json",
            rss: site.url + "/rss.xml",
          },
          author: {
            name: site.author.name,
            link: site.url,
          }
        },
        atom: {
          enabled: false,
          output: '/atom.xml'
        },
        json: {
          enabled: false,
          output: '/feed.json'
        },
        rss: {
          enabled: true,
          output: '/rss.xml'
        },
        // Optional: the maximum number of items to include in your feed
        maxItems: 300,
        // Optional: an array of properties passed to `Feed.addItem()` that will be parsed for
        // URLs in HTML (ensures that URLs are full `http` URLs rather than site-relative).
        // To disable this functionality, set to `null`.
        htmlFields: ['description', 'content'],
        // Optional: if you wish to enforce trailing slashes for site URLs
        enforceTrailingSlashes: false,
        // Optional: a method that accepts a node and returns true (include) or false (exclude)
        // Example: only past-dated nodes: `filterNodes: (node) => node.date <= new Date()`
        filterNodes: (node) => { return node.published; },
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
              }
            ],
            date: new Date(node.date),
            categories: node.tags,
            image: node.heroImage,
          };
        }
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-flexsearch
    {
      use: "gridsome-plugin-flexsearch",
      options: {
        collections: [
          {
            typeName: "post",
            indexName: "post",
            fields: ["title", "description", "heroImage"]
          },
          {
            typeName: "portfolio",
            indexName: "portfolio",
            fields: ["title", "description", "heroImage", "permalink"]
          }
        ],
        searchFields: ["title", "description"]
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-pwa
    {
      use: 'gridsome-plugin-pwa',
      options: {
        title: site.name,
        startUrl: '/',
        display: 'standalone',
        statusBarStyle: 'default',
        manifestPath: 'manifest.json',
        disableServiceWorker: false,
        serviceWorkerPath: 'service-worker.js',
        cachedFileTypes: 'js,json,css,html,png,jpg,jpeg,svg,gif',
        shortName: site.shortName,
        themeColor: '#6b17e8',
        backgroundColor: '#f2f4f7',
        icon: 'src/favicon.png',
        msTileImage: 'src/favicon.png',
        msTileColor: '#6b17e8',
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-robots
    {
      use: 'gridsome-plugin-robots',
      options: {
        host: site.url,
        sitemap: `${site.url}/sitemap.xml`,
        policy: [{ userAgent: '*', allow: '/' }]
      }
    },
    {
      use: 'gridsome-source-static-meta',
      options: {
        path: 'site.json'
      }
    }
  ],

  transformers: {
    remark: {
      externalLinksTarget: "_blank",
      externalLinksRel: ["nofollow", "noopener", "noreferrer"],
      anchorClassName: "icon icon-link",
      plugins: [
        [
          'gridsome-remark-embed-snippet',
          {
          }
        ],
        // https://github.com/remarkjs/remark-autolink-headings
        [
          'remark-autolink-headings',
          {
          }
        ],
        [
          'remark-containers',
          {
            default: false,
            custom: [
              {
                type: 'tip',
                element: 'div',
                transform: function(node, config, tokenize) {
                  return transformContainer(node, config, 'tip', 'p', "Tip");
                }
              },
              {
                type: 'warning',
                element: 'div',
                transform: function(node, config, tokenize) {
                  return transformContainer(node, config, 'warning', 'p', "Warning");
                }
              },
              {
                type: 'danger',
                element: 'div',
                transform: function(node, config, tokenize) {
                  return transformContainer(node, config, 'danger', 'p', "Warning");
                }
              },
              {
                type: 'details',
                element: 'details',
                transform: function(node, config, tokenize) {
                  return transformContainer(node, config, 'details', 'summary', "Details");
                }
              }
            ]
          }
        ],
        'remark-kbd',
        'remark-toc',
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
          }
        ],
        // https://github.com/noxify/gridsome-plugin-remark-embed
        [
          '@noxify/gridsome-plugin-remark-embed',
          {
            enabledProviders: ['Youtube'], // 'Twitter', 'Codepen'
            Youtube: {
              margin: "25px 0 25px 0"
            },
            // Twitter: {
            //   hideMedia: false
            // },
            // Codepen: {
            //   // iframe: true
            // }
          }
        ],
        [
          'remark-validate-links',
          {
          }
        ]
      ]
    }
  }
};

function transformContainer(node, config, type, element, defaultTitle) {
  node.data.hProperties = {
    className: `custom-block ${type}`
  };
  node.children.splice(0, 0, {
    type: 'paragraph',
    data: {
      hName: element,
      hProperties: {
        className: 'custom-block-title',
      },
    },
    children: [
      { type: 'text', value: config || defaultTitle }
    ]
  });
}
