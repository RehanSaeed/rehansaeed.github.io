<template>
  <NuxtPicture
    format="avif"
    v-if="getAvifSource(src)"
    class="site-image"
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
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}>();
</script>
