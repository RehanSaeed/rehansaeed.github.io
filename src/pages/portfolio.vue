<template>
  <Layout>
    <div class="portfolio">

      <div class="portfolio__title">
        <u-heading level="1" center>Portfolio</u-heading>
        <p>These are some of the open source projects that I've started and maintained. There are many others I've contributed to which you can see in my GitHub profile and of course there are other commercial projects that I cannot disclose.</p>
      </div>

      <div class="portfolio__items">
        <u-portfolio-card
          v-for="edge in $page.portfolio.edges"
          :key="edge.node.id"
          :portfolio="edge.node"/>
      </div>

      <u-newsletter class="portfolio__newsletter"/>

    </div>
  </Layout>
</template>

<script>
import heading from '~/components/shared/heading.vue';
import newsletter from '~/components/newsletter.vue';
import portfolioCard from '~/components/portfolio-card.vue';

export default {
  components: {
    'u-heading': heading,
    'u-newsletter': newsletter,
    'u-portfolio-card': portfolioCard,
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
        { name: 'twitter:site', content: this.$static.metadata.author.twitter.user },
        { name: 'twitter:creator', content: this.$static.metadata.author.twitter.user },
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
      twitter {
        user
      }
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
        date (format: "YYYY-MM-DDTHH:mm:ssZ")
        description
        heroImage (width: 770, height: 380, blur: 10)
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
  grid-gap: var(--global-space-fluid-5);
  grid-template-columns: 1fr;
}

.portfolio__title {
  display: grid;
  justify-items: center;
  text-align: center;
}

.portfolio__items {
  display: grid;
  grid-gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(auto-fit, minmax(var(--global-space-content-min-width), var(--global-space-content-max-width)));
  justify-content: center;
}

.portfolio__newsletter {
  justify-self: center;
}
</style>
