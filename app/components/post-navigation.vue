<template>
  <nav
    v-if="previous || next"
    class="post-navigation"
    aria-label="Post navigation">
    <ul class="post-navigation__list" role="list">
      <u-card
        v-for="item in neighbours"
        :key="item.rel"
        class="post-navigation__card"
        :class="`post-navigation__card--${item.rel}`"
        tag="li"
        hoverable
        focusable>
        <NuxtLink
          class="post-navigation__link"
          :to="item.post.permalink"
          :rel="item.rel"
          :aria-labelledby="`post-navigation-${item.rel}-label post-navigation-${item.rel}-title`"
          :aria-describedby="`post-navigation-${item.rel}-time`">
          <NuxtPicture
            class="post-navigation__picture"
            :img-attrs="{ class: 'post-navigation__image' }"
            format="avif"
            :legacy-format="getLegacyImageFormat(item.post.heroImage)"
            :src="item.post.heroImage"
            :width="item.image.width"
            :height="item.image.height"
            :sizes="contentImageSizes"
            densities="x1 x2"
            loading="lazy"
            alt="" />
          <p class="post-navigation__meta">
            <span
              class="post-navigation__direction"
              :id="`post-navigation-${item.rel}-label`">
              <u-icon class="post-navigation__arrow" :name="item.icon" />
              {{ item.label }}
            </span>
            <time
              class="post-navigation__reading-time"
              :id="`post-navigation-${item.rel}-time`"
              :datetime="`PT${item.post.timeToRead}M`">
              {{ item.post.timeToRead }} min read
            </time>
          </p>
          <h2
            class="post-navigation__title"
            :id="`post-navigation-${item.rel}-title`">
            {{ item.post.title }}
          </h2>
        </NuxtLink>
      </u-card>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { getImageMetadata } from "~/framework/images";
import { contentImageSizes } from "#shared/utils/images";

const props = defineProps<{ permalink: string }>();

const { data: posts } = await useAsyncData("post-navigation", () =>
  queryCollection("posts")
    .where("published", "=", true)
    .order("date", "ASC")
    // Keep navigation stable when multiple posts share a publication date.
    .order("permalink", "ASC")
    .select("title", "permalink", "heroImage", "timeToRead")
    .all(),
);

const index = computed(
  () =>
    posts.value?.findIndex((post) => post.permalink === props.permalink) ?? -1,
);
const previous = computed(() =>
  index.value > 0 ? posts.value?.[index.value - 1] : undefined,
);
const next = computed(() =>
  index.value >= 0 ? posts.value?.[index.value + 1] : undefined,
);

function getLegacyImageFormat(src: string): "png" | "jpg" {
  return src.endsWith(".png") ? "png" : "jpg";
}

const neighbours = computed(() =>
  [
    {
      post: previous.value,
      rel: "prev",
      label: "Previous post",
      icon: "feather:arrow-left",
    },
    {
      post: next.value,
      rel: "next",
      label: "Next post",
      icon: "feather:arrow-right",
    },
  ].flatMap((item) =>
    item.post
      ? [
          {
            ...item,
            post: item.post,
            image: getImageMetadata(item.post.heroImage),
          },
        ]
      : [],
  ),
);
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.post-navigation {
  --post-navigation-caption-offset: calc(
    var(--global-space-fixed-6) + var(--global-space-fixed-4)
  );

  container-type: inline-size;
}

.post-navigation__list {
  display: grid;
  align-items: start;
  gap: var(--global-space-fixed-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));

  margin: 0;
  padding: 0;

  list-style: none;

  @container (width <= 40em) {
    gap: var(--global-space-fixed-4);
    grid-template-columns: minmax(0, 1fr);
  }
}

.post-navigation__card {
  min-inline-size: 0;
  margin-block: 0;
  padding: 0;
}

.post-navigation__card--next {
  grid-column: -2 / -1;

  text-align: end;
}

.post-navigation__link {
  display: grid;
  grid-template-areas:
    "picture"
    "meta"
    "title";
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto auto;

  position: relative;

  min-inline-size: 0;
  overflow: hidden;

  border-radius: inherit;
  color: var(--global-title-color);
  text-decoration: none;
}

.post-navigation__link:focus-visible {
  outline: var(--global-border-width-2) solid var(--global-accent-color);
  outline-offset: var(--global-space-fixed-1);
}

.post-navigation__picture {
  align-self: start;
  grid-area: picture;
  grid-row-end: title-end;

  display: block;

  margin-block-end: var(--post-navigation-caption-offset);
}

.post-navigation__image {
  display: block;

  inline-size: 100%;
  block-size: auto;
}

.post-navigation__link::before {
  grid-area: meta;
  grid-row-end: title-end;

  z-index: 1;

  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--global-content-background-color) 65%, transparent),
    color-mix(in srgb, var(--global-content-background-color) 88%, transparent)
      calc((100% - var(--post-navigation-caption-offset)) * 0.35),
    var(--global-content-background-color)
      calc(100% - var(--post-navigation-caption-offset))
  );
  content: "";
  pointer-events: none;
}

.post-navigation__meta,
.post-navigation__title {
  position: relative;
  z-index: 1;

  min-inline-size: 0;
  padding-inline: var(--global-space-fixed-5);

  @include breakpoints.respond-below(sm) {
    padding-inline: var(--global-space-fixed-4);
  }
}

.post-navigation__meta {
  grid-area: meta;

  display: grid;
  align-items: center;
  gap: var(--global-space-fixed-2);
  grid-template-areas: "direction time";
  grid-template-columns: max-content max-content;
  justify-content: space-between;

  margin: 0;
  padding-block-start: var(--global-space-fixed-4);

  font-size: var(--global-font-size-1);
  white-space: nowrap;
}

.post-navigation__direction {
  grid-area: direction;

  display: grid;
  align-items: center;
  gap: var(--global-space-fixed-2);
  grid-template-areas: "arrow label";
  grid-template-columns: max-content max-content;

  min-block-size: var(--global-space-fixed-5);

  color: var(--global-accent-color);
  font-weight: var(--global-font-weight-bold);
  line-height: var(--global-line-height-0);
}

.post-navigation__reading-time {
  grid-area: time;
}

.post-navigation__card--next .post-navigation__meta {
  grid-template-areas: "time direction";
}

.post-navigation__card--next .post-navigation__direction {
  grid-template-areas: "label arrow";
}

.post-navigation__arrow {
  grid-area: arrow;

  display: block;

  font-size: var(--global-font-size-4);
}

.post-navigation__title {
  grid-area: title;

  margin: 0;
  padding-block: var(--global-space-fixed-2) var(--global-space-fixed-4);

  font-size: var(--global-font-size-2);
  line-height: var(--global-line-height-1);
  overflow-wrap: anywhere;
}

@container (width > 40em) {
  .post-navigation__list {
    align-items: stretch;
    grid-template-rows: minmax(0, 1fr) auto auto;
    row-gap: 0;
  }

  .post-navigation__card,
  .post-navigation__link {
    grid-row: span 3;

    display: grid;
    grid-template-rows: subgrid;
    row-gap: 0;
  }
}
</style>
