// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`
const siteName = 'Muhammad Rehan Saeed';
const siteDescription = 'Software Developer at Microsoft, Open Source Contributor and Blogger';
const siteUrl = 'https://rehansaeed.com';
const siteAuthor = 'Muhammad Rehan Saeed';
const siteCopyright = `Copyright © ${new Date().getFullYear()} Muhammad Rehan Saeed`;
const siteLanguage = "en-GB";

module.exports = {
  siteName,
  siteDescription,
  siteUrl,

  templates: {
    Post: '/:title',
    Tag: '/tag/:title'
  },

  plugins: [
    // Mailchimp
    // https://rehansaeed.us19.list-manage.com/subscribe/post?u=0d1d7c30db26dd0a4aa1b5b40&amp;id=07ce865066

    // https://gridsome.org/plugins/@gridsome/plugin-google-analytics
    {
      use: '@gridsome/plugin-google-analytics',
      options: {
        id: 'UA-159632920-1'
      }
    },
    // https://gridsome.org/plugins/@gridsome/plugin-sitemap
    {
      use: '@gridsome/plugin-sitemap',
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
      use: '@gridsome/source-filesystem',
      options: {
        typeName: 'Post',
        path: 'content/posts/**/*.md',
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: 'Tag',
            create: true
          }
        }
      }
    },
    {
      // Create posts from markdown files
      use: '@gridsome/source-filesystem',
      options: {
        typeName: 'Portfolio',
        path: 'content/portfolio/**/*.md',
        refs: {
          // Creates a GraphQL collection from 'tags' in front-matter and adds a reference.
          tags: {
            typeName: 'Tag',
            create: true
          }
        }
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-brotli
    {
      use: 'gridsome-plugin-brotli',
      options: {
        extensions: ['css', 'html', 'js', 'svg', 'json']
      }
    },
    // https://gridsome.org/plugins/gridsome-plugin-rss
    {
      use: 'gridsome-plugin-rss',
      options: {
        contentTypeName: 'Post',
        latest: true,
        dateField: 'date',
        maxItems: 300,
        feedOptions: {
          title: siteName,
          description: siteDescription,
          feed_url: siteUrl + '/rss.xml',
          site_url: siteUrl,
          image_url: siteUrl + '/images/Muhammad-Rehan-Saeed-Hero.png',
          managingEditor: siteAuthor,
          webMaster: siteAuthor,
          copyright: siteCopyright,
          language: siteLanguage
        },
        feedItemOptions: node =>
        {
          console.log(node);
          return ({
            title: node.title,
            description: node.description,
            url: siteUrl + node.permalink,
            author: node.author,
            date: node.date,
            categories: node.tags,
            // enclosure: {
            //   file: node.cover_image
            // }
          });
        },
        output: {
          dir: './static',
          name: 'rss.xml'
        }
      }
    }
  ],

  transformers: {
    //Add markdown support to all file-system sources
    remark: {
      externalLinksTarget: '_blank',
      externalLinksRel: ['nofollow', 'noopener', 'noreferrer'],
      anchorClassName: 'icon icon-link',
      plugins: [
        '@gridsome/remark-prismjs'
      ]
    }
  }
}
