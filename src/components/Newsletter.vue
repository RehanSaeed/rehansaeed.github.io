<template>
  <ContentBox class="newsletter">
    <form class="newsletter__form" @submit.prevent="onSubmit">
      <h2 class="newsletter__title">Newsletter</h2>
      <p class="newsletter__content">Stay up to date! Get all the latest &amp; greatest posts delivered straight to your inbox!</p>
      <input
        class="newsletter__input"
        name="email"
        placeholder="youremail@example.com"
        required
        type="email"
        autocapitalize="off"
        autocorrect="off"/>
      <EffectButton button submit class="newsletter__button">
        Subscribe
      </EffectButton>
    </form>
  </ContentBox>
</template>

<script>
import ContentBox from '~/components/ContentBox.vue';
import EffectButton from '~/components/EffectButton.vue';

export default {
  components: {
    ContentBox,
    EffectButton,
  },
}
// import addToMailchimp from '../mailchimpSubscribe';
// import event from '../event';
// import _debug from 'debug';
// const debug = _debug('plugin-mailchimp');
/**
 * If developers make UI customiztion and offer users an option whether to enable.
 * It won't be able to import client dynamic modules if it's disabled.
 * Use commonJs because dynamic import cannot be caught https://github.com/webpack/webpack/issues/5360
 */
// let submitText, content, title, popupEnabled;
// try {
//   const options = require('@dynamic/mailchimpOptions');
//   submitText = options.submitText;
//   content = options.content;
//   title = options.title;
//   popupEnabled = options.popupEnabled;
// } catch (error) {
//   debug('Fail to get options', error.message);
// }
// export default {
//   data() {
//     return {
//       slotProps: {
//         mail: '',
//         title: title || 'Newsletter',
//         content: content || 'Subscribe to get my latest content. No spam.',
//         submitText: submitText || 'Subscribe',
//       },
//     };
//   },
//   methods: {
//     onSubmit() {
//       addToMailchimp(this.slotProps.mail)
//         .catch(err => {
//           this.slotProps.mail = '';
//           if (popupEnabled) event.$emit('submited', { result: 'error' });
//         })
//         .then(res => {
//           this.slotProps.mail = '';
//           if (popupEnabled) event.$emit('submited', res);
//         });
//     },
//   },
// };
</script>

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
