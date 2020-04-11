<template>
  <ContentBox class="newsletter">
    <form class="newsletter__form" method="post" :action="this.$static.metadata.mailchimpUrl">
      <h2 class="newsletter__title">Newsletter</h2>
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
import EffectButton from '~/components/EffectButton.vue';

export default {
  components: {
    ContentBox,
    EffectButton,
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
  grid-gap: .7rem;
  grid-template-columns: 1fr auto auto 1fr;
  grid-template-areas:
    "title title title title"
    "content content content content"
    ". input button .";
}

.newsletter__title {
  grid-area: title;
  margin: 0;
  text-align: center;
}

.newsletter__content {
  grid-area: content;
  margin: 0;
  text-align: center;
}

.newsletter__input {
  grid-area: input;
  min-width: 13rem
}

.newsletter__button {
  grid-area: button;
}
</style>
