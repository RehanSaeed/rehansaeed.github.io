<template>
  <div class="tags" :class="{ 'tags--variant': variant }">
    <template v-for="tag of tags" :key="tag">
      <u-button
        v-if="variant"
        class="tags__link"
        :variant="variant"
        :tag-icon="tagIcon"
        :to="tagPath(tag)"
        >{{ tag }}</u-button
      >
      <u-link-button v-else class="tags__link" bordered :to="tagPath(tag)">{{
        tag
      }}</u-link-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { tagPath } from "#shared/utils/tag";
import type { TagButtonVariant } from "~/types/button";

defineOptions({ name: "u-tags" });
defineProps({
  /** Add the tag-label outline icon to an opt-in button variant. */ tagIcon: {
    type: Boolean,
  },
  /** Tags associated with the content. */ tags: {
    required: true,
    type: Array as PropType<string[]>,
  },
  /** Optional button appearance; omitted tags retain their existing style. */ variant:
    {
      type: String as PropType<TagButtonVariant>,
    },
});
</script>

<style lang="scss">
.tags {
  display: flex;
  gap: var(--global-space-fixed-3);
  flex-wrap: wrap;
}

.tags--variant {
  gap: 0.5rem;
}
</style>
