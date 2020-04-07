<template>
  <EffectButton v-if="isSupported" @click.native="onClick" button>
    <svg aria-hidden="true" focusable="false" height="14" width="14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <title>Share</title>
      <path fill="currentColor" d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"></path>
    </svg>
    Share
  </EffectButton>
</template>

<script>
import EffectButton from '~/components/EffectButton.vue';

export default {
  components: {
    EffectButton,
  },
  data() {
    return {
      isSupported: process.isClient && navigator.share
    }
  },
  props: {
    title: {
      type: String
    },
    url: {
      type: String
    },
  },
  methods: {
    onClick: function() {

      let url = this.url;
      if (!url) {
        const canonicalElement = document.querySelector('link[rel=canonical]');
        if (canonicalElement !== null) {
          url = canonicalElement.href;
        } else {
          url = document.location.href;
        }
      }

      navigator.share({
        title: this.title || document.title,
        url: url
      });
    }
  }
}
</script>
