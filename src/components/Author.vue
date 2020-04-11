<template>
	<section class="author">

		<g-image :alt="$static.metadata.name" class="author__image" src="~/assets/images/author/Muhammad-Rehan-Saeed/Logo-260x260.png" width="120" height="120" blur="5" />

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
	margin: 0 auto;
	text-align: center;
	padding: calc(var(--space) / 2) 0;
}

.author__image {
  border: solid 2px var(--title-color);
  border-radius: 100%;
  width: 6rem;
  height: 6rem;
  margin-bottom: 1rem;
}

.author__site-title {
  font-size: 2.5em;
}

.author__description {
  opacity: .8;
}
</style>
