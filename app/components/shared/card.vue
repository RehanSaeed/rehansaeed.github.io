<template>
  <component
    class="card"
    :is="tag"
    :class="{
      'card--compact': compact,
      'card--hoverable': hoverable,
      'card--focusable': focusable,
    }">
    <slot />
  </component>
</template>

<script>
import { defineComponent } from "vue";
export default defineComponent({
  name: "u-card",
  props: {
    /** Whether the card uses compact spacing. */ compact: {
      type: Boolean,
    },
    /** Whether the card can receive keyboard focus. */ focusable: {
      type: Boolean,
    },
    /** Whether the card displays its hover treatment. */ hoverable: {
      type: Boolean,
    },
    /** HTML element used for the card. */ tag: {
      default: "section",
      type: String,
    },
  },
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/type";

.card {
  --card-space: var(--global-space-fluid-6);

  background-color: var(--global-content-background-color);
  border-radius: var(--global-border-radius);
  box-shadow: var(--global-shadow-1);
  padding: var(--card-space);
  transition: translate var(--global-duration-2) var(--ease-in-out-cubic);
  will-change: translate;

  @include type.word-wrap();
}

.card--compact {
  --card-space: calc(var(--global-space-fluid-6) * 0.85);

  font-size: max(16px, 0.85em);
  inline-size: 100%;
  max-inline-size: var(--global-space-card-max-width);
  justify-self: center;
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
