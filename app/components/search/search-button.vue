<template>
  <u-search-dialogue v-slot="{ open }">
    <u-tooltip v-slot="{ trigger }" text="Search" placement="left">
      <u-button
        v-bind="trigger"
        class="search-button"
        aria-label="Open search"
        @click.prevent="open">
        <u-icon name="feather:search" />
      </u-button>
    </u-tooltip>
  </u-search-dialogue>
</template>

<script setup lang="ts">
defineOptions({ name: "u-search-button" });
</script>

<style lang="scss">
.search-button {
  display: block;
  font-size: var(--global-font-size-4);
}
</style>
