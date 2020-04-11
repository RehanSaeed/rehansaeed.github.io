<template>
  <nav class="navigation">
    <EffectLink to="/">
		  <g-image :alt="$static.metadata.name" class="navigation__image" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="50" height="50" blur="0" />
    </EffectLink>
    <div class="navigation__items">
      <EffectLink class="navigation__item" to="/">Blog</EffectLink>
      <EffectLink class="navigation__item" to="/portfolio/">Portfolio</EffectLink>
      <EffectLink class="navigation__item" to="/about/">About</EffectLink>
    </div>
    <ToggleSearch class="navigation__search" />
    <ToggleTheme class="navigation__toggle-theme" />
  </nav>
</template>

<static-query>
query {
  metadata {
    author {
      name
    }
  }
}
</static-query>

<script>
import EffectLink from '~/components/EffectLink.vue'
import ToggleSearch from '~/components/ToggleSearch.vue'
import ToggleTheme from '~/components/ToggleTheme.vue'

export default {
  components: {
    EffectLink,
    ToggleSearch,
    ToggleTheme,
  }
}
</script>

<style lang="scss">
.navigation {
  align-items: center;
  display: grid;
  font-size: 1.1em;
  grid-template-columns: repeat(4, auto) 1fr repeat(2, auto);
  grid-gap: 1rem;
  padding: 1rem;
  visibility: hidden;
}

.navigation__image {
  border: solid 2px var(--title-color);
  border-radius: 100%;
  width: 2.5rem;
  height: 2.5rem;
  visibility: visible;
}

.navigation__items {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: 1rem;
}

.navigation__item {
  visibility: visible;
}

.navigation__search {
  grid-column-start: 6;
  visibility: visible;
}

.navigation__toggle-theme {
  grid-column-start: 7;
  margin-bottom: .2rem;
  visibility: visible;
}

@media screen and (min-width: 1300px) {
  .navigation {
    grid-template-columns: auto 1fr repeat(2, auto);
    margin-bottom: -8rem;
  }
  .navigation__items {
    grid-column-start: 1;
    grid-row-start: 2;
    grid-template-columns: auto;
  }
}
</style>
