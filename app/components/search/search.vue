<template>
  <section class="search" aria-label="site">
    <form class="search__form" role="search" @submit.prevent>
      <label class="search__label" :for="inputId">Search</label>
      <input
        class="search__input"
        ref="search"
        :id="inputId"
        autofocus
        v-model="searchTerm"
        placeholder="Search"
        inputmode="search"
        type="search" />
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

<script lang="ts">
import { defineComponent, useId } from "vue";
import type { RouteLocationNormalized } from "vue-router";
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
function loadIndex() {
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
}

export default defineComponent({
  name: "u-search",
  emits: ["selected"],
  props: {
    /** Whether the search or dialog is open. */ isOpen: {
      type: Boolean,
    },
    /** Initial search term supplied when opening search. */ search: {
      type: String,
    },
  },
  setup() {
    const { polite } = useAnnouncer();
    return { inputId: `site-search-${useId()}`, announceResults: polite };
  },
  data() {
    return {
      searchTerm: "",
      searchResults: [] as SearchDocument[],
    };
  },
  methods: {
    onSelected() {
      this.$emit("selected", this.searchTerm);
    },
    async updateSearchResults() {
      const searchTerm = this.searchTerm;
      if (searchTerm.length < minimumSearchTermLength) {
        this.searchResults = [];
        return;
      }

      try {
        const index = await loadIndex();
        if (searchTerm !== this.searchTerm) {
          return;
        }

        // The limit applies per field, so the merged results are limited again.
        this.searchResults = index
          .search(searchTerm, { limit: resultLimit, enrich: true, merge: true })
          .slice(0, resultLimit)
          .map((result) => {
            if (!result.doc) {
              throw new Error("The search index returned a missing document");
            }
            return result.doc;
          });
        this.announceResults(
          `${this.searchResults.length} search ${this.searchResults.length === 1 ? "result" : "results"}.`,
        );
      } catch (error) {
        console.error(error);
      }
    },
  },
  watch: {
    $route(to: RouteLocationNormalized, from: RouteLocationNormalized) {
      // Nuxt can update the route object after hydration without navigating, e.g. on deep links with ?search=.
      if (to.path !== from.path) {
        this.searchTerm = "";
      }
    },
    searchTerm() {
      void this.updateSearchResults();
    },
    isOpen() {
      if (this.isOpen) {
        void loadIndex().catch((error: unknown) => {
          console.error("Unable to load the search index", error);
        });
        setTimeout(() => {
          const input = this.$refs.search;
          if (input instanceof HTMLInputElement) {
            input.focus();
          }
        }, 100);
      }
    },
  },
  mounted() {
    if (this.search) {
      this.searchTerm = this.search;
    }
  },
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
