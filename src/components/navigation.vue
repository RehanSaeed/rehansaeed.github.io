<template>
  <nav class="navigation">
    <u-link-button class="navigation__image-container" label="Home" to="/">
      <g-image
        :alt="this.$static.metadata.author.name"
        class="navigation__image"
        src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png"
        width="50"
        height="50"
        blur="0" />
    </u-link-button>
    <div class="navigation__items-left">
      <u-link-button class="navigation__item" to="/">Blog</u-link-button>
      <u-link-button class="navigation__item" to="/portfolio/"
        >Portfolio</u-link-button
      >
      <u-link-button class="navigation__item" to="/about/">About</u-link-button>
    </div>
    <div class="navigation__items-right">
      <u-search-button class="navigation__search" />
      <u-theme-button class="navigation__toggle-theme" />
      <u-install-button class="navigation__install" />
    </div>
  </nav>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";
import installButton from "~/components/install-button.vue";
import searchButton from "~/components/search-button.vue";
import themeButton from "~/components/theme-button.vue";

export default {
  components: {
    "u-link-button": linkButton,
    "u-install-button": installButton,
    "u-search-button": searchButton,
    "u-theme-button": themeButton,
  },
};
</script>

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

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.navigation {
  display: grid;
  align-items: center;
  gap: var(--global-space-fluid-5);
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;

  font-size: var(--global-font-size-3);
  padding: var(--global-space-fluid-5);
  visibility: hidden;
}

.navigation__image-container {
  line-height: 0;
  visibility: visible;
}

.navigation__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  transition: border-color var(--global-duration-3) ease-out;
  height: 2.5rem;
  width: 2.5rem;
}

.navigation__items-left {
  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(3, auto);
  justify-content: start;
}

.navigation__items-right {
  align-self: start;
  grid-column-start: 3;
  grid-row-start: 1;
  grid-row-end: 3;

  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-areas:
    "search theme"
    ". install";
  grid-template-columns: repeat(2, auto);
}

.navigation__item {
  visibility: visible;
}

.navigation__search {
  grid-area: search;
  visibility: visible;
}

.navigation__toggle-theme {
  grid-area: theme;
  visibility: visible;
}

.navigation__install {
  grid-area: install;
  visibility: visible;
}

@include breakpoints.respond-above(xl) {
  .navigation {
    gap: var(--global-space-fluid-3);
    grid-template-rows: auto auto;
    justify-items: left;

    margin-bottom: -9.5rem;
  }

  .navigation__items-left {
    gap: var(--global-space-fluid-3);
    grid-column-start: 1;
    grid-row-start: 2;
    grid-template-columns: auto;
  }
}

@media print {
  .navigation {
    display: none;
  }
}
</style>
