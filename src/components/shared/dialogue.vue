<template>
  <dialog
    class="dialog"
    ref="dialog"
    @close="close"
    :class="{ 'dialog--fullscreen': fullscreen }"
  >
    <div class="dialog__container">
      <u-heading id="title" level="2" class="dialog__title">{{
        title
      }}</u-heading>
      <form class="dialog__form" method="dialog">
        <u-button aria-label="Close search" class="dialog__close" submit>
          <u-icon-close :size="24" />
        </u-button>
      </form>
      <div class="dialog__content">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<script>
import button from "~/components/shared/button.vue";
import heading from "~/components/shared/heading.vue";
import iconClose from "~/components/shared/icons/icon-close.vue";

export default {
  name: "u-dialogue",
  components: {
    "u-button": button,
    "u-heading": heading,
    "u-icon-close": iconClose,
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
    },
  },
  computed: {
    dialog() {
      return this.$refs.dialog;
    },
  },
  watch: {
    isOpen() {
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
        this.$emit("close");
      }
    },
  },
  mounted() {
    if (!process.isClient) {
      return;
    }

    const dialogPolyfill = require("dialog-polyfill").default;
    dialogPolyfill.registerDialog(this.dialog);
  },
};
</script>

<style lang="scss">
dialog {
  position: absolute;
  left: 0;
  right: 0;
  height: fit-content;
  width: fit-content;
  margin: auto;
  display: block;
  overflow-y: auto;

  // Workaround to force the polyfill to always show the dialog in the center of the screen.
  position: fixed;

  @media screen and (prefers-reduced-motion: no-preference) {
    will-change: transform;

    transition: opacity var(--global-duration-1) var(--ease-out-quart),
      transform var(--global-duration-1) var(--ease-out-cubic);
  }
}

dialog:not([open]) {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-30%);
}

dialog::backdrop,
dialog + .backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: hsla(0, 0%, 0%, 0.2);
  backdrop-filter: blur(3px);
}

._dialog_overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

dialog.fixed {
  position: fixed;
  top: 30%;
  transform: translate(0, -30%);
}

.dialog {
  background: var(--global-content-background-color);
  border: var(--global-border-width-2) solid var(--global-border-color);
  border: none;
  border-radius: var(--global-border-radius);
  color: var(--global-title-color);

  &:before {
    content: "";
    background: linear-gradient(
      to right,
      var(--global-accent-color) 0%,
      var(--global-alternate-accent-color) 100%
    );
    display: block;
    height: 0.5rem;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}

.dialog--fullscreen {
  border: none;
  border-radius: 0;
  height: 100vh;
  width: 100vw;
}

.dialog__container {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title close"
    "content content";
  padding: var(--global-space-fluid-5);
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
  padding-top: var(--global-space-fluid-5);
}
</style>
