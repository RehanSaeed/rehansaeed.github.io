<template>
  <u-link-button class="skip-link" variant="contrast" href="#main"
    >Skip to content</u-link-button
  >
</template>

<script setup lang="ts">
defineOptions({ name: "u-skip-link" });
</script>

<style lang="scss" scoped>
.skip-link {
  position: absolute;
  inset-inline: 0;
  z-index: 11;

  margin-inline: auto;
  text-align: center;
  translate: 0 -110%;
  transition: translate var(--global-duration-2) var(--ease-in-out-cubic);
  inline-size: 10rem;
}

.skip-link:focus {
  translate: 0 10%;
}

.skip-link:focus-visible {
  outline: var(--global-border-width-2) solid var(--global-accent-color);
  outline-offset: var(--global-focus-outline-offset);
}

@media (width < 75em) {
  .skip-link {
    inset-block-start: calc(2.5rem + 2 * var(--global-space-fluid-5));
    inset-inline-start: var(--global-space-fluid-5);
    inset-inline-end: auto;

    margin-inline: 0;
    translate: 0 -500%;
  }

  .skip-link:focus {
    translate: none;
  }
}
</style>
