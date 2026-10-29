<template>
  <div class="tags">
    <u-link-button
      class="tags__link"
      bordered
      sound
      v-for="tag of tags"
      :key="tag"
      :to="tagPath(tag)"
      >{{ tag }}</u-link-button
    >
  </div>
</template>

<script>
import { tagPath } from "#shared/utils/tag";

export default {
  name: "u-tags",
  setup() {
    return { tagPath };
  },
  props: {
    tags: {
      required: true,
      type: Array,
    },
  },
};
</script>

<style lang="scss">
.tags {
  display: flex;
  gap: var(--global-space-fixed-3);
  flex-wrap: wrap;
}
</style>
