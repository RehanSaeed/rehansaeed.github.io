<template>
  <div class="post-meta">
    Posted <time :datetime="meta.date">{{meta.displayDate}}</time>
    <span v-if="updated"> and updated <time :datetime="meta.dateModified">{{updated}}</time></span>
    <template v-if="meta.timeToRead">
      - <strong>{{ meta.timeToRead }} min read</strong>
    </template>
  </div>
</template>

<script>
import { formatDistance } from 'date-fns';

export default {
  name: 'u-post-meta',
  props: {
    meta: {
      type: Object,
    },
  },
  computed: {
    updated: function() {
      if (this.meta.dateModified) {
        return formatDistance(new Date(this.meta.dateModified), new Date(), { addSuffix: true });
      }
      return undefined;
    }
  }
}
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  opacity: .8;
}
</style>
