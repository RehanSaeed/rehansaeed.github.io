<template>
  <ul class="tags" aria-label="Tags" role="list">
    <li v-for="tag of tags" :key="tag">
      <u-link-button class="tags__link" bordered :to="tagPath(tag)">{{
        tag
      }}</u-link-button>
    </li>
  </ul>
</template>

<script>
import { tagPath } from "#shared/utils/tag";

export default {
  name: "u-tags",
  setup() {
    return { tagPath };
  },
  props: {
    /** Tags associated with the content. */
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

.tags > li {
  display: flex;
}
</style>
