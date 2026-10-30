<template>
  <picture v-if="image" class="thumbnail-image__picture">
    <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
    <img
      v-bind="$attrs"
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

<script lang="ts">
import { getAvifSource } from "#shared/utils/images";
import { queryString } from "~/utils/query";

export default defineComponent({
  inheritAttrs: false,
  data() {
    return {
      image: "",
      imageRotate: "",
      imageWidth: "0",
      imageHeight: "0",
      imageX: "0",
      imageY: "0",
    };
  },
  props: {
    name: {
      required: true,
      type: String,
    },
  },
  computed: {
    avifSource() {
      return getAvifSource(this.image);
    },
    imageRotateDegrees() {
      return this.imageRotate ? `${this.imageRotate}deg` : undefined;
    },
  },
  methods: {
    toPx(value: string) {
      return value + "px";
    },
  },
  mounted() {
    this.image = queryString(this.$route.query[this.name]) ?? "";
    this.imageRotate =
      queryString(this.$route.query[`${this.name}-rotate`]) ?? "";
    this.imageWidth =
      queryString(this.$route.query[`${this.name}-width`]) || "1920";
    this.imageHeight =
      queryString(this.$route.query[`${this.name}-height`]) || "1080";
    this.imageX = queryString(this.$route.query[`${this.name}-x`]) || "0";
    this.imageY = queryString(this.$route.query[`${this.name}-y`]) || "0";
  },
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
