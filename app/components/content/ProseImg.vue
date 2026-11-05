<template>
  <span class="prose-image">
    <NuxtPicture
      format="avif"
      v-if="getAvifSource(src)"
      :legacy-format="src.endsWith('.png') ? 'png' : 'jpg'"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :sizes="sizes"
      densities="x1 x2"
      loading="lazy" />
    <NuxtImg
      v-else
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :sizes="sizes"
      densities="x1 x2"
      loading="lazy" />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { contentImageSizes, getAvifSource } from "#shared/utils/images";

const props = defineProps<{
  /** Source URL of the image. */ src: string;
  /** Alternative text describing the image; empty for decorative images. */ alt?: string;
  /** Image width in pixels. */ width?: number | string;
  /** Image height in pixels. */ height?: number | string;
}>();

const sizes = computed(() => {
  const width = Number(props.width);
  return width > 0 && width < 1280 ? `${width}px` : contentImageSizes;
});
</script>
