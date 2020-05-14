<template>
  <Layout>
    <div class="tag-page">

      <u-heading level="1" center># {{$page.tag.title}}</u-heading>

      <div class="tag-page__items">
        <u-post-card v-for="edge in $page.tag.belongsTo.edges" :key="edge.node.id" :post="edge.node"/>
      </div>

      <u-newsletter class="tag-page__newsletter"/>

    </div>
  </Layout>
</template>

<script>
import heading from '~/components/shared/heading.vue';
import author from '~/components/author.vue';
import newsletter from '~/components/newsletter.vue';
import postCard from '~/components/post-card.vue';

export default {
  components: {
    'u-heading': heading,
    'u-author': author,
    'u-newsletter': newsletter,
    'u-post-card': postCard,
  },
  computed: {
    description: function() { return `Blog posts authored by ${this.$static.metadata.author.name} about ${this.$page.tag.title}.`; },
    image: function() { return this.$static.metadata.url + '/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg'; },
    url: function() { return this.$static.metadata.url + this.$page.tag.path; }
  },
  metaInfo() {
    return {
      title: this.$page.tag.title,
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
        { name: 'twitter:title', content: this.$page.tag.title },
        { name: 'twitter:description', content: this.description },
        { name: 'twitter:image', content: this.image },
        // Open Graph
        { property: 'og:title', content: this.$page.tag.title },
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
query Tag ($id: ID!) {
  tag (id: $id) {
    title
    path
    belongsTo(filter:{typeName:{eq:post}}) {
      edges {
        node {
          ...on post {
            title
            path
            date (format: "D MMMM YYYY")
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

<style lang="scss">
.tag-page {
  display: grid;
  grid-gap: var(--global-space-fluid-5);
  grid-template-columns: 1fr;
}

.tag-page__items {
  display: grid;
  grid-gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(auto-fit, minmax(var(--global-space-content-min-width), var(--global-space-content-max-width)));
  justify-content: center;
}

.tag-page__newsletter {
  justify-self: center;
}
</style>
