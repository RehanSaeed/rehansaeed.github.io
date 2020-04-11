<template>
  <Layout :show-logo="false">
    <Author />

    <div class="posts">
      <PostCard v-for="edge in $page.posts.edges" :key="edge.node.id" :post="edge.node"/>
    </div>

  </Layout>
</template>

<static-query>
query {
  metadata {
    name
    language
    url
    facebookAppId
    author {
      name
      firstName
      lastName
      gender
      twitter
    }
  }
}
</static-query>

<page-query>
query {
  posts: allPost(filter: { published: { eq: true }}, sortBy: "date") {
    edges {
      node {
        id
        title
        date (format: "D MMMM YYYY")
        timeToRead
        description
        cover_image (width: 770, height: 380, blur: 10)
        path
        tags {
          id
          title
          path
        }
      }
    }
  }
}
</page-query>

<script>
import Author from '~/components/Author.vue'
import PostCard from '~/components/PostCard.vue'

export default {
  components: {
    Author,
    PostCard
  },
  computed: {
    title: function() { return 'Blog'; },
    description: function() { return `Blog posts and more authored by ${this.$static.metadata.author.name}.`; },
    image: function() { return this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'; },
    imageHeight: function() { return this.image.match(/(\d*)x(\d*)/)[2]; },
    imageWidth: function() { return this.image.match(/(\d*)x(\d*)/)[1]; },
  },
  metaInfo() {
    return {
      title: this.title,
      link: [
        { rel: 'canonical', href: this.$static.metadata.url },
      ],
      meta: [
        { name: 'description', content: this.description },
        { name: 'author', content: this.$static.metadata.author.name },
        // Twitter card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: this.$static.metadata.author.twitter },
        { name: 'twitter:creator', content: this.$static.metadata.author.twitter },
        { name: 'twitter:title', content: this.title },
        { name: 'twitter:description', content: this.description },
        { name: 'twitter:image', content: this.image },
        // Open Graph
        { property: 'og:title', content: this.title },
        { property: 'og:url', content: this.$static.metadata.url },
        { property: 'og:image', content: this.image },
        { property: 'og:image:height', content: this.imageHeight },
        { property: 'og:image:width', content: this.imageWidth },
        { property: 'og:description', content: this.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'profile' },
        { property: 'profile:first_name', content: this.$static.metadata.author.firstName },
        { property: 'profile:last_name', content: this.$static.metadata.author.lastName },
        { property: 'profile:username', content: this.$static.metadata.author.name },
        { property: 'profile:gender', content: this.$static.metadata.author.gender },
        { property: 'fb:app_id', content: this.$static.metadata.facebookAppId },
      ],
      script: [
        {
          type: 'application/ld+json',
          json: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            description: this.description,
            url: this.$static.metadata.url,
            image: [
              {
                '@type': 'ImageObject',
                url: this.image,
                width: this.imageWidth,
                height: this.imageHeight,
              }
            ],
            potentialAction: {
              '@type': 'SearchAction',
              target: `${this.$static.metadata.url}?search={search_term_string}`,
              'query-input': "required name=search_term_string"
            },
            author: {
              '@type': 'Person',
              name: this.$static.metadata.author.name,
              logo: {
                '@type': 'ImageObject',
                url: `${this.$static.metadata.url}/images/author/${this.$static.metadata.author.name.split(' ').join('-')}/Logo-260x260.png`,
                width: 260,
                height: 260,
              },
              url: this.$static.metadata.url + '/about/',
            },
            publisher: {
              '@type': 'Organization',
              name: this.$static.metadata.name,
              logo: {
                '@type': 'ImageObject',
                url: this.$static.metadata.url + '/images/schema/Publisher-600x60.png',
                width: 600,
                height: 60,
              },
              url: this.$static.metadata.url,
            },
          }
        }
      ]
    }
  }
}
</script>
