<template>
  <div class="tags">
    <u-link-button
      v-for="tag of tags"
      :key="tag"
      class="tags__link"
      tag
      data-tag-transition-link
      :to="tagPath(tag)"
      ><span data-tag-transition-label>{{ tag }}</span></u-link-button
    >
  </div>
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
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
