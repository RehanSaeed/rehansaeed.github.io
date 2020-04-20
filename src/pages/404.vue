<template>
  <Layout :show-logo="true">
    <div class="not-found">

      <Heading level="1">404 Not Found</Heading>

      <ContentBox class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <EffectLink button to="/">Go Home</EffectLink>
      </ContentBox>

      <Newsletter />

    </div>
  </Layout>
</template>

<script>
import ContentBox from '~/components/ContentBox.vue';
import EffectLink from '~/components/shared/EffectLink.vue';
import Heading from '~/components/shared/Heading.vue';
import Newsletter from '~/components/Newsletter.vue';

export default {
  components: {
    ContentBox,
    EffectLink,
    Heading,
    Newsletter,
  },
}
</script>

<style lang="scss">
.not-found {
  display: grid;
  justify-content: center;
}

.not-found__content {
  display: grid;
  justify-items: center;
  margin-bottom: var(--global-space-4);
  text-align: center;
}
</style>
