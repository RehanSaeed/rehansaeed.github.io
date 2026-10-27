<template>
  <u-tooltip v-slot="{ trigger }" :text="label">
    <a v-bind="trigger" class="anchor-link" :href="href" :aria-label="label">
      <slot />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{ href: string; label: string }>();
</script>

<style lang="scss" scoped>
.anchor-link {
  --heading-anchor-size: var(--global-space-fixed-4);
  --heading-anchor-gap: var(--global-space-fixed-2);
  --heading-anchor-offset: min(
    calc(var(--heading-anchor-size) + var(--heading-anchor-gap)),
    var(--card-space, var(--global-space-fluid-6))
  );

  color: var(--global-link-color);
  float: inline-start;
  margin-inline-start: calc(-1 * var(--heading-anchor-offset));
  opacity: 0;
  margin-inline-end: calc(
    var(--heading-anchor-offset) - var(--heading-anchor-size)
  );
  inline-size: var(--heading-anchor-size);
  block-size: var(--heading-anchor-size);
  text-decoration: none;
  transition: opacity var(--global-duration-2) ease-out 100ms;
  vertical-align: middle;

  :slotted(svg) {
    display: inline;
    inline-size: 100%;
    block-size: 100%;
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
