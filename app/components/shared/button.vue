<template>
  <button
    class="button"
    :class="{
      'button--bordered': variant !== 'plain',
      'button--primary': variant === 'primary',
      'button--hydrating': !hydrated && !disabled && !submit,
    }"
    :disabled="disabled || (!hydrated && !submit)"
    :type="type">
    <slot />
  </button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

export default defineComponent({
  name: "u-button",
  props: {
    disabled: {
      type: Boolean,
    },
    variant: {
      type: String as PropType<"plain" | "secondary" | "primary">,
      default: "plain",
      validator: (value: string) =>
        ["plain", "secondary", "primary"].includes(value),
    },
    submit: {
      type: Boolean,
    },
  },
  data() {
    return { hydrated: false };
  },
  mounted() {
    this.hydrated = true;
  },
  computed: {
    type() {
      if (this.submit) {
        return "submit";
      } else {
        return "button";
      }
    },
  },
});
</script>

<style lang="scss">
.button {
  background-color: transparent;
  border: none;
  color: var(--global-title-color);
  cursor: pointer;
  font-family: var(--font-heading);
  line-height: var(--global-line-height-1);
  padding: 0;
  position: relative;
  transition:
    color var(--global-duration-1) var(--ease-in-out-cubic),
    opacity var(--global-duration-1) var(--ease-in-out-cubic),
    transform var(--global-duration-1) var(--ease-in-out-cubic);
  will-change: transform;

  &:hover,
  &:focus {
    color: var(--global-accent-color);
    transform: scale(1.07);
  }

  &:disabled {
    color: var(--global-disabled-color);
    cursor: not-allowed;
    transform: scale(1);
  }

  &.button--hydrating:disabled {
    color: var(--global-title-color);
    cursor: progress;
  }
}

.button--bordered {
  background-color: var(--global-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: var(--global-shadow-1);
  font-size: var(--global-font-size-1);
  padding: var(--global-space-fixed-2) var(--global-space-fixed-4);

  &:hover,
  &:focus {
    outline: none;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    transform: none;
  }
}

.button--bordered::before {
  content: "";

  position: absolute;
  inset: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: var(--global-shadow-2);
  opacity: 0;
  transition: opacity var(--global-duration-1) var(--ease-in-out-cubic);
}

.button--bordered:hover::before,
.button--bordered:focus::before {
  opacity: 1;
}

.button--bordered:active::before {
  box-shadow: var(--global-shadow-1);
  opacity: 1;
}

.button--primary {
  border-color: var(--global-accent-color);
  background-color: var(--global-accent-color);
  color: var(--global-content-background-color);

  &:hover,
  &:focus {
    color: var(--global-content-background-color);
  }

  &:disabled {
    border-color: var(--global-border-color);
    background-color: var(--global-border-color);
    color: var(--global-disabled-color);
  }
}
</style>
