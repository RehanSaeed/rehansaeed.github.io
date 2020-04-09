<template>
  <button class="button" :class="{ 'button--button': button }" :type="type">
    <slot/>
  </button>
</template>

<script>
export default {
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
  border: 0;
  color: var(--title-color);
  cursor: pointer;
  font-family: var(--heading-font-family);
  line-height: 1;
  padding: 0;
  transition: all 300ms ease-out;

  &:hover {
    opacity: .5;
    transform: scale(1.07);
  }

  &:focus {
    outline: none;
  }
}

.button--button {
  background-color: var(--bg-color);
  border-radius: var(--radius);
  font-size: .8em;
  padding: .5rem 1rem;
}
</style>
