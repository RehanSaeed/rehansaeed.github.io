<template>
  <u-button aria-label="Toggle dark/light" @click.native.prevent="toggleTheme">
    <u-icon-sun v-if="darkTheme" title="Enable light theme" :size="24"/>
    <u-icon-moon v-else title="Enable dark theme" :size="24"/>
  </u-button>
</template>

<script>
import button from '~/components/shared/button.vue';
import iconMoon from '~/components/shared/icons/icon-moon.vue';
import iconSun from '~/components/shared/icons/icon-sun.vue';

export default {
  components: {
    'u-button': button,
    'u-icon-moon': iconMoon,
    'u-icon-sun': iconSun,
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
