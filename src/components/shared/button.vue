<template>
  <button
    class="button"
    :class="{
      'button--bordered': bordered,
      'button--contrast': contrast,
      'button--primary': primary
    }"
    :type="type"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: "u-button",
  props: {
    bordered: {
      type: Boolean
    },
    contrast: {
      type: Boolean
    },
    primary: {
      type: Boolean
    },
    submit: {
      type: Boolean
    }
  },
  computed: {
    type() {
      if (this.submit) {
        return "submit";
      } else {
        return "button";
      }
    }
  }
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
  transition: color var(--global-duration-1) ease-out,
    opacity var(--global-duration-1) ease-out,
    transform var(--global-duration-1) ease-out;

  &:hover {
    transform: scale(1.07);
  }

  &:focus {
    outline: none;
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
  box-shadow: 0 1px 3px hsl(0, 0%, 90%);
  font-size: var(--global-font-size-1);
  padding: var(--global-space-fixed-2) var(--global-space-fixed-4);

  &:hover,
  &:focus {
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

  box-shadow: 0 3px 5px hsl(0, 0%, 70%);
  opacity: 0;
  transition: opacity var(--global-duration-1) ease-out;
}

.button--bordered:hover::before,
.button--bordered:focus::before,
.vssue-button:hover::before,
.vssue-button:focus::before {
  opacity: 1;
}

.button--bordered:active::before,
.vssue-button:active::before {
  box-shadow: 0 0 0 hsl(0, 0%, 70%);
  opacity: 1;
}

.button--contrast {
  background-color: var(--global-content-background-color);
}

.link--primary {
  color: var(--global-accent-color);
}
</style>
