<template>
  <!-- Added webmention markup (See https://indiewebify.me/validate-h-card/?url=https%3A%2F%2Frehansaeed.com) -->
  <section class="author h-card" :aria-label="metadata.name">
    <NuxtImg
      class="author__image u-photo"
      :alt="metadata.name"
      loading="eager"
      src="/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png"
      width="120"
      height="120" />

    <u-heading
      :id="headingId || metadata.name"
      class="author__site-title"
      link-class="u-url u-uid p-name"
      level="1"
      :href="metadata.url"
      center
      >{{ metadata.name }}</u-heading
    >

    <p class="author__description p-note">{{ metadata.description }}</p>

    <u-social-links />
  </section>
</template>

<script>
import { NuxtImg } from "#components";
import heading from "~/components/shared/heading.vue";
import socialLinks from "~/components/social-links.vue";

export default {
  name: "u-author",
  components: {
    NuxtImg,
    "u-heading": heading,
    "u-social-links": socialLinks,
  },
  props: {
    headingId: {
      type: String,
    },
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
};
</script>

<style lang="scss">
.author {
  display: grid;
  justify-items: center;
  padding-inline: var(--global-space-fluid-3);
}

.author__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  inline-size: 7rem;
  block-size: 7rem;
  margin-block-end: var(--global-space-fluid-3);
  transition: border-color var(--global-duration-3) ease-out;
}

.author__site-title {
  font-size: var(--global-font-size-8);
}

.author__description {
  opacity: 0.8;
  text-align: center;
}

@media print {
  .author {
    display: none;
  }
}
</style>
