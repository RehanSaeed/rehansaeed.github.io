<template>
  <div>
    <input
      id="search"
      v-model="searchTerm"
      class="search__input"
      type="text">
    <div v-if="this.searchResults.length != 0" class="search__popup">
      <g-link v-for="result in searchResults"
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
import Search from 'gridsome-plugin-flexsearch/SearchMixin'
export default {
  mixins: [Search]
}
</script>

<style lang="scss">
.search__input {
  background: var(--bg-color) url('/images/icons/Search.svg') .45em .45em no-repeat;
  border-color: var(--title-color);
  border-radius: var(--radius);
  border-width: 2px;
  color: var(--title-color);
  font-size: 0.9em;
  max-width: 10rem;
  padding: 0.3em 0.3em 0.3em 1.8em;

  @media screen and (max-width: 650px) {
    max-width: 8rem;
  }
}

.search__popup {
  background-color: var(--bg-content-color);
  border-radius: var(--radius);
  position: absolute;
  top: 4em;
  left: 0;
  z-index: 100;
  max-height: calc(100vh - 6em);
  margin: 0 1.5em 1.5em 1.5em;
  padding: 0.5em 0;
  overflow-y: auto;
  padding: 1.5em 1.5em 0.5em 1.5em;
}

.search__result {
  display: block;
  text-decoration: none;
  margin-bottom: 1em;
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
