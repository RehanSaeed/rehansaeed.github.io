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
        <g-image v-if="result.cover_image" alt="Cover image" class="search__result__image" :src="result.cover_image"/>
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
  props: {
    search: {
      type: String,
    }
  },
  methods: {
    onSelected: function() {
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
  grid-gap: 1rem;
}

.search__input {
  font-size: 1.5em;

  @media screen and (max-width: 650px) {
    font-size: 1.2em;
  }
}

.search__results {
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
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
  border: solid 2px var(--border-color);
  border-radius: var(--radius);
  grid-area: image;
  margin-right: 1rem;
  min-width: 8rem;
  width: 8rem;
}

.search__result__title {
  color: var(--title-color);
  font-size: 1.1em;
  grid-area: title;
  margin: 0;
}

.search__result__description {
  color: var(--body-color);
  font-size: 0.9em;
  grid-area: description;
  margin: 0;
}
</style>
