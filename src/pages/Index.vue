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
    image: function() { return this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'; }
  },
  metaInfo() {
    return {
      title: this.title,
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
        { property: 'og:description', content: this.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'profile' },
        { property: 'profile:first_name', content: this.$static.metadata.author.firstName },
        { property: 'profile:last_name', content: this.$static.metadata.author.lastName },
        { property: 'profile:username', content: this.$static.metadata.author.name },
        { property: 'profile:gender', content: this.$static.metadata.author.gender },
      ]
    }
  }
}
</script>
