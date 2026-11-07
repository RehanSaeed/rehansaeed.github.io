<template>
  <u-card class="newsletter">
    <section class="newsletter__content" aria-labelledby="newsletter">
      <u-heading
        id="newsletter"
        class="newsletter__title"
        level="2"
        center
        href="#newsletter"
        >Newsletter</u-heading
      >
      <p class="newsletter__description">
        Stay up to date! Get all the latest &amp; greatest posts delivered
        straight to your inbox!
      </p>
      <u-link-button
        class="newsletter__button"
        bordered
        :href="metadata.newsletter.formUrl"
        >Subscribe by email</u-link-button
      >
      <p class="newsletter__note">
        Opens the {{ metadata.newsletter.provider }} sign-up form. Unsubscribe
        at any time.
      </p>
    </section>
  </u-card>
</template>

<script setup lang="ts">
defineOptions({ name: "u-newsletter" });
const metadata = useAppConfig().site;
</script>

<style lang="scss">
.newsletter {
  content-visibility: auto;
  contain-intrinsic-size: 354px;
}

.newsletter__content {
  display: grid;
  gap: var(--global-space-fluid-3);
  justify-items: center;
  text-align: center;
}

.newsletter__title {
  margin-block-start: 0;
}

.newsletter__description,
.newsletter__note {
  margin-block: 0;
}

.newsletter__note {
  font-size: var(--global-font-size-1);
}

@media print {
  .newsletter {
    display: none;
  }
}
</style>
