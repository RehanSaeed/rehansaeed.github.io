<template>
  <div>
    <p v-if="meta.dateModified" class="post-meta">
      Posted
      <time class="dt-published" :datetime="meta.date" :title="meta.date">{{
        postedDisplayDate
      }}</time>
      and updated
      <time :datetime="meta.dateModified" :title="meta.dateModified">{{
        updatedDisplayDate
      }}</time>
      - <strong>{{ meta.timeToRead }} min read</strong>
    </p>
    <p v-else class="post-meta">
      Posted
      <time class="dt-updated" :datetime="meta.date" :title="meta.date">{{
        postedDisplayDate
      }}</time>
      - <strong>{{ meta.timeToRead }} min read</strong>
    </p>
  </div>
</template>

<script>
import { getDisplayDateFromString } from "~/framework/date.js";

export default {
  name: "u-post-meta",
  props: {
    meta: {
      type: Object
    }
  },
  computed: {
    postedDisplayDate() {
      return getDisplayDateFromString(this.meta.date);
    },
    updatedDisplayDate() {
      return getDisplayDateFromString(this.meta.dateModified);
    }
  }
};
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  margin-bottom: 0;
  opacity: 0.8;
}
</style>
