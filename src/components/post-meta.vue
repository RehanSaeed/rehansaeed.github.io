<template>
  <div>
    <p v-if="meta.dateModified" class="post-meta">Posted <time class="dt-published" :datetime="meta.date" :title="meta.date">{{postedDisplayDate}}</time> and updated <time :datetime="meta.dateModified" :title="meta.dateModified">{{updatedDisplayDate}}</time> - <strong>{{ meta.timeToRead }} min read</strong></p>
    <p v-else class="post-meta">Posted <time class="dt-updated" :datetime="meta.date" :title="meta.date">{{postedDisplayDate}}</time> - <strong>{{ meta.timeToRead }} min read</strong></p>
  </div>
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
    postedDisplayDate: function() { return getDisplayDateFromString(this.meta.date); },
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
