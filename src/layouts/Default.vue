<template>
  <div id="app">

    <header class="header">
      <Navigation class="header__navigation" />

      <Search class="header__search" />
      <ToggleTheme class="header__theme" />
    </header>

    <main class="main">
      <slot/>
    </main>

    <footer class="footer">
      <span class="footer__copyright">Copyright © {{ new Date().getFullYear() }} Muhammad Rehan Saeed</span>
      <span>|</span>
      <span class="footer__links">Built with <a href="https://gridsome.org">Gridsome</a></span>
      <span>|</span>
      <span class="footer__links">Code on <a href="https://github.com/RehanSaeed/rehansaeed.github.io">GitHub</a></span>
    </footer>

  </div>
</template>

<script>
import Navigation from '~/components/Navigation.vue'
import Search from '~/components/Search.vue'
import ToggleTheme from '~/components/ToggleTheme.vue'

export default {
  components: {
    Navigation,
    Search,
    ToggleTheme
  }
}
</script>

<style lang="scss">
.header {
  align-items: center;
  display: grid;
  grid-gap: 0.6em;
  grid-template-columns: 1fr auto auto;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0.5rem 1rem;
  top:0;
  z-index: 10;

  &__navigation {
    justify-self: start;
  }
  &__theme {
    margin-top: 0.1rem;
  }
}

.main {
  margin: 0 auto;
  padding: 1.5vw 15px 0;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--space) / 2);
  text-align: center;
  font-size: .8em;

  > span {
    margin: 0 .35em;
  }

  a {
    color: currentColor;
  }
}
</style>
