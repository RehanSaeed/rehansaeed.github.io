<template>
  <dialog
    ref="dialog"
    class="dialog"
    :class="{ 'dialog--fullscreen': fullscreen }"
    aria-labelledby="title"
    @close="close">
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
  watch: {
    isOpen() {
      if (this.isOpen) {
        this.$refs.dialog.showModal();
      } else {
        this.$refs.dialog.close();
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
  },
};
</script>

<style lang="scss">
.dialog {
  --title-bar-height: 0.5rem;

  background: var(--global-content-background-color);
  border: var(--global-border-width-2) solid var(--global-border-color);
  border: none;
  border-radius: var(--global-border-radius);
  color: var(--global-title-color);
  margin: auto;
  overflow: hidden;

  &:before {
    content: "";
    background: linear-gradient(
      to right,
      var(--global-accent-color) 0%,
      var(--global-alternate-accent-color) 100%
    );
    display: block;

    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0;

    inline-size: 100%;
    block-size: var(--title-bar-height);
  }

  @media (prefers-reduced-motion: no-preference) {
    will-change: transform;

    transition: opacity var(--global-duration-1) var(--ease-out-cubic),
      transform var(--global-duration-1) var(--ease-out-cubic);
  }
}

.dialog:not([open]) {
  display: block;
  opacity: 0;
  visibility: hidden;
  transform: translateY(30%);
}

.dialog--fullscreen {
  border: none;
  border-radius: var(--global-border-radius);
  inline-size: 90vw;
  block-size: 90vh;
}

.dialog::backdrop {
  background: hsla(0, 0%, 0%, 0.2);
  backdrop-filter: blur(3px);
}

.dialog__container {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title close"
    "content content";
  padding: var(--global-space-fluid-5);
  margin-block-start: var(--title-bar-height);

  block-size: calc(100% - var(--title-bar-height));
  overflow-y: auto; // Remove when browser support is good enough.
  overflow-block: auto;
  overscroll-behavior: contain;
}

.dialog__title {
  grid-area: title;
  margin: 0;
}

.dialog__close {
  grid-area: close;

  font-size: var(--global-font-size-5);
}

.dialog__content {
  grid-area: content;
  padding-block-start: var(--global-space-fluid-5);
}
</style>
