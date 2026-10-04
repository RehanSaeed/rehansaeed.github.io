<template>
  <article class="search-result">
    <Component
      :is="tag"
      :href="isExternal ? searchResult.permalink : undefined"
      :to="isExternal ? undefined : searchResult.permalink"
      class="search-result__link"
      @click="onSelected">
      <img
        v-if="searchResult.heroImage"
        class="search-result__image"
        alt=""
        loading="lazy"
        :src="searchResult.heroImage" />
      <u-heading
        :id="`search-result-${searchResult.id}`"
        class="search-result__title"
        level="3"
        >{{ searchResult.title }}</u-heading
      >
      <p class="search-result__description">
        {{ searchResult.description }}
      </p>
    </Component>
  </article>
</template>

<script>
import { NuxtLink } from "#components";
import Heading from "~/components/shared/heading.vue";

export default {
  name: "u-search-result",
  components: {
    "u-heading": Heading,
  },
  emits: ["selected"],
  props: {
    searchResult: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isExternal() {
      return /^https?:\/\//.test(this.searchResult.permalink);
    },
    tag() {
      return this.isExternal ? "a" : NuxtLink;
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
