<template>
  <u-skeleton class="webmention-replies-skeleton" ref="skeleton">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" />
      <rect x="75" width="160" height="20" rx="5" />
      <rect x="250" y="5" width="100" height="15" rx="5" />
      <rect x="75" y="36" :width="commentWidth" height="20" rx="5" />
      <rect x="75" y="72" :width="commentWidth" height="20" rx="5" />
    </svg>
  </u-skeleton>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";
defineOptions({ name: "u-webmention-replies-skeleton" });
const skeleton = useTemplateRef<ComponentPublicInstance>("skeleton");
const width = ref(0);
const commentWidth = computed(() => Math.max(0, width.value - 75));
const viewBox = computed(() => `0 0 ${width.value} 92`);

useResizeObserver(skeleton, (entries) => {
  const entry = entries[0];
  if (entry) {
    width.value = Math.floor(entry.contentRect.width);
  }
});
</script>

<style lang="scss">
.webmention-replies-skeleton {
  block-size: 4.75rem;
}
</style>
