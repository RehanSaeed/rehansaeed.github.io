<template>
  <Layout>
    <div class="not-found">
      <u-heading id="not-found" level="1" center>404 Not Found</u-heading>

      <u-arrows class="not-found__arrows" />

      <u-card class="not-found__content">
        <p>Didn't find what you were looking for?</p>
        <u-link-button bordered to="/">Go Home</u-link-button>
      </u-card>
    </div>
  </Layout>
</template>

<script>
import arrows from "~/components/shared/arrows.vue";
import card from "~/components/shared/card.vue";
import linkButton from "~/components/shared/link-button.vue";
import heading from "~/components/shared/heading.vue";

export default {
  components: {
    "u-arrows": arrows,
    "u-card": card,
    "u-link-button": linkButton,
    "u-heading": heading,
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
}

.not-found__arrows {
  margin-inline: calc(var(--global-space-main) * -1);
}

.not-found__content {
  justify-self: center;

  display: grid;
  justify-items: center;
  text-align: center;
}
</style>
