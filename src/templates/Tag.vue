<template>
  <Layout>
    <h1 class="tag-title text-center space-bottom">
      # {{ $page.tag.title }}
    </h1>

    <div class="posts">
      <PostCard v-for="edge in $page.tag.belongsTo.edges" :key="edge.node.id" :post="edge.node"/>
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
query Tag ($id: ID!) {
  tag (id: $id) {
    title
    belongsTo {
      edges {
        node {
          ...on Post {
            title
            path
            date (format: "DD MMMM YYYY")
            timeToRead
            description
            content
          }
        }
      }
    }
  }
}
</page-query>

<script>
import Author from '~/components/Author.vue';
import PostCard from '~/components/PostCard.vue';

export default {
  components: {
    Author,
    PostCard
  },
  computed: {
    description: function() { return `Blog posts about ${this.$page.tag.title}`; }
  },
  metaInfo() {
    return {
      title: this.$page.tag.title,
      meta: [
        {
          name: 'description',
          content: this.description,
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
          content: this.$page.tag.title
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
