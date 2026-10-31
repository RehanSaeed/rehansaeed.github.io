<template>
  <nav class="pager" aria-label="Pagination">
    <u-link-button
      v-if="pageInfo.hasPreviousPage"
      class="pager__previous-button"
      bordered
      contrast
      :to="previousUrl"
      >Previous</u-link-button
    >

    <p class="pager__info">
      <strong
        >Page {{ pageInfo.currentPage }} of {{ pageInfo.totalPages }}</strong
      >
    </p>

    <u-link-button
      v-if="pageInfo.hasNextPage"
      class="pager__next-button"
      bordered
      contrast
      :to="nextUrl"
      >Next</u-link-button
    >
  </nav>
</template>

<script>
import { previousUrl, nextUrl } from "~/framework/paging.js";

export default {
  name: "BlogPager",
  props: {
    pageInfo: {
      required: true,
      type: Object,
    },
  },
  computed: {
    previousUrl() {
      return previousUrl(this.pageInfo);
    },
    nextUrl() {
      return nextUrl(this.pageInfo);
    },
  },
};
</script>

<style lang="scss">
.pager {
  display: grid;
  align-items: center;
  gap: var(--global-space-fluid-4);
  grid-template-areas: "previous info next";
  grid-template-columns: 7rem 1fr 7rem;

  text-align: center;
}

.pager__info {
  grid-area: info;
  margin-block-end: 0;
  min-inline-size: 0;
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
</style>
