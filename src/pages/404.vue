<template>
  <Layout :show-logo="true">
    <div class="not-found">

      <PageTitle>404 Not Found</PageTitle>

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
import EffectLink from '~/components/EffectLink.vue';
import Newsletter from '~/components/Newsletter.vue';
import PageTitle from '~/components/PageTitle.vue';

export default {
  components: {
    ContentBox,
    EffectLink,
    Newsletter,
    PageTitle,
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
  margin-bottom: var(--global-space-3);
  text-align: center;
}
</style>
