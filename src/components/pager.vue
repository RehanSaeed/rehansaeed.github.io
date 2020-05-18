<template>
  <div class="pager">
    <u-link class="pager__previous-button" :class="{ 'pager__button--none': !pageInfo.hasPreviousPage }" bordered contrast :to="previousUrl">Previous</u-link>

    <p class="pager__info"><strong>Page {{pageInfo.currentPage}} of {{pageInfo.totalPages}}</strong></p>

    <u-link class="pager__next-button" :class="{ 'pager__button--none': !pageInfo.hasNextPage }" bordered contrast :to="nextUrl">Next</u-link>
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
  grid-template-columns: 7rem 1fr 7rem;
  text-align: center;
}

.pager__info {
  grid-area: info;
  margin-bottom: 0;
  min-width: 0;
}

.pager__previous-button,
.pager__next-button {
  a {
    display: block;
  }
}

.pager__previous-button {
  grid-area: previous;
}

.pager__next-button {
  grid-area: next;
}

.pager__button--none {
  display: none;
}
</style>
