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

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

definePageMeta({ layout: "empty" });
useHead({ meta: [{ name: "robots", content: "noindex, follow" }] });

const route = useRoute();
const background = ref("dark");
const backgroundClass = computed(() =>
  background.value ? "thumbnail--background-" + background.value : "",
);
const backgroundImage = computed(() =>
  background.value.startsWith("/") || background.value.startsWith("http")
    ? `url("${background.value}")`
    : "",
);
onMounted(() => {
  document.body.style.backgroundColor = "transparent";
  background.value = String(route.query.background ?? "");
});
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
