<template>
  <nav class="navigation">
    <EffectLink class="navigation__image-container" label="Home" to="/">
		  <g-image :alt="this.$static.metadata.author.name" class="navigation__image" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="50" height="50" blur="0" />
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
    name
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
  font-size: var(--global-font-size-2);
  grid-template-columns: auto auto 1fr auto auto;
  grid-gap: var(--global-space-2);
  padding: var(--global-space-2);
  visibility: hidden;
}

.navigation__image-container {
  line-height: 0;
  visibility: visible;
}

.navigation__image {
  border: var(--global-border-width-2) solid var(--title-color);
  border-radius: 100%;
  height: 2.5rem;
  width: 2.5rem;
}

.navigation__items {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: var(--global-space-2);
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

@media screen and (min-width: 1200px) {
  .navigation {
    grid-template-columns: auto 1fr auto auto;
    margin-bottom: -8rem;
    justify-items: left;
  }

  .navigation__items {
    grid-column-start: 1;
    grid-row-start: 2;
    grid-template-columns: auto;
  }
}
</style>
