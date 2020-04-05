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

const title = 'Blog';
const description = `Blog posts written by ${this.$static.metadata.author}`;

export default {
  components: {
    Author,
    PostCard
  },
  metaInfo() {
    return {
      title,
      meta: [
        {
          name: 'description',
          content: description
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
          content: title
        },
        {
          name: 'twitter:description',
          content: description
        },
        {
          name: 'twitter:image',
          content: this.$static.metadata.url + '/images/Site-Hero-1280x640.png'
        }
      ]
    }
  }
}
</script>
