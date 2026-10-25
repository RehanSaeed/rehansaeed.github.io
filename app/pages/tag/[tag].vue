<template>
  <div class="tag-page">
    <u-heading :id="title" level="1" center :to="path"># {{ title }}</u-heading>

    <u-arrows class="tag-page__arrows" />

    <ul class="tag-page__items" aria-label="Blog posts" role="list">
      <li v-for="(post, index) of posts" :key="post.id">
        <u-post-card :post="post" :priority="index === 0" />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { tagPath, tagSlug } from "#shared/utils/tag";

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
    // Tag-page post cards omit tags and hero images.
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
const url = site.url + path;
useBlogOgImage(`# ${title}`);
useSchemaOrg([
  defineWebPage({ "@type": "CollectionPage", name: title }),
  defineItemList({
    itemListElement: posts.value.map((post) => ({
      name: post.title,
      url: site.url + post.permalink,
    })),
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
    { name: "author", content: site.author.name },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:url", content: url },
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

.tag-page__items > li {
  display: grid;
}
</style>
