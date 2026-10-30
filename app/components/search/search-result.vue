<template>
  <article class="search-result" v-bind="soundTrigger">
    <NuxtLink
      :to="searchResult.permalink"
      class="search-result__link"
      @click="onSelected">
      <picture v-if="searchResult.heroImage" class="search-result__picture">
        <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
        <img
          class="search-result__image"
          alt=""
          loading="lazy"
          :src="searchResult.heroImage" />
      </picture>
      <u-heading
        :id="`search-result-${searchResult.id}`"
        class="search-result__title"
        level="3"
        >{{ searchResult.title }}</u-heading
      >
      <p class="search-result__description">
        {{ searchResult.description }}
      </p>
    </NuxtLink>
  </article>
</template>

<script>
import { getAvifSource } from "#shared/utils/images";

export default {
  name: "u-search-result",
  emits: ["selected"],
  setup() {
    return { soundTrigger: useLinkSound(() => "search") };
  },
  computed: {
    avifSource() {
      return getAvifSource(this.searchResult.heroImage);
    },
  },
  props: {
    searchResult: {
      type: Object,
      required: true,
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
.search-result__picture {
  grid-area: image;
  margin-inline-end: var(--global-space-fixed-5);
}
.search-result__image {
  border: var(--global-border-width-2) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
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
