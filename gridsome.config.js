const marked = require('marked');

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`
const siteName = "Muhammad Rehan Saeed";
const siteDescription =
  "Software Developer at Microsoft, Open Source Contributor and Blogger";
const siteUrl = "https://rehansaeed.com";
const siteAuthor = "Muhammad Rehan Saeed";
const siteCopyright = `Copyright © ${new Date().getFullYear()} Muhammad Rehan Saeed`;
const siteLanguage = "en-GB";

module.exports = {
  siteName,
  siteDescription,
  siteUrl,

  templates: {
    Post: "/:permalink",
    Tag: "/tag/:title",
    Portfolio: "/:permalink"
  },

  plugins: [
    // Mailchimp
    // https://rehansaeed.us19.list-manage.com/subscribe/post?u=0d1d7c30db26dd0a4aa1b5b40&amp;id=07ce865066

    // https://gridsome.org/plugins/@gridsome/plugin-google-analytics
    {
      use: "@gridsome/plugin-google-analytics",
      options: {
        id: "UA-159632920-1"
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
        typeName: "Post",
        path: "content/posts/**/*.md",
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: "Tag",
            create: true
          }
        }
      }
    },
    {
      // Create posts from markdown files
      use: "@gridsome/source-filesystem",
      options: {
        typeName: "Portfolio",
        path: "content/portfolio/**/*.md",
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: "Tag",
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
        contentTypes: ['Post'],
        // Optional: any properties you wish to set for `Feed()` constructor
        // See https://www.npmjs.com/package/feed#example for available properties
        feedOptions: {
          title: siteName,
          description: siteDescription,
          id: siteUrl,
          link: siteUrl,
          language: siteLanguage,
          image: siteUrl + "/images/Site-Hero-1280x640.png",
          favicon: siteUrl + "/favicon.ico",
          copyright: siteCopyright,
          feedLinks: {
            atom: siteUrl + "/atom.xml",
            json: siteUrl + "/feed.json",
            rss: siteUrl + "/rss.xml",
          },
          author: {
            name: siteAuthor,
            link: siteUrl,
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
        filterNodes: (node) => true,
        // Optional: a method that accepts a node and returns an object for `Feed.addItem()`
        // See https://www.npmjs.com/package/feed#example for available properties
        // NOTE: `date` field MUST be a Javascript `Date` object
        nodeToFeedItem: (node) => {
          console.log(new Date(node.date));
          return {
            title: node.title,
            id: siteUrl + node.permalink,
            link: siteUrl + node.permalink,
            description: node.description,
            content: marked(node.content),
            author: [
              {
                name: node.author,
                link: siteUrl,
              }
            ],
            date: new Date(node.date),
            categories: node.tags,
            image: node.cover_image,
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
            typeName: "Post",
            indexName: "Post",
            fields: ["title", "description"]
          },
          {
            typeName: "Portfolio",
            indexName: "Portfolio",
            fields: ["title", "description"]
          }
        ],
        searchFields: ["title", "description"]
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-robots
    {
      use: 'gridsome-plugin-robots',
      options: {
        host: siteUrl,
        sitemap: `${siteUrl}/sitemap.xml`,
        policy: [{ userAgent: '*', allow: '/' }]
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
        // TODO: Add GitHub style heading anchors.
        // https://github.com/remarkjs/remark-autolink-headings
        // [
        //   'remark-autolink-headings',
        //   {
        //     // behavior: 'before'
        //   }
        // ],
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
        'remark-validate-links'
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
