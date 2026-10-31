<template>
  <u-tooltip v-slot="{ trigger }" :text="label">
    <a v-bind="trigger" class="anchor-link" :href="href" :aria-label="label">
      <slot />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  /** URL used for the link. */
  href: string;
  /** Accessible text describing the control or link. */
  label: string;
}>();
</script>

<style lang="scss" scoped>
.anchor-link {
  color: var(--global-link-color);
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
