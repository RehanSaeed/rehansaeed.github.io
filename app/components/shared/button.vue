<template>
  <component
    :is="tag"
    class="button"
    :class="[
      `button--${variant}`,
      {
        'button--tag': tagVariant,
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
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type PropType } from "vue";
import { NuxtLink } from "#components";
import type { ButtonVariant } from "~/types/button";

defineOptions({ name: "u-button" });
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const props = defineProps({
  /** Whether the button is disabled. */ disabled: {
    type: Boolean,
  },
  /** Visual variant of the button. */ variant: {
    type: String as PropType<ButtonVariant>,
    default: "plain",
    validator: (value: string) =>
      [
        "plain",
        "secondary",
        "primary",
        "quiet-pill",
        "hairline-capsule",
        "solid-lozenge",
        "code-token",
        "code-token-rounded",
        "keycap",
        "tag-label",
      ].includes(value),
  },
  /** Render a navigation link instead of a native button when supplied. */ to: {
    type: String,
  },
  /** Whether the button submits its containing form. */ submit: {
    type: Boolean,
  },
});
const hydrated = ref(false);
const type = computed(() => (props.submit ? "submit" : "button"));
const tagVariant = computed(
  () => !["plain", "secondary", "primary"].includes(props.variant),
);
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
onMounted(() => {
  hydrated.value = true;
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

  display: inline-flex;
  gap: 0.45em;
  align-items: center;
  min-inline-size: 24px;
  max-inline-size: 100%;
  min-block-size: 36px;
  border: 1px solid transparent;
  border-radius: 0;
  padding: 0.35rem 0.75rem;
  background: transparent;
  box-shadow: none;
  color: var(--button-tag-text-color);
  font-family: var(--global-font-family-sans-serif);
  font-size: 0.875rem;
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

  &:disabled,
  &[aria-disabled="true"] {
    border-color: var(--global-border-color);
    box-shadow: none;
    color: var(--global-disabled-color);
    cursor: not-allowed;
    transform: none;

    &::before {
      opacity: 0;
    }
  }
}

.button--quiet-pill {
  --button-tag-text-color: #000;

  border-radius: 999px;
  background: color-mix(in srgb, var(--global-accent-color) 9%, transparent);
}

.button--hairline-capsule {
  --button-tag-text-color: #000;

  border-color: var(--global-accent-color);
  border-radius: 999px;
  padding-inline: 1rem;
  font-family: var(--font-heading);
  font-size: 0.8rem;
}

[data-theme="dark"] {
  .button--quiet-pill,
  .button--hairline-capsule {
    --button-tag-text-color: var(--global-title-color);
  }
}

.button--solid-lozenge {
  border-radius: 0.3rem;
  background: color-mix(
    in srgb,
    var(--global-accent-color) 16%,
    var(--global-content-background-color)
  );
  font-weight: 600;
}

.button--code-token,
.button--code-token-rounded {
  border-inline-start: 3px solid var(--global-accent-color);
  border-end-end-radius: 0.4rem;
  background: var(--global-background-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.8rem;
}

.button--code-token-rounded {
  border-radius: 0.4rem;
}

.button--keycap {
  border: 1px solid var(--global-accent-color);
  border-block-end-width: 3px;
  border-radius: 0.4rem;
  background: var(--global-background-color);
  box-shadow: 0 2px 0 var(--global-border-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.8rem;
}

.button--tag-label {
  border-color: var(--global-border-color);
  border-radius: var(--global-border-radius);
  background: var(--global-background-color);
  font-weight: 600;

  &::after {
    content: "";
    order: -1;
    flex: 0 0 1em;
    block-size: 1em;
    background: var(--global-accent-color);
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-width='2' stroke-linejoin='round' d='M3 3h7l11 11-7 7L3 10V3Z'/%3E%3Ccircle cx='7.5' cy='7.5' r='1.5'/%3E%3C/svg%3E")
      center / contain no-repeat;
  }
}

@media (prefers-reduced-motion: reduce) {
  .button.button--tag {
    transform: none;
    transition: none;

    &::before {
      transition: none;
    }
  }
}

@media (forced-colors: active) {
  .button.button--tag {
    --button-tag-text-color: LinkText;

    border-color: LinkText;
    background: Canvas;
    box-shadow: none;

    &:focus-visible {
      outline-color: Highlight;
    }

    &::before {
      box-shadow: none;
    }

    &::after {
      background: LinkText;
    }
  }
}
</style>
