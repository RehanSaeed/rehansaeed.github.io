<template>
  <!-- Added webmention markup (See https://indiewebify.me/validate-h-card/?url=https%3A%2F%2Frehansaeed.com) -->
	<section class="author h-card">

		<g-image :alt="$static.metadata.name" immediate class="author__image u-photo" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="120" height="120" />

		<u-heading level="1" class="author__site-title">
      <a :href="$static.metadata.url" class="author__site-title-link u-url p-name">{{$static.metadata.name}}</a>
    </u-heading>

		<p class="author__description p-note">{{$static.metadata.description}}</p>

		<u-social-links />

	</section>
</template>

<script>
import heading from '~/components/shared/heading.vue';
import socialLinks from '~/components/social-links.vue';

export default {
  name: 'u-author',
  components: {
    'u-heading': heading,
    'u-social-links': socialLinks,
  },
}
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
  padding: var(--global-space-fluid-5) var(--global-space-fluid-3);
}

.author__image {
  border: var(--global-border-width-2) solid var(--global-title-color);
  border-radius: 100%;
  width: 6rem;
  height: 6rem;
  margin-bottom: var(--global-space-fluid-3);
  transition: border-color var(--global-duration-3) ease-out;
}

.author__site-title {
  font-size: var(--global-font-size-8);
  text-align: center;
}
.author__site-title-link {
  color: var(--global-title-color);
  opacity: 1;
  text-decoration: none;

  &:hover,
  &:focus,
  &:active {
    color: var(--global-title-color);
    opacity: .7;
  }

  &:visited {
    color: var(--global-title-color);
  }
}

.author__description {
  opacity: .8;
  text-align: center;
}

@media print {
  .author {
    display: none;
  }
}
</style>
