<template>
  <g-link class="link" :class="{ 'link--bordered': bordered }" :to="to" :aria-label="label">
    <slot/>
  </g-link>
</template>

<script>
export default {
  name: 'u-link',
  props: {
    bordered: {
      type: Boolean,
    },
    label: {
      type: String,
    },
    to: {
      type: String,
    },
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
  font-size: var(--global-font-size-0);
  padding: var(--global-space-fixed-2) var(--global-space-fixed-4);
}
</style>
