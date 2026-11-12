<template>
  <u-tooltip
    v-slot="{ trigger }"
    :text="darkTheme ? 'Enable light theme' : 'Enable dark theme'"
    placement="left">
    <u-button
      v-bind="{ ...$attrs, ...trigger }"
      class="theme-button"
      aria-label="Toggle dark/light"
      @click.prevent="onToggleTheme">
      <u-icon
        class="theme-button__icon theme-button__moon"
        name="feather:moon" />
      <u-icon class="theme-button__icon theme-button__sun" name="feather:sun" />
    </u-button>
  </u-tooltip>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { appThemeChanged, appThemeLoaded } from "~/framework/analytics";

defineOptions({ name: "u-theme-button", inheritAttrs: false });
const colorMode = useColorMode();
const darkTheme = computed(
  () => !colorMode.unknown && colorMode.value === "dark",
);
const onToggleTheme = () => {
  const theme = darkTheme.value ? "light" : "dark";
  colorMode.preference = theme;
  appThemeChanged(theme);
};

onMounted(() => {
  watch(
    () => colorMode.unknown,
    (unknown) => {
      if (!unknown) {
        appThemeLoaded(colorMode.value);
      }
    },
    { immediate: true },
  );
});
</script>

<style lang="scss">
.theme-button {
  display: grid;
  font-size: var(--global-font-size-4);

  &.button,
  &.button.button--hydrating:disabled {
    color: var(--global-accent-color);
  }

  &.button.button--hydrating:disabled {
    transform: none;
  }

  .theme-button__icon {
    grid-area: 1 / 1;
  }

  .theme-button__sun {
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
    visibility: hidden;
  }
}

// Read the pre-paint theme so a saved dark preference never flashes the moon.
[data-theme="dark"] .theme-button {
  .theme-button__moon {
    opacity: 0;
    transform: rotate(90deg) scale(0.4);
    visibility: hidden;
  }

  .theme-button__sun {
    opacity: 1;
    transform: rotate(0deg) scale(1);
    visibility: visible;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .theme-button .theme-button__icon {
    transition:
      opacity var(--global-duration-3) var(--ease-in-out-cubic),
      transform var(--global-duration-3) var(--ease-in-out-cubic),
      visibility var(--global-duration-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-button.button {
    transition: none;

    &:hover,
    &:focus {
      transform: none;
    }
  }
}
</style>
