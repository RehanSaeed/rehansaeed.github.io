<template>
  <div class="tags">
    <u-link-button
      class="tags__link"
      bordered
      v-for="tag of tags"
      :key="tag"
      :to="tagPath(tag)"
      >{{ tag }}</u-link-button
    >
  </div>
</template>

<script>
import { tagPath } from "#shared/utils/tag";
import linkButton from "~/components/shared/link-button.vue";

export default {
  name: "u-tags",
  components: {
    "u-link-button": linkButton,
  },
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
