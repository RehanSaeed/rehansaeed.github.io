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

    <ContentRenderer
      class="post__content e-content"
      data-post-content
      :components="{ figure: ProseFigure }"
      :value="post" />

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
import ProseFigure from "~/components/content/ProseFigure.vue";

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
