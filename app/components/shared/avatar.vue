<template>
  <Component
    class="avatar"
    :is="tag"
    :aria-label="label"
    :title="label"
    :href="href"
    :to="to">
    <img
      v-if="src && !imageFailed"
      class="avatar__image"
      :alt="alt"
      :src="src"
      :width="sizeInPixels"
      :height="sizeInPixels"
      :loading="loading"
      @error="onImageError" />
    <u-icon v-else class="avatar__fallback" name="fa-solid:user" />
  </Component>
</template>

<script>
import { NuxtLink } from "#components";
import icon from "~/components/shared/icon.vue";

export default {
  name: "u-avatar",
  components: {
    "u-icon": icon,
  },
  data() {
    return { imageFailed: false };
  },
  props: {
    label: {
      required: true,
      type: String,
    },
    alt: {
      required: true,
      type: String,
    },
    src: {
      required: true,
      type: String,
    },
    loading: {
      required: false,
      type: String,
    },
    to: {
      required: false,
      type: String,
    },
    href: {
      required: false,
      type: String,
    },
  },
  watch: {
    src() {
      this.imageFailed = false;
    },
  },
  methods: {
    onImageError() {
      this.imageFailed = true;
    },
  },
  computed: {
    sizeInPixels() {
      return this.size === "medium" ? "50" : "60";
    },
    tag() {
      return this.to ? NuxtLink : "a";
    },
  },
};
</script>

<style lang="scss">
@use "~/assets/style/abstracts/avatar";

.avatar {
  @include avatar.frame(var(--global-border-width-3), transparent, 100%);

  transition: scale var(--global-duration-3) var(--ease-out-cubic);
  inline-size: 3rem;
  block-size: 3rem;

  margin: calc(var(--global-border-width-3) * -1);

  &:hover,
  &:focus {
    outline: none;
    scale: 1.4;
    z-index: 1;

    &::after {
      border-color: var(--global-accent-color);
    }
  }
}

.avatar > .icon.avatar__fallback {
  inline-size: 100%;
  block-size: 100%;
  padding: var(--global-space-fixed-3);
  background-color: var(--global-background-color);
  color: var(--global-title-color);
}
</style>
