<template>
  <portal to="body">
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
  </portal>
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
      if (this.dialog) {
        if (this.isOpen) {
          this.dialog.showModal();
        } else {
          this.dialog.close();
        }
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

    this.$nextTick().then(
      this.$nextTick(() => {
        const dialogPolyfill = require("dialog-polyfill").default;
        dialogPolyfill.registerDialog(this.dialog);
      })
    );
  },
};
</script>

<style lang="scss">
@import "~dialog-polyfill/dist/dialog-polyfill.css";

dialog {
  overflow: hidden;

  // Fix the position of the dialog in the middle of the screen.
  position: fixed;
  top: 0;
  margin-top: 35vh;

  @media (prefers-reduced-motion: no-preference) {
    will-change: transform;

    transition: opacity var(--global-duration-1) var(--ease-out-cubic),
      transform var(--global-duration-1) var(--ease-out-cubic);
  }
}

.dialog--fullscreen {
  // Fix the position of the dialog in the middle of the screen.
  margin-top: 5vh;
}

dialog:not([open]) {
  display: block;
  opacity: 0;
  visibility: hidden;
  transform: translateY(30%);
}

dialog::backdrop,
dialog + .backdrop {
  background: hsla(0, 0%, 0%, 0.2);
  backdrop-filter: blur(3px);
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
  border-radius: var(--global-border-radius);
  height: 90vh;
  width: 90vw;
}

.dialog__container {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title close"
    "content content";
  padding: var(--global-space-fluid-5);

  height: 100%;
  overflow-y: auto;
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
