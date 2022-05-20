<template>
  <!-- Added webmention markup (See https://indiewebify.me/validate-h-card/?url=https%3A%2F%2Frehansaeed.com) -->
  <section class="author h-card" :aria-label="$static.metadata.name">
    <g-image
      class="author__image u-photo"
      :alt="$static.metadata.name"
      immediate
      src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-192x192.png"
      width="120"
      height="120" />

    <u-heading
      :id="$static.metadata.name"
      class="author__site-title"
      link-class="u-url u-uid p-name"
      level="1"
      :href="$static.metadata.url"
      center
      >{{ $static.metadata.name }}</u-heading
    >

    <p class="author__description p-note">{{ $static.metadata.description }}</p>

    <u-social-links />
  </section>
</template>

<script>
import heading from "~/components/shared/heading.vue";
import socialLinks from "~/components/social-links.vue";

export default {
  name: "u-author",
  components: {
    "u-heading": heading,
    "u-social-links": socialLinks,
  },
};
</script>

<static-query>
query {
  metadata {
    name
    description
    url
  }
}
</static-query>

<style lang="scss">
.author {
  display: grid;
  justify-items: center;
  padding-inline: var(--global-space-fluid-3);
}

.author__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  width: 6rem;
  height: 6rem;
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
