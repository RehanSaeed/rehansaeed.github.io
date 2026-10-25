<template>
  <span class="badge"><slot /></span>
</template>

<script setup lang="ts">
defineOptions({ name: "u-badge" });
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--global-space-fixed-1) var(--global-space-fixed-2);
  border: var(--global-border-width-1) solid currentColor;
  border-radius: var(--global-border-radius);
  color: var(--global-accent-color);
  background-color: transparent;
  font-size: var(--global-font-size-1);
  line-height: var(--global-line-height-0);
}
</style>
