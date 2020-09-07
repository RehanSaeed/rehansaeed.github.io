<template>
  <u-link-button class="skip-link" bordered contrast href="#main"
    >Skip to content</u-link-button
  >
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";

export default {
  name: "u-skip-link",
  components: {
    "u-link-button": linkButton,
  },
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
  transform: translateY(-110%);
  transition: transform var(--global-duration-2) var(--ease-in-out-cubic);
  width: 10rem;
}

.skip-link:focus {
  transform: translateY(10%);
}
</style>
