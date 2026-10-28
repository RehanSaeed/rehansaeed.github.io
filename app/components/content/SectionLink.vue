<template>
  <u-tooltip v-slot="{ trigger }" text="Link to this section">
    <a
      v-bind="trigger"
      class="section-link"
      :href="href"
      aria-label="Link to this section">
      <slot />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{ href: string }>();
</script>

<style lang="scss" scoped>
.section-link {
  color: var(--global-link-color);
  float: left; // Remove when browser support is good enough.
  float: inline-start;
  margin-inline-start: -30px;
  opacity: 0;
  margin-inline-end: 8px;
  inline-size: 22px;
  block-size: 22px;
  text-decoration: none;
  transition: opacity var(--global-duration-2) ease-out 100ms;
  vertical-align: middle;

  :slotted(svg) {
    display: inline;
  }

  :is(h1, h2, h3, h4, h5, h6):hover &,
  :is(h1, h2, h3, h4, h5, h6):focus &,
  &:focus {
    color: var(--global-link-color);
    opacity: 1;
    text-decoration: none;
    transition-delay: 0;
  }
}
</style>
