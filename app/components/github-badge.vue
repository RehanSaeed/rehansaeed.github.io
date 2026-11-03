<template>
  <u-tooltip v-slot="{ trigger }" :text="tooltip">
    <a v-bind="trigger" class="github-badge" :href="href">
      <img class="github-badge__image" :alt="alt" height="30" :src="src" />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  /** Destination opened when the badge is activated. */
  href: string;
  /** URL of the badge image. */
  src: string;
  /** Accessible description of the badge and its current count. */
  alt: string;
  /** Explanation shown on hover or keyboard focus. */
  tooltip: string;
}>();
</script>

<style lang="scss">
.github-badge {
  --github-badge-image-height: 30px;

  display: inline-flex;
  touch-action: manipulation;

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }
}

.github-badge__image {
  block-size: var(--github-badge-image-height);
  inline-size: auto;
}
</style>
