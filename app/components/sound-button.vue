<template>
  <div class="sound-control">
    <u-button
      class="sound-control__button"
      aria-label="Sound effects"
      :aria-pressed="enabled"
      :title="enabled ? 'Turn sound effects off' : 'Turn sound effects on'"
      @click="setEnabled(!enabled)">
      <u-icon
        class="sound-control__icon sound-control__on"
        name="feather:volume-2" />
      <u-icon
        class="sound-control__icon sound-control__off"
        name="feather:volume-x" />
    </u-button>
    <p v-if="error" class="sound-control__error" role="status">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const { enabled, error, setEnabled } = useSoundEffect();
</script>

<style lang="scss">
.sound-control {
  position: relative;
}

.sound-control__button {
  display: grid;
  font-size: var(--global-font-size-4);

  &.button,
  &.button.button--hydrating:disabled {
    color: var(--global-accent-color);
  }

  &.button.button--hydrating:disabled {
    transform: none;
  }

  .sound-control__icon {
    grid-area: 1 / 1;
  }

  .sound-control__off {
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
    visibility: hidden;
  }
}

.sound-control__button[aria-pressed="false"] {
  .sound-control__on {
    opacity: 0;
    transform: rotate(90deg) scale(0.4);
    visibility: hidden;
  }

  .sound-control__off {
    opacity: 1;
    transform: rotate(0deg) scale(1);
    visibility: visible;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sound-control__button .sound-control__icon {
    transition:
      opacity var(--global-duration-3) var(--ease-in-out-cubic),
      transform var(--global-duration-3) var(--ease-in-out-cubic),
      visibility var(--global-duration-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sound-control__button.button {
    transition: none;

    &:hover,
    &:focus {
      transform: none;
    }
  }
}

.sound-control__error {
  position: fixed;
  inset-inline-end: var(--global-space-fixed-3);
  inset-block-end: var(--global-space-fixed-3);
  z-index: 10;
  pointer-events: none;
  inline-size: min(16rem, 75vw);
  padding: var(--global-space-fixed-3);
  background: var(--global-content-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: var(--global-shadow-1);
  font-size: var(--global-font-size-1);
}
</style>
