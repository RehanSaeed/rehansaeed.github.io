<template>
  <u-link class="skip-link" bordered contrast href="#main"
    >Skip to content</u-link
  >
</template>

<script>
import link from "~/components/shared/link.vue";

export default {
  components: {
    "u-link": link
  }
};
</script>

<style lang="scss">
.skip-link {
  margin-left: auto;
  margin-right: auto;
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  transform: translateY(-100%);
  transition: transform var(--global-duration-2) ease-out;
  width: 10rem;
}

.skip-link:focus {
  transform: translateY(0%);
}
</style>
