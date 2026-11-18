<template>
  <article
    class="search-result"
    :data-view-transition-source="
      searchResult.index === 'post' ? '' : undefined
    "
    :data-post-permalink="searchResult.permalink"
    :data-post-hero="searchResult.heroImage">
    <NuxtLink
      :to="searchResult.permalink"
      class="search-result__link"
      data-view-transition-link
      @click.capture="onSelected">
      <picture v-if="searchResult.heroImage" class="search-result__picture">
        <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
        <img
          class="search-result__image"
          data-view-transition-image
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

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { getAvifSource } from "#shared/utils/images";
import type { SearchDocument } from "#shared/utils/search";

defineOptions({ name: "u-search-result" });
const emit = defineEmits<{ selected: [permalink: string] }>();
const props = defineProps({
  /** Indexed content entry to display as a search result. */ searchResult: {
    type: Object as PropType<SearchDocument>,
    required: true,
  },
});
const avifSource = computed(() => getAvifSource(props.searchResult.heroImage));
const onSelected = (event: MouseEvent) => {
  const link = event.currentTarget;
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !(link instanceof HTMLAnchorElement) ||
    link.hasAttribute("download") ||
    (link.target && link.target !== "_self")
  ) {
    return;
  }
  emit("selected", props.searchResult.permalink);
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
