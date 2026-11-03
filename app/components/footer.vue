<template>
  <footer class="footer">
    <u-arrows class="footer__arrows" />

    <u-newsletter class="footer__newsletter" />

    <u-author class="footer_author" heading-id="footer-author" />

    <p class="footer__offline">
      Installing the app does not download the entire blog. Articles are cached
      as you read; unvisited articles are not guaranteed offline.
      <a href="/offline.html">About offline reading</a>
    </p>

    <section class="footer__text">
      <span class="footer__copyright"
        >Copyright © {{ new Date().getFullYear() }}
        {{ metadata.author.name }}</span
      >
      <span>|</span>
      <span class="footer__copyright"><a href="/sitemap.xml">Sitemap</a></span>
      <span>|</span>
      <span class="footer__links"
        >Built with <a href="https://nuxt.com">Nuxt</a></span
      >
      <span>|</span>
      <span class="footer__links"
        >Code on <a :href="metadata.repository.url">GitHub</a></span
      >
    </section>
  </footer>
</template>

<script setup lang="ts">
defineOptions({ name: "u-footer" });
const metadata = useAppConfig().site;
</script>

<style lang="scss">
.footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--global-space-fluid-5);
}

.footer__newsletter {
  justify-self: center;
  max-inline-size: 100%;
}

.footer__offline {
  margin-inline: auto;
  padding-inline: var(--global-space-fluid-5);
  max-inline-size: 40rem;
  text-align: center;
}

.footer__text {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block-end: var(--global-space-fluid-5);
  text-align: center;
  font-size: var(--global-font-size-1);

  > span {
    margin: 0 0.35em;
  }
}

@media print {
  .footer {
    display: none;
  }
}
</style>
