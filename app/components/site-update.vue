<template>
  <section
    v-if="available && !dismissed"
    class="site-update"
    aria-label="Site update">
    <h2 class="site-update__title">Update available</h2>
    <u-button
      class="site-update__close"
      aria-label="Dismiss site update"
      :disabled="updating"
      @click="dismissed = true">
      <u-icon-close :size="20" />
    </u-button>
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
      <u-button bordered :disabled="updating" @click="dismissed = true">
        Later
      </u-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { registerSW } from "virtual:pwa-register";
import UButton from "~/components/shared/button.vue";
import UIconClose from "~/components/shared/icons/icon-close.vue";

const available = ref(false);
const dismissed = ref(false);
const updating = ref(false);
const error = ref("");
let registration: ServiceWorkerRegistration | undefined;
let latestVersion: string | undefined;
let workerChanged = false;
let reloading = false;
let activationTimer: ReturnType<typeof setTimeout> | undefined;

function reload() {
  if (reloading) return;
  reloading = true;
  clearTimeout(activationTimer);
  window.location.reload();
}

function reportError(cause: unknown) {
  console.error("[site-update] Could not apply the site update.", cause);
  error.value = "The update is not ready. Please try again when online.";
  updating.value = false;
  clearTimeout(activationTimer);
}

const { onAppOutdated, onCurrentChunksOutdated } = useSkewProtection();
onCurrentChunksOutdated(() => {
  available.value = true;
});
onAppOutdated((manifest) => {
  if (latestVersion && latestVersion !== manifest?.id) dismissed.value = false;
  latestVersion = manifest?.id;
  available.value = true;
  if (navigator.onLine) void registration?.update().catch(reportError);
});
const removeChunkError = useNuxtApp().hook(
  "app:chunkError",
  ({ error: cause }) => {
    console.error("[site-update] A page asset could not be loaded.", cause);
    error.value = "This page needs an update. Choose Update now to continue.";
    available.value = true;
    dismissed.value = false;
  },
);

function waitForInstall(worker: ServiceWorker) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Service worker installation timed out."));
    }, 30000);
    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", changed);
    };
    const changed = () => {
      if (worker.state === "installed" || worker.state === "activated") {
        cleanup();
        resolve();
      } else if (worker.state === "redundant") {
        cleanup();
        reject(new Error("Service worker installation failed."));
      }
    };
    worker.addEventListener("statechange", changed);
    changed();
  });
}

async function update() {
  if (updating.value) return;
  updating.value = true;
  error.value = "";
  try {
    if (workerChanged || !("serviceWorker" in navigator)) return reload();
    if (!registration) {
      throw new Error("The service worker has not registered yet.");
    }
    await registration.update();
    if (registration.installing) await waitForInstall(registration.installing);
    if (registration.waiting) {
      activationTimer = setTimeout(
        () => reportError(new Error("Service worker activation timed out.")),
        30000,
      );
      registration.waiting.postMessage({
        type: "SKIP_WAITING",
        readerApproved: true,
      });
    } else if (workerChanged || !navigator.serviceWorker.controller) {
      reload();
    } else {
      throw new Error("The deployment is visible but its worker is not ready.");
    }
  } catch (cause) {
    reportError(cause);
  }
}

onMounted(() => {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      available.value = true;
    },
    onNeedReload() {
      workerChanged = true;
      available.value = true;
      // Another tab can activate the worker; only a reader-approved update reloads this tab.
      if (updating.value) reload();
    },
    onRegisteredSW(_url, value) {
      registration = value;
    },
    onRegisterError(cause) {
      console.error("[site-update] Service worker registration failed.", cause);
    },
  });
});

onUnmounted(() => {
  clearTimeout(activationTimer);
  removeChunkError();
});
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
