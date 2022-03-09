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
      <u-link-button class="navigation__item" to="/" :aria-current="blogPage"
        >Blog</u-link-button
      >
      <u-link-button
        class="navigation__item"
        to="/portfolio/"
        :aria-current="portfolioPage"
        >Portfolio</u-link-button
      >
      <u-link-button
        class="navigation__item"
        to="/about/"
        :aria-current="aboutPage"
        >About</u-link-button
      >
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
import searchButton from "~/components/search/search-button.vue";
import themeButton from "~/components/theme-button.vue";

export default {
  components: {
    "u-link-button": linkButton,
    "u-install-button": installButton,
    "u-search-button": searchButton,
    "u-theme-button": themeButton,
  },
  computed: {
    blogPage() {
      return this.getIsCurrentPage("/");
    },
    portfolioPage() {
      return this.getIsCurrentPage("/portfolio/");
    },
    aboutPage() {
      return this.getIsCurrentPage("/about/");
    },
  },
  methods: {
    getIsCurrentPage(path) {
      return this.$route.path === path ? "page" : undefined;
    },
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
  grid-template-rows: auto auto;
  grid-template-areas:
    "image left right"
    ". . right";

  font-size: var(--global-font-size-3);
  padding: var(--global-space-fluid-5);
  visibility: hidden;
}

.navigation__image-container {
  grid-area: image;

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
  grid-area: left;

  display: grid;
  gap: var(--global-space-fluid-5);
  grid-template-columns: repeat(3, auto);
  justify-content: start;
}

.navigation__items-right {
  grid-area: right;

  display: grid;
  gap: var(--global-space-fluid-5);

  padding-top: var(--global-space-fluid-4);
  padding-right: var(--global-space-fluid-4);
}

.navigation__item {
  visibility: visible;
}

.navigation__item[aria-current="page"] {
  color: var(--global-accent-color);
}

.navigation__search,
.navigation__toggle-theme,
.navigation__install {
  visibility: visible;
}

@include breakpoints.respond-above(xl) {
  .navigation {
    grid-template-areas:
      "image . right"
      "left . right";
    gap: var(--global-space-fluid-3);

    margin-bottom: -9.5rem;
  }

  .navigation__items-left {
    gap: var(--global-space-fluid-3);
    grid-template-columns: auto;
  }

  .navigation__items-right {
    align-self: start;
    gap: var(--global-space-fluid-4);

    padding-top: initial;
    padding-right: initial;
  }
}

@media print {
  .navigation {
    display: none;
  }
}
</style>
