<template>
  <Layout>
    <div class="post-page h-entry">
      <div class="post-page__title-container">
        <u-heading
          :id="title"
          class="p-name u-url"
          level="1"
          center
          :to="post.path"
          >{{ title }}</u-heading
        >
        <u-post-meta :meta="post" />
      </div>

      <u-arrows class="post-page__arrows" />

      <u-post class="post-page__content" :post="post" />

      <u-webmentions class="post-page__webmentions" :url="url" />

      <u-comments class="post-page__comments" :title="title" />
    </div>
  </Layout>
</template>

<script>
import arrows from "~/components/shared/arrows.vue";
import heading from "~/components/shared/heading.vue";
import comments from "~/components/comments.vue";
import post from "~/components/post.vue";
import postMeta from "~/components/post-meta.vue";
import webmentions from "~/components/webmentions/webmentions.vue";
import { getOpenGraphImage, getSchemaImageObject } from "~/framework/images.js";

export default {
  components: {
    "u-arrows": arrows,
    "u-comments": comments,
    "u-heading": heading,
    "u-post": post,
    "u-post-meta": postMeta,
    "u-webmentions": webmentions,
  },
  computed: {
    metadata() {
      return this.$static.metadata;
    },
    post() {
      return this.$page.post;
    },

    title() {
      return this.post.title;
    },
    description() {
      return this.post.description;
    },
    author() {
      return this.post.author;
    },
    date() {
      return this.post.date;
    },
    dateModified() {
      return this.post.dateModified;
    },
    image() {
      return this.metadata.url + this.post.heroImage;
    },
    url() {
      return this.metadata.url + this.post.path;
    },
    tags() {
      return this.post.tags ?? [];
    },
    headings() {
      return this.post.headings ?? [];
    },
  },
  metaInfo() {
    return {
      title: this.title,
      link: [{ rel: "canonical", href: this.url }],
      meta: [
        { name: "description", content: this.description },
        { name: "author", content: this.author },
        { name: "keywords", content: this.tags.map((x) => x.title).join(",") },
        // Twitter card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: this.metadata.author.twitter.user },
        { name: "twitter:creator", content: this.metadata.author.twitter.user },
        { name: "twitter:title", content: this.title },
        { name: "twitter:description", content: this.description },
        { name: "twitter:image", content: this.image },
        // Open Graph
        { property: "og:title", content: this.title },
        { property: "og:url", content: this.url },
        ...getOpenGraphImage(this.image),
        { property: "og:description", content: this.description },
        {
          property: "og:locale",
          content: this.metadata.language.replace("-", "_"),
        },
        { property: "og:site_name", content: this.metadata.name },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: this.date },
        ...[this.dateModified]
          .filter((x) => x)
          .map((x) => ({ property: "article:modified_time", content: x })),
        { property: "article:author", content: this.author },
        ...this.headings.map((x) => ({
          property: "article:section",
          content: x.value,
        })),
        ...this.tags.map((x) => ({
          property: "article:tag",
          content: x.title,
        })),
        { property: "fb:app_id", content: this.metadata.facebookAppId },
      ],
      script: [
        {
          type: "application/ld+json",
          json: {
            "@context": "https://schema.org",
            "@type": "Article",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": this.metadata.url,
            },
            headline: this.title,
            description: this.description,
            keywords: this.tags.map((x) => x.title).join(),
            url: this.url,
            image: [getSchemaImageObject(this.image)],
            datePublished: this.date,
            dateModified: this.dateModified,
            author: {
              "@type": "Person",
              name: this.author,
              logo: [
                {
                  "@type": "ImageObject",
                  url: `${this.metadata.url}/images/author/${this.author
                    .split(" ")
                    .join("-")}/Logo-192x192.png`,
                  width: 192,
                  height: 192,
                },
                {
                  "@type": "ImageObject",
                  url: `${this.metadata.url}/images/author/${this.author
                    .split(" ")
                    .join("-")}/Logo-512x512.png`,
                  width: 512,
                  height: 512,
                },
              ],
              url: this.metadata.url + "/about/",
            },
            publisher: {
              "@type": "Organization",
              name: this.metadata.name,
              logo: {
                "@type": "ImageObject",
                url: this.metadata.url + "/images/schema/Publisher-600x60.png",
                width: 600,
                height: 60,
              },
              url: this.metadata.url,
            },
          },
        },
      ],
    };
  },
};
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
query Post ($id: ID!) {
  post: post (id: $id) {
    title
    path
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
    heroImage (width: 860, blur: 10)
  }
}
</page-query>

<style lang="scss">
.post-page {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(
    1,
    minmax(
      var(--global-space-content-min-width),
      var(--global-space-content-max-width)
    )
  );
  justify-content: center;
}

.post-page__title-container {
  display: grid;
  justify-items: center;
  margin: 0 auto;
  padding-top: var(--global-space-fluid-5);
  text-align: center;
}

.post-page__arrows {
  margin-left: calc(
    var(--global-space-main) + var(--global-space-content-max-width) * -1
  );
  margin-right: calc(
    var(--global-space-main) + var(--global-space-content-max-width) * -1
  );
}
</style>
