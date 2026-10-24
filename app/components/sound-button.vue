<template>
  <div class="sound-control">
    <u-button
      class="sound-control__button"
      aria-label="Sound effects"
      :aria-pressed="enabled"
      :title="enabled ? 'Turn sound effects off' : 'Turn sound effects on'"
      @click="setEnabled(!enabled)">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <template v-if="enabled">
          <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
        </template>
        <path v-else d="m16 9 5 6m0-6-5 6" />
      </svg>
    </u-button>
    <p v-if="error" class="sound-control__error" role="status">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import UButton from "~/components/shared/button.vue";

const { enabled, error, setEnabled } = useSoundEffect();
</script>

<style lang="scss">
.sound-control {
  position: relative;
}

.sound-control__button {
  display: block;
  font-size: var(--global-font-size-4);

  svg {
    display: block;
    inline-size: 1em;
    block-size: 1em;
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
