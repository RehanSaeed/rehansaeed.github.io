<template>
  <p class="post-meta">
    Posted <time :datetime="meta.date" :title="meta.date">{{postedDisplayDate}}</time>
    <span v-if="meta.dateModified"> and updated <time :datetime="meta.dateModified" :title="meta.dateModified">{{updatedDisplayDate}}</time></span>
    <span v-if="meta.timeToRead">
      - <strong>{{ meta.timeToRead }} min read</strong>
    </span>
  </p>
</template>

<script>
import { differenceInDays, format, formatDistance, getYear } from 'date-fns';

function getDisplayDate(date) {
  const now = new Date();
  if (differenceInDays(now, date) <= 30) {
    return formatDistance(date, now, { addSuffix: true })
  } else if (getYear(now) == getYear(date)) {
    return format(date, 'd MMMM');
  } else {
    return format(date, 'd MMMM yyyy');
  }
}

function getDisplayDateFromString(date) {
  if (date) {
    return getDisplayDate(new Date(date));
  }
  return undefined;
}

export default {
  name: 'u-post-meta',
  props: {
    meta: {
      type: Object,
    },
  },
  computed: {
    postedDisplayDate: function() { return getDisplayDateFromString(new Date(this.meta.date)); },
    updatedDisplayDate: function() { return getDisplayDateFromString(this.meta.dateModified); },
  }
}
</script>

<style lang="scss">
.post-meta {
  font-size: var(--global-font-size-1);
  margin-bottom: 0;
  opacity: .8;
}
</style>
