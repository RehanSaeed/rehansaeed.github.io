<template>
  <div class="pager">
    <u-link-button
      v-if="pageInfo.hasPreviousPage"
      class="pager__previous-button"
      variant="contrast"
      :to="previousUrl">
      <u-icon
        class="pager__icon"
        name="fa-solid:arrow-left"
        aria-hidden="true" />
      <span class="pager__label">Previous</span>
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
      :to="nextUrl">
      <span class="pager__label">Next</span>
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
  grid-template-columns: clamp(7rem, 12vw, 8rem) 1fr clamp(7rem, 12vw, 8rem);

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
  align-items: center;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: var(--global-space-fixed-1);
  padding-inline: clamp(
    var(--global-space-fixed-1),
    var(--global-space-fluid-2),
    var(--global-space-fixed-2)
  );
  white-space: nowrap;
}

.pager__label {
  grid-column: 2;
}

.pager__previous-button .pager__icon {
  grid-column: 1;
  justify-self: start;
}

.pager__next-button .pager__icon {
  grid-column: 3;
  justify-self: end;
}

.pager__previous-button {
  grid-area: previous;
}

.pager__next-button {
  grid-area: next;
}
</style>
