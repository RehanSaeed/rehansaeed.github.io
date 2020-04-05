<template>
  <dialog ref="dialog" @close="close">
    <form method="dialog">
      <EffectButton aria-label="Close search" class="dialog__close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close">
          <title>Close search</title>
          <line x1="4" y1="4" x2="20" y2="20"></line>
          <line x1="4" y1="20" x2="20" y2="4"></line>
        </svg>
      </EffectButton>
    </form>
    <slot/>
  </dialog>
</template>

<script>
import EffectButton from '~/components/EffectButton.vue';

export default {
  components: {
    EffectButton,
  },
  props: {
    isOpen: {
      default: false,
      type: Boolean,
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
      this.$emit('close');
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
  // width: fit-content;
  // height: fit-content;
  height: calc(100vh - var(--space));
  width: calc(100vw - var(--space));
  background: var(--bg-color);
  border: solid 2px var(--border-color);
  border-radius: var(--radius);
  color: var(--title-color);
  display: block;
  margin: auto;
  padding: var(--space);
  overflow-y: auto;
  scrollbar-color: var(--scroll-thumb-color) var(--scroll-track-color);

  // Workaround to force the polyfill to always show the dialog in the center of the screen.
  position: fixed;
  top: 50%;
  transform: translate(0, -50%);
}

dialog:not([open]) {
  display: none;
}

dialog + .backdrop {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  background: var(--border-color);
  backdrop-filter: blur(3px);
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

.dialog__close {
  position: absolute;
  top: 0;
  right: 0;
  margin: 1rem;
}
</style>
