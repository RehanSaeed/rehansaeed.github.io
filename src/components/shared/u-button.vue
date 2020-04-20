<template>
  <button class="button" :class="{ 'button--button': button }" :type="type">
    <slot/>
  </button>
</template>

<script>
export default {
  name: 'u-button',
  props: {
    button: Boolean,
    submit: Boolean,
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
  padding: 0;
  transition: all 300ms ease-out;

  &:hover {
    opacity: .7;
    transform: scale(1.07);
  }

  &:focus {
    outline: none;
  }
}

.button--button {
  background-color: var(--bg-color);
  border: var(--global-border-width-1) solid var(--border-color);
  border-radius: var(--global-border-radius);
  font-size: var(--global-font-size-0);
  padding: .5rem 1rem;
}
</style>
