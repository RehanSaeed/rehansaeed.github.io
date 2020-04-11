<template>
  <EffectButton aria-label="Toggle dark/light" @click.native.prevent="toggleTheme">
    <SunIcon v-if="darkTheme" title="Enable light theme" :size="24"/>
    <MoonIcon v-else title="Enable dark theme" :size="24"/>
  </EffectButton>
</template>

<script>
import EffectButton from '~/components/EffectButton.vue';
import MoonIcon from '~/components/icons/MoonIcon.vue';
import SunIcon from '~/components/icons/SunIcon.vue';

export default {
  components: {
    EffectButton,
    MoonIcon,
    SunIcon,
  },
  data() {
    return {
      darkTheme: false
    }
  },
  methods: {
    toggleTheme() {
      this.darkTheme = !this.darkTheme

      // This is using a script that is added in index.html
      window.__setPreferredTheme(this.darkTheme ? 'dark' : 'light')
    }
  },
  mounted() {
    if (window.__theme == 'dark') {
      this.darkTheme = true;
    }
  }
}
</script>
