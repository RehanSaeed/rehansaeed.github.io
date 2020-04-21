<template>
  <button class="button" :class="{ 'button--bordered': bordered }" :type="type">
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
    submit: {
      type: Boolean
    },
  },
  computed: {
    type: function() {
      if (this.submit) {
        return 'submit';
      }
    }
  }
}
</script>

<style lang="scss">
.button {
  background-color: transparent;
  border: none;
  color: var(--title-color);
  cursor: pointer;
  font-family: var(--global-font-family-heading);
  line-height: var(--global-line-height-1);
  padding: var(--global-space-0);
  transition: all var(--global-duration-1) ease-out;

  &:hover {
    opacity: .7;
    transform: scale(1.07);
  }

  &:focus {
    outline: none;
  }
}

.button--bordered {
  background-color: var(--bg-color);
  border: var(--global-border-width-1) solid var(--border-color);
  border-radius: var(--global-border-radius);
  font-size: var(--global-font-size-0);
  padding: var(--global-space-2) var(--global-space-35);
}
</style>
