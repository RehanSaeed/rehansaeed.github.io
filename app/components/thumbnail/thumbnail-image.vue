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

<script lang="ts">
import { defineComponent } from "vue";
import { getAvifSource } from "#shared/utils/images";

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
    /** Name identifying the icon or selected thumbnail image. */ name: {
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
      return `${value}px`;
    },
  },
  mounted() {
    this.image = String(this.$route.query[this.name] ?? "");
    this.imageRotate = String(this.$route.query[`${this.name}-rotate`] ?? "");
    this.imageWidth = String(this.$route.query[`${this.name}-width`] || "1920");
    this.imageHeight = String(
      this.$route.query[`${this.name}-height`] || "1080",
    );
    this.imageX = String(this.$route.query[`${this.name}-x`] || "0");
    this.imageY = String(this.$route.query[`${this.name}-y`] || "0");
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
