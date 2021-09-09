<template>
  <Layout>
    <article
      class="thumbnail"
      :class="[backgroundClass]"
      :style="{ backgroundImage: backgroundImage }">
      <u-thumbnail-title class="thumbnail__title" />
      <u-thumbnail-logo class="thumbnail__logo" />
      <u-thumbnail-image class="thumbnail__image1" name="image1" />
      <u-thumbnail-image class="thumbnail__image2" name="image2" />
    </article>
    <u-thumbnail-options
      :background="background"
      @update:background="background = $event" />
  </Layout>
</template>

<script>
import Layout from "~/layouts/empty.vue";
import thumbnailImage from "~/components/thumbnail/thumbnail-image.vue";
import thumbnailLogo from "~/components/thumbnail/thumbnail-logo.vue";
import thumbnailOptions from "~/components/thumbnail/thumbnail-options.vue";
import thumbnailTitle from "~/components/thumbnail/thumbnail-title.vue";

export default {
  components: {
    Layout,
    "u-thumbnail-image": thumbnailImage,
    "u-thumbnail-logo": thumbnailLogo,
    "u-thumbnail-options": thumbnailOptions,
    "u-thumbnail-title": thumbnailTitle,
  },
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
      return this.background?.startsWith("/") ||
        this.background?.startsWith("http")
        ? `url("${this.background}")`
        : "";
    },
  },
  mounted() {
    document.body.style.backgroundColor = "transparent";
    const { background } = this.$route.query;

    this.background = background;
  },
};
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
  width: 1920px;
  height: 1080px;
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
.thumbnail__image2 {
  grid-area: content;
}
</style>
