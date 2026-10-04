<template>
  <div class="posts">
    <u-author />
    <u-arrows class="posts__arrows" />

    <div class="posts__items">
      <u-post-card
        v-for="(post, index) of posts"
        :key="post.id"
        :post="post"
        :priority="index === 0" />
    </div>

    <u-pager class="posts__pager" :page-info="pageInfo" />
  </div>
</template>

<script setup>
import UAuthor from "~/components/author.vue";
import UArrows from "~/components/shared/arrows.vue";
import UPager from "~/components/pager.vue";
import UPostCard from "~/components/post-card.vue";
import {
  authorSchema,
  heroImagePath,
  imageSize,
  publisherSchema,
} from "~/composables/use-site-head";
import { nextUrl, previousUrl } from "~/framework/paging.js";

const postsPerPage = 10;

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
});

const site = useAppConfig().site;

const { data } = await useAsyncData(`posts-page-${props.page}`, async () => {
  const published = () =>
    queryCollection("posts").where("published", "=", true);
  const [posts, totalItems] = await Promise.all([
    published()
      .order("date", "DESC")
      .skip((props.page - 1) * postsPerPage)
      .limit(postsPerPage)
      .select(
        "id",
        "title",
        "date",
        "dateModified",
        "timeToRead",
        "description",
        "heroImage",
        "permalink",
        "tags",
      )
      .all(),
    published().count(),
  ]);
  return { posts, totalItems };
});

const totalPages = Math.ceil((data.value?.totalItems ?? 0) / postsPerPage);
if (!data.value?.posts.length || props.page > totalPages) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page Not Found",
    fatal: true,
  });
}

const posts = computed(() => data.value.posts);
const pageInfo = {
  totalPages,
  currentPage: props.page,
  hasPreviousPage: props.page > 1,
  hasNextPage: props.page < totalPages,
};

const title = "Blog";
const description = `Blog posts and more authored by ${site.author.name}.`;
const image = site.url + heroImagePath;
const url = `${site.url}${props.page === 1 ? "/" : `/${props.page}/`}`;
const { width: imageWidth, height: imageHeight } = imageSize(image);

useHead({
  title,
  link: [
    { rel: "canonical", href: url },
    ...[{ rel: "next", href: nextUrl(pageInfo, site.url) }].filter(
      (x) => x.href,
    ),
    ...[{ rel: "prev", href: previousUrl(pageInfo, site.url) }].filter(
      (x) => x.href,
    ),
  ],
  meta: [
    { name: "description", content: description },
    { name: "author", content: site.author.name },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:height", content: imageHeight },
    { property: "og:image:width", content: imageWidth },
    { property: "og:description", content: description },
    { property: "og:locale", content: site.language.replace("-", "_") },
    { property: "og:site_name", content: site.name },
    { property: "og:type", content: "profile" },
    { property: "profile:first_name", content: site.author.firstName },
    { property: "profile:last_name", content: site.author.lastName },
    { property: "profile:username", content: site.author.name },
    { property: "profile:gender", content: site.author.gender },
    { property: "fb:app_id", content: site.facebookAppId },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        description,
        url: site.url,
        image: [
          {
            "@type": "ImageObject",
            url: image,
            width: imageWidth,
            height: imageHeight,
          },
        ],
        potentialAction: {
          "@type": "SearchAction",
          target: `${site.url}?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        author: authorSchema(site, site.author.name),
        publisher: publisherSchema(site),
      }),
    },
  ],
});
</script>

<style lang="scss">
.posts {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: 1fr;
}

.posts__arrows {
  margin-inline: calc(var(--global-space-main) * -1);
}

.posts__items {
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

.posts__pager {
  justify-self: center;
}
</style>
