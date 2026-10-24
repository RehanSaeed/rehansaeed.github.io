<template>
  <u-button
    class="theme-button"
    aria-label="Toggle dark/light"
    @click.prevent="onToggleTheme">
    <NuxtIcon
      v-if="darkTheme"
      name="feather:sun"
      title="Enable light theme"
      aria-hidden="true" />
    <NuxtIcon
      v-else
      name="feather:moon"
      title="Enable dark theme"
      aria-hidden="true" />
  </u-button>
</template>

<script>
import { NuxtIcon } from "#components";
import button from "~/components/shared/button.vue";
import { appThemeChanged, appThemeLoaded } from "~/framework/analytics";

export default {
  name: "u-theme-button",
  components: {
    NuxtIcon,
    "u-button": button,
  },
  data() {
    return {
      darkTheme: false,
    };
  },
  computed: {
    theme() {
      return this.darkTheme ? "dark" : "light";
    },
  },
  methods: {
    onToggleTheme() {
      this.darkTheme = !this.darkTheme;

      // This is using a script that is added in index.html
      window.__setPreferredTheme(this.theme);

      appThemeChanged(this.theme);
    },
  },
  mounted() {
    if (window.__theme == "dark") {
      this.darkTheme = true;
    }

    appThemeLoaded(this.theme);
  },
};
</script>

<style lang="scss">
.theme-button {
  font-size: var(--global-font-size-4);
}
</style>
