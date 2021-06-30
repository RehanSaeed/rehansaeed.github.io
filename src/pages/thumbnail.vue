<template>
  <div>
    <Layout>
      <article
        class="thumbnail"
        :class="[backgroundClass]"
        :style="{ backgroundImage: backgroundImage }"
      >
        <img
          v-if="logo"
          class="thumbnail__logo"
          src="/favicon.svg"
          :style="{ alignSelf: logoAlign, justifySelf: logoJustify }"
          width="150"
          height="150"
        />
        <img
          v-if="item1"
          class="thumbnail__item thumbnail__item1"
          :src="item1"
          :style="{
            width: item1WidthPx,
            height: item1HeightPx,
            left: item1XPx,
            top: item1YPx,
          }"
          :width="item1Width"
          :height="item1Height"
        />
        <img
          v-if="item2"
          class="thumbnail__item thumbnail__item2"
          :src="item2"
          :style="{
            width: item2WidthPx,
            height: item2HeightPx,
            left: item2XPx,
            top: item2YPx,
          }"
          :width="item2Width"
          :height="item2Height"
        />
        <section
          v-if="title || subtitle"
          class="thumbnail__text"
          :style="{ alignContent: titleAlign, justifyItems: titleJustify }"
        >
          <h1 v-if="title" class="thumbnail__title">{{ title }}</h1>
          <h2 v-if="subtitle" class="thumbnail__subtitle">{{ subtitle }}</h2>
        </section>
      </article>
      <aside v-if="help">
        <h2>General</h2>
        <ul>
          <li>
            <em>background</em> - none, light, dark,
            /images/hero/Code-1600x900.jpg
          </li>
          <li><em>help</em></li>
        </ul>

        <h2>Title</h2>
        <ul>
          <li><em>title</em> - Title</li>
          <li><em>subtitle</em> - Subtitle</li>
          <li><em>title-justify</em> - start, center, end</li>
          <li><em>title-align</em> - start, center, end</li>
        </ul>

        <h2>Logo</h2>
        <ul>
          <li><em>logo</em></li>
          <li><em>logo-justify</em> - start, center, end</li>
          <li><em>logo-align</em> - start, center, end</li>
        </ul>

        <h2>Item 1</h2>
        <ul>
          <li><em>item1</em> - /images/hero/Code-1600x900.jpg</li>
          <li><em>item1-width</em> - 600</li>
          <li><em>item1-height</em> - 600</li>
          <li><em>item1-x</em> - 950</li>
          <li><em>item1-y</em> - 200</li>
        </ul>

        <h2>Item 2</h2>
        <ul>
          <li><em>item2</em> - /images/hero/Code-1600x900.jpg</li>
          <li><em>item2-width</em> - 600</li>
          <li><em>item2-height</em> - 600</li>
          <li><em>item2-x</em> - 950</li>
          <li><em>item2-y</em> - 200</li>
        </ul>
      </aside>
    </Layout>
  </div>
</template>

<script>
import Layout from "~/layouts/empty.vue";

export default {
  components: {
    Layout,
  },
  data() {
    return {
      help: false,
      background: "",

      title: "",
      subtitle: "",
      titleJustify: "",
      titleAlign: "",

      logo: false,
      logoJustify: "",
      logoAlign: "",

      item1: "",
      item1Width: "0",
      item1Height: "0",
      item1X: "0",
      item1Y: "0",

      item2: "",
      item2Width: "0",
      item2Height: "0",
      item2X: "0",
      item2Y: "0",
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
    item1WidthPx() {
      return this.item1Width + "px";
    },
    item1HeightPx() {
      return this.item1Height + "px";
    },
    item1XPx() {
      return this.item1X + "px";
    },
    item1YPx() {
      return this.item1Y + "px";
    },
    item2WidthPx() {
      return this.item2Width + "px";
    },
    item2HeightPx() {
      return this.item2Height + "px";
    },
    item2XPx() {
      return this.item2X + "px";
    },
    item2YPx() {
      return this.item2Y + "px";
    },
  },
  mounted() {
    const {
      background,
      help,
      item1,
      "item1-width": item1Width,
      "item1-height": item1Height,
      "item1-x": item1X,
      "item1-y": item1Y,
      item2,
      "item2-width": item2Width,
      "item2-height": item2Height,
      "item2-x": item2X,
      "item2-y": item2Y,
      logo,
      "logo-justify": logoJustify,
      "logo-align": logoAlign,
      title,
      "title-justify": titleJustify,
      "align-title": titleAlign,
      subtitle,
    } = this.$route.query;

    this.background = background;
    this.help = help === null;

    this.title = title;
    this.subtitle = subtitle;
    this.titleJustify = titleJustify || "start";
    this.titleAlign = titleAlign || "end";

    this.logo = logo === null;
    this.logoJustify = logoJustify || "end";
    this.logoAlign = logoAlign || "start";

    this.item1 = item1;
    this.item1Width = item1Width || "600";
    this.item1Height = item1Height || "600";
    this.item1X = item1X || "950";
    this.item1Y = item1Y || "200";

    this.item2 = item2;
    this.item2Width = item2Width || "600";
    this.item2Height = item2Height || "600";
    this.item2X = item2X || "950";
    this.item2Y = item2Y || "200";
  },
};
</script>

<style lang="scss">
body {
  background-color: transparent;
}

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

.thumbnail__logo {
  grid-area: content;

  background: var(--global-background-color);
  border-radius: 50%;
  width: 150px;
  height: 150px;
  z-index: 2;
}

.thumbnail__text {
  grid-area: content;

  display: grid;
  gap: var(--global-space-fluid-2);
  z-index: 2;
}
.thumbnail__title {
  background: var(--global-background-color);
  color: var(--global-accent-color);
  font-size: var(--global-font-size-9);
  line-height: var(--global-line-height-0);
  margin: 0;
  padding: var(--global-space-fluid-1) var(--global-space-fluid-2);
}
.thumbnail__subtitle {
  background: var(--global-accent-color);
  color: var(--global-background-color);
  font-size: var(--global-font-size-9);
  line-height: var(--global-line-height-0);
  margin: 0;
  padding: var(--global-space-fluid-1) var(--global-space-fluid-2);
}

.thumbnail__item {
  grid-area: content;

  filter: drop-shadow(
      0 0 var(--global-space-fluid-3) var(--global-background-color)
    )
    drop-shadow(0 0 var(--global-space-fluid-3) var(--global-background-color))
    drop-shadow(0 0 var(--global-space-fluid-3) var(--global-background-color));
  position: absolute;
  z-index: 1;
}
</style>
