<template>
  <footer class="footer">
    <u-arrows class="footer__arrows" />

    <u-newsletter class="footer__newsletter" />

    <u-author
      class="footer_author"
      heading-id="footer-author"
      heading-level="2" />

    <p class="footer__text">
      <span class="footer__copyright"
        >Copyright © {{ new Date().getFullYear() }}
        {{ metadata.author.name }}</span
      >
      <span aria-hidden="true">|</span>
      <span class="footer__copyright"><a href="/sitemap.xml">Sitemap</a></span>
      <span aria-hidden="true">|</span>
      <span class="footer__links"
        >Built with <a href="https://nuxt.com">Nuxt</a></span
      >
      <span aria-hidden="true">|</span>
      <span class="footer__links"
        >Code on <a :href="metadata.repository.url">GitHub</a></span
      >
    </p>
  </footer>
</template>

<script>
export default {
  name: "u-footer",
  setup() {
    return { metadata: useAppConfig().site };
  },
};
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

.footer__text {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block-end: var(--global-space-fluid-5);
  margin-block-end: 0;
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
