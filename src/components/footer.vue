<template>
  <footer class="footer">
    <span class="footer__copyright">Copyright © {{new Date().getFullYear()}} {{this.$static.metadata.author.name}}</span>
    <span>|</span>
    <span class="footer__copyright"><g-link to="/sitemap.xml">Sitemap</g-link></span>
    <span>|</span>
    <span class="footer__links">Built with <g-link to="https://gridsome.org">Gridsome</g-link></span>
    <span>|</span>
    <span class="footer__links">Code on <g-link :to="this.$static.metadata.repository.url">GitHub</g-link></span>
  </footer>
</template>

<script>
export default {
  name: 'u-footer',
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
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--global-space-fluid-5);
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
