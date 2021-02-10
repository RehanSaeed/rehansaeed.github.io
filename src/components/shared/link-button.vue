<template>
  <Component
    :is="tag"
    class="link-button"
    :class="{
      'link-button--bordered': bordered,
      'link-button--contrast': contrast,
      'link-button--primary': primary,
    }"
    :href="href"
    :to="to"
    :rel="rel"
    :aria-label="label"
  >
    <slot />
  </Component>
</template>

<script>
export default {
  name: "u-link-button",
  props: {
    bordered: {
      type: Boolean,
    },
    contrast: {
      type: Boolean,
    },
    primary: {
      type: Boolean,
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
    rel: {
      type: String,
    },
  },
  computed: {
    tag() {
      return this.to ? "g-link" : "a";
    },
  },
};
</script>

<style lang="scss">
.link-button,
.vssue-logout {
  animation: none;
  color: var(--global-title-color);
  font-family: var(--global-font-family-heading);
  line-height: var(--global-line-height-1);
  position: relative;
  text-decoration: none;
  transition: color var(--global-duration-1) var(--ease-in-out-cubic),
    opacity var(--global-duration-1) var(--ease-in-out-cubic),
    transform var(--global-duration-1) var(--ease-in-out-cubic);
  will-change: transform;

  &:visited,
  &:focus,
  &:active {
    color: var(--global-title-color);
  }

  &:hover {
    color: var(--global-title-color);
    transform: scale(1.07);
  }
}

.link-button--bordered,
.vssue-logout {
  background-color: var(--global-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: 0 1px 3px hsl(0, 0%, 90%);
  font-size: var(--global-font-size-1);
  padding: var(--global-space-fixed-2) var(--global-space-fixed-4);

  &:hover,
  &:focus {
    opacity: 1;
    transform: translateY(-2px);
  }

  &:focus {
    outline: none;
  }

  &:active {
    transform: translateY(0);
  }

  &:not([href]),
  &[href=""] {
    color: var(--global-body-color);
  }
}

.link-button--bordered::before,
.vssue-logout::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: 0 3px 5px hsl(0, 0%, 70%);
  opacity: 0;
  transition: opacity var(--global-duration-2) var(--ease-in-out-cubic);
}

.link-button--bordered:hover::before,
.link-button--bordered:focus::before,
.vssue-logout:hover::before,
.vssue-logout:focus::before {
  opacity: 1;
}

.link-button--bordered:active::before,
.vssue-logout:active::before {
  box-shadow: 0 0 0 hsl(0, 0%, 70%);
  opacity: 1;
}

.link-button--contrast {
  background-color: var(--global-content-background-color);
}

.link-button--primary {
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

  &:not([href]),
  &[href=""] {
    color: var(--global-accent-color);
  }
}
</style>
