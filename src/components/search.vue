<template>
  <div class="search">
    <input
      id="search"
      autofocus
      v-model="searchTerm"
      class="search__input"
      placeholder="Search"
      inputmode="search"
      type="search">
    <div class="search__results">
      <g-link v-for="result in searchResults"
        @click.native="onSelected"
        :key="result.id"
        :to="result.permalink || result.path"
        class="search__result">
        <g-image v-if="result.node.heroImage"
          class="search__result__image"
          :src="result.node.heroImage"/>
        <p class="search__result__title">{{result.node.title}}</p>
        <p class="search__result__description">{{result.node.description}}</p>
      </g-link>
    </div>
  </div>
</template>

<script>
import Search from 'gridsome-plugin-flexsearch/SearchMixin';

export default {
  name: 'u-search',
  mixins: [Search],
  props: {
    search: {
      type: String,
    }
  },
  methods: {
    onSelected() {
      this.$emit('selected');
    }
  },
  mounted() {
    if (this.search) {
      this.searchTerm = this.search;
    }
  }
}
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

.search__result {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "image title"
    "image description";
  text-decoration: none;
}

.search__result__image {
  border: var(--global-border-width-2) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  grid-area: image;
  margin-right: var(--global-space-fixed-5);
  min-width: 8rem;
  width: 8rem;
}

.search__result__title {
  color: var(--global-title-color);
  font-size: var(--global-font-size-3);
  grid-area: title;
  margin: 0;
}

.search__result__description {
  color: var(--global-body-color);
  font-size: var(--global-font-size-1);
  grid-area: description;
  margin: 0;
}
</style>
