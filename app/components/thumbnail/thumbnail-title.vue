<template>
  <section
    v-if="title || subtitle"
    class="thumbnail-title"
    :style="{
      fontSize: toEm(titleFontSize),
      alignContent: titleAlign,
      justifyItems: titleJustify,
      'inline-size': toPx(titleWidth),
    }">
    <h1 v-if="title" class="thumbnail-title__title">
      {{ title }}
    </h1>
    <h2 v-if="subtitle" class="thumbnail-title__subtitle">{{ subtitle }}</h2>
  </section>
</template>

<script lang="ts">
import { queryString } from "~/utils/query";

export default defineComponent({
  data() {
    return {
      title: "",
      subtitle: "",
      titleFontSize: "",
      titleJustify: "",
      titleAlign: "",
      titleWidth: "",
    };
  },
  methods: {
    toEm: function (value: string) {
      return value + "em";
    },
    toPx(value: string) {
      return value + "px";
    },
  },
  mounted() {
    const {
      title,
      subtitle,
      "title-font-size": titleFontSize,
      "title-justify": titleJustify,
      "title-align": titleAlign,
      "title-width": titleWidth,
    } = this.$route.query;

    this.title = queryString(title) ?? "";
    this.subtitle = queryString(subtitle) ?? "";
    this.titleFontSize = queryString(titleFontSize) || "3.5";
    this.titleJustify = queryString(titleJustify) || "start";
    this.titleAlign = queryString(titleAlign) || "end";
    this.titleWidth = queryString(titleWidth) ?? "";
  },
});
</script>

<style lang="scss">
.thumbnail-title {
  display: grid;
  gap: var(--global-space-fluid-2);
  z-index: 2;
}
.thumbnail-title__title {
  background: var(--global-background-color);
  color: var(--global-accent-color);
  line-height: var(--global-line-height-0);
  margin: 0;
  padding: var(--global-space-fluid-1) var(--global-space-fluid-2)
    var(--global-space-fluid-2) var(--global-space-fluid-2);
}
.thumbnail-title__subtitle {
  background: var(--global-accent-color);
  color: var(--global-background-color);
  line-height: var(--global-line-height-0);
  margin: 0;
  padding: var(--global-space-fluid-1) var(--global-space-fluid-2)
    var(--global-space-fluid-2) var(--global-space-fluid-2);
}
</style>
