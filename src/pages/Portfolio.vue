<template>
  <Layout :show-logo="true">

    <h1 class="portfolio__title">Portfolio</h1>

    <div class="portfolio">
      <PortfolioCard v-for="edge in $page.portfolio.edges" :key="edge.node.id" :portfolio="edge.node"/>
    </div>

  </Layout>
</template>

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
  metaInfo: {
    title: 'Portfolio'
  }
}
</script>

<style lang="scss">
.portfolio__title {
  padding: calc(var(--space) / 2) 0 calc(var(--space) / 2);
  text-align: center;
}
</style>
