<template>
  <u-card
    class="post-card"
    tag="article"
    compact
    hoverable
    focusable
    :class="{ 'post-card--has-poster': post.poster }">
    <div class="post-card__header">
      <NuxtImg
        format="avif"
        v-if="post.heroImage"
        class="post-card__image"
        :fetchpriority="priority ? 'high' : undefined"
        :alt="imageMeta.alt"
        :src="getAvifSource(post.heroImage) ?? post.heroImage"
        :width="imageMeta.width"
        :height="imageMeta.height"
        :sizes="contentImageSizes"
        densities="x1 x2"
        :loading="priority ? 'eager' : 'lazy'" />
    </div>
    <div class="post-card__content">
      <u-heading
        class="post-card__title"
        :id="`post-card-${post.id}`"
        :to="post.permalink"
        level="2"
        >{{ post.title }}</u-heading
      >
      <p class="post-card__description">{{ post.description }}</p>

      <u-post-meta class="post-card__meta" :meta="post" />
      <u-tags v-if="post.tags" class="post-card__tags" :tags="post.tags" />
    </div>
  </u-card>
</template>

<script>
import { getImageMetadata } from "~/framework/images.js";
import { contentImageSizes, getAvifSource } from "#shared/utils/images";

export default {
  name: "u-post-card",
  props: {
    priority: {
      type: Boolean,
      default: false,
    },
    post: {
      type: Object,
    },
  },
  computed: {
    contentImageSizes() {
      return contentImageSizes;
    },
    imageMeta() {
      return getImageMetadata(this.post.heroImage);
    },
  },
  methods: { getAvifSource },
};
</script>

<style lang="scss">
.post-card {
  position: relative;
}

.post-card__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-inline: calc(var(--card-space) * -1);
  margin-block-start: calc(var(--card-space) * -1);
  margin-block-end: var(--global-space-fluid-5);
  overflow: hidden;

  &:empty {
    display: none;
  }
}

.post-card__image {
  min-inline-size: 100%;
}

.post-card__title {
  margin-block-start: 0;
}

.post-card__title a::after {
  content: "";

  position: absolute;
  inset: 0;
}

.post-card__tags {
  margin-block-start: var(--global-space-fixed-4);
  position: relative;
  z-index: 1;
}
</style>
