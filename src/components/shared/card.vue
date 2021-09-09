<template>
  <div
    class="card"
    :is="tag"
    :class="{ 'card--hoverable': hoverable, 'card--focusable': focusable }">
    <slot />
  </div>
</template>

<script>
export default {
  name: "u-card",
  props: {
    focusable: {
      type: Boolean,
    },
    hoverable: {
      type: Boolean,
    },
    tag: {
      default: "section",
      type: String,
    },
  },
};
</script>

<style lang="scss">
@use "~/assets/style/abstracts/type";

.card {
  background-color: var(--global-content-background-color);
  border-radius: var(--global-border-radius);
  box-shadow: 0 1px 5px 0 hsla(0, 0%, 0%, 0.02),
    0 1px 15px 0 hsla(0, 0%, 0%, 0.03);
  padding: var(--global-space-fluid-6);
  transition: transform var(--global-duration-2) var(--ease-in-out-cubic);
  will-change: transform;

  @include type.word-wrap();
}

.card--hoverable,
.card--focusable {
  position: relative;
}

.card--hoverable:hover,
.card--focusable:focus-within {
  transform: translateY(-5px);
}

.card--hoverable::before,
.card--focusable::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: 0 10px 30px 0 hsl(0, 0%, 70%);
  opacity: 0;
  transition: opacity var(--global-duration-2) var(--ease-in-out-cubic);
}

.card--hoverable:hover::before,
.card--focusable:focus-within::before {
  opacity: 1;
}
</style>
