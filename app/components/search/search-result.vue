<template>
  <article class="search-result">
    <Component
      :is="tag"
      @click.native="onSelected"
      :href="searchResult.node.permalink"
      :to="searchResult.path"
      class="search-result__link">
      <g-image
        v-if="searchResult.node.heroImage"
        class="search-result__image"
        :src="searchResult.node.heroImage" />
      <u-heading
        :id="searchResult.node.title"
        class="search-result__title"
        level="3"
        >{{ searchResult.node.title }}</u-heading
      >
      <p class="search-result__description">
        {{ searchResult.node.description }}
      </p>
    </Component>
  </article>
</template>

<script>
import Heading from "~/components/shared/heading.vue";

export default {
  name: "u-search-result",
  components: {
    "u-heading": Heading,
  },
  props: {
    searchResult: {
      type: Object,
      required: true,
    },
  },
  computed: {
    tag() {
      return this.searchResult.node.permalink ? "a" : "g-link";
    },
  },
  methods: {
    onSelected() {
      this.$emit("selected");
    },
  },
};
</script>

<style lang="scss">
.search-result__link {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "image title"
    "image description";
  text-decoration: none;
}
.search-result__image {
  grid-area: image;
  border: var(--global-border-width-2) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  margin-inline-end: var(--global-space-fixed-5);
  min-inline-size: 8rem;
  inline-size: 8rem;
}
.search-result__title {
  grid-area: title;
  color: var(--global-title-color);
  font-size: var(--global-font-size-3);
  margin: 0;
}
.search-result__description {
  grid-area: description;
  color: var(--global-body-color);
  font-size: var(--global-font-size-1);
  margin: 0;
}
</style>
