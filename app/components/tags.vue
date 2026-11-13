<template>
  <div class="tags">
    <u-button
      v-for="tag of tags"
      :key="tag"
      class="tags__link"
      :variant="variant"
      tag-icon
      :to="tagPath(tag)"
      >{{ tag }}</u-button
    >
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { useTagStylePreview } from "~/composables/use-tag-style-preview";
import { tagPath } from "#shared/utils/tag";

defineOptions({ name: "u-tags" });
defineProps({
  /** Tags associated with the content. */ tags: {
    required: true,
    type: Array as PropType<string[]>,
  },
});
const variant = import.meta.dev
  ? useTagStylePreview()
  : ref<"code-token">("code-token");
</script>

<style lang="scss">
.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
