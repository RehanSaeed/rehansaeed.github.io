<template>
  <div>

    <u-button aria-label="Open search" @click.native.prevent="open">
      <SearchIcon v-if="!isOpen" :size="24"/>
    </u-button>

    <Dialogue fullscreen title="Search" :is-open="isOpen" @close="close" class="search-dialogue">
      <Search :search="this.$route.query.search" @selected="close"/>
    </Dialogue>

  </div>
</template>

<script>
import button from '~/components/shared/u-button.vue';
import Dialogue from '~/components/Dialogue.vue';
import Search from '~/components/Search.vue';
import SearchIcon from '~/components/icons/SearchIcon.vue';

export default {
  components: {
    'u-button': button,
    Dialogue,
    Search,
    SearchIcon,
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
