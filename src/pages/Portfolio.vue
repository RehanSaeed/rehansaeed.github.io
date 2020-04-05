<template>
  <Layout :show-logo="true">

    <h1 class="portfolio__title">Portfolio</h1>

    <div class="portfolio">
      <PortfolioCard v-for="edge in $page.portfolio.edges" :key="edge.node.id" :portfolio="edge.node"/>
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
  portfolio: allPortfolio(filter: { published: { eq: true }}, sortBy: "date") {
    edges {
      node {
        id
        title
        date (format: "D MMMM YYYY")
        description
        cover_image (width: 770, height: 380, blur: 10)
        permalink
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
import PortfolioCard from '~/components/PortfolioCard.vue'

export default {
  components: {
    PortfolioCard
  },
  computed: {
    title: function() { return 'Portfolio'; },
    description: function() { return `Portfolio of work by ${this.$static.metadata.author}`; }
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

<style lang="scss">
.portfolio {
  display: grid;
  grid-gap: var(--space);
  grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
  padding: 0 var(--space);
  margin-left: var(--space);
  margin-right: var(--space);
}

.portfolio__title {
  padding: calc(var(--space) / 2) 0 calc(var(--space) / 2);
  text-align: center;
}
</style>
