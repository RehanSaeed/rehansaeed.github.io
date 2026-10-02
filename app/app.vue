<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import audiowide from "@fontsource/audiowide/files/audiowide-latin-400-normal.woff2?url";

useHead({
  link: [
    {
      rel: "preload",
      href: audiowide,
      as: "font",
      type: "font/woff2",
      crossorigin: "",
    },
  ],
});
</script>
