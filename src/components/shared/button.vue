<template>
  <button class="button" :class="{ 'button--bordered': bordered, 'button--contrast': contrast, 'button--primary': primary }" :type="type">
    <slot/>
  </button>
</template>

<script>
export default {
  name: 'u-button',
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
    },
  },
  computed: {
    type: function() {
      if (this.submit) {
        return 'submit';
      } else {
        return 'button';
      }
    }
  }
}
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
  text-align: center;
  transition: all var(--global-duration-1) ease-out;

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
    box-shadow: 0 3px 5px hsl(0, 0%, 70%);
    transform: translateY(-2px);
  }

  &:active {
    box-shadow: 0 0 0 hsl(0, 0%, 70%);
    transform: translateY(0);
  }

  &:disabled {
    transform: none;
  }
}

.button--contrast {
  background-color: var(--global-content-background-color);
}

.link--primary {
  color: var(--global-accent-color);
}
</style>
