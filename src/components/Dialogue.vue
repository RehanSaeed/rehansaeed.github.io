<template>
  <dialog class="dialog" ref="dialog" @close="close" :class="{ 'dialog--fullscreen': fullscreen }">
    <div class="dialog__container">
      <h2 class="dialog__title">{{title}}</h2>
      <form class="dialog__form" method="dialog">
        <EffectButton aria-label="Close search" class="dialog__close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close">
            <title>Close search</title>
            <line x1="4" y1="4" x2="20" y2="20"></line>
            <line x1="4" y1="20" x2="20" y2="4"></line>
          </svg>
        </EffectButton>
      </form>
      <div class="dialog__content">
        <slot/>
      </div>
    </div>
  </dialog>
</template>

<script>
import EffectButton from '~/components/EffectButton.vue';

export default {
  components: {
    EffectButton,
  },
  props: {
    fullscreen: {
      default: false,
      type: Boolean,
    },
    isOpen: {
      default: false,
      type: Boolean,
    },
    title: {
      type: String,
    }
  },
  computed: {
    dialog: function() {
      return this.$refs.dialog;
    }
  },
  watch: {
    isOpen: function () {
      if (this.isOpen) {
        this.dialog.showModal();
      } else {
        this.dialog.close();
      }
    },
  },
  methods: {
    close() {
      if (this.isOpen) {
        this.$emit('close');
      }
    }
  },
  mounted() {
    if (!process.isClient) {
      return;
    }

    const dialogPolyfill = require('dialog-polyfill').default;
    dialogPolyfill.registerDialog(this.dialog);
  },
}
</script>

<style lang="scss">
dialog {
  position: absolute;
  left: 0;
  right: 0;
  height: fit-content;
  width: fit-content;
  display: block;
  margin: auto;
  overflow-y: auto;

  // Workaround to force the polyfill to always show the dialog in the center of the screen.
  position: fixed;
  top: 50%;
  transform: translate(0, -50%);
}

dialog:not([open]) {
  display: none;
}

dialog::backdrop,
dialog + .backdrop {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: var(--border-color);
  backdrop-filter: blur(2px);
}

._dialog_overlay {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
}

dialog.fixed {
  position: fixed;
  top: 50%;
  transform: translate(0, -50%);
}

.dialog {
  background: var(--bg-content-color);
  border: solid 2px var(--border-color);
  border-radius: var(--radius);
  color: var(--title-color);
  scrollbar-color: var(--scroll-thumb-color) var(--scroll-track-color);
}

.dialog--fullscreen {
  border: none;
  border-radius: 0;
  // 100vw or 100vh includes the width of the scrollbar. This removes it.
  height: calc(100vh - (100vh - 100%));
  width: calc(100vw - (100vw - 100%));
}

.dialog__container {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title close"
    "content content";
  padding: calc(var(--space) / 2);
}

.dialog__title {
  grid-area: title;
  margin: 0;
}

.dialog__close {
  grid-area: close;
}

.dialog__content {
  grid-area: content;
  padding-top: calc(var(--space) / 2);
}
</style>
