<template>
  <g-link class="link" :class="{ 'link--button': button }" :to="to">
    <slot/>
  </g-link>
</template>

<script>
export default {
  props: {
    button: Boolean,
    to: String,
  }
}
</script>

<style lang="scss">
.link {
  color: var(--title-color);
  font-family: var(--heading-font-family);
  line-height: 1;
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

.link--button {
  background-color: var(--bg-color);
  border: solid 1px var(--border-color);
  border-radius: var(--radius);
  font-size: .8em;
  padding: .5rem 1rem;
}
</style>
