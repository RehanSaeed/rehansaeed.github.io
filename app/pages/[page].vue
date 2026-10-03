<template>
  <u-posts-page :page="page" />
</template>

<script setup>
import UPostsPage from "~/components/posts-page.vue";

// A regex param, so post permalinks like /my-post/ fall through to [...slug].vue. Page 1 is "/".
definePageMeta({
  path: "/:page(\\d+)",
  validate: (route) => Number(route.params.page) >= 2,
});

const page = Number(useRoute().params.page);
</script>
