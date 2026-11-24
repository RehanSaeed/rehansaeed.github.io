<template>
  <section
    class="search"
    :class="{ 'search--feedback': searchTerm && searchStatus !== 'results' }"
    aria-label="site">
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
    <div
      class="search__feedback"
      :class="{
        'search__feedback--hidden': !searchTerm || searchStatus === 'results',
      }">
      <div role="status">
        <template v-if="searchTerm && searchStatus !== 'results'">
          <u-icon
            class="search__feedback-icon"
            :name="
              searchStatus === 'error'
                ? 'feather:alert-circle'
                : searchStatus === 'loading'
                  ? 'feather:rotate-cw'
                  : 'feather:search'
            " />
          <template v-if="searchStatus === 'idle'">
            <h3 class="search__feedback-heading">Keep typing</h3>
            <p>
              Enter at least {{ minimumSearchTermLength }} characters to search.
            </p>
          </template>
          <template v-else-if="searchStatus === 'loading'">
            <h3 class="search__feedback-heading">Searching…</h3>
          </template>
          <template v-else-if="searchStatus === 'empty'">
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
        v-if="searchTerm && searchStatus === 'error'"
        variant="secondary"
        @click="retrySearch">
        Retry search
      </u-button>
    </div>
    <div class="search__results">
      <u-search-result
        v-for="searchResult of searchResults"
        :key="searchResult.id"
        :searchResult="searchResult"
        @selected="onSelected" />
    </div>
  </section>
</template>

<script lang="ts">
import { onMounted, ref, useId, watch } from "vue";
import type { Document } from "flexsearch";
import { z } from "zod";
import {
  searchDocumentSchema,
  type SearchDocument,
} from "#shared/utils/search";

const minimumSearchTermLength = 2;
const resultLimit = 8;
let indexPromise: Promise<Document<SearchDocument>> | undefined;

// Downloads the prerendered /flexsearch.json once and builds the index in the browser.
const loadIndex = () => {
  indexPromise ??= Promise.all([
    $fetch<unknown>("/flexsearch.json"),
    import("flexsearch"),
  ])
    .then(([response, { Document }]) => {
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
const searchStatus = ref<"idle" | "loading" | "results" | "empty" | "error">(
  "idle",
);
let searchRequest = 0;

const onSelected = (permalink: string) => {
  emit("selected", searchTerm.value, permalink);
};
const updateSearchResults = async () => {
  const term = searchTerm.value;
  const request = ++searchRequest;
  searchResults.value = [];
  if (term.length < minimumSearchTermLength) {
    searchStatus.value = "idle";
    return;
  }

  searchStatus.value = "loading";
  try {
    const index = await loadIndex();
    if (request !== searchRequest) {
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
    searchStatus.value = searchResults.value.length ? "results" : "empty";
    if (searchResults.value.length) {
      announceResults(
        `${searchResults.value.length} search ${searchResults.value.length === 1 ? "result" : "results"}.`,
      );
    }
  } catch (error) {
    console.error(error);
    if (request === searchRequest) {
      searchStatus.value = "error";
    }
  }
};
const retrySearch = () => {
  document.getElementById(inputId)?.focus();
  void updateSearchResults();
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

.search--feedback {
  min-block-size: 100%;
  grid-template-rows: auto 1fr;

  .search__feedback {
    align-self: center;
  }

  .search__results {
    display: none;
  }
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

.search__results {
  display: grid;
  gap: var(--global-space-fixed-5);
  grid-template-columns: 1fr;

  overflow-y: auto; // Remove when browser support is good enough.
  overflow-block: auto;
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
