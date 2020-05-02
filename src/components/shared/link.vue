<template>
  <Component :is="tag" class="link" :class="{ 'link--bordered': bordered, 'link--contrast': contrast, 'link--primary': primary }" :href="href" :to="to" :aria-label="label">
    <slot/>
  </Component>
</template>

<script>
export default {
  name: 'u-link',
  props: {
    bordered: {
      type: Boolean,
    },
    contrast: {
      type: Boolean
    },
    primary: {
      type: Boolean
    },
    label: {
      type: String,
    },
    to: {
      type: String,
    },
    href: {
      type: String,
    },
  },
  computed: {
    tag: function() { return this.to ? 'g-link' : 'a'; }
  }
}
</script>

<style lang="scss">
.link {
  color: var(--global-title-color);
  font-family: var(--global-font-family-heading);
  line-height: var(--global-line-height-1);
  text-decoration: none;
  transition: all var(--global-duration-2) ease-out;

  &:visited,
  &:focus,
  &:active {
    color: var(--global-title-color);
  }

  &:hover {
    color: var(--global-title-color);
    opacity: .7;
    transform: scale(1.07);
  }
}

.link--bordered {
  background-color: var(--global-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  font-size: var(--global-font-size-1);
  padding: var(--global-space-fixed-2) var(--global-space-fixed-4);
}

.link--contrast {
  background-color: var(--global-content-background-color);
}

.link--primary {
  color: var(--global-accent-color);
  border-color: var(--global-accent-color);

  &:visited,
  &:focus,
  &:active {
    color: var(--global-accent-color);
  }

  &:hover {
    color: var(--global-accent-color);
  }
}
</style>
