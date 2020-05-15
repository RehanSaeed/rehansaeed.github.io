<template>
  <Layout>
    <div class="tag-page">

      <u-heading level="1" center># {{title}}</u-heading>

      <div class="tag-page__items">
        <u-post-card v-for="post in posts" :key="post.id" :post="post"/>
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
    metadata: function() { return this.$static.metadata; },
    tag: function() { return this.$page.tag; },
    posts: function() { return this.tag.belongsTo.edges.map(x => x.node).filter(x => x.published); },

    title: function() { return this.tag.title; },
    description: function() { return `Blog posts authored by ${this.metadata.author.name} about ${this.title}.`; },
    image: function() { return `${this.metadata.url}/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg`; },
    url: function() { return this.metadata.url + this.tag.path; }
  },
  metaInfo() {
    return {
      title: this.title,
      link: [
        { rel: 'canonical', href: this.url },
      ],
      meta: [
        { name: 'description', content: this.description },
        { name: 'author', content: this.metadata.author.name },
        // Twitter card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: this.metadata.author.twitter },
        { name: 'twitter:creator', content: this.metadata.author.twitter },
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
        { property: 'og:locale', content: this.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.metadata.name },
        { property: 'og:type', content: 'website' },
        { property: 'fb:app_id', content: this.metadata.facebookAppId },
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
query Tag($id: ID!) {
  tag(id: $id) {
    title
    path
    belongsTo(filter: {typeName: {eq: post}}, sort: {by: "date", order: DESC}) {
      edges {
        node {
          ...on post {
            title
            date(format: "YYYY-MM-DDTHH:mm:ssZ")
            dateModified(format: "YYYY-MM-DDTHH:mm:ssZ")
            timeToRead
            description
            path
            published
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
