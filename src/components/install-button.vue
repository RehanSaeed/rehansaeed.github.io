<template>
  <u-button
    v-show="isVisible"
    class="install-button"
    aria-label="Install the app"
    @click.native.prevent="onInstall"
  >
    <u-icon-add-home :size="24" />
  </u-button>
</template>

<script>
import button from "~/components/shared/button.vue";
import iconAddHome from "~/components/shared/icons/icon-add-home.vue";

export default {
  name: "u-install-button",
  components: {
    "u-button": button,
    "u-icon-add-home": iconAddHome,
  },
  data() {
    return {
      deferredPrompt: undefined,
      isVisible: false,
    };
  },
  methods: {
    async onInstall() {
      this.isVisible = false;
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("PWA Installed");
      } else {
        console.log("PWA Install Declined");
      }
    },
    onAppInstalled(e) {
      this.isVisible = false;
      console.log("PWA Installed");
    },
    onBeforeInstallPrompt(e) {
      // Prevent the mini-infobar from appearing on mobile
      // e.preventDefault();
      this.deferredPrompt = e;
      this.isVisible = true;
      console.log("PWA Installable");
    },
    onDomContentLoaded() {
      let displayMode = "browser tab";
      if (navigator.standalone) {
        displayMode = "standalone-ios";
      }
      if (window.matchMedia("(display-mode: standalone)").matches) {
        displayMode = "standalone";
      }
      console.log("PWA launched with display mode:", displayMode);

      window.matchMedia("(display-mode: standalone)").addListener((evt) => {
        let displayMode = "browser tab";
        if (evt.matches) {
          displayMode = "standalone";
        }
        console.log("PWA display mode changed:", displayMode);
      });
    },
  },
  mounted() {
    if (window) {
      window.addEventListener("appinstalled", this.onAppInstalled);
      window.addEventListener(
        "beforeinstallprompt",
        this.onBeforeInstallPrompt
      );
      window.addEventListener("DOMContentLoaded", this.onDomContentLoaded);
    }
  },
  unmounted() {
    if (window) {
      window.removeEventListener("appinstalled", this.onAppInstalled);
      window.removeEventListener(
        "beforeinstallprompt",
        this.onBeforeInstallPrompt
      );
      window.removeEventListener("DOMContentLoaded", this.onDomContentLoaded);
    }
  },
};
</script>

<style lang="scss">
.install-button {
  line-height: 0;
  position: relative;
}

.install-button::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
      transform: scale(1);
      opacity: 0;
    }
    50% {
      transform: scale(2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
}
</style>
