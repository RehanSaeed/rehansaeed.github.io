<template>
  <ContentBox class="newsletter" tag="section">
    <form class="newsletter__form" method="post" :action="this.$static.metadata.mailchimpUrl">
      <Heading level="2" class="newsletter__title">Newsletter</Heading>
      <p class="newsletter__content">Stay up to date! Get all the latest &amp; greatest posts delivered straight to your inbox!</p>
      <input
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
      <EffectButton button submit class="newsletter__button">
        Subscribe
      </EffectButton>
    </form>
  </ContentBox>
</template>

mailchimpUrl

<script>
import ContentBox from '~/components/ContentBox.vue';
import EffectButton from '~/components/shared/EffectButton.vue';
import Heading from '~/components/shared/Heading.vue';

export default {
  components: {
    ContentBox,
    EffectButton,
    Heading,
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
  text-align: center;
}

.newsletter__input {
  grid-area: input;
  margin-right: var(--global-space-3)
}

.newsletter__button {
  grid-area: button;
}
</style>
