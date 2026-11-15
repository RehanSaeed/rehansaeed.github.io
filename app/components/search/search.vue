<template>
  <section class="search" aria-label="site">
    <form class="search__form" role="search" @submit.prevent>
      <label class="search__label" :for="inputId">Search</label>
      <!-- Opening search deliberately moves focus to its input. -->
      <!-- eslint-disable vuejs-accessibility/no-autofocus -->
      <input
        class="search__input"
        :id="inputId"
        autofocus
        v-model="searchTerm"
        placeholder="Search"
        inputmode="search"
        type="search" />
      <!-- eslint-enable vuejs-accessibility/no-autofocus -->
    </form>
    <div class="search__results">
      <u-search-result
        v-for="searchResult of searchResults"
        :key="searchResult.id"
        :searchResult="searchResult"
        @selected="onSelected" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, useId, watch } from "vue";
import {
  minimumSearchTermLength,
  type SearchDocument,
} from "#shared/utils/search";
import { siteSearch } from "~/framework/search";

defineOptions({ name: "u-search" });
const emit = defineEmits<{
  selected: [searchTerm: string, permalink: string];
}>();
const props = defineProps({
  /** Whether the search or dialog is open. */ isOpen: {
    type: Boolean,
  },
  /** Initial search term supplied when opening search. */ search: {
    type: String,
  },
});
const { polite: announceResults } = useAnnouncer();
const inputId = `site-search-${useId()}`;
const route = useRoute();
const searchTerm = ref("");
const searchResults = ref<SearchDocument[]>([]);

const onSelected = (permalink: string) => {
  emit("selected", searchTerm.value, permalink);
};
const updateSearchResults = async () => {
  const term = searchTerm.value;
  if (term.length < minimumSearchTermLength) {
    searchResults.value = [];
    return;
  }

  try {
    const results = await siteSearch.search(term);
    if (term !== searchTerm.value) {
      return;
    }

    searchResults.value = results;
    announceResults(
      `${searchResults.value.length} search ${searchResults.value.length === 1 ? "result" : "results"}.`,
    );
  } catch (error) {
    console.error(error);
  }
};
// Query-only hydration updates must not clear a deep-linked search term.
watch(
  () => route.path,
  () => {
    searchTerm.value = "";
  },
);
watch(searchTerm, () => {
  void updateSearchResults();
});
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      void siteSearch.loadIndex().catch((error: unknown) => {
        console.error("Unable to load the search index", error);
      });
    }
  },
);
onMounted(() => {
  if (props.search) {
    searchTerm.value = props.search;
  }
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.search {
  display: grid;
  gap: var(--global-space-fixed-5);
}

.search__form {
  display: grid;
}
.search__label {
  @include visually-hidden.visually-hidden();
}
.search__input {
  font-size: var(--global-font-size-5);
}

.search__results {
  display: grid;
  gap: var(--global-space-fixed-5);
  grid-template-columns: 1fr;

  overflow-y: auto; // Remove when browser support is good enough.
  overflow-block: auto;
}
</style>
