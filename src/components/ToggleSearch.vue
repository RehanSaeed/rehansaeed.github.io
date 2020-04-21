<template>
  <div>

    <u-button aria-label="Open search" @click.native.prevent="open">
      <u-icon-search v-if="!isOpen" :size="24"/>
    </u-button>

    <u-dialogue fullscreen title="Search" :is-open="isOpen" @close="close" class="search-dialogue">
      <Search :search="this.$route.query.search" @selected="close"/>
    </u-dialogue>

  </div>
</template>

<script>
import button from '~/components/shared/button.vue';
import dialogue from '~/components/shared/dialogue.vue';
import iconSearch from '~/components/shared/icons/icon-search.vue';
import Search from '~/components/Search.vue';

export default {
  components: {
    'u-button': button,
    'u-dialogue': dialogue,
    'u-icon-search': iconSearch,
    Search,
  },
  data() {
    return {
      isOpen: false
    }
  },
  methods: {
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    }
  },
  mounted() {
    if (this.$route.query.search) {
      this.open();
    }
  }
}
</script>
