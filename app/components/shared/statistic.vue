<template>
  <dl class="statistic">
    <dt class="statistic__label">{{ label }}</dt>
    <dd class="statistic__value">{{ value }}</dd>
  </dl>
</template>

<script setup lang="ts">
defineProps<{
  value: string | number;
  label: string;
}>();
</script>

<style lang="scss">
.statistic {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  margin: 0;
  min-inline-size: 0;
}
.statistic__value {
  order: -1;
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: var(--global-font-weight-normal);
  line-height: 1.2;
  overflow-wrap: anywhere;
}
</style>
