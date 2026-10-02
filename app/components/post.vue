<template>
  <u-card class="post" tag="article">
    <header class="post__header">
      <g-image
        v-if="post.heroImage"
        :alt="imageMeta.alt"
        :src="post.heroImage"
        class="post__photo" />
    </header>

    <div class="post__content e-content" v-html="post.content" />

    <footer class="post__footer">
      <div class="post__footer__actions">
        <u-share-button
          class="post__share"
          :title="post.title"
          :tags="post.tags.map((x) => x.title)" />
        <u-edit-post-button class="post__edit" :post="post" />
        <u-support-button class="post__support" />
      </div>
      <u-tags class="post__tags" :tags="post.tags" />
    </footer>
  </u-card>
</template>

<script>
import card from "~/components/shared/card.vue";
import editPostButton from "~/components/edit-post-button.vue";
import shareButton from "~/components/share-button.vue";
import supportButton from "~/components/support-button.vue";
import tags from "~/components/tags.vue";
import { getImageMetadata } from "~/framework/images.js";

export default {
  name: "u-post",
  components: {
    "u-card": card,
    "u-edit-post-button": editPostButton,
    "u-share-button": shareButton,
    "u-support-button": supportButton,
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
.post {
  overflow: hidden;
}

.post__header {
  border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
  margin-inline-start: var(--global-space-fluid--6);
  margin-block-start: var(--global-space-fluid--6);
  margin-block-end: var(--global-space-fluid-5);
  overflow: hidden;
  inline-size: calc(100% + (2 * var(--global-space-fluid-6)));

  &:empty {
    display: none;
  }
}

.post__content {
  > h2:first-child {
    margin-block-start: 0;
  }

  > p:first-of-type {
    color: var(--global-title-color);
    font-size: var(--global-font-size-4);
    min-inline-size: 0;

    &:first-letter {
      color: var(--global-accent-color);
      font-family: var(--global-font-family-serif);

      // initial-letter: 2; // Only supported by Safari
      // OR
      float: left; // Remove when browser support is good enough.
      float: inline-start;
      font-size: calc(var(--global-font-size-4) * 2.6);
      line-height: calc(var(--global-line-height-1) * 0.44);
      padding-inline-end: var(--global-space-fixed-2);
      margin-block-start: 0.65rem;
    }
  }

  img {
    display: block;
    inline-size: calc(100% + (2 * var(--global-space-fluid-6)));
    margin-inline: var(--global-space-fluid--6);
    max-inline-size: none;
  }

  .mermaid {
    svg {
      margin-inline: auto;
    }
  }

  .youtube-embed {
    margin-block-start: var(--global-space-fixed-4);
    margin-block-end: var(--global-space-fixed-5);

    div {
      margin-inline: var(--global-space-fluid--6);

      div {
        --padding-value: 34%;
        padding-block: var(--padding-value) !important;
      }
    }
  }
}

.post__footer {
  display: grid;
  gap: var(--global-space-fixed-3);
  justify-items: start;

  margin-block-start: var(--global-space-fixed-6);
}

.post__footer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-3);
}
</style>
