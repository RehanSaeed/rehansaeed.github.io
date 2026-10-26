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
          <div class="post-navigation__caption">
            <p class="post-navigation__meta">
              <span
                class="post-navigation__direction"
                :id="`post-navigation-${item.rel}-label`">
                <u-icon class="post-navigation__arrow" :name="item.icon" />
                {{ item.label }}
              </span>
              <time
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
          </div>
        </NuxtLink>
      </u-card>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { getImageMetadata } from "~/framework/images.js";
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
  --post-navigation-caption-offset: 64px;

  container-type: inline-size;
}

.post-navigation__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;

  @container (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  min-inline-size: 0;
  overflow: hidden;
  border-radius: inherit;
  color: var(--global-title-color);
  text-decoration: none;
}

.post-navigation__link:focus-visible {
  outline: 3px solid var(--global-accent-color);
  outline-offset: 4px;
}

.post-navigation__picture {
  grid-area: 1 / 1;
  align-self: start;
  display: block;
  margin-block-end: var(--post-navigation-caption-offset);
}

.post-navigation__image {
  display: block;
  inline-size: 100%;
  block-size: auto;
}

.post-navigation__caption {
  grid-area: 1 / 1;
  position: relative;
  align-self: end;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-inline-size: 0;
  gap: 10px;
  padding: 16px 24px;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--global-content-background-color) 65%, transparent),
    color-mix(in srgb, var(--global-content-background-color) 88%, transparent)
      calc((100% - var(--post-navigation-caption-offset)) * 0.35),
    var(--global-content-background-color)
      calc(100% - var(--post-navigation-caption-offset))
  );

  @include breakpoints.respond-below(sm) {
    padding-inline: 20px;
  }
}

.post-navigation__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-inline-size: 0;
  margin: 0;
  font-size: 0.8em;
  white-space: nowrap;
}

.post-navigation__direction {
  display: flex;
  align-items: center;
  gap: 8px;
  min-block-size: 24px;
  color: var(--global-accent-color);
  font-weight: var(--global-font-weight-bold);
  line-height: 1.25;
}

.post-navigation__card--next .post-navigation__meta,
.post-navigation__card--next .post-navigation__direction {
  flex-direction: row-reverse;
}

.post-navigation__arrow {
  display: block;
  flex: 0 0 20px;
  font-size: 20px;
}

.post-navigation__title {
  margin: 0;
  font-size: 1em;
  line-height: 1.5;
  overflow-wrap: anywhere;

  @include breakpoints.respond-below(sm) {
    font-size: 0.95em;
  }
}

@container (width > 640px) {
  .post-navigation__list {
    grid-template-rows: minmax(0, 1fr) auto;
    row-gap: 0;
    align-items: stretch;
  }

  .post-navigation__card,
  .post-navigation__link {
    display: grid;
    grid-row: span 2;
    grid-template-rows: subgrid;
    row-gap: 0;
  }

  .post-navigation__picture {
    grid-area: 1 / 1 / 3 / 2;
  }

  .post-navigation__caption {
    grid-area: 2 / 1;
    align-self: stretch;
    align-content: start;
  }
}
</style>
