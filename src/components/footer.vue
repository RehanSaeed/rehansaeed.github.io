<template>
  <footer class="footer">
    <span class="footer__copyright">Copyright © {{new Date().getFullYear()}} {{this.$static.metadata.author.name}}</span>
    <span>|</span>
    <span class="footer__copyright"><a href="/sitemap.xml">Sitemap</a></span>
    <span>|</span>
    <span class="footer__links">Built with <a href="https://gridsome.org">Gridsome</a></span>
    <span>|</span>
    <span class="footer__links">Code on <a :href="this.$static.metadata.repository.url">GitHub</a></span>
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
  font-size: var(--global-font-size-1);

  > span {
    margin: 0 .35em;
  }
}

@media print {
  .footer {
    display: none;
  }
}
</style>
