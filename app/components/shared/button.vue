<template>
  <component
    :is="tag"
    class="button"
    :class="[
      `button--${variant}`,
      {
        'button--hydrating': !to && !hydrated && !disabled && !submit,
      },
    ]"
    :to="to && !disabled ? to : undefined"
    :disabled="to ? undefined : disabled || (!hydrated && !submit)"
    :aria-disabled="to && disabled ? 'true' : undefined"
    :role="to && disabled ? 'link' : undefined"
    :tabindex="to && disabled ? -1 : undefined"
    :type="to ? undefined : type"
    @click="onClick">
    <span
      v-if="variant === 'tag'"
      class="button__tag-surface"
      aria-hidden="true" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { NuxtLink } from "#components";

defineOptions({ name: "u-button" });
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const props = defineProps({
  /** Whether the button is disabled. */ disabled: {
    type: Boolean,
  },
  /**
   * Visual variant; icon is a circular 44px control and tag is a pointed label.
   */ variant: {
    type: String as PropType<
      "plain" | "secondary" | "primary" | "icon" | "tag"
    >,
    default: "plain",
    validator: (value: string) =>
      ["plain", "secondary", "primary", "icon", "tag"].includes(value),
  },
  /** Render a navigation link instead of a native button when supplied. */ to: {
    type: String,
  },
  /** Whether the button submits its containing form. */ submit: {
    type: Boolean,
  },
});
const hydrated = useMounted();
const type = computed(() => (props.submit ? "submit" : "button"));
const tag = computed(() =>
  props.to ? (props.disabled ? "a" : NuxtLink) : "button",
);
const onClick = (event: MouseEvent) => {
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  emit("click", event);
};
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

  &:disabled,
  &[aria-disabled="true"] {
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
.button--secondary,
.button--tag {
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

  &:disabled,
  &[aria-disabled="true"] {
    transform: none;
  }
}

.button--primary::before,
.button--secondary::before,
.button--tag::before {
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
.button--secondary:focus::before,
.button--tag:hover::before,
.button--tag:focus::before {
  opacity: 1;
}

.button--primary:active::before,
.button--secondary:active::before,
.button--tag:active::before {
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

.button--tag {
  --button-tag-text-color: var(--global-title-color);
  --button-tag-point: 1rem;
  --button-tag-surface: var(--global-background-color);
  --button-tag-edge: var(--global-border-color);
  --button-tag-shadow: none;
  --button-tag-outline: polygon(
    var(--button-tag-point) 0,
    100% 0,
    100% 100%,
    var(--button-tag-point) 100%,
    0 50%
  );

  isolation: isolate;
  display: inline-flex;
  gap: 0.45em;
  align-items: center;
  min-inline-size: 24px;
  max-inline-size: 100%;
  min-block-size: 36px;
  border: 1px solid transparent;
  border-radius: 0;
  border-start-end-radius: 0.4rem;
  border-end-end-radius: 0.4rem;
  padding: 0.35rem 0.75rem;
  padding-inline-start: calc(var(--button-tag-point) + 1rem);
  background: transparent;
  box-shadow: none;
  color: var(--button-tag-text-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
  overflow-wrap: anywhere;
  text-decoration: none;

  &:visited,
  &:hover,
  &:focus,
  &:active {
    color: var(--button-tag-text-color);
    text-decoration: none;
  }

  &:focus-visible {
    outline: 3px solid var(--global-accent-color);
    outline-offset: 4px;
  }

  &::before {
    content: none;
    box-shadow: none;
  }

  &:hover,
  &:focus {
    --button-tag-shadow: drop-shadow(var(--global-shadow-2-near))
      drop-shadow(var(--global-shadow-2-middle))
      drop-shadow(var(--global-shadow-2-far));
  }

  &:active {
    --button-tag-shadow: drop-shadow(var(--global-shadow-1));
  }

  &::after {
    content: "";

    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: calc(var(--button-tag-point) - 0.2rem);
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-radius: 50%;
    background: var(--global-accent-color);
    transform: translateY(-50%);
  }

  &:disabled,
  &[aria-disabled="true"] {
    --button-tag-shadow: none;

    border-color: transparent;
    box-shadow: none;
    color: var(--global-disabled-color);
    cursor: not-allowed;
    transform: none;

    &::before {
      opacity: 0;
    }

    &::after {
      background: var(--global-disabled-color);
    }
  }
}

// Filter the clipped paint, not the rectangular control or its focus outline.
.button__tag-surface {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  filter: var(--button-tag-shadow);
  pointer-events: none;
  transition: filter var(--global-duration-1) var(--ease-in-out-cubic);

  &::before {
    content: "";

    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--button-tag-edge);
    clip-path: var(--button-tag-outline);
  }

  &::after {
    content: "";

    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: var(--button-tag-surface);
    clip-path: var(--button-tag-outline);
  }
}

@media (prefers-reduced-motion: reduce) {
  .button.button--tag {
    transform: none;
    transition: none;

    &::before {
      transition: none;
    }

    .button__tag-surface {
      transition: none;
    }
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
  .button.button--tag {
    --button-tag-text-color: LinkText;
    --button-tag-surface: Canvas;
    --button-tag-edge: LinkText;
    --button-tag-shadow: none;

    border-color: transparent;
    background: transparent;
    box-shadow: none;
    forced-color-adjust: none;

    &:focus-visible {
      outline-color: Highlight;
    }

    &::before {
      box-shadow: none;
    }

    &::after {
      background: LinkText;
    }
    &:disabled,
    &[aria-disabled="true"] {
      --button-tag-text-color: GrayText;
      --button-tag-edge: GrayText;

      color: GrayText;

      &::after {
        background: GrayText;
      }
    }
  }

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
