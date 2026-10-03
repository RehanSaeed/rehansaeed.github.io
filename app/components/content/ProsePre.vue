<template>
  <div v-if="filename" class="code-title">
    <span>{{ filename }}</span>
  </div>
  <div
    class="line-highlight"
    :class="{ 'has-highlighted-lines': highlights?.length }"
    :data-language="language">
    <pre
      :class="
        preClass
      "><code :class="`language-${language}`" v-html="html" /></pre>
  </div>
</template>

<script setup lang="ts">
// Code blocks are highlighted by Shiki at build time and pre-rendered to an HTML string by
// prerenderCodeBlocks (modules/blog-content/fields.ts). Fence syntax: ```js [Title] {2,4-5} line-numbers
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    language?: string;
    filename?: string;
    highlights?: number[];
    meta?: string;
    html?: string;
    class?: string;
  }>(),
  { language: "text", html: "" },
);

const preClass = computed(() => {
  const classes = new Set([
    `language-${props.language}`,
    ...(props.class ?? "").split(" "),
  ]);
  if (props.meta?.split(" ").includes("line-numbers")) {
    classes.add("line-numbers");
  }
  classes.delete("");
  return [...classes];
});
</script>
