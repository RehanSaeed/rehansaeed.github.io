<template>
  <div class="pager">
    <u-link-button
      class="pager__previous-button"
      :class="{ 'pager__button--none': !pageInfo.hasPreviousPage }"
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
      class="pager__next-button"
      :class="{ 'pager__button--none': !pageInfo.hasNextPage }"
      bordered
      contrast
      :to="nextUrl"
      >Next</u-link-button
    >
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import type { PageInfo } from "~/framework/paging";
import {
  previousUrl as getPreviousUrl,
  nextUrl as getNextUrl,
} from "~/framework/paging";

defineOptions({ name: "BlogPager" });
const props = defineProps({
  /** Pagination metadata for the current page. */ pageInfo: {
    required: true,
    type: Object as PropType<PageInfo>,
  },
});
const previousUrl = computed(() => getPreviousUrl(props.pageInfo));
const nextUrl = computed(() => getNextUrl(props.pageInfo));
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

.pager__button--none {
  display: none;
}
</style>
