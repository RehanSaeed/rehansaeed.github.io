<template>
  <div>
    <p>
      If you like my content, please consider buying me a coffee. Thank you for
      your support!
    </p>

    <div class="support-links">
      <u-link-button
        v-if="this.$static.metadata.author.patreon.url"
        bordered
        label="Patreon"
        :href="this.$static.metadata.author.patreon.url">
        <u-icon-patreon inline /> Patreon
      </u-link-button>
      <u-link-button
        v-if="this.$static.metadata.author.buyMeACoffee.url"
        bordered
        label="Buy me a Coffee"
        :href="this.$static.metadata.author.buyMeACoffee.url">
        <u-icon-coffee inline /> Buy me a Coffee
      </u-link-button>
      <u-link-button
        v-if="this.$static.metadata.author.gitHub.sponsorsUrl"
        bordered
        label="GitHub Sponsors"
        :href="this.$static.metadata.author.gitHub.sponsorsUrl">
        <u-icon-github inline /> GitHub Sponsors
      </u-link-button>
      <u-link-button
        v-if="this.$static.metadata.author.paypal.url"
        bordered
        label="Paypal"
        :href="this.$static.metadata.author.paypal.url">
        <u-icon-paypal inline /> Paypal
      </u-link-button>
    </div>
  </div>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";
import iconCoffee from "~/components/shared/icons/icon-coffee.vue";
import iconGitHub from "~/components/shared/icons/icon-github.vue";
import iconPatreon from "~/components/shared/icons/icon-patreon.vue";
import iconPaypal from "~/components/shared/icons/icon-paypal.vue";

export default {
  name: "u-support-links",
  components: {
    "u-link-button": linkButton,
    "u-icon-coffee": iconCoffee,
    "u-icon-github": iconGitHub,
    "u-icon-patreon": iconPatreon,
    "u-icon-paypal": iconPaypal,
  },
};
</script>

<static-query>
query {
  metadata {
    author {
      gitHub {
        sponsorsUrl
      }
      patreon {
        url
      }
      buyMeACoffee {
        url
      }
      paypal {
        url
      }
    }
  }
}
</static-query>

<style lang="scss">
.support-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-4);
  justify-content: center;
}
</style>
