<template>
  <div>

    <EffectButton aria-label="Open search" @click.native.prevent="open">
      <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search">
        <title>Open search</title>
        <path d="M20 20l-4-4"/>
        <circle cx="10" cy="10" r="7"/>
      </svg>
    </EffectButton>

    <Dialogue :is-open="isOpen" @close="close" class="search-dialogue">
      <Search />
    </Dialogue>

  </div>
</template>

<script>
import Dialogue from '~/components/Dialogue.vue';
import EffectButton from '~/components/EffectButton.vue';
import Search from '~/components/Search.vue';

export default {
  components: {
    Dialogue,
    EffectButton,
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
}
</script>
