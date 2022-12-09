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
  position: absolute;
  inset-inline: 0;

  margin-inline: auto;
  text-align: center;
  translate: 0 -110%;
  transition: translate var(--global-duration-2) var(--ease-in-out-cubic);
  inline-size: 10rem;
}

.skip-link:focus {
  translate: 0 10%;
}
</style>
