<template>
  <NuxtIcon
    :name="name"
    class="icon"
    :class="{ 'icon--inline': inline }"
    aria-hidden="true" />
</template>

<script setup lang="ts">
defineOptions({ name: "u-icon" });

defineProps<{
  /** Name identifying the icon or selected thumbnail image. */ name: string;
  /** Whether the icon flows inline with surrounding text. */ inline?: boolean;
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
