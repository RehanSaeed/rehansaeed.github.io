<template>
  <footer class="footer">
    <u-arrows class="footer__arrows" />

    <u-newsletter class="footer__newsletter" />

    <u-author class="footer_author" />

    <section class="footer__text">
      <span class="footer__copyright"
        >Copyright © {{ new Date().getFullYear() }}
        {{ this.$static.metadata.author.name }}</span
      >
      <span>|</span>
      <span class="footer__copyright"><a href="/sitemap.xml">Sitemap</a></span>
      <span>|</span>
      <span class="footer__links"
        >Built with <a href="https://gridsome.org">Gridsome</a></span
      >
      <span>|</span>
      <span class="footer__links"
        >Code on
        <a :href="this.$static.metadata.repository.url">GitHub</a></span
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
};
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
