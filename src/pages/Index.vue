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
    url
    author
    twitter
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
    description: function() { return `Blog posts and more authored by ${this.$static.metadata.author}.`; }
  },
  metaInfo() {
    return {
      title: this.title,
      meta: [
        {
          name: 'description',
          content: this.description
        },
        {
          name: 'author',
          content: this.$static.metadata.author
        },

        // Twitter card
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:site',
          content: this.$static.metadata.twitter
        },
        {
          name: 'twitter:creator',
          content: this.$static.metadata.twitter
        },
        {
          name: 'twitter:title',
          content: this.title
        },
        {
          name: 'twitter:description',
          content: this.description
        },
        {
          name: 'twitter:image',
          content: this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'
        }
      ]
    }
  }
}
</script>
