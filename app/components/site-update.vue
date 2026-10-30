<template>
  <section
    v-if="$pwa?.needRefresh"
    class="site-update"
    aria-label="Site update">
    <h2 class="site-update__title">Update available</h2>
    <u-tooltip v-slot="{ trigger }" text="Dismiss update notification">
      <u-button
        v-bind="trigger"
        class="site-update__close"
        aria-label="Dismiss site update"
        :disabled="updating"
        @click="dismiss">
        <u-icon name="feather:x" />
      </u-button>
    </u-tooltip>
    <p class="site-update__message" role="status">
      {{ error || "A new version is available. Update when you are ready." }}
    </p>
    <div class="site-update__actions">
      <u-button
        bordered
        class="site-update__update"
        :disabled="updating"
        @click="update">
        {{ updating ? "Updating..." : "Update now" }}
      </u-button>
      <u-button bordered :disabled="updating" @click="dismiss">
        Later
      </u-button>
    </div>
  </section>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp();
const { play } = useSoundEffect();
const updating = ref(false);
const error = ref("");

function dismiss() {
  $pwa?.cancelPrompt();
  play("dialog-close");
}

async function update() {
  if (!$pwa || updating.value) return;
  updating.value = true;
  error.value = "";
  play("update-start");
  try {
    await $pwa.updateServiceWorker();
  } catch (cause) {
    console.error("[site-update] Could not apply the site update.", cause);
    error.value = "The update is not ready. Please try again when online.";
  } finally {
    updating.value = false;
  }
}
</script>

<style lang="scss">
.site-update {
  --site-update-inline-offset: max(
    calc(
      var(--global-space-fluid-5) + var(--global-space-fluid-4) +
        var(--global-space-fixed-6)
    ),
    env(safe-area-inset-right)
  );
  --site-update-block-offset: max(
    var(--global-space-fixed-4),
    env(safe-area-inset-top)
  );

  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "title close"
    "message message"
    "actions actions";
  gap: var(--global-space-fixed-3);
  background: var(--global-content-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  box-shadow: var(--global-shadow-3);
  color: var(--global-body-color);
  padding: var(--global-space-fixed-5);
  position: fixed;
  inset-block-start: var(--site-update-block-offset);
  inset-inline-end: var(--site-update-inline-offset);
  inline-size: min(
    20rem,
    calc(
      100% - var(--site-update-inline-offset) - max(
          var(--global-space-fixed-4),
          env(safe-area-inset-left)
        )
    )
  );
  max-block-size: calc(
    100dvb - var(--site-update-block-offset) - max(
        var(--global-space-fixed-4),
        env(safe-area-inset-bottom)
      )
  );
  overflow: auto;
  overscroll-behavior: contain;
  z-index: 20;

  &::before {
    content: "";
    background: linear-gradient(
      to right,
      var(--global-accent-color),
      var(--global-alternate-accent-color)
    );
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    block-size: 0.5rem;
  }

  .button:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-space-fixed-2);
  }
}

.site-update__title {
  grid-area: title;
  align-self: center;
  margin: 0;
  font-size: var(--global-font-size-4);
}

.site-update__close {
  grid-area: close;
  align-self: start;
  display: grid;
  place-items: center;
  inline-size: 2rem;
  block-size: 2rem;
  color: var(--global-accent-color);
}

.site-update__message {
  grid-area: message;
  margin: 0;
  min-inline-size: 0;
}

.site-update__actions {
  grid-area: actions;
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-3);
  margin-block-start: var(--global-space-fixed-2);
}

.site-update__update:not(:disabled) {
  border-color: var(--global-accent-color);
  color: var(--global-accent-color);
}
</style>
