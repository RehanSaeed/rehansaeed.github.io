<template>
  <Layout>
    <div class="post-page">

      <div class="post-page__title">
        <u-heading level="1" center>{{$page.post.title}}</u-heading>
        <u-post-meta :meta="$page.post" />
      </div>

      <u-post class="post-page__content" :post="$page.post" />

      <u-newsletter/>

      <div class="post-page__comments">
      </div>

      <u-author class="post-page__author" />

    </div>
  </Layout>
</template>

<script>
import heading from '~/components/shared/heading.vue';
import author from '~/components/author.vue';
import newsletter from '~/components/newsletter.vue';
import post from '~/components/post.vue';
import postMeta from '~/components/post-meta.vue';

export default {
  components: {
    'u-heading': heading,
    'u-author': author,
    'u-newsletter': newsletter,
    'u-post': post,
    'u-post-meta': postMeta,
  },
  computed: {
    image: function() { return this.$static.metadata.url + this.$page.post.cover_image; },
    imageHeight: function() { return this.image.match(/(\d*)x(\d*)/)[2]; },
    imageWidth: function() { return this.image.match(/(\d*)x(\d*)/)[1]; },
    url: function() { return this.$static.metadata.url + this.$page.post.path; }
  },
  metaInfo () {
    return {
      title: this.$page.post.title,
      link: [
        { rel: 'canonical', href: this.url },
      ],
      meta: [
        { name: 'description', content: this.$page.post.description },
        { name: 'author', content: this.$page.post.author.name },
        { name: 'keywords', content: this.$page.post.tags.map(x => x.title).join(",") },
        // Twitter card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: this.$static.metadata.author.twitter },
        { name: 'twitter:creator', content: this.$static.metadata.author.twitter },
        { name: 'twitter:title', content: this.$page.post.title },
        { name: 'twitter:description', content: this.$page.post.description },
        { name: 'twitter:image', content: this.image },
        // Open Graph
        { property: 'og:title', content: this.$page.post.title },
        { property: 'og:url', content: this.url },
        { property: 'og:image', content: this.image },
        { property: 'og:image:height', content: this.imageHeight },
        { property: 'og:image:width', content: this.imageWidth },
        { property: 'og:description', content: this.$page.post.description },
        { property: 'og:locale', content: this.$static.metadata.language.replace('-', '_') },
        { property: 'og:site_name', content: this.$static.metadata.name },
        { property: 'og:type', content: 'article' },
        { property: 'article:published_time', content: this.$page.post.date },
        ...[this.$page.post.dateModified].filter(x => x).map(x => ({ property: 'article:modified_time', content: x })),
        { property: 'article:author', content: this.$page.post.author },
        ...this.$page.post.headings.map(x => ({ property: 'article:section', content: x.value })),
        ...this.$page.post.tags.map(x => ({ property: 'article:tag', content: x.title })),
        { property: 'fb:app_id', content: this.$static.metadata.facebookAppId },
      ],
      script: [
        {
          type: 'application/ld+json',
          json: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': this.$static.metadata.url,
            },
            headline: this.$page.post.title,
            description: this.$page.post.description,
            keywords: this.$page.post.tags.map(x => x.title).join(),
            url: this.url,
            image: [
              {
                '@type': 'ImageObject',
                url: this.image,
                width: this.imageWidth,
                height: this.imageHeight,
              }
            ],
            datePublished: this.$page.post.date,
            dateModified: this.$page.post.dateModified,
            author: {
              '@type': 'Person',
              name: this.$page.post.author,
              logo: {
                '@type': 'ImageObject',
                url: `${this.$static.metadata.url}/images/author/${this.$page.post.author.split(' ').join('-')}/Logo-260x260.png`, //
                width: 260,
                height: 260,
              },
              url: this.$static.metadata.url + '/about/',
            },
            publisher: {
              '@type': 'Organization',
              name: this.$static.metadata.name,
              logo: {
                '@type': 'ImageObject',
                url: this.$static.metadata.url + '/images/schema/Publisher-600x60.png',
                width: 600,
                height: 60,
              },
              url: this.$static.metadata.url,
            },
          }
        }
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
query Post ($id: ID!) {
  post: post (id: $id) {
    title
    path
    displayDate: date (format: "D MMMM YYYY")
    date (format: "YYYY-MM-DDTHH:mm:ssZ")
    dateModified (format: "YYYY-MM-DDTHH:mm:ssZ")
    timeToRead
    author
    headings {
      value
    }
    tags {
      id
      title
      path
    }
    description
    content
    cover_image (width: 860, blur: 10)
  }
}
</page-query>

<style lang="scss">
.post-page {
  --post-page-content-max-width: calc(var(--global-space-fluid-6) * 2 + var(--global-line-length-max));
  --post-page-content-min-width: calc(var(--global-space-fluid-6) * 2 + var(--global-line-length-min));

  display: grid;
  grid-gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(1, minmax(var(--post-page-content-min-width), var(--post-page-content-max-width)));
  justify-content: center;
}

.post-page__title {
  display: grid;
  justify-items: center;
  margin: 0 auto;
  padding: var(--global-space-fluid-5) 0 var(--global-space-fluid-5);
  text-align: center;
}

.post-page__comments {
  padding: var(--global-space-fluid-5);

  &:empty {
    display: none;
  }
}
</style>
