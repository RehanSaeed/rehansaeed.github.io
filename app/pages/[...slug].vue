<template>
  <div class="post-page h-entry">
    <div class="post-page__title-container">
      <u-heading
        :id="title"
        class="p-name u-url"
        level="1"
        center
        :to="post.permalink"
        >{{ title }}</u-heading
      >
      <u-post-meta :meta="post" />
    </div>

    <u-arrows class="post-page__arrows" />

    <u-post class="post-page__content" :post="post" />

    <u-webmentions class="post-page__webmentions" :url="url" />

    <u-comments class="post-page__comments" :title="title" />
  </div>
</template>

<script setup>
import UArrows from "~/components/shared/arrows.vue";
import UHeading from "~/components/shared/heading.vue";
import UComments from "~/components/comments.vue";
import UPost from "~/components/post.vue";
import UPostMeta from "~/components/post-meta.vue";
import UWebmentions from "~/components/webmentions/webmentions.vue";
import { authorSchema, publisherSchema } from "~/composables/use-site-head";
import { getOpenGraphImage, getSchemaImageObject } from "~/framework/images.js";

const site = useAppConfig().site;
const route = useRoute();
// Drafts are routed too, as in Gridsome; they are only left out of listings and feeds.
const permalink = route.path.endsWith("/") ? route.path : `${route.path}/`;

const { data: post } = await useAsyncData(`post-${permalink}`, () =>
  queryCollection("posts").where("permalink", "=", permalink).first(),
);
if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const title = post.value.title;
const description = post.value.description;
const author = post.value.author;
const date = post.value.date;
const dateModified = post.value.dateModified;
const image = site.url + post.value.heroImage;
const url = site.url + post.value.permalink;
const tags = post.value.tags ?? [];
const headings = post.value.headings ?? [];

useHead({
  title,
  link: [{ rel: "canonical", href: url }],
  meta: [
    { name: "description", content: description },
    { name: "author", content: author },
    { name: "keywords", content: tags.join(",") },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:url", content: url },
    ...getOpenGraphImage(image),
    { property: "og:description", content: description },
    { property: "og:locale", content: site.language.replace("-", "_") },
    { property: "og:site_name", content: site.name },
    { property: "og:type", content: "article" },
    { property: "article:published_time", content: date },
    ...[dateModified]
      .filter((x) => x)
      .map((x) => ({ property: "article:modified_time", content: x })),
    { property: "article:author", content: author },
    // One tag per heading, split apart by plugins/article-sections.ts.
    ...[headings.map((x) => x.value).join("\n")]
      .filter((x) => x)
      .map((x) => ({ property: "article:section", content: x })),
    ...tags.map((x) => ({
      property: "article:tag",
      content: x,
    })),
    { property: "fb:app_id", content: site.facebookAppId },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": site.url,
        },
        headline: title,
        description,
        keywords: tags.join(),
        url,
        image: [getSchemaImageObject(image)],
        datePublished: date,
        dateModified,
        author: authorSchema(site, author),
        publisher: publisherSchema(site),
      }),
    },
  ],
});
</script>

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
  padding-block-start: var(--global-space-fluid-5);
  text-align: center;
}

.post-page__arrows {
  margin-inline-start: 50%;
  translate: -50%;
  width: 100vw;
}
</style>
