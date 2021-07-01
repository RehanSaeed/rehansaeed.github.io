<template>
  <Layout>
    <article
      class="thumbnail"
      :class="[backgroundClass]"
      :style="{ backgroundImage: backgroundImage }"
    >
      <u-thumbnail-title class="thumbnail__title" />
      <u-thumbnail-logo class="thumbnail__logo" />
      <u-thumbnail-image class="thumbnail__image1" name="image1" />
      <u-thumbnail-image class="thumbnail__image2" name="image2" />
    </article>
    <aside>
      <h2>General</h2>
      <section>
        <fieldset class="thumbnail__fieldset">
          <label class="thumbnail__label">background</label>
          <input
            class="thumbnail__input"
            v-model="background"
            placeholder="none|light|dark|/images/hero/Code-1600x900.jpg"
          />
        </fieldset>
      </section>

      <h2>Title</h2>
      <ul>
        <li><em>title</em> - Title</li>
        <li><em>subtitle</em> - Subtitle</li>
        <li><em>title-font-size</em> - 5</li>
        <li><em>title-justify</em> - start, center, end</li>
        <li><em>title-align</em> - start, center, end</li>
        <li><em>title-width</em> - 300</li>
      </ul>

      <h2>Logo</h2>
      <ul>
        <li><em>logo</em></li>
        <li><em>logo-justify</em> - start, center, end</li>
        <li><em>logo-align</em> - start, center, end</li>
      </ul>

      <h2>Image 1</h2>
      <ul>
        <li><em>image1</em> - /images/hero/Code-1600x900.jpg</li>
        <li><em>image1-rotate</em> - 0-360</li>
        <li><em>image1-width</em> - 600</li>
        <li><em>image1-height</em> - 600</li>
        <li><em>image1-x</em> - 950</li>
        <li><em>image1-y</em> - 200</li>
      </ul>

      <h2>Image 2</h2>
      <ul>
        <li><em>image2</em> - /images/hero/Code-1600x900.jpg</li>
        <li><em>image2-rotate</em> - 0-360</li>
        <li><em>image2-width</em> - 600</li>
        <li><em>image2-height</em> - 600</li>
        <li><em>image2-x</em> - 950</li>
        <li><em>image2-y</em> - 200</li>
      </ul>
    </aside>
  </Layout>
</template>

<script>
import Layout from "~/layouts/empty.vue";
import thumbnailImage from "~/components/thumbnail/thumbnail-image.vue";
import thumbnailLogo from "~/components/thumbnail/thumbnail-logo.vue";
import thumbnailTitle from "~/components/thumbnail/thumbnail-title.vue";

export default {
  components: {
    Layout,
    "u-thumbnail-image": thumbnailImage,
    "u-thumbnail-logo": thumbnailLogo,
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

.thumbnail__fieldset {
  display: flex;
  gap: var(--global-space-fluid-2);
}
</style>
