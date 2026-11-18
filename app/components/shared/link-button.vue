<template>
  <Component
    :is="element"
    class="link-button"
    :class="{
      'link-button--bordered':
        variant === 'secondary' || variant === 'contrast',
      'link-button--contrast': variant === 'contrast',
      'link-button--primary': variant === 'primary',
      'link-button--tag': variant === 'tag',
    }"
    :href="href"
    :to="to"
    :rel="rel"
    :aria-label="label">
    <template v-if="variant === 'tag'">
      <span
        v-for="shadow in ['far', 'middle', 'near']"
        :key="shadow"
        class="link-button__tag-shadow"
        :class="`link-button__tag-shadow--${shadow}`"
        aria-hidden="true" />
    </template>
    <span
      v-if="variant === 'tag'"
      class="link-button__tag-surface"
      aria-hidden="true" />
    <slot />
  </Component>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { NuxtLink } from "#components";

defineOptions({ name: "u-link-button" });
const props = defineProps({
  /** Visual appearance; contrast is a bordered link on a contrasting surface. */ variant:
    {
      type: String as PropType<
        "plain" | "secondary" | "contrast" | "primary" | "tag"
      >,
      default: "plain",
      validator: (value: string) =>
        ["plain", "secondary", "contrast", "primary", "tag"].includes(value),
    },
  /** Accessible text describing the control or link. */ label: {
    type: String,
  },
  /** Internal route used for navigation. */ to: {
    type: String,
  },
  /** URL used for the link. */ href: {
    type: String,
  },
  /** Relationship attributes applied to the link. */ rel: {
    type: String,
  },
});
const element = computed(() => (props.to ? NuxtLink : "a"));
</script>

<style lang="scss">
.link-button {
  animation: none;
  color: var(--link-button-tag-text-color, var(--global-title-color));
  font-family: var(--font-heading);
  line-height: var(--global-line-height-1);
  position: relative;
  text-decoration: none;
  transition:
    color var(--global-duration-1) var(--ease-in-out-cubic),
    opacity var(--global-duration-1) var(--ease-in-out-cubic),
    transform var(--global-duration-1) var(--ease-in-out-cubic);
  will-change: transform;

  &:visited,
  &:focus,
  &:active {
    color: var(--link-button-tag-text-color, var(--global-title-color));
  }

  &:hover {
    color: var(--link-button-tag-text-color, var(--global-accent-color));
    transform: scale(1.07);
  }
}

.link-button--bordered {
  background-color: var(--global-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: var(--global-shadow-1);
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

.link-button--bordered::before {
  content: "";

  position: absolute;
  inset: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: var(--global-shadow-2);
  opacity: 0;
  transition: opacity var(--global-duration-2) var(--ease-in-out-cubic);
}

.link-button--bordered:hover::before,
.link-button--bordered:focus::before {
  opacity: 1;
}

.link-button--bordered:active::before {
  box-shadow: var(--global-shadow-1);
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

.link-button--tag {
  --link-button-tag-text-color: var(--global-title-color);
  --link-button-tag-point: var(--global-space-fixed-4);
  --link-button-tag-hole-size: var(--global-space-fixed-2);
  --link-button-tag-surface: var(--global-background-color);
  --link-button-tag-edge: var(--global-border-color);
  --link-button-tag-shadow: drop-shadow(var(--global-drop-shadow-1));
  --link-button-tag-raised-opacity: 0;
  --link-button-tag-outline: polygon(
    var(--link-button-tag-point) 0,
    100% 0,
    100% 100%,
    var(--link-button-tag-point) 100%,
    0 50%
  );

  isolation: isolate;
  display: inline-flex;
  align-items: center;
  min-inline-size: var(--global-space-fixed-5);
  max-inline-size: 100%;
  min-block-size: calc(var(--global-space-fixed-3) * 3);
  border: none;
  border-radius: 0;
  border-start-end-radius: var(--global-border-radius);
  border-end-end-radius: var(--global-border-radius);
  padding: calc(var(--global-space-fixed-2) + var(--global-border-width-1))
    calc(var(--global-space-fixed-3) + var(--global-border-width-1));
  padding-inline-start: calc(
    var(--link-button-tag-point) + var(--global-space-fixed-4) +
      var(--global-border-width-1)
  );
  background: transparent;
  box-shadow: none;
  font-family: var(--global-font-family-monospace);
  font-size: var(--global-font-size-1);
  font-weight: var(--global-font-weight-normal);
  line-height: var(--global-line-height-1);
  overflow-wrap: anywhere;

  &:hover,
  &:focus {
    --link-button-tag-raised-opacity: 1;

    outline: none;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }

  &:active {
    --link-button-tag-shadow: drop-shadow(var(--global-shadow-1));
    --link-button-tag-raised-opacity: 0;

    transform: translateY(0);
  }

  &::before {
    content: none;
    box-shadow: none;
  }

  &::after {
    content: "";

    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: calc(
      var(--link-button-tag-point) - var(--link-button-tag-hole-size) / 2
    );
    inline-size: var(--link-button-tag-hole-size);
    block-size: var(--link-button-tag-hole-size);
    border-radius: 50%;
    background: var(--global-accent-color);
    transform: translateY(-50%);
  }
}

// Filter the clipped paint, not the rectangular control or its focus outline.
.link-button__tag-surface,
.link-button__tag-shadow {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;

  &::before,
  &::after {
    content: "";

    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--link-button-tag-surface);
    clip-path: var(--link-button-tag-outline);
  }

  &::before {
    // Keep the silhouette opaque beneath its translucent border for filtering.
    background:
      linear-gradient(var(--link-button-tag-edge), var(--link-button-tag-edge)),
      var(--link-button-tag-surface);
  }

  &::after {
    inset: var(--global-border-width-1);
  }
}

.link-button__tag-surface {
  filter: var(--link-button-tag-shadow);
  transition: filter var(--global-duration-1) var(--ease-in-out-cubic);
}

// Separate filters keep each shadow from blurring or shadowing the other layers.
.link-button__tag-shadow {
  // Normal buttons' raised pseudo-element sits inside their border.
  inset: var(--global-border-width-1);
  // Apply faint shadow alpha after blur to avoid filter rounding accumulating.
  opacity: calc(
    var(--link-button-tag-raised-opacity) * var(--global-shadow-opacity)
  );
  transition: opacity var(--global-duration-1) var(--ease-in-out-cubic);
}

@each $layer in ("near", "middle", "far") {
  .link-button__tag-shadow--#{$layer} {
    filter: drop-shadow(var(--global-drop-shadow-2-#{$layer}));
  }
}

@media (prefers-reduced-motion: reduce) {
  .link-button.link-button--tag {
    transform: none;
    transition: none;

    .link-button__tag-surface,
    .link-button__tag-shadow {
      transition: none;
    }
  }
}

@media (forced-colors: active) {
  .link-button.link-button--tag {
    --link-button-tag-text-color: LinkText;
    --link-button-tag-surface: Canvas;
    --link-button-tag-edge: LinkText;
    --link-button-tag-shadow: none;
    --link-button-tag-raised-opacity: 0;

    forced-color-adjust: none;

    &:focus-visible {
      outline-color: Highlight;
    }

    &::after {
      background: LinkText;
    }
  }
}
</style>
