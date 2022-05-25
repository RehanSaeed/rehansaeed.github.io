<template>
  <u-card class="newsletter">
    <form
      class="newsletter__form"
      method="post"
      :action="this.$static.metadata.mailchimpUrl">
      <u-heading
        id="newsletter"
        class="newsletter__title"
        level="2"
        center
        href="#newsletter"
        >Newsletter</u-heading
      >
      <label class="newsletter__label" for="email"
        >Stay up to date! Get all the latest &amp; greatest posts delivered
        straight to your inbox!</label
      >
      <input
        id="email"
        class="newsletter__input"
        name="EMAIL"
        placeholder="youremail@example.com"
        required
        type="email"
        autocapitalize="off"
        autocorrect="off" />
      <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
      <input
        aria-hidden="true"
        type="text"
        name="b_0d1d7c30db26dd0a4aa1b5b40_07ce865066"
        style="position: absolute; inset-inline-start: -5000px"
        tabindex="-1"
        value />
      <u-button bordered submit class="newsletter__button">Subscribe</u-button>
    </form>
  </u-card>
</template>

mailchimpUrl

<script>
import button from "~/components/shared/button.vue";
import card from "~/components/shared/card.vue";
import heading from "~/components/shared/heading.vue";

export default {
  name: "u-newsletter",
  components: {
    "u-button": button,
    "u-card": card,
    "u-heading": heading,
  },
};
</script>

<static-query>
query {
  metadata {
    mailchimpUrl
  }
}
</static-query>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.newsletter {
  content-visibility: auto;
  contain-intrinsic-size: 354px;
}

.newsletter__form {
  display: grid;
  gap: var(--global-space-fluid-3);
  grid-template-areas:
    "title title title title"
    "label label label label"
    ". input button .";
  grid-template-columns: 1fr auto auto 1fr;

  @include breakpoints.respond-below(md) {
    grid-template-areas:
      "title title title"
      "label label label"
      ". input ."
      ". button .";
    grid-template-columns: 1fr auto 1fr;
  }
}

.newsletter__title {
  grid-area: title;
  margin-block-start: 0;
  text-align: center;
}

.newsletter__label {
  grid-area: label;
  justify-self: center;
  margin-block-end: var(--global-space-fixed-4);
  text-align: center;
}

.newsletter__input {
  grid-area: input;
}

.newsletter__button {
  grid-area: button;
}

@media print {
  .newsletter {
    display: none;
  }
}
</style>
