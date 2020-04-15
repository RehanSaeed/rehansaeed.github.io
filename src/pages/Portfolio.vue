<template>
  <Layout :show-logo="true">
    <div class="portfolio">

      <PageTitle>Portfolio</PageTitle>

      <div class="portfolio__items">
        <PortfolioCard
          v-for="edge in $page.portfolio.edges"
          :key="edge.node.id"
          :portfolio="edge.node"/>
      </div>

      <Newsletter/>

    </div>
  </Layout>
</template>

<script>
import Newsletter from '~/components/Newsletter.vue'
import PageTitle from '~/components/PageTitle.vue'
import PortfolioCard from '~/components/PortfolioCard.vue'

export default {
  components: {
    Newsletter,
    PageTitle,
    PortfolioCard,
  },
  computed: {
    title: function() { return 'Portfolio'; },
    description: function() { return `Portfolio of work by ${this.$static.metadata.author.name}.`; },
    image: function() { return this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'; },
    url: function() { return this.$static.metadata.url + '/portfolio/'; }
  },
  metaInfo() {
    return {
      title: this.title,
      link: [
        { rel: 'canonical', href: this.url },
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
        { property: 'og:url', content: this.url },
        { property: 'og:image', content: this.image },
        { property: 'og:image:height', content: this.image.match(/(\d*)x(\d*)/)[2] },
        { property: 'og:image:width', content: this.image.match(/(\d*)x(\d*)/)[1] },
        { property: 'og:description', content: this.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'website' },
        { property: 'fb:app_id', content: this.$static.metadata.facebookAppId },
      ]
    }
  }
}
</script>

<static-query>
query {
  metadata {
    name
    url
    language
    facebookAppId
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

<style lang="scss">
.portfolio {
  display: grid;
  grid-template-columns: 1fr;
}

.portfolio__items {
  display: grid;
  grid-gap: calc(var(--global-space) / 2);
  grid-template-columns: repeat(auto-fit, minmax(35rem, 46rem));
  justify-content: center;
  margin-bottom: calc(var(--global-space) / 2);
}
</style>
