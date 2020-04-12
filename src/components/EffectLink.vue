<template>
  <g-link class="link" :class="{ 'link--button': button }" :to="to" :aria-label="label">
    <slot/>
  </g-link>
</template>

<script>
export default {
  props: {
    button: Boolean,
    label: String,
    to: String,
  }
}
</script>

<style lang="scss">
.link {
  color: var(--title-color);
  font-family: var(--global-font-family-heading);
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
    opacity: .7;
    transform: scale(1.07);
  }
}

.link--button {
  background-color: var(--bg-color);
  border: var(--global-border-width-1) solid var(--border-color);
  border-radius: var(--global-border-radius);
  font-size: .8em;
  padding: .5rem 1rem;
}
</style>
