// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'Muhammad Rehan Saeed',
  siteDescription: 'Software Developer at Microsoft, Open Source Contributor and Blogger',
  siteUrl: 'https://preview.rehansaeed.com',

  templates: {
    Post: '/:title',
    Tag: '/tag/:title'
  },

  plugins: [
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
