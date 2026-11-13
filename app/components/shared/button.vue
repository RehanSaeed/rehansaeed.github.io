<template>
  <button
    class="button"
    :class="{
      'button--plain': variant === 'plain',
      'button--secondary': variant === 'secondary',
      'button--primary': variant === 'primary',
      'button--icon': variant === 'icon',
      'button--hydrating': !hydrated && !disabled && !submit,
    }"
    :disabled="disabled || (!hydrated && !submit)"
    :type="type">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";

defineOptions({ name: "u-button" });
const props = defineProps({
  /** Whether the button is disabled. */ disabled: {
    type: Boolean,
  },
  /** Visual variant; icon is a circular 44px control. */ variant: {
    type: String as PropType<"plain" | "secondary" | "primary" | "icon">,
    default: "plain",
    validator: (value: string) =>
      ["plain", "secondary", "primary", "icon"].includes(value),
  },
  /** Whether the button submits its containing form. */ submit: {
    type: Boolean,
  },
});
const hydrated = useMounted();
const type = computed(() => (props.submit ? "submit" : "button"));
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

.button--primary,
.button--secondary {
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

.button--primary::before,
.button--secondary::before {
  content: "";

  position: absolute;
  inset: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: var(--global-shadow-2);
  opacity: 0;
  transition: opacity var(--global-duration-1) var(--ease-in-out-cubic);
}

.button--primary:hover::before,
.button--primary:focus::before,
.button--secondary:hover::before,
.button--secondary:focus::before {
  opacity: 1;
}

.button--primary:active::before,
.button--secondary:active::before {
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

// Retain both classes so late base button rules cannot override icon colours.
.button.button--icon {
  display: grid;
  place-items: center;
  color: var(--button-icon-color, inherit);
  border-radius: 50%;
  font: inherit;
  font-size: 1rem;
  inline-size: 44px;
  block-size: 44px;
  padding: 8px;
  transition: none;
  will-change: auto;

  &:hover,
  &:focus {
    color: var(--button-icon-color, inherit);
    transform: none;
  }

  &:is(:hover, :focus-visible):not(:disabled) {
    color: var(--button-icon-hover-color, var(--button-icon-color, inherit));
    background-color: var(
      --button-icon-hover-background,
      var(--global-border-color)
    );
  }

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }

  &:active:not(:disabled) {
    color: var(
      --button-icon-active-color,
      var(--global-content-background-color)
    );
    background-color: var(
      --button-icon-active-background,
      var(--global-accent-color)
    );
  }

  &:disabled {
    color: var(--button-icon-disabled-color, var(--global-disabled-color));
    background-color: var(--button-icon-disabled-background, transparent);
  }
}

@media (forced-colors: active) {
  .button.button--icon {
    color: ButtonText;
    background-color: ButtonFace;
    border: 1px solid ButtonText;

    &:hover,
    &:focus {
      color: ButtonText;
    }

    &:is(:hover, :focus-visible):not(:disabled) {
      color: HighlightText;
      background-color: Highlight;
    }

    &:focus-visible {
      outline-color: Highlight;
    }

    &:active:not(:disabled) {
      color: ButtonFace;
      background-color: ButtonText;
      border-color: ButtonText;
    }

    &:disabled {
      color: GrayText;
      background-color: ButtonFace;
      border-color: GrayText;
    }
  }
}
</style>
