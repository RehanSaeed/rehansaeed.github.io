<template>
  <Component
    :is="element"
    class="link-button"
    :class="{
      'link-button--bordered': bordered,
      'link-button--contrast': contrast,
      'link-button--primary': primary,
      'link-button--tag': tag,
    }"
    :href="href"
    :to="to"
    :rel="rel"
    :aria-label="label">
    <span v-if="tag" class="link-button__tag-surface" aria-hidden="true" />
    <slot />
  </Component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NuxtLink } from "#components";

defineOptions({ name: "u-link-button" });
const props = defineProps({
  /** Whether the link button has a border. */ bordered: {
    type: Boolean,
  },
  /** Whether the link button uses contrasting colours. */ contrast: {
    type: Boolean,
  },
  /** Whether the link button uses the primary appearance. */ primary: {
    type: Boolean,
  },
  /** Whether the link uses the pointed tag appearance. */ tag: {
    type: Boolean,
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
  color: var(--global-title-color);
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
    color: var(--global-title-color);
  }

  &:hover {
    color: var(--global-accent-color);
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
  --link-button-tag-point: 1rem;
  --link-button-tag-surface: var(--global-background-color);
  --link-button-tag-edge: var(--global-border-color);
  --link-button-tag-shadow: none;
  --link-button-tag-outline: polygon(
    var(--link-button-tag-point) 0,
    100% 0,
    100% 100%,
    var(--link-button-tag-point) 100%,
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
  padding-inline-start: calc(var(--link-button-tag-point) + 1rem);
  background: transparent;
  box-shadow: none;
  color: var(--link-button-tag-text-color);
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
    color: var(--link-button-tag-text-color);
    text-decoration: none;
  }

  &:hover,
  &:focus {
    --link-button-tag-shadow: drop-shadow(var(--global-shadow-2-near))
      drop-shadow(var(--global-shadow-2-middle))
      drop-shadow(var(--global-shadow-2-far));

    outline: none;
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid var(--global-accent-color);
    outline-offset: 4px;
  }

  &:active {
    --link-button-tag-shadow: drop-shadow(var(--global-shadow-1));

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
    inset-inline-start: calc(var(--link-button-tag-point) - 0.2rem);
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-radius: 50%;
    background: var(--global-accent-color);
    transform: translateY(-50%);
  }
}

// Filter the clipped paint, not the rectangular control or its focus outline.
.link-button__tag-surface {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  filter: var(--link-button-tag-shadow);
  pointer-events: none;
  transition: filter var(--global-duration-1) var(--ease-in-out-cubic);

  &::before {
    content: "";

    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--link-button-tag-edge);
    clip-path: var(--link-button-tag-outline);
  }

  &::after {
    content: "";

    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: var(--link-button-tag-surface);
    clip-path: var(--link-button-tag-outline);
  }
}

@media (prefers-reduced-motion: reduce) {
  .link-button.link-button--tag {
    transform: none;
    transition: none;

    .link-button__tag-surface {
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

    border-color: transparent;
    background: transparent;
    box-shadow: none;
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
