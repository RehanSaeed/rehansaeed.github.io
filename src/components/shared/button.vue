<template>
  <button
    class="button"
    :class="{
      'button--bordered': bordered,
      'button--contrast': contrast,
      'button--primary': primary,
    }"
    :type="type">
    <slot />
  </button>
</template>

<script>
export default {
  name: "u-button",
  props: {
    bordered: {
      type: Boolean,
    },
    contrast: {
      type: Boolean,
    },
    primary: {
      type: Boolean,
    },
    submit: {
      type: Boolean,
    },
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
};
</script>

<style lang="scss">
.button,
.vssue-button {
  background-color: transparent;
  border: none;
  color: var(--global-title-color);
  cursor: pointer;
  font-family: var(--global-font-family-heading);
  line-height: var(--global-line-height-1);
  padding: 0;
  position: relative;
  transition: color var(--global-duration-1) var(--ease-in-out-cubic),
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
}

.button--bordered,
.vssue-button {
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

.button--bordered::before,
.vssue-button::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;

  border-radius: inherit;
  box-shadow: var(--global-shadow-2);
  opacity: 0;
  transition: opacity var(--global-duration-1) var(--ease-in-out-cubic);
}

.button--bordered:hover::before,
.button--bordered:focus::before,
.vssue-button:hover::before,
.vssue-button:focus::before {
  opacity: 1;
}

.button--bordered:active::before,
.vssue-button:active::before {
  box-shadow: var(--global-shadow-1);
  opacity: 1;
}

.button--contrast {
  background-color: var(--global-content-background-color);
}

.link--primary {
  color: var(--global-accent-color);
}
</style>
