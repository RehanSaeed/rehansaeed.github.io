<template>
  <div class="tags">
    <u-link-button
      class="tags__link"
      bordered
      v-for="tag in tags"
      :key="tag.id"
      :to="tag.path"
      >{{ tag.title }}</u-link-button
    >
  </div>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";

export default {
  name: "u-tags",
  components: {
    "u-link-button": linkButton,
  },
  props: {
    tags: {
      isRequired: true,
      type: Array,
    },
  },
};
</script>

<style lang="scss">
.tags {
  --gap: var(--global-space-fixed-3);

  display: flex;
  flex-wrap: wrap;
  margin-right: calc(-1 * var(--gap));
  margin-bottom: calc(-1 * var(--gap));
}

.tags__link {
  margin-right: var(--gap);
  margin-bottom: var(--gap);
}
</style>
