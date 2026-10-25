<template>
  <Component
    class="avatar"
    :is="tag"
    :aria-label="label"
    :title="label"
    :href="href"
    :to="to">
    <picture>
      <source v-if="avifSource" type="image/avif" :srcset="avifSource" />
      <img
        class="avatar__image"
        :alt="alt"
        :src="src"
        :width="sizeInPixels"
        :height="sizeInPixels"
        :loading="loading" />
    </picture>
  </Component>
</template>

<script>
import { NuxtLink } from "#components";
import { getAvifSource } from "#shared/utils/images";

export default {
  name: "u-avatar",
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
  computed: {
    avifSource() {
      return getAvifSource(this.src);
    },
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
</style>
