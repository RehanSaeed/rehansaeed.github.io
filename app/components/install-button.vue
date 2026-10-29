<template>
  <u-tooltip
    v-if="hydrated && $pwa?.showInstallPrompt && !$pwa.isPWAInstalled"
    v-slot="{ trigger }"
    text="Install the app"
    placement="left">
    <u-button
      v-bind="{ ...$attrs, ...trigger }"
      class="install-button"
      aria-label="Install the app"
      @click.prevent="install">
      <u-icon name="lucide:house-heart" />
    </u-button>
  </u-tooltip>
</template>

<script setup lang="ts">
import {
  pwaInstallPromoShown,
  pwaInstallPromoClicked,
} from "~/framework/analytics";
defineOptions({ inheritAttrs: false });
const { $pwa } = useNuxtApp();
const { play } = useSoundEffect();
const hydrated = ref(false);
watch(
  () => $pwa?.showInstallPrompt,
  (visible) => {
    if (visible && !$pwa?.isPWAInstalled) pwaInstallPromoShown();
  },
  { immediate: true },
);
async function install() {
  try {
    const choice: unknown = await $pwa?.install();
    if (choice && typeof choice === "object" && "outcome" in choice) {
      pwaInstallPromoClicked("install-button", choice.outcome === "accepted");
      if (choice.outcome === "accepted") play("success");
    }
  } catch (error) {
    console.error("PWA installation failed:", error);
  }
}
onMounted(() => {
  hydrated.value = true;
});
</script>

<style lang="scss">
.install-button {
  font-size: var(--global-font-size-4);
  position: relative;
}

.install-button::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;

  background: radial-gradient(
    transparent,
    var(--global-alternate-accent-color),
    var(--global-accent-color)
  );
  border: var(--global-border-width-1) solid var(--global-accent-color);
  border-radius: 50%;

  animation-name: pulse;
  animation-iteration-count: 5;
  animation-timing-function: ease;
  animation-duration: 2s;
  animation-fill-mode: forwards;

  @keyframes pulse {
    0% {
      opacity: 0;
      scale: 1;
    }
    50% {
      opacity: 1;
      scale: 2;
    }
    100% {
      opacity: 0;
      scale: 1;
    }
  }
}
</style>
