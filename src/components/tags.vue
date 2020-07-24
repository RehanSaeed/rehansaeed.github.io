<template>
  <div class="tags">
    <u-link
      class="tags__link"
      bordered
      v-for="tag in tags"
      :key="tag.id"
      :to="tag.path"
    >
      {{ tag.title }}
    </u-link>
  </div>
</template>

<script>
import link from "~/components/shared/link.vue";

export default {
  name: "u-tags",
  components: {
    "u-link": link,
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
