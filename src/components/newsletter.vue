<template>
  <u-content-box class="newsletter" tag="section">
    <form class="newsletter__form" method="post" :action="this.$static.metadata.mailchimpUrl">
      <u-heading class="newsletter__title" id="newsletter" level="2" center href="#newsletter">Newsletter</u-heading>
      <label class="newsletter__content" for="email">Stay up to date! Get all the latest &amp; greatest posts delivered straight to your inbox!</label>
      <input
        id="email"
        class="newsletter__input"
        name="EMAIL"
        placeholder="youremail@example.com"
        required
        type="email"
        autocapitalize="off"
        autocorrect="off"/>
      <!-- real people should not fill this in and expect good things - do not remove this or risk form bot signups-->
      <input
        aria-hidden="true"
        type="text"
        name="b_0d1d7c30db26dd0a4aa1b5b40_07ce865066"
        style="position: absolute; left: -5000px;"
        tabindex="-1"
        value="">
      <u-button bordered submit class="newsletter__button">
        Subscribe
      </u-button>
    </form>
  </u-content-box>
</template>

mailchimpUrl

<script>
import button from '~/components/shared/button.vue';
import contentBox from '~/components/shared/content-box.vue';
import heading from '~/components/shared/heading.vue';

export default {
  name: 'u-newsletter',
  components: {
    'u-button': button,
    'u-content-box': contentBox,
    'u-heading': heading,
  },
}
</script>

<static-query>
query {
  metadata {
    mailchimpUrl
  }
}
</static-query>

<style lang="scss">
.newsletter__form {
  display: grid;
  grid-template-columns: 1fr auto auto 1fr;
  grid-template-areas:
    "title title title title"
    "content content content content"
    ". input button .";
}

.newsletter__title {
  grid-area: title;
  margin-top: 0;
  text-align: center;
}

.newsletter__content {
  grid-area: content;
  justify-self: center;
  margin-bottom: var(--global-space-fixed-5);
  text-align: center;
}

.newsletter__input {
  grid-area: input;
  margin-right: var(--global-space-fluid-3)
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
