<template>
  <a class="avatar" :class="{ 'avatar--medium': size === 'medium', 'avatar--large': size === 'large' }" :aria-label="label" :title="label" :href="href">
    <g-image
      class="avatar__image"
      :alt="alt"
      :src="src"
      :width="sizeInPixels"
      :height="sizeInPixels"/>
  </a>
</template>

<script>
export default {
  name: 'u-avatar',
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
    href: {
      required: true,
      type: String,
    },
  },
  computed: {
    sizeInPixels() { return this.size === 'medium' ? 44 : 60; }
  }
}
</script>

<style lang="scss">
.avatar {
  display: inline-block;
  line-height: 0;
}

.avatar__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  display: block;
  object-fit: cover;
  transition: border-color var(--global-duration-3) ease-out;
}

.avatar--medium {
  .avatar__image {
    height: 2.5rem;
    width: 2.5rem;
  }
}

.avatar--large {
  .avatar__image {
    height: 3rem;
    width: 3rem;
  }
}
</style>
