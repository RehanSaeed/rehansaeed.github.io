<template>
  <Component
    class="avatar"
    :is="tag"
    :class="{
      'avatar--medium': size === 'medium',
      'avatar--large': size === 'large',
    }"
    :aria-label="label"
    :title="label"
    :href="href"
    :to="to"
  >
    <g-image
      class="avatar__image"
      :alt="alt"
      :src="src"
      :width="sizeInPixels"
      :height="sizeInPixels"
    />
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
    size: {
      default: "medium",
      required: false,
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
  background-color: var(--global-accent-color);
  border-radius: 100%;
  display: inline-block;
  line-height: 0;

  &:hover,
  &:focus {
    opacity: 1;
    outline: none;
    z-index: 1;

    .avatar__image {
      border: var(--global-border-width-2) solid
        var(--global-alternate-accent-color);
      transform: scale(1.3);
    }
  }
}

.avatar__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  display: block;
  object-fit: cover;
  transition: border-color var(--global-duration-3) var(--ease-out-cubic),
    transform var(--global-duration-3) var(--ease-out-cubic);
  will-change: border-color, transform;
}

.avatar--medium {
  height: 2.5rem;
  width: 2.5rem;
  .avatar__image {
    height: 2.5rem;
    width: 2.5rem;
  }
}

.avatar--large {
  height: 3rem;
  width: 3rem;
  .avatar__image {
    height: 3rem;
    width: 3rem;
  }
}
</style>
