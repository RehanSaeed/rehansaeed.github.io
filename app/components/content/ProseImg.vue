<template>
  <NuxtImg
    :src="getAvifSource(src) ?? src"
    :format="getAvifSource(src) || src.endsWith('.avif') ? 'avif' : undefined"
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
