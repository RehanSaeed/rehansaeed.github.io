<template>
  <img
    v-if="image"
    class="thumbnail-image"
    :src="image"
    :style="{
      transform: imageTransform,
      width: toPx(imageWidth),
      height: toPx(imageHeight),
      left: toPx(imageX),
      top: toPx(imageY),
    }"
    :width="imageWidth"
    :height="imageHeight" />
</template>

<script>
export default {
  data() {
    return {
      image: "",
      imageRotate: undefined,
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
    imageTransform() {
      return this.imageRotate ? `rotate(${this.imageRotate}deg)` : undefined;
    },
  },
  methods: {
    toPx(value) {
      return value + "px";
    },
  },
  mounted() {
    this.image = this.$route.query[this.name];
    this.imageRotate = this.$route.query[`${this.name}-rotate`];
    this.imageWidth = this.$route.query[`${this.name}-width`] || "1920";
    this.imageHeight = this.$route.query[`${this.name}-height`] || "1080";
    this.imageX = this.$route.query[`${this.name}-x`] || "0";
    this.imageY = this.$route.query[`${this.name}-y`] || "0";
  },
};
</script>

<style lang="scss">
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
