<template>
  <Layout>

    <div class="post-title">
      <u-heading level="1" class="post-title__text">
        {{ $page.post.title }}
      </u-heading>
      <Meta :meta="$page.post" />
    </div>

    <u-content-box class="post" tag="article">

      <div class="post__header">
        <g-image alt="Cover image" v-if="$page.post.cover_image" :src="$page.post.cover_image"/>
      </div>

      <div class="post__content" v-html="$page.post.content" />

      <div class="post__footer">
        <div class="post__footer-first-row">
          <ShareButton :title="$page.post.title" :tags="$page.post.tags.map(x => x.title)" class="post__share" />
          <u-edit-post-button :post="$page.post" class="post__edit" />
        </div>
        <Tags :tags="$page.post.tags"  class="post__tags" />
      </div>

    </u-content-box>

    <Newsletter/>

    <div class="post-comments">
      <!-- Add comment widgets here -->
    </div>

    <u-author class="post-author" />
  </Layout>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';
import author from '~/components/author.vue';
import editPostButton from '~/components/edit-post-button.vue';
import Meta from '~/components/Meta';
import Newsletter from '~/components/Newsletter';
import ShareButton from '~/components/ShareButton.vue';
import Tags from '~/components/Tags';

export default {
  components: {
    'u-content-box': contentBox,
    'u-heading': heading,
    'u-author': author,
    'u-edit-post-button': editPostButton,
    Meta,
    Newsletter,
    ShareButton,
    Tags,
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
.post {
  margin-bottom: var(--global-space-fluid-3);
}

.post-title {
  display: grid;
  justify-items: center;
  margin: 0 auto;
  padding: var(--global-space-fluid-5) 0 var(--global-space-fluid-5);
  text-align: center;
}

.post__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-left: calc(var(--global-space-fluid-6) * -1);
  margin-top: calc(var(--global-space-fluid-6) * -1);
  margin-bottom: var(--global-space-fluid-5);
  overflow: hidden;
  width: calc(100% + var(--global-space-fluid-7));

  img {
    width: 100%;
  }

  &:empty {
    display: none;
  }
}

.post__content {
  > h2:first-child {
    margin-top: 0;
  }

  > p:first-of-type {
    font-size: var(--global-font-size-3);
    color: var(--title-color);
  }

  img {
    width: calc(100% + var(--global-space-fluid-6));
    margin-left: calc(var(--global-space-fluid-6) * -1);
    display: block;
    max-width: none;
  }
}

.post__footer {
  display: grid;
  justify-items: start;
}

.post__footer-first-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-gap: .6rem;
}

.post__edit,
.post__share {
  margin-bottom: 1.5rem;
}

.post-comments {
  padding: var(--global-space-fluid-5);

  &:empty {
    display: none;
  }
}

.post-author {
  margin-top: var(--global-space-fluid-5);
}
</style>
