<template>
  <nav class="navigation">
    <EffectLink to="/">
		  <g-image alt="Author image" class="navigation__image" src="~/assets/images/Muhammad-Rehan-Saeed.png" width="30" height="30" blur="0" />
    </EffectLink>
    <EffectLink class="navigation__item" to="/">Blog</EffectLink>
    <EffectLink class="navigation__item" to="/portfolio/">Portfolio</EffectLink>
    <EffectLink class="navigation__item" to="/about/">About</EffectLink>
  </nav>
</template>

<script>
import EffectLink from '~/components/EffectLink.vue'

export default {
  components: {
    EffectLink,
  }
}
</script>

<style lang="scss">
.navigation {
  align-items: center;
  display: grid;
  font-size: 1.1em;
  grid-template-columns: repeat(4, auto);
  grid-gap: 1rem;
}

.navigation__image {
  border: solid 2px var(--title-color);
  border-radius: 100%;
  width: 45px;
  height: 45px;
}
</style>
