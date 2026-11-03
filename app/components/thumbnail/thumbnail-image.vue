<template>
  <picture v-if="image" class="thumbnail-image__picture">
    <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
    <img
      v-bind="$attrs"
      :alt="typeof $attrs.alt === 'string' ? $attrs.alt : ''"
      class="thumbnail-image"
      :src="image"
      :style="{
        rotate: imageRotateDegrees,
        'inline-size': toPx(imageWidth),
        'block-size': toPx(imageHeight),
        'inset-inline-start': toPx(imageX),
        'inset-block-start': toPx(imageY),
      }"
      :width="imageWidth"
      :height="imageHeight" />
  </picture>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getAvifSource } from "#shared/utils/images";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  /** Name identifying the icon or selected thumbnail image. */ name: {
    required: true,
    type: String,
  },
});
const route = useRoute();
const image = ref("");
const imageRotate = ref("");
const imageWidth = ref("0");
const imageHeight = ref("0");
const imageX = ref("0");
const imageY = ref("0");
const avifSource = computed(() => getAvifSource(image.value));
const imageRotateDegrees = computed(() =>
  imageRotate.value ? `${imageRotate.value}deg` : undefined,
);

const toPx = (value: string) => {
  return `${value}px`;
};
onMounted(() => {
  image.value = String(route.query[props.name] ?? "");
  imageRotate.value = String(route.query[`${props.name}-rotate`] ?? "");
  imageWidth.value = String(route.query[`${props.name}-width`] || "1920");
  imageHeight.value = String(route.query[`${props.name}-height`] || "1080");
  imageX.value = String(route.query[`${props.name}-x`] || "0");
  imageY.value = String(route.query[`${props.name}-y`] || "0");
});
</script>

<style lang="scss">
.thumbnail-image__picture {
  grid-area: content;
}

.thumbnail-image {
  filter: drop-shadow(
      0 0 var(--global-space-fluid-3) var(--global-background-color)
    )
    drop-shadow(0 0 var(--global-space-fluid-3) var(--global-background-color))
    drop-shadow(0 0 var(--global-space-fluid-3) var(--global-background-color));
  position: absolute;
  z-index: 1;
}
</style>
