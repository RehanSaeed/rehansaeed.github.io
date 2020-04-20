<template>
  <u-button aria-label="Toggle dark/light" @click.native.prevent="toggleTheme">
    <SunIcon v-if="darkTheme" title="Enable light theme" :size="24"/>
    <MoonIcon v-else title="Enable dark theme" :size="24"/>
  </u-button>
</template>

<script>
import button from '~/components/shared/u-button.vue';
import MoonIcon from '~/components/icons/MoonIcon.vue';
import SunIcon from '~/components/icons/SunIcon.vue';

export default {
  components: {
    'u-button': button,
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
