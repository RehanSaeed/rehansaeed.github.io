<template>
  <article
    class="thumbnail"
    :class="[backgroundClass]"
    :style="{ backgroundImage: backgroundImage }">
    <u-thumbnail-title class="thumbnail__title" />
    <u-thumbnail-logo class="thumbnail__logo" />
    <u-thumbnail-image class="thumbnail__image1" name="image1" />
    <u-thumbnail-image class="thumbnail__image2" name="image2" />
    <u-thumbnail-image class="thumbnail__image3" name="image3" />
  </article>
  <u-thumbnail-options
    :background="background"
    @update:background="background = $event" />
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  data() {
    return {
      background: "dark",
    };
  },
  computed: {
    backgroundClass() {
      return this.background ? "thumbnail--background-" + this.background : "";
    },
    backgroundImage() {
      return this.background.startsWith("/") ||
        this.background.startsWith("http")
        ? `url("${this.background}")`
        : "";
    },
  },
  mounted() {
    document.body.style.backgroundColor = "transparent";
    const { background } = this.$route.query;

    this.background = String(background ?? "");
  },
});
</script>

<script setup>
definePageMeta({ layout: "empty" });
useHead({ meta: [{ name: "robots", content: "noindex, follow" }] });
</script>

<style lang="scss">
.thumbnail {
  display: grid;
  grid-template-areas: "content";

  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
  padding: var(--global-space-fluid-6);
  position: relative;
  inline-size: 1920px;
  block-size: 1080px;
}
.thumbnail--background-light {
  background-color: var(--global-content-background-color);
}
.thumbnail--background-dark {
  background-color: var(--global-body-color);
}

.thumbnail__logo,
.thumbnail__title,
.thumbnail__image1,
.thumbnail__image2,
.thumbnail__image3 {
  grid-area: content;
}
</style>
