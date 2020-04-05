<template>
  <div id="app">

    <Navigation class="navigation" />

    <main class="main">
      <slot/>
    </main>

    <footer class="footer">
      <span class="footer__copyright">Copyright © {{ new Date().getFullYear() }} Muhammad Rehan Saeed</span>
      <span>|</span>
      <span class="footer__copyright"><a href="/sitemap.xml">Sitemap</a></span>
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

export default {
  components: {
    Navigation,
    Search,
  }
}
</script>

<style lang="scss">
@media screen and (min-width: 1300px) {
  .navigation {
    position: sticky;
    top: 0;
    z-index: 10;
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
