<template>
  <section
    class="search__feedback"
    :class="{
      'search__feedback--hidden': !searchTerm || status === 'results',
    }">
    <div role="status">
      <template v-if="searchTerm && status !== 'results'">
        <u-icon class="search__feedback-icon" :name="feedbackIcon" />
        <template v-if="status === 'idle'">
          <h3 class="search__feedback-heading">Keep typing</h3>
          <p>
            Enter at least {{ minimumSearchTermLength }} characters to search.
          </p>
        </template>
        <template v-else-if="status === 'loading'">
          <h3 class="search__feedback-heading">Searching…</h3>
        </template>
        <template v-else-if="status === 'empty'">
          <h3 class="search__feedback-heading">No results found</h3>
          <p>Try a different search.</p>
        </template>
        <template v-else>
          <h3 class="search__feedback-heading">Search is unavailable</h3>
          <p>Please try again.</p>
        </template>
      </template>
    </div>
    <u-button
      v-if="searchTerm && status === 'error'"
      variant="secondary"
      @click="$emit('retry')">
      Retry search
    </u-button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({ name: "u-search-feedback" });
const props = defineProps<{
  /** Current search term. */
  searchTerm: string;
  /** Current search state. */
  status: "idle" | "loading" | "results" | "empty" | "error";
  /** Minimum number of characters needed to search. */
  minimumSearchTermLength: number;
}>();
defineEmits<{ retry: [] }>();

const feedbackIcon = computed(() => {
  if (props.status === "error") {
    return "feather:alert-circle";
  }
  if (props.status === "loading") {
    return "feather:rotate-cw";
  }
  return "feather:search";
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.search__feedback {
  text-align: center;
}

.search__feedback--hidden {
  @include visually-hidden.visually-hidden();
}

.search__feedback-icon {
  color: var(--global-accent-color);
  font-size: var(--global-space-fixed-6);
  margin-inline: auto;
}

.search__feedback-heading {
  font-size: var(--global-font-size-3);
  margin-block: var(--global-space-fixed-3);
}

.search__feedback p {
  margin-block: 0;
  margin-inline: auto;
}

.search__feedback .button {
  margin-block-start: var(--global-space-fixed-3);

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }
}

@media (forced-colors: active) {
  .search__feedback-icon {
    color: CanvasText;
  }

  .search__feedback .button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
