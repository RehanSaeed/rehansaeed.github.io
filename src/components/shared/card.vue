<template>
  <div class="card" :is="tag" :class="{ 'card--hoverable': hoverable }">
    <slot />
  </div>
</template>

<script>
export default {
  name: "u-card",
  props: {
    hoverable: {
      type: Boolean
    },
    tag: {
      default: "div",
      type: String
    }
  }
};
</script>

<style lang="scss">
.card {
  background-color: var(--global-content-background-color);
  border-radius: var(--global-border-radius);
  box-shadow: 1px 1px 5px 0 rgba(0, 0, 0, 0.02),
    1px 1px 15px 0 rgba(0, 0, 0, 0.03);
  padding: var(--global-space-fluid-6);
  transition: transform var(--global-duration-2) ease-out;

  // @mixin word-wrap()
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.card--hoverable {
  position: relative;
}

.card--hoverable:hover {
  transform: translateY(-5px);
}

.card--hoverable::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: 1px 10px 30px 0 hsl(0, 0%, 70%);
  opacity: 0;
  transition: opacity var(--global-duration-2) ease-out;
}

.card--hoverable:hover::before {
  opacity: 1;
}
</style>
