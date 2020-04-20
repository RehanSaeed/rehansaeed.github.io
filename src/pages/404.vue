<template>
  <Layout :show-logo="true">
    <div class="not-found">

      <u-heading level="1">404 Not Found</u-heading>

      <u-content-box class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link button to="/">Go Home</u-link>
      </u-content-box>

      <Newsletter />

    </div>
  </Layout>
</template>

<script>
import contentBox from '~/components/shared/u-content-box.vue';
import link from '~/components/shared/u-link.vue';
import heading from '~/components/shared/u-heading.vue';
import Newsletter from '~/components/Newsletter.vue';

export default {
  components: {
    'u-content-box': contentBox,
    'u-link': link,
    'u-heading': heading,
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
