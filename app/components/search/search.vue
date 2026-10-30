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
import { Document } from "flexsearch";
import { useId } from "vue";
import type { SearchDocument } from "#shared/types/search";

const minimumSearchTermLength = 3;
const resultLimit = 8;
let indexPromise: Promise<Document<SearchDocument>> | undefined;

// Downloads the prerendered /flexsearch.json once and builds the index in the browser.
function loadIndex() {
  indexPromise ??= $fetch<SearchDocument[]>("/flexsearch.json")
    .then((documents) => {
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
    .catch((error) => {
      indexPromise = undefined;
      throw error;
    });
  return indexPromise;
}

export default defineComponent({
  name: "u-search",
  emits: ["selected"],
  props: {
    isOpen: {
      type: Boolean,
    },
    search: {
      type: String,
    },
  },
  setup() {
    const { polite } = useAnnouncer();
    return { inputId: `site-search-${useId()}`, announceResults: polite };
  },
  data(): { searchTerm: string; searchResults: SearchDocument[] } {
    return {
      searchTerm: "",
      searchResults: [],
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
            if (!result.doc)
              throw new Error("Search result is missing its document.");
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
    $route(to, from) {
      // Nuxt can update the route object after hydration without navigating, e.g. on deep links with ?search=.
      if (to.path !== from.path) {
        this.searchTerm = "";
      }
    },
    searchTerm() {
      this.updateSearchResults();
    },
    isOpen() {
      if (this.isOpen) {
        loadIndex().catch(() => {});
        setTimeout(() => {
          if (this.$refs.search instanceof HTMLInputElement) {
            this.$refs.search.focus();
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
