<template>
   <div class="portfolio-tags">
   		<g-link class="portfolio-tags__link" v-for="tag in portfolio.tags" :key="tag.id" :to="tag.path">
   			{{ tag.title }}
   		</g-link>
    </div>
</template>

<script>
export default {
  props: ['portfolio']
}
</script>

<style lang="scss">
.portfolio-tags {
  margin: 1em 0 0;

  &__link {
  	margin-right: .7em;
  	font-size: .8em;
  	color: currentColor;
  	text-decoration: none;
  	background-color: var(--bg-color);
  	color: currentColor;
  	padding: .5em 1em;
  	border-radius: var(--radius);
  }
}
</style>
