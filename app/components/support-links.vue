<template>
  <div>
    <p>
      If you like my content, please consider buying me a coffee. Thank you for
      your support!
    </p>

    <div class="support-links">
      <u-link-button
        v-if="metadata.author.patreon.url"
        variant="secondary"
        label="Patreon"
        :href="metadata.author.patreon.url">
        <u-icon name="fa-brands:patreon" inline />
        Patreon
      </u-link-button>
      <u-link-button
        v-if="metadata.author.buyMeACoffee.url"
        variant="secondary"
        label="Buy me a Coffee"
        :href="metadata.author.buyMeACoffee.url">
        <u-icon name="simple-icons:buymeacoffee" inline />
        Buy me a Coffee
      </u-link-button>
      <u-link-button
        v-if="metadata.author.gitHub.sponsorsUrl"
        variant="secondary"
        label="GitHub Sponsors"
        :href="metadata.author.gitHub.sponsorsUrl">
        <u-icon name="fa-brands:github" inline />
        GitHub Sponsors
      </u-link-button>
      <u-link-button
        v-if="metadata.author.paypal.url"
        variant="secondary"
        label="Paypal"
        :href="metadata.author.paypal.url">
        <u-icon name="fa-brands:paypal" inline />
        Paypal
      </u-link-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "u-support-links" });
const metadata = useAppConfig().site;
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
