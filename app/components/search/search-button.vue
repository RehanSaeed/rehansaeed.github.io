<template>
  <div>
    <u-tooltip v-slot="{ trigger }" text="Search" placement="left">
      <u-button
        v-bind="trigger"
        class="search-button"
        aria-label="Open search"
        @click.prevent="onOpenClick">
        <u-icon name="feather:search" />
      </u-button>
    </u-tooltip>

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
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

export default {
  name: "u-search-button",
  data() {
    return {
      isOpen: false,
    };
  },
  setup() {
    return { playSoundEffect: useSoundEffect().play };
  },
  methods: {
    onOpenClick() {
      this.onOpen();
      this.playSoundEffect("dialog-open");
    },
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
