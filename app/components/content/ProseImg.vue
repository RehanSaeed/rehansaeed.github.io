<template>
  <NuxtPicture
    format="avif"
    v-if="getAvifSource(src)"
    :legacy-format="src.endsWith('.png') ? 'png' : 'jpg'"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="contentImageSizes"
    densities="x1 x2"
    loading="lazy" />
  <NuxtImg
    v-else
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="contentImageSizes"
    densities="x1 x2"
    loading="lazy" />
</template>

<script setup lang="ts">
import { contentImageSizes, getAvifSource } from "#shared/utils/images";

defineProps<{
  /** Source URL of the image. */
  src: string;
  /** Alternative text describing the image; empty for decorative images. */
  alt?: string;
  /** Image width in pixels. */
  width?: number | string;
  /** Image height in pixels. */
  height?: number | string;
}>();
</script>
