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

<script setup lang="ts">
import { onMounted, ref } from "vue";

const route = useRoute();
const title = ref("");
const subtitle = ref("");
const titleFontSize = ref("3.5");
const titleJustify = ref("");
const titleAlign = ref("");
const titleWidth = ref("");

const toEm = (value: string) => {
  return `${value}em`;
};
const toPx = (value: string) => {
  return value ? `${value}px` : undefined;
};
onMounted(() => {
  const query = route.query;
  title.value = String(query.title ?? "");
  subtitle.value = String(query.subtitle ?? "");
  titleFontSize.value = String(query["title-font-size"] || 3.5);
  titleJustify.value = String(query["title-justify"] || "start");
  titleAlign.value = String(query["title-align"] || "end");
  titleWidth.value = String(query["title-width"] ?? "");
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
