<template>
  <dialog class="dialog" ref="dialog" @close="close" :class="{ 'dialog--fullscreen': fullscreen }">
    <div class="dialog__container">
      <Heading level="2" class="dialog__title">{{title}}</Heading>
      <form class="dialog__form" method="dialog">
        <u-button aria-label="Close search" class="dialog__close">
          <CloseIcon :size="24"/>
        </u-button>
      </form>
      <div class="dialog__content">
        <slot/>
      </div>
    </div>
  </dialog>
</template>

<script>
import button from '~/components/shared/u-button.vue';
import CloseIcon from '~/components/icons/CloseIcon.vue';
import Heading from '~/components/shared/Heading.vue';

export default {
  components: {
    'u-button': button,
    CloseIcon,
    Heading,
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
  border: var(--global-border-width-2) solid var(--border-color);
  border-radius: var(--global-border-radius);
  color: var(--title-color);
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
  padding: var(--global-space-4);
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
  padding-top: var(--global-space-4);
}
</style>
