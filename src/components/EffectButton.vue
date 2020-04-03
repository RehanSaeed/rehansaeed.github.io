<template>
  <button class="button">
    <slot/>
  </button>
</template>

<style lang="scss">
.button {
  background-color: transparent;
  border: 0;
  color: var(--title-color);
  cursor: pointer;
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
</style>
