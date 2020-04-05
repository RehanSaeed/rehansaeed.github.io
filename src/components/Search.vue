<template>
  <div class="search">
    <input
      id="search"
      autofocus
      v-model="searchTerm"
      class="search__input"
      placeholder="Search"
      type="search">
    <div class="search__results">
      <g-link v-for="result in searchResults"
        @click.native="onSelected"
        :key="result.id"
        :to="result.permalink || result.path"
        class="search__result">
        <p class="search__result__title">{{result.title}}</p>
        <p class="search__result__description">{{result.description}}</p>
      </g-link>
    </div>
  </div>
</template>

<script>
import Search from 'gridsome-plugin-flexsearch/SearchMixin';

export default {
  mixins: [Search],
  methods: {
    onSelected: function() {
      this.$emit('selected');
    }
  }
}
</script>

<style lang="scss">
.search {
  display: grid;
  grid-gap: 1rem;
}

.search__input {
  background: var(--bg-content-color);
  border-color: var(--title-color);
  border-radius: var(--radius);
  border-width: 2px;
  color: var(--title-color);
  font-size: 1.5em;
  padding: .3rem .9rem;

  @media screen and (max-width: 650px) {
    font-size: 1.5em;
  }
}

.search__results {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
  overflow-y: auto;
}

.search__result {
  display: block;
  text-decoration: none;
}

.search__result__title {
  color: var(--title-color);
  font-size: 1.1em;
  margin: 0;
}

.search__result__description {
  color: var(--body-color);
  font-size: 0.9em;
  margin: 0;
}
</style>
