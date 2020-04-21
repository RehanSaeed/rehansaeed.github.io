<template>
  <nav class="navigation">
    <u-link class="navigation__image-container" label="Home" to="/">
		  <g-image :alt="this.$static.metadata.author.name" class="navigation__image" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="50" height="50" blur="0" />
    </u-link>
    <div class="navigation__items-left">
      <u-link class="navigation__item" to="/">Blog</u-link>
      <u-link class="navigation__item" to="/portfolio/">Portfolio</u-link>
      <u-link class="navigation__item" to="/about/">About</u-link>
    </div>
    <div class="navigation__items-right">
      <u-search-button class="navigation__search" />
      <u-theme-button class="navigation__toggle-theme" />
    </div>
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
import link from '~/components/shared/link.vue';
import searchButton from '~/components/search-button.vue';
import themeButton from '~/components/theme-button.vue';

export default {
  components: {
    'u-link': link,
    'u-search-button': searchButton,
    'u-theme-button': themeButton,
  }
}
</script>

<style lang="scss">
.navigation {
  align-items: center;
  display: grid;
  font-size: var(--global-font-size-2);
  grid-template-columns: auto auto 1fr auto;
  grid-gap: var(--global-space-fluid-5);
  padding: var(--global-space-fluid-5);
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

.navigation__items-left {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: var(--global-space-fluid-5);
}

.navigation__items-right {
  grid-column-start: 6;
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: var(--global-space-fluid-5);
}

.navigation__item {
  visibility: visible;
}

.navigation__search {
  visibility: visible;
}

.navigation__toggle-theme {
  margin-bottom: .2rem;
  visibility: visible;
}

@media screen and (min-width: 1200px) { // $global-breakpoint-xl
  .navigation {
    grid-gap: var(--global-space-fluid-3);
    grid-template-columns: auto 1fr auto auto;
    margin-bottom: -9.5rem;
    justify-items: left;
  }

  .navigation__items-left {
    grid-gap: var(--global-space-fluid-3);
    grid-column-start: 1;
    grid-row-start: 2;
    grid-template-columns: auto;
  }
}
</style>
