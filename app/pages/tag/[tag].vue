<template>
  <div class="tag-page">
    <u-heading :id="title" level="1" center :to="path"># {{ title }}</u-heading>

    <u-arrows class="tag-page__arrows" />

    <div class="tag-page__items">
      <u-post-card
        v-for="(post, index) of posts"
        :key="post.id"
        :post="post"
        :priority="index === 0" />
    </div>
  </div>
</template>

<script setup>
import { tagPath, tagSlug } from "#shared/utils/tag";
import UArrows from "~/components/shared/arrows.vue";
import UHeading from "~/components/shared/heading.vue";
import UPostCard from "~/components/post-card.vue";
import { heroImagePath, imageSize } from "~/composables/use-site-head";

const site = useAppConfig().site;
const slug = String(useRoute().params.tag);

// Tag pages exist for every post and portfolio tag, but only list published posts.
const { data } = await useAsyncData(`tag-${slug}`, async () => {
  const [posts, portfolio] = await Promise.all([
    queryCollection("posts")
      .order("date", "DESC")
      .select(
        "id",
        "title",
        "date",
        "dateModified",
        "timeToRead",
        "description",
        "permalink",
        "published",
        "tags",
      )
      .all(),
    queryCollection("portfolio").select("tags").all(),
  ]);
  const title = [...posts, ...portfolio]
    .flatMap((x) => x.tags)
    .find((x) => tagSlug(x) === slug);
  if (!title) {
    return null;
  }
  return {
    title,
    // Gridsome's tag page query did not include tags or hero images for its post cards.
    posts: posts
      .filter((x) => x.published && x.tags.includes(title))
      .map(({ tags: _tags, published: _published, ...x }) => x),
  };
});
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const title = data.value.title;
const posts = computed(() => data.value.posts);
const path = tagPath(title);
const description = `Blog posts authored by ${site.author.name} about ${title}.`;
const image = site.url + heroImagePath;
const url = site.url + path;

useHead({
  title,
  link: [{ rel: "canonical", href: url }],
  meta: [
    { name: "description", content: description },
    { name: "author", content: site.author.name },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:height", content: imageSize(image).height },
    { property: "og:image:width", content: imageSize(image).width },
    { property: "og:description", content: description },
    { property: "og:locale", content: site.language.replace("-", "_") },
    { property: "og:site_name", content: site.name },
    { property: "og:type", content: "website" },
    { property: "fb:app_id", content: site.facebookAppId },
  ],
});
</script>

<style lang="scss">
.tag-page {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: 1fr;
}

.tag-page__arrows {
  margin-inline: calc(var(--global-space-main) * -1);
}

.tag-page__items {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(
    auto-fit,
    minmax(
      min(var(--global-space-content-min-width), 100%),
      var(--global-space-content-max-width)
    )
  );
  justify-content: center;
}
</style>
