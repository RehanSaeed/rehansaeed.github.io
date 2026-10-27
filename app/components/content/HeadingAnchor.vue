<template>
  <u-tooltip v-slot="{ trigger }" text="Link to this section">
    <a
      v-bind="trigger"
      class="heading-anchor"
      :href="href"
      aria-label="Link to this section">
      <slot />
    </a>
  </u-tooltip>
</template>

<script setup lang="ts">
defineProps<{ href: string }>();
</script>
