<template>
  <div>
    <u-button
      class="search-button"
      aria-label="Open search"
      @click.native.prevent="onOpen"
    >
      <u-icon-search v-if="!isOpen" :size="24" />
    </u-button>

    <u-dialogue
      fullscreen
      title="Search"
      :is-open="isOpen"
      @close="onClose"
      class="search-dialogue"
    >
      <u-search
        :is-open="isOpen"
        :search="this.$route.query.search"
        @selected="onClose"
      />
    </u-dialogue>
  </div>
</template>

<script>
import button from "~/components/shared/button.vue";
import dialogue from "~/components/shared/dialogue.vue";
import iconSearch from "~/components/shared/icons/icon-search.vue";
import search from "~/components/search.vue";

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
    },
    onClose() {
      this.isOpen = false;
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
  line-height: 0;
}
</style>
