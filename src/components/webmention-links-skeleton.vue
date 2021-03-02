<template>
  <u-skeleton class="webmention-links-skeleton">
    <svg viewBox="0 0 500 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="20" rx="8" />
      <rect x="175" y="5" width="100" height="16" rx="8" />
    </svg>
  </u-skeleton>
</template>

<script>
import skeleton from "~/components/shared/skeleton.vue";

export default {
  name: "u-webmention-links-skeleton",
  components: {
    "u-skeleton": skeleton,
  },
};
</script>

<style lang="scss">
.webmention-links-skeleton {
  height: 1.5rem;
}
</style>
