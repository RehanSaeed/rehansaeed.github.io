<template>
  <Layout :show-logo="true">

    <div class="not-found__container">
      <h1 class="not-found__title">404 Not Found</h1>
      <EffectLink button class="not-found__home-button" to="/">Go Home</EffectLink>
    </div>

    <Newsletter />

  </Layout>
</template>

<script>
import Author from '~/components/Author.vue'
import EffectLink from '~/components/EffectLink.vue'
import Newsletter from '~/components/Newsletter.vue'

export default {
  components: {
    Author,
    EffectLink,
    Newsletter,
  },
}
</script>

<style lang="scss">
.not-found__container {
  display: grid;
  margin-bottom: 10rem;
}

.not-found__title {
  margin-bottom: 1.5rem;
  text-align: center;
}

.not-found__home-button {
  justify-self: center;
}
</style>
