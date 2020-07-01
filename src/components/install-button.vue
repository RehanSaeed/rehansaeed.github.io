<template>
  <u-button v-show="true" class="install-button" aria-label="Install the app" @click.native.prevent="install">
    <u-icon-add-home :size="24"/>
  </u-button>
</template>

<script>
import button from '~/components/shared/button.vue';
import dialogue from '~/components/shared/dialogue.vue';
import iconAddHome from '~/components/shared/icons/icon-add-home.vue';
import search from '~/components/search.vue';

export default {
  name: 'u-install-button',
  components: {
    'u-button': button,
    'u-icon-add-home': iconAddHome,
  },
  data() {
    return {
      deferredPrompt: undefined,
      isVisible: false,
    }
  },
  methods: {
    async install() {
      this.isVisible = false;
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA Installed');
      } else {
        console.log('PWA Install Declined');
      }
    },
  },
  mounted() {
    window.addEventListener('appinstalled', (e) => {
      this.isVisible = false;
      console.log('PWA Installed');
    });
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      // e.preventDefault();
      this.deferredPrompt = e;
      this.isVisible = true;
      console.log('PWA Installable');
    });
    window.addEventListener('DOMContentLoaded', () => {
      let displayMode = 'browser tab';
      if (navigator.standalone) {
        displayMode = 'standalone-ios';
      }
      if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = 'standalone';
      }
      console.log('PWA launched with display mode:', displayMode);

      window.matchMedia('(display-mode: standalone)').addListener((evt) => {
        let displayMode = 'browser tab';
        if (evt.matches) {
          displayMode = 'standalone';
        }
        console.log('PWA display mode changed:', displayMode);
      });
    });
  }
}
</script>

<style lang="scss">
.install-button {
  line-height: 0;
  position: relative;
}

.install-button::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: -1;

  background: radial-gradient(transparent, var(--global-alternate-accent-color), var(--global-accent-color));
  border: var(--global-border-width-1) solid var(--global-accent-color);
  border-radius: 50%;

  animation-name: pulse;
  animation-iteration-count: 5;
  animation-timing-function: ease;
  animation-duration: 2s;
  animation-fill-mode: forwards;

  @keyframes pulse {
    0% { transform: scale(1); opacity: 0; }
    50% { transform: scale(2); opacity: 1; }
    100% { transform: scale(1); opacity: 0; }
  }
}
</style>
