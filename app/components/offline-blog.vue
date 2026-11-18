<template>
  <section class="offline-blog" aria-labelledby="offline-blog-title">
    <h2 id="offline-blog-title" class="offline-blog__title">Read offline</h2>
    <p class="offline-blog__status" role="status" aria-live="polite">
      {{ message }}
    </p>
    <template v-if="status && !status.ready">
      <label for="offline-blog-progress">
        {{ status.saved }} of {{ status.total }} assets saved
        <span v-if="status.verified">; {{ status.verified }} verified</span>
      </label>
      <progress
        id="offline-blog-progress"
        class="offline-blog__progress"
        :value="status.saved"
        :max="status.total" />
    </template>
    <div class="offline-blog__actions">
      <u-button
        v-if="installError"
        variant="secondary"
        @click="retryInstallation">
        Retry offline reader installation
      </u-button>
      <u-button
        v-if="!status?.ready"
        variant="secondary"
        :disabled="!activated || (!status && working)"
        @click="run('start')">
        {{ action }}
      </u-button>
      <u-button
        v-if="status && !status.paused && !status.ready"
        variant="secondary"
        @click="run('pause')">
        Pause download
      </u-button>
      <u-button v-if="error" variant="secondary" @click="refresh">
        Check offline reader again
      </u-button>
      <u-button v-if="status?.ready" variant="secondary" @click="refresh">
        Check saved blog
      </u-button>
    </div>
    <p class="offline-blog__help">
      Installing the app is separate from saving the blog. Keep a blog tab open
      and visible while downloading. Interrupted downloads resume on your next
      online visit; pausing lets the current small batch finish, then waits for
      you. Browser storage may be evicted. Check the saved blog before
      travelling.
    </p>
  </section>
</template>

<script setup lang="ts">
const { status, error, activated, working, run, refresh } = useOfflineBlog();
const installError = useState("offline-install-error", () => "");
function retryInstallation() {
  window.location.reload();
}
const message = computed(() => {
  if (installError.value) {
    return installError.value;
  }
  if (error.value || status.value?.error) {
    return error.value || status.value?.error;
  }
  if (!activated.value) {
    return "Waiting for the offline reader to activate.";
  }
  if (!status.value) {
    return "Checking saved content. Worker activation does not mean the blog is saved.";
  }
  if (status.value.ready) {
    return "The whole blog is verified and ready offline.";
  }
  const previous = status.value.previousReady
    ? "The previous complete version remains available offline. "
    : "";
  if (status.value.paused) {
    return `${previous}The current blog is not fully saved offline.`;
  }
  return `${previous}${status.value.saved === status.value.total ? "Verifying saved assets." : "Saving the blog."}`;
});
const action = computed(() => {
  if (error.value || status.value?.error) {
    return "Retry offline download";
  }
  if (status.value?.saved) {
    return "Resume offline download";
  }
  return "Save the whole blog offline";
});
</script>

<style lang="scss">
.offline-blog {
  display: grid;
  gap: var(--global-space-fixed-3);
  background: var(--global-content-background-color);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
  color: var(--global-body-color);
  margin-inline: auto;
  padding: var(--global-space-fixed-4);
  inline-size: min(36rem, 100%);
  min-inline-size: 0;

  .button:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-space-fixed-2);
  }
}

.offline-blog__title,
.offline-blog__status,
.offline-blog__help {
  margin: 0;
  overflow-wrap: anywhere;
}

.offline-blog__title {
  font-size: var(--global-font-size-4);
}

.offline-blog__progress {
  accent-color: var(--global-accent-color);
  inline-size: 100%;
}

.offline-blog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--global-space-fixed-3);
}

.offline-blog__help {
  font-size: var(--global-font-size-1);
}

@media (forced-colors: active) {
  .offline-blog {
    border-color: CanvasText;
  }

  .offline-blog .button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
