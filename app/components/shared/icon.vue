<template>
  <NuxtIcon
    :name="name"
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
.icon--inline {
  display: inline;
}
</style>
