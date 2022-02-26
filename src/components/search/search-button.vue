<template>
  <div>
    <u-button
      class="search-button"
      aria-label="Open search"
      @click.native.prevent="onOpen">
      <u-icon-search v-if="!isOpen" />
    </u-button>

    <u-dialogue
      fullscreen
      title="Search"
      :is-open="isOpen"
      @close="onClose"
      class="search-dialogue">
      <u-search
        :is-open="isOpen"
        :search="this.$route.query.search"
        @selected="onSelected" />
    </u-dialogue>
  </div>
</template>

<script>
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import iconSearch from "~/components/shared/icons/icon-search.vue";
import search from "~/components/search/search.vue";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

// TODO: Add 'find' and '/' keyup event handlers.

export default {
  name: "u-search-button",
  components: {
    "u-button": button,
    "u-dialogue": dialogue,
    "u-icon-search": iconSearch,
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
      console.log("search opened");
    },
    onClose() {
      this.isOpen = false;
      searchClosed();
      console.log("search closed");
    },
    onSelected(searchTerm) {
      this.isOpen = false;
      searchResultSelected(searchTerm);
      console.log("search executed", searchTerm);
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
