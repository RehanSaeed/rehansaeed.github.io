<template>
  <div class="pager">
    <g-link v-if="pageInfo.hasPreviousPage" class="pager__previous-button" bordered contrast :to="previousUrl">Previous</g-link>

    <p class="pager__info"><strong>Page {{pageInfo.currentPage}} of {{pageInfo.totalPages}}</strong></p>

    <g-link v-if="pageInfo.hasNextPage" class="pager__next-button" bordered contrast :to="nextUrl">Next</g-link>
  </div>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import link from '~/components/shared/link.vue';
import { previousUrl, nextUrl } from '~/framework/paging.js';

export default {
  components: {
    'u-content-box': contentBox,
    'u-link': link,
  },
  props: {
    pageInfo: {
      required: true,
      type: Object
    }
  },
  computed: {
    previousUrl: function() { return previousUrl(this.pageInfo); },
    nextUrl: function() { return nextUrl(this.pageInfo); }
  }
}
</script>

<style lang="scss">
.pager {
  align-items: center;
  display: grid;
  grid-gap: var(--global-space-fluid-4);
  grid-template-areas: "previous info next";
  grid-template-columns: 1fr 1fr 1fr;
  text-align: center;
}

.pager__info {
  grid-area: info;
  margin-bottom: 0;
  min-width: 0;
}

.pager__previous-button,
.pager__next-button {
  width: 7rem;
}

.pager__previous-button {
  grid-area: previous;
}

.pager__next-button {
  grid-area: next;
}
</style>
