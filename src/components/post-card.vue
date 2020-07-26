<template>
  <u-card
    class="post-card"
    tag="article"
    hoverable
    focusable
    :class="{ 'post-card--has-poster': post.poster }"
  >
    <div class="post-card__header">
      <g-image
        v-if="post.heroImage"
        class="post-card__image"
        :alt="imageMeta.alt"
        :src="post.heroImage"
      />
    </div>
    <div class="post-card__content">
      <u-heading
        class="post-card__title"
        :id="post.title"
        :to="post.path"
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
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";
import postMeta from "~/components/post-meta.vue";
import tags from "~/components/tags.vue";
import { getImageMetadata } from "~/framework/images.js";

export default {
  name: "u-post-card",
  components: {
    "u-card": card,
    "u-heading": heading,
    "u-post-meta": postMeta,
    "u-tags": tags,
  },
  props: {
    post: {
      type: Object,
    },
  },
  computed: {
    imageMeta() {
      return getImageMetadata(this.post.heroImage);
    },
  },
};
</script>

<style lang="scss">
.post-card {
  position: relative;
}

.post-card__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-left: var(--global-space-fluid--6);
  margin-right: var(--global-space-fluid--6);
  margin-bottom: var(--global-space-fluid-5);
  margin-top: var(--global-space-fluid--6);
  overflow: hidden;

  &:empty {
    display: none;
  }
}

.post-card__image {
  min-width: 100%;
}

.post-card__title {
  margin-top: 0;
}

.post-card__title a::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

.post-card__tags {
  margin-top: var(--global-space-fixed-4);
  position: relative;
  z-index: 1;
}
</style>
