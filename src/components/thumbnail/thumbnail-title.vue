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

<script>
import iconRehan from "~/components/shared/icons/icon-rehan.vue";

export default {
  components: {
    "u-icon-rehan": iconRehan,
  },
  data() {
    return {
      title: "",
      subtitle: "",
      titleJustify: "",
      titleAlign: "",
      titleWidth: undefined,
    };
  },
  methods: {
    toEm: function (value) {
      return value + "em";
    },
    toPx(value) {
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

    this.title = title;
    this.subtitle = subtitle;
    this.titleFontSize = titleFontSize || 3.5;
    this.titleJustify = titleJustify || "start";
    this.titleAlign = titleAlign || "end";
    this.titleWidth = titleWidth;
  },
};
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
