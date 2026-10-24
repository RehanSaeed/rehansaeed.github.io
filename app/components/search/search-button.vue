<template>
  <div>
    <u-button
      class="search-button"
      aria-label="Open search"
      @click.prevent="onOpen">
      <NuxtIcon v-if="!isOpen" name="feather:search" aria-hidden="true" />
    </u-button>

    <u-dialogue
      fullscreen
      title="Search"
      :is-open="isOpen"
      @close="onClose"
      class="search-dialogue">
      <u-search
        :is-open="isOpen"
        :search="$route.query.search"
        @selected="onSelected" />
    </u-dialogue>
  </div>
</template>

<script>
import { NuxtIcon } from "#components";
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import search from "~/components/search/search.vue";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

export default {
  name: "u-search-button",
  components: {
    NuxtIcon,
    "u-button": button,
    "u-dialogue": dialogue,
    "u-search": search,
  },
  data() {
    return {
      isOpen: false,
    };
  },
  methods: {
    onOpen() {
      this.isOpen = true;
      searchOpened();
    },
    onClose() {
      this.isOpen = false;
      searchClosed();
    },
    onSelected(searchTerm) {
      this.isOpen = false;
      searchResultSelected(searchTerm);
    },
  },
  mounted() {
    if (this.$route.query.search) {
      this.onOpen();
    }
  },
};
</script>

<style lang="scss">
.search-button {
  display: block;
  font-size: var(--global-font-size-4);
}
</style>
