<template>
	<section class="author">

		<g-image :alt="$static.metadata.name" immediate class="author__image" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="120" height="120" />

		<h1 class="author__site-title">{{$static.metadata.name}}</h1>

		<p class="author__description">{{$static.metadata.description}}</p>

		<SocialLinks />

	</section>
</template>

<static-query>
query {
  metadata {
    name
    description
  }
}
</static-query>

<script>
import SocialLinks from '~/components/SocialLinks.vue'

export default {
  components: {
    SocialLinks,
  },
}
</script>

<style lang="scss">
.author {
  display: grid;
  justify-items: center;
	padding: calc(var(--global-space) / 2) 0;
}

.author__image {
  border: var(--global-border-width-2) solid var(--title-color);
  border-radius: 100%;
  width: 6rem;
  height: 6rem;
  margin-bottom: 1rem;
}

.author__site-title {
  font-size: var(--global-font-size-7);
  text-align: center;
}

.author__description {
  opacity: .8;
  text-align: center;
}
</style>
