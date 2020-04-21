<template>
  <div id="app">

    <Navigation class="navigation" />

    <main class="main">
      <slot/>
    </main>

    <footer class="footer">
      <span class="footer__copyright">Copyright © {{new Date().getFullYear()}} {{this.$static.metadata.author.name}}</span>
      <span>|</span>
      <span class="footer__copyright"><g-link to="/sitemap.xml">Sitemap</g-link></span>
      <span>|</span>
      <span class="footer__links">Built with <g-link to="https://gridsome.org">Gridsome</g-link></span>
      <span>|</span>
      <span class="footer__links">Code on <g-link :to="this.$static.metadata.repository.url">GitHub</g-link></span>
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

<static-query>
query {
  metadata {
    author {
      name
    }
    repository {
      url
    }
  }
}
</static-query>

<style lang="scss">
@media screen and (min-width: 1200px) { // $global-breakpoint-xl
  .navigation {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

.main {
  margin: 0 auto;
  padding-left: calc(var(--global-space-6) * 2.7);
  padding-right: calc(var(--global-space-6) * 2.7);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--global-space-5);
  text-align: center;
  font-size: var(--global-font-size-0);

  > span {
    margin: 0 .35em;
  }

  a {
    color: currentColor;
  }
}
</style>
