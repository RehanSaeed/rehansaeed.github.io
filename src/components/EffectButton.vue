<template>
  <button class="button" :class="{ 'button--button': button }">
    <slot/>
  </button>
</template>

<script>
export default {
  props: {
    button: Boolean,
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
  padding: .5em 1em;
}
</style>
