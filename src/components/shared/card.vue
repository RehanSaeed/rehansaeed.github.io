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
  box-shadow: var(--global-shadow-1);
  padding: var(--global-space-fluid-6);
  transition: translate var(--global-duration-2) var(--ease-in-out-cubic);
  will-change: translate;

  @include type.word-wrap();
}

.card--hoverable,
.card--focusable {
  position: relative;
}

.card--hoverable:hover,
.card--focusable:focus-within {
  translate: 0 -5px;
}

.card--hoverable::before,
.card--focusable::before {
  content: "";

  position: absolute;
  inset: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: var(--global-shadow-3);
  opacity: 0;
  transition: opacity var(--global-duration-2) var(--ease-in-out-cubic);
}

.card--hoverable:hover::before,
.card--focusable:focus-within::before {
  opacity: 1;
}
</style>
