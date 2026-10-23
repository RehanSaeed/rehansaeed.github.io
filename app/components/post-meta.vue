<template>
  <div>
    <p v-if="meta.dateModified" class="post-meta">
      Posted
      <u-time class="dt-published" :datetime="meta.date" /> and updated
      <u-time class="dt-updated" :datetime="meta.dateModified" /> -
      <strong>{{ meta.timeToRead }} min read</strong>
    </p>
    <p v-else class="post-meta">
      Posted
      <u-time class="dt-published" :datetime="meta.date" /> -
      <strong>{{ meta.timeToRead }} min read</strong>
    </p>
  </div>
</template>

<script>
import time from "~/components/shared/time.vue";

export default {
  name: "u-post-meta",
  components: {
    "u-time": time,
  },
  props: {
    meta: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  margin-block-end: 0;
  opacity: 0.8;
}
</style>
