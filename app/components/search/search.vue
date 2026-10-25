<template>
  <search class="search" aria-label="Site">
    <form class="search__form" @submit.prevent>
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
        name="search"
        type="search" />
      <!-- eslint-enable vuejs-accessibility/no-autofocus -->
    </form>
    <ul class="search__results" aria-label="Search results" role="list">
      <li v-for="searchResult of searchResults" :key="searchResult.id">
        <u-search-result :searchResult="searchResult" @selected="onSelected" />
      </li>
    </ul>
  </search>
</template>

<script lang="ts">
import { onMounted, ref, useId, watch } from "vue";
import { Document } from "flexsearch";
import { z } from "zod";
import {
  searchDocumentSchema,
  type SearchDocument,
} from "#shared/utils/search";

const minimumSearchTermLength = 3;
const resultLimit = 8;
let indexPromise: Promise<Document<SearchDocument>> | undefined;

// Downloads the prerendered /flexsearch.json once and builds the index in the browser.
const loadIndex = () => {
  indexPromise ??= $fetch<unknown>("/flexsearch.json")
    .then((response) => {
      const documents = z.array(searchDocumentSchema).parse(response);
      const index = new Document<SearchDocument>({
        tokenize: "forward",
        document: {
          id: "id",
          index: ["title", "description"],
          store: true,
        },
      });
      for (const document of documents) {
        index.add(document);
      }
      return index;
    })
    .catch((error: unknown) => {
      indexPromise = undefined;
      throw error;
    });
  return indexPromise;
};
</script>

<script setup lang="ts">
defineOptions({ name: "u-search" });
const emit = defineEmits<{ selected: [searchTerm: string] }>();
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

const onSelected = () => {
  emit("selected", searchTerm.value);
};
const updateSearchResults = async () => {
  const term = searchTerm.value;
  if (term.length < minimumSearchTermLength) {
    searchResults.value = [];
    return;
  }

  try {
    const index = await loadIndex();
    if (term !== searchTerm.value) {
      return;
    }

    // The limit applies per field, so the merged results are limited again.
    searchResults.value = index
      .search(term, { limit: resultLimit, enrich: true, merge: true })
      .slice(0, resultLimit)
      .map((result) => {
        if (!result.doc) {
          throw new Error("The search index returned a missing document");
        }
        return result.doc;
      });
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
      void loadIndex().catch((error: unknown) => {
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
