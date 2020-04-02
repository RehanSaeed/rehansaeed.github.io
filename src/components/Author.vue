<template>
	<div class="author">

		<g-image alt="Author image" class="author__image" src="~/assets/images/Muhammad-Rehan-Saeed.png" width="180" height="180" blur="5" />

		<h1 class="author__site-title">{{$static.metadata.siteName}}</h1>

		<p class="author__description">{{$static.metadata.siteDescription}}</p>

		<SocialLinks />

	</div>
</template>

<static-query>
query {
  metadata {
    siteName
    siteDescription
  }
}
</static-query>

<script>
import SocialLinks from '~/components/SocialLinks.vue'

export default {
  components: {
    SocialLinks,
  }
}
</script>

<style lang="scss">
.author {
	margin: 0 auto;
	text-align: center;
	padding: calc(var(--space) / 2) 0;
}

.author__image {
  border-radius: 100%;
  width: 100px;
  height: 100px;
  margin-bottom: 1rem;
}

.author__site-title {
  font-size: 2.5em;
}

.author__description {
  opacity: .8;
}
</style>
