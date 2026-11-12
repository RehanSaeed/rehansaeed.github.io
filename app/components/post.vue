<template>
  <u-card class="post" tag="article">
    <header class="post__header">
      <NuxtPicture
        format="avif"
        v-if="post.heroImage"
        :alt="imageMeta.alt"
        :src="post.heroImage"
        :img-attrs="{
          class: 'post__photo',
          fetchpriority: 'high',
          'data-view-transition-image': '',
        }"
        :legacy-format="post.heroImage.endsWith('.png') ? 'png' : 'jpg'"
        :width="imageMeta.width"
        :height="imageMeta.height"
        :sizes="contentImageSizes"
        densities="x1 x2"
        loading="eager"
        :preload="{ fetchPriority: 'high' }" />
    </header>

    <ContentRenderer class="post__content e-content" :value="post" />

    <footer class="post__footer">
      <div class="post__footer__actions">
        <u-share-button
          class="post__share"
          :title="post.title"
          :tags="post.tags" />
        <u-edit-post-button class="post__edit" :post="post" />
        <u-support-button class="post__support" />
      </div>
      <u-tags class="post__tags" :tags="post.tags" />
    </footer>
  </u-card>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import type { PostsCollectionItem } from "@nuxt/content";
import "katex/dist/katex.min.css";
import { getImageMetadata } from "~/framework/images";
import { contentImageSizes } from "#shared/utils/images";

defineOptions({ name: "u-post" });
const props = defineProps({
  /** Post metadata used to render this component. */ post: {
    type: Object as PropType<
      Pick<
        PostsCollectionItem,
        "body" | "stem" | "extension" | "title" | "tags" | "heroImage"
      >
    >,
    required: true,
  },
});
const imageMeta = computed(() => getImageMetadata(props.post.heroImage));
</script>

<style lang="scss">
.post {
  overflow: hidden;

  &:has(.image-carousel) {
    overflow: visible;
  }
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

      float: left;
      float: inline-start;
      font-size: calc(var(--global-font-size-4) * 2.6);
      line-height: calc(var(--global-line-height-1) * 0.44);
      margin-inline-end: var(--global-space-fixed-3);
      margin-block-start: 0.65rem;

      @supports (initial-letter: 2) {
        initial-letter: 2;
        float: none;
        font-size: inherit;
        line-height: normal;
        margin-block-start: 0;
      }
    }
  }

  video {
    display: block;
    inline-size: calc(100% + (2 * var(--global-space-fluid-6)));
    margin-inline: var(--global-space-fluid--6);
    max-inline-size: none;
  }

  figure {
    margin-block: var(--global-space-fixed-5);
    margin-inline: 0;

    > p:has(.prose-image) {
      max-inline-size: none;
      min-inline-size: 0;
      margin-block-end: 0;
    }

    .youtube-embed {
      margin-block: 0;
    }
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
