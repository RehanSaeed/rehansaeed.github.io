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
    name
    url
    language
    author {
      name
      twitter
    }
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
    description: function() { return `Portfolio of work by ${this.$static.metadata.author.name}.`; },
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
        { property: 'og:url', content: this.$static.metadata.url + '/portfolio/' },
        { property: 'og:image', content: this.image },
        { property: 'og:description', content: this.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'website' },
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
