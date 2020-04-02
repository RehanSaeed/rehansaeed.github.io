<template>
  <g-link class="link" :to="to">
    <slot/>
  </g-link>
</template>

<script>
export default {
  props: {
    to: String,
  }
}
</script>

<style lang="scss">
.link {
  color: var(--title-color);
  font-family: var(--heading-font-family);
  text-decoration: none;
  transition: all 300ms ease-out;

  &:visited,
  &:focus,
  &:active {
    color: var(--title-color);
  }

  &:hover {
    color: var(--title-color);
    opacity: .5;
    transform: scale(1.07);
  }
}
</style>
