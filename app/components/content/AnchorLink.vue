<template>
  <u-tooltip v-slot="{ trigger }" :text="label">
    <a v-bind="trigger" class="anchor-link" :href="href" :aria-label="label">
      <slot />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  /** URL used for the link. */ href: string;
  /** Accessible text describing the control or link. */ label: string;
}>();
</script>

<style lang="scss" scoped>
@use "~/assets/style/abstracts/breakpoints";

.anchor-link {
  --heading-anchor-offset: min(
    calc(var(--heading-anchor-size) + var(--heading-anchor-gap)),
    var(--card-space, var(--global-space-fluid-6))
  );

  color: var(--global-link-color);
  position: absolute;
  inset-inline-start: calc(-1 * var(--heading-anchor-offset));
  inset-block-start: calc((1lh - var(--heading-anchor-size)) / 2);
  display: inline-flex;
  opacity: 0;
  inline-size: var(--heading-anchor-size);
  block-size: var(--heading-anchor-size);
  text-decoration: none;
  transition: opacity var(--global-duration-2) ease-out 100ms;
  vertical-align: middle;

  @include breakpoints.respond-below(sm) {
    position: static;
    margin-inline-start: var(--heading-anchor-gap);
  }

  :slotted(svg) {
    display: block;
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
