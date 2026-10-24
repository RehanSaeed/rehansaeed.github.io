<template>
  <Transition name="dialog" @enter="open" @after-leave="hide">
    <dialog
      v-show="isOpen"
      class="dialog"
      :class="{ 'dialog--fullscreen': fullscreen }"
      :aria-labelledby="titleId"
      @cancel.prevent="onDismiss"
      @close="onNativeClose">
      <div class="dialog__container">
        <u-heading :id="titleId" level="2" class="dialog__title">{{
          title
        }}</u-heading>
        <form class="dialog__form" method="dialog" @submit.prevent="onDismiss">
          <u-tooltip
            v-slot="{ trigger }"
            :text="`Close ${title}`"
            placement="left">
            <u-button
              v-bind="trigger"
              :aria-label="`Close ${title}`"
              class="dialog__close"
              submit>
              <u-icon name="feather:x" />
            </u-button>
          </u-tooltip>
        </form>
        <div class="dialog__content">
          <slot />
        </div>
      </div>
    </dialog>
  </Transition>
</template>

<script>
import { useId } from "vue";

export default {
  name: "u-dialogue",
  emits: ["close"],
  setup() {
    return { titleId: useId(), playSoundEffect: useSoundEffect().play };
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
      required: true,
      type: String,
    },
  },
  methods: {
    open(dialog) {
      dialog.showModal();
    },
    hide(dialog) {
      dialog.close();
    },
    onNativeClose(event) {
      // A queued close event can arrive after the dialog has reopened.
      if (!event.currentTarget.open) {
        this.close();
      }
    },
    onDismiss() {
      if (this.isOpen) this.playSoundEffect("dialog-close");
      this.close();
    },
    close() {
      if (this.isOpen) {
        this.$emit("close");
      }
    },
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
}

.dialog--fullscreen {
  border: none;
  border-radius: var(--global-border-radius);
  inline-size: 90vw;
  block-size: 90vh;
}

.dialog::backdrop {
  background: hsl(0 0% 0% / 0.2);
  backdrop-filter: blur(3px);
}

@media (prefers-reduced-motion: no-preference) {
  .dialog-enter-active {
    transition:
      opacity var(--global-duration-2) var(--ease-out-cubic),
      translate var(--global-duration-2) var(--ease-out-cubic);

    &::backdrop {
      transition: opacity var(--global-duration-2) ease-out;
    }
  }

  .dialog-leave-active {
    transition:
      opacity var(--global-duration-1) var(--ease-in-cubic),
      translate var(--global-duration-1) var(--ease-in-cubic);

    &::backdrop {
      transition: opacity var(--global-duration-1) ease-out;
    }
  }

  .dialog-enter-from,
  .dialog-leave-to {
    opacity: 0;
    translate: 0 clamp(3rem, 8vh, 6rem);

    &::backdrop {
      opacity: 0;
    }
  }
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
