<template>
  <Layout>
    <div class="not-found">

      <u-heading id="not-found" level="1" center>404 Not Found</u-heading>

      <u-content-box class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link bordered to="/">Go Home</u-link>
      </u-content-box>

      <u-newsletter />

    </div>
  </Layout>
</template>

<script>
import contentBox from '~/components/shared/content-box.vue';
import link from '~/components/shared/link.vue';
import heading from '~/components/shared/heading.vue';
import newsletter from '~/components/newsletter.vue';

export default {
  components: {
    'u-content-box': contentBox,
    'u-link': link,
    'u-heading': heading,
    'u-newsletter': newsletter,
  },
  metaInfo () {
    return {
      title: 'Not Found',
      link: [],
      meta: [],
    }
  },
}
</script>

<style lang="scss">
.not-found {
  display: grid;
  grid-gap: var(--global-space-fluid-5);
  justify-items: center;
}

.not-found__content {
  display: grid;
  justify-items: center;
  text-align: center;
}
</style>
