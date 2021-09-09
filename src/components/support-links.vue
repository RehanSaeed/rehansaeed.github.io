<template>
  <div>
    <p>
      If you like my content, please consider buying me a coffee. Thank you for
      your support!
    </p>

    <div class="support-links">
      <u-link-button
        v-if="this.$static.metadata.author.buyMeACoffee.url"
        bordered
        label="Buy me a Coffee"
        :href="this.$static.metadata.author.buyMeACoffee.url"
        class="support-links__link">
        <u-icon-coffee /> Buy me a Coffee
      </u-link-button>
      <u-link-button
        v-if="this.$static.metadata.author.gitHub.sponsorsUrl"
        bordered
        label="GitHub Sponsors"
        :href="this.$static.metadata.author.gitHub.sponsorsUrl"
        class="support-links__link">
        <u-icon-github /> GitHub Sponsors
      </u-link-button>
      <u-link-button
        v-if="this.$static.metadata.author.paypal.url"
        bordered
        label="Paypal"
        :href="this.$static.metadata.author.paypal.url"
        class="support-links__link">
        <u-icon-paypal /> Paypal
      </u-link-button>
    </div>
  </div>
</template>

<script>
import linkButton from "~/components/shared/link-button.vue";
import iconCoffee from "~/components/shared/icons/icon-coffee.vue";
import iconGitHub from "~/components/shared/icons/icon-github.vue";
import iconPaypal from "~/components/shared/icons/icon-paypal.vue";

export default {
  name: "u-support-links",
  components: {
    "u-link-button": linkButton,
    "u-icon-coffee": iconCoffee,
    "u-icon-github": iconGitHub,
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
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-right: var(--global-space-fixed--4);
  margin-bottom: var(--global-space-fixed--4);
}

.support-links__link {
  margin-right: var(--global-space-fixed-4);
  margin-bottom: var(--global-space-fixed-4);
}
</style>
