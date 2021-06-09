<template>
  <section class="search" role="search" aria-label="site">
    <input
      ref="search"
      id="search"
      autofocus
      v-model="searchTerm"
      class="search__input"
      placeholder="Search"
      inputmode="search"
      type="search"
    />
    <div class="search__results">
      <u-search-result
        v-for="searchResult of searchResults"
        :key="searchResult.id"
        :searchResult="searchResult"
        @click.native="onSelected"
      />
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
.search {
  display: grid;
  grid-gap: var(--global-space-fixed-5);
}

.search__input {
  font-size: var(--global-font-size-5);
}

.search__results {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--global-space-fixed-5);
  overflow-y: auto;
}
</style>
