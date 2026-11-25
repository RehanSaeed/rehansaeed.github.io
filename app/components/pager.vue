<template>
  <div class="pager">
    <u-link-button
      v-if="pageInfo.hasPreviousPage"
      class="pager__previous-button"
      variant="contrast"
      label="Previous page"
      :to="previousUrl">
      <u-icon
        class="pager__icon"
        name="fa-solid:arrow-left"
        aria-hidden="true" />
    </u-link-button>

    <p class="pager__info">
      <strong
        >Page {{ pageInfo.currentPage }} of {{ pageInfo.totalPages }}</strong
      >
    </p>

    <u-link-button
      v-if="pageInfo.hasNextPage"
      class="pager__next-button"
      variant="contrast"
      label="Next page"
      :to="nextUrl">
      <u-icon
        class="pager__icon"
        name="fa-solid:arrow-right"
        aria-hidden="true" />
    </u-link-button>
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
  grid-template-columns: 2.75rem auto 2.75rem;

  text-align: center;
}

.pager__info {
  grid-area: info;
  margin-block-end: 0;
  min-inline-size: 0;
}

.pager__previous-button,
.pager__next-button {
  display: grid;
  place-items: center;
  inline-size: 2.75rem;
  block-size: 2.75rem;
  border-radius: 50%;
  padding: var(--global-space-fixed-2);
  font-size: 1rem;
}

.pager .pager__previous-button:focus-visible,
.pager .pager__next-button:focus-visible {
  outline: var(--global-border-width-2) solid var(--global-accent-color);
  outline-offset: var(--global-focus-outline-offset);
}

.pager__previous-button {
  grid-area: previous;
}

.pager__next-button {
  grid-area: next;
}

@media (forced-colors: active) {
  .pager__previous-button,
  .pager__next-button {
    border-color: LinkText;
  }

  .pager .pager__previous-button:focus-visible,
  .pager .pager__next-button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
