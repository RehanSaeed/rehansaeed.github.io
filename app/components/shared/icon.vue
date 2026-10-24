<template>
  <NuxtIcon
    :name="name"
    class="icon"
    :class="{ 'icon--inline': inline }"
    aria-hidden="true" />
</template>

<script setup lang="ts">
import { NuxtIcon } from "#components";

defineOptions({ name: "u-icon" });

defineProps<{
  name: string;
  inline?: boolean;
}>();
</script>

<style scoped>
.icon {
  display: block;
  inline-size: 1em;
  block-size: 1em;
}

.icon--inline {
  display: inline;
}
</style>
