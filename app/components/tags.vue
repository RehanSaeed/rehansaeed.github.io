<template>
  <!-- eslint-disable-next-line vuejs-accessibility/no-redundant-roles -- Preserve list semantics in Safari when list-style is none. -->
  <ul class="tags" aria-label="Tags" role="list">
    <li v-for="tag of tags" :key="tag">
      <u-link-button class="tags__link" bordered :to="tagPath(tag)">{{
        tag
      }}</u-link-button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { tagPath } from "#shared/utils/tag";

defineOptions({ name: "u-tags" });
defineProps({
  /** Tags associated with the content. */ tags: {
    required: true,
    type: Array as PropType<string[]>,
  },
});
</script>

<style lang="scss">
.tags {
  display: flex;
  gap: var(--global-space-fixed-3);
  flex-wrap: wrap;
}

.tags > li {
  display: flex;
}
</style>
