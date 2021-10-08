<template>
  <u-button
    v-show="isVisible"
    class="install-button"
    aria-label="Install the app"
    @click.native.prevent="onInstall">
    <u-icon-add-home />
  </u-button>
</template>

<script>
import button from "~/components/shared/button.vue";
import iconAddHome from "~/components/shared/icons/icon-add-home.vue";
import {
  pwaInstallPromoShown,
  pwaInstallPromoClicked,
  pwaInstallAppInstalled,
  appLaunchDomContentLoaded,
  appLaunchDisplayModeChanged,
} from "~/framework/analytics";

export default {
  name: "u-install-button",
  components: {
    "u-button": button,
    "u-icon-add-home": iconAddHome,
  },
  data() {
    return {
      deferredPrompt: undefined,
      displayModeMediaQuery: undefined,
      installSource: undefined,
      isVisible: false,
    };
  },
  methods: {
    async onInstall() {
      this.isVisible = false;
      this.installSource = "install-button";

      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      pwaInstallPromoClicked(
        this.installSource,
        choiceResult.outcome === "accepted"
      );

      if (choiceResult.outcome === "accepted") {
        this.deferredPrompt = undefined;
        console.log("PWA Installed");
      } else {
        this.installSource = undefined;
        console.log("PWA Install Declined");
      }
    },
    onAppInstalled(e) {
      this.isVisible = false;
      this.deferredPrompt = undefined;

      if (document.visibilityState !== "visible") {
        return;
      }

      console.log("PWA Installed");
      pwaInstallAppInstalled(this.installSource);
    },
    onBeforeInstallPrompt(e) {
      // Prevent the mini-infobar from appearing on mobile
      // e.preventDefault();
      this.deferredPrompt = e;
      this.isVisible = true;

      console.log("PWA Installable");
      pwaInstallPromoShown();
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
      appLaunchDomContentLoaded(displayMode);
    },
  },
  onDisplayModeChanged(e) {
    let displayMode = "browser tab";
    if (e.matches) {
      displayMode = "standalone";
    }
    console.log("PWA display mode changed:", displayMode);
    appLaunchDisplayModeChanged(displayMode);
  },
  mounted() {
    if (window) {
      window.addEventListener("appinstalled", this.onAppInstalled);
      window.addEventListener(
        "beforeinstallprompt",
        this.onBeforeInstallPrompt
      );
      window.addEventListener("DOMContentLoaded", this.onDomContentLoaded);

      this.displayModeMediaQuery = window.matchMedia(
        "(display-mode: standalone)"
      );
      this.displayModeMediaQuery.addEventListener(
        "change",
        this.onDisplayModeChanged
      );
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

      this.displayModeMediaQuery.removeEventListener(
        "change",
        this.onDisplayModeChanged
      );
    }
  },
};
</script>

<style lang="scss">
.install-button {
  font-size: var(--global-font-size-4);
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
