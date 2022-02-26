<template>
  <Component
    class="avatar"
    :is="tag"
    :aria-label="label"
    :title="label"
    :href="href"
    :to="to">
    <g-image
      class="avatar__image"
      :alt="alt"
      :src="src"
      :width="sizeInPixels"
      :height="sizeInPixels" />
  </Component>
</template>

<script>
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
    sizeInPixels() {
      return this.size === "medium" ? "50" : "60";
    },
    tag() {
      return this.to ? "g-link" : "a";
    },
  },
};
</script>

<style lang="scss">
.avatar {
  display: inline-block;

  background-color: var(--global-content-background-color);
  border: var(--global-border-width-3) solid
    var(--global-content-background-color);
  border-radius: 100%;
  overflow: hidden;
  transition: border-color var(--global-duration-3) var(--ease-out-cubic),
    transform var(--global-duration-3) var(--ease-out-cubic);
  height: 3rem;
  width: 3rem;
  will-change: border-color, transform;

  &:hover,
  &:focus {
    border: var(--global-border-width-3) solid var(--global-accent-color);
    opacity: 1;
    outline: none;
    transform: scale(1.4);
    z-index: 1;
  }
}

.avatar__image {
  display: block;

  object-fit: cover;
  height: 100%;
  width: 100%;
}
</style>
