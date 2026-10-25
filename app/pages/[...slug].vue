<template>
  <div class="post-page h-entry">
    <div class="post-page__title-container">
      <u-heading
        :id="titleId"
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

    <u-card
      v-if="previousPost || nextPost"
      class="post-page__navigation"
      tag="nav"
      aria-label="Post navigation">
      <NuxtLink
        v-if="previousPost"
        class="post-page__previous"
        :to="previousPost.permalink"
        rel="prev">
        <strong>Previous post</strong>
        <span>{{ previousPost.title }}</span>
      </NuxtLink>
      <NuxtLink
        v-if="nextPost"
        class="post-page__next"
        :to="nextPost.permalink"
        rel="next">
        <strong>Next post</strong>
        <span>{{ nextPost.title }}</span>
      </NuxtLink>
    </u-card>

    <u-webmentions class="post-page__webmentions" :url="url" />

    <u-comments
      class="post-page__comments"
      :title="title"
      :snapshot="post.comments" />
  </div>
</template>

<script setup>
import { getSchemaImageObject } from "~/framework/images.js";
import { pageHeadingId } from "#shared/utils/headings";

const site = useAppConfig().site;
const route = useRoute();
// Drafts are routed too, as in Gridsome; they are only left out of listings and feeds.
const permalink = route.path.endsWith("/") ? route.path : `${route.path}/`;

const { data: post } = await useAsyncData(`post-${permalink}`, () =>
  queryCollection("posts")
    .where("permalink", "=", permalink)
    .select(
      "id",
      "title",
      "author",
      "body",
      "comments",
      "date",
      "dateModified",
      "description",
      "extension",
      "headings",
      "heroImage",
      "meta",
      "path",
      "permalink",
      "published",
      "stem",
      "tags",
      "timeToRead",
    )
    .first(),
);
if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const { data: surroundingPosts, error: navigationError } = await useAsyncData(
  `post-navigation-${permalink}`,
  async () => {
    if (!post.value.published) return [null, null];
    const posts = await queryCollection("posts")
      .where("published", "=", true)
      .order("date", "ASC")
      .order("permalink", "ASC")
      .select("title", "permalink")
      .all();
    const index = posts.findIndex((item) => item.permalink === permalink);
    if (index === -1) {
      throw createError({
        statusCode: 500,
        statusMessage: "Published post missing from post navigation",
      });
    }
    return [posts[index - 1] ?? null, posts[index + 1] ?? null];
  },
);
if (navigationError.value) {
  throw createError(navigationError.value);
}
const previousPost = computed(() => surroundingPosts.value?.[0]);
const nextPost = computed(() => surroundingPosts.value?.[1]);

const title = post.value.title;
const titleId = pageHeadingId(title, post.value.body.value);
const description = post.value.description;
const author = post.value.author;
const date = post.value.date;
const dateModified = post.value.dateModified ?? date;
const image = site.url + post.value.heroImage;
const url = site.url + post.value.permalink;
const tags = post.value.tags ?? [];
const headings = post.value.headings ?? [];

useBlogOgImage(title, post.value.heroImage, author);
useRobotsRule(post.value.published ? true : "noindex, follow");
useSchemaOrg([
  defineArticle({
    "@id": `${url}#article`,
    headline: title,
    description,
    keywords: tags,
    url,
    image: [getSchemaImageObject(image)],
    datePublished: date,
    dateModified,
    author: { "@id": `${site.url}/#identity` },
    publisher: { "@id": `${site.url}/#publisher` },
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: "Blog", item: site.url + "/" },
      { name: title, item: url },
    ],
  }),
]);

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
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

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

.post-page__navigation {
  display: grid;
  gap: var(--global-space-fluid-4);

  a {
    display: grid;
    gap: var(--global-space-fixed-2);
    min-inline-size: 0;
  }

  @include breakpoints.respond-above(sm) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.post-page__next {
  text-align: end;

  @include breakpoints.respond-above(sm) {
    grid-column: 2;
  }
}
</style>
