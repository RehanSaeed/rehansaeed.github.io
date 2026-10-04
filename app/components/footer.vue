<template>
  <footer class="footer">
    <u-arrows class="footer__arrows" />

    <u-newsletter class="footer__newsletter" />

    <u-author class="footer_author" heading-id="footer-author" />

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

<script>
import arrows from "~/components/shared/arrows.vue";
import author from "~/components/author.vue";
import newsletter from "~/components/newsletter.vue";

export default {
  name: "u-footer",
  components: {
    "u-arrows": arrows,
    "u-author": author,
    "u-newsletter": newsletter,
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
};
</script>

<style lang="scss">
.footer {
  display: grid;
  gap: var(--global-space-fluid-5);
}

.footer__newsletter {
  justify-self: center;
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
