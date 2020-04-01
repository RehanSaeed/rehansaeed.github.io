<template>
  <nav class="navigation">
    <g-link class="navigation__item" to="/">Blog</g-link>
    <g-link class="navigation__item" to="/portfolio/">Portfolio</g-link>
    <g-link class="navigation__item" to="/about/">About</g-link>
  </nav>
</template>

<style lang="scss">
.navigation {
  display: grid;
  font-size: 1.1em;
  grid-template-columns: auto auto auto;
  grid-gap: 1rem;
}

.navigation__item {
  color: var(--title-color);
  font-family: var(--heading-font-family);
  text-decoration: none;

  &:visited,
  &:focus,
  &:active {
    color: var(--title-color);
  }

  &:hover {
    color: var(--title-color);
    opacity: .7;
  }

}
</style>
