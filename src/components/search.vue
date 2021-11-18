<template>
  <section class="search" aria-label="site">
    <form class="search__form" role="search">
      <label class="search__label" for="search">Search</label>
      <input
        class="search__input"
        ref="search"
        id="search"
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
        @click.native="onSelected" />
    </div>
  </section>
</template>

<script>
import Search from "gridsome-plugin-flexsearch/SearchMixin";
import SearchResult from "./search-result.vue";

export default {
  name: "u-search",
  components: {
    "u-search-result": SearchResult,
  },
  mixins: [Search],
  props: {
    isOpen: {
      type: Boolean,
    },
    search: {
      type: String,
    },
  },
  methods: {
    onSelected() {
      this.$emit("selected", this.searchTerm);
    },
  },
  watch: {
    isOpen() {
      if (this.isOpen) {
        setTimeout(() => {
          // TODO: Implement v-focus directive in Vue 3
          // https://v3.vuejs.org/guide/custom-directive.html
          this.$refs.search.focus();
        }, 100);
      }
    },
  },
  mounted() {
    if (this.search) {
      this.searchTerm = this.search;
    }
  },
};
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

  overflow-y: auto;
}
</style>
