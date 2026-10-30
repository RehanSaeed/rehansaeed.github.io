<template>
  <div>
    <u-tooltip v-slot="{ trigger }" text="Search" placement="left">
      <u-button
        v-bind="trigger"
        class="search-button"
        aria-label="Open search"
        @click.prevent="onOpen">
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
        :search="queryString($route.query.search)"
        @selected="onSelected" />
    </u-dialogue>
  </div>
</template>

<script lang="ts">
import { queryString } from "~/utils/query";
import {
  searchOpened,
  searchClosed,
  searchResultSelected,
} from "~/framework/analytics";

export default defineComponent({
  name: "u-search-button",
  setup() {
    return { queryString };
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
    onSelected(searchTerm: string) {
      this.isOpen = false;
      searchResultSelected(searchTerm);
    },
  },
  mounted() {
    if (this.$route.query.search) {
      this.onOpen();
    }
  },
});
</script>

<style lang="scss">
.search-button {
  display: block;
  font-size: var(--global-font-size-4);
}
</style>
