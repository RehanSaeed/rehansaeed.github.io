<template>
  <div>
    <p>
      If you like my content, please consider buying me a coffee. Thank you for
      your support!
    </p>

    <div class="support-links">
      <u-link-button
        v-if="metadata.author.patreon.url"
        bordered
        label="Patreon"
        :href="metadata.author.patreon.url">
        <NuxtIcon
          name="fa-brands:patreon"
          class="icon--inline"
          aria-hidden="true" />
        Patreon
      </u-link-button>
      <u-link-button
        v-if="metadata.author.buyMeACoffee.url"
        bordered
        label="Buy me a Coffee"
        :href="metadata.author.buyMeACoffee.url">
        <NuxtIcon name="blog:coffee" class="icon--inline" aria-hidden="true" />
        Buy me a Coffee
      </u-link-button>
      <u-link-button
        v-if="metadata.author.gitHub.sponsorsUrl"
        bordered
        label="GitHub Sponsors"
        :href="metadata.author.gitHub.sponsorsUrl">
        <NuxtIcon
          name="fa-brands:github"
          class="icon--inline"
          aria-hidden="true" />
        GitHub Sponsors
      </u-link-button>
      <u-link-button
        v-if="metadata.author.paypal.url"
        bordered
        label="Paypal"
        :href="metadata.author.paypal.url">
        <NuxtIcon
          name="fa-brands:paypal"
          class="icon--inline"
          aria-hidden="true" />
        Paypal
      </u-link-button>
    </div>
  </div>
</template>

<script>
import { NuxtIcon } from "#components";
import linkButton from "~/components/shared/link-button.vue";

export default {
  name: "u-support-links",
  components: {
    NuxtIcon,
    "u-link-button": linkButton,
  },
  setup() {
    return { metadata: useAppConfig().site };
  },
};
</script>

<style lang="scss">
.support-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-4);
  justify-content: center;
}
</style>
