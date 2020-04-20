<template>
  <Layout :show-logo="true">
    <div class="not-found">

      <u-heading level="1">404 Not Found</u-heading>

      <ContentBox class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link button to="/">Go Home</u-link>
      </ContentBox>

      <Newsletter />

    </div>
  </Layout>
</template>

<script>
import link from '~/components/shared/u-link.vue';
import heading from '~/components/shared/u-heading.vue';
import ContentBox from '~/components/ContentBox.vue';
import Newsletter from '~/components/Newsletter.vue';

export default {
  components: {
    'u-link': link,
    'u-heading': heading,
    ContentBox,
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
