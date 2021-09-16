<template>
  <Layout>
    <div class="not-found">
      <u-heading id="not-found" level="1" center>404 Not Found</u-heading>

      <u-card class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link-button bordered to="/">Go Home</u-link-button>
      </u-card>

      <u-newsletter />
    </div>
  </Layout>
</template>

<script>
import card from "~/components/shared/card.vue";
import linkButton from "~/components/shared/link-button.vue";
import heading from "~/components/shared/heading.vue";
import newsletter from "~/components/newsletter.vue";

export default {
  components: {
    "u-card": card,
    "u-link-button": linkButton,
    "u-heading": heading,
    "u-newsletter": newsletter,
  },
  metaInfo() {
    return {
      title: "Not Found",
      link: [],
      meta: [],
    };
  },
};
</script>

<style lang="scss">
.not-found {
  display: grid;
  gap: var(--global-space-fluid-5);
  justify-items: center;
}

.not-found__content {
  display: grid;
  justify-items: center;
  text-align: center;
}
</style>
