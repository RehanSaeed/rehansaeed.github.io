<template>
  <nav class="navigation">

		<g-image alt="Author image" class="navigation__image" src="~/assets/images/Muhammad-Rehan-Saeed.png" width="30" height="30" blur="5" />

    <g-link class="navigation__item" to="/">Blog</g-link>
    <g-link class="navigation__item" to="/portfolio/">Portfolio</g-link>
    <g-link class="navigation__item" to="/about/">About</g-link>
  </nav>
</template>

<style lang="scss">
.navigation {
  align-items: center;
  display: grid;
  font-size: 1.1em;
  grid-template-columns: auto auto auto auto;
  grid-gap: 1rem;
}

.navigation__image {
  border: solid 2px var(--title-color);
  box-shadow: 1px 10px 30px 0 rgba(0,0,0,.2);
  border-radius: 100%;
  width: 45px;
  height: 45px;
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
