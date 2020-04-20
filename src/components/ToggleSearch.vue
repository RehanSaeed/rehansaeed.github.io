<template>
  <div>

    <EffectButton aria-label="Open search" @click.native.prevent="open">
      <SearchIcon v-if="!isOpen" :size="24"/>
    </EffectButton>

    <Dialogue fullscreen title="Search" :is-open="isOpen" @close="close" class="search-dialogue">
      <Search :search="this.$route.query.search" @selected="close"/>
    </Dialogue>

  </div>
</template>

<script>
import Dialogue from '~/components/Dialogue.vue';
import EffectButton from '~/components/shared/EffectButton.vue';
import Search from '~/components/Search.vue';
import SearchIcon from '~/components/icons/SearchIcon.vue';

export default {
  components: {
    Dialogue,
    EffectButton,
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
