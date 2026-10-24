import {
  pwaInstallPromoShown,
  pwaInstallPromoClicked,
  pwaInstallAppInstalled,
  appLaunchDomContentLoaded,
  appLaunchDisplayModeChanged,
} from "~/framework/analytics";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default defineNuxtPlugin({
  name: "pwa-install",
  enforce: "pre",
  setup() {
    const deferredPrompt = shallowRef<InstallPromptEvent>();
    const installed = ref(false);
    let installSource: string | undefined;
    let prompting = false;

    async function install() {
      const prompt = deferredPrompt.value;
      if (!prompt || prompting || installed.value) return;
      // A beforeinstallprompt event can only be used once, even after dismissal.
      deferredPrompt.value = undefined;
      prompting = true;
      installSource = "install-button";
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        pwaInstallPromoClicked(installSource, outcome === "accepted");
        if (outcome === "dismissed") installSource = undefined;
      } catch (error) {
        installSource = undefined;
        console.error("PWA installation failed:", error);
      } finally {
        prompting = false;
      }
    }

    if (import.meta.client) {
      const displayMode = window.matchMedia("(display-mode: standalone)");
      const minimalUi = window.matchMedia("(display-mode: minimal-ui)");
      const fullscreen = window.matchMedia("(display-mode: fullscreen)");
      const isInstalled = () =>
        displayMode.matches ||
        minimalUi.matches ||
        fullscreen.matches ||
        ("standalone" in navigator && navigator.standalone === true);
      installed.value = isInstalled();

      // Register before component mounting so navigation never owns the one-shot event.
      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        if (installed.value) return;
        deferredPrompt.value = event as InstallPromptEvent;
        pwaInstallPromoShown();
      });
      window.addEventListener("appinstalled", () => {
        installed.value = true;
        deferredPrompt.value = undefined;
        if (document.visibilityState === "visible") {
          pwaInstallAppInstalled(installSource);
        }
      });
      const onDisplayModeChanged = () => {
        installed.value = isInstalled();
        if (installed.value) deferredPrompt.value = undefined;
        appLaunchDisplayModeChanged(
          installed.value ? "standalone" : "browser tab",
        );
      };
      for (const query of [displayMode, minimalUi, fullscreen]) {
        query.addEventListener("change", onDisplayModeChanged);
      }
      const onDomContentLoaded = () => {
        const mode =
          "standalone" in navigator && navigator.standalone === true
            ? "standalone-ios"
            : installed.value
              ? "standalone"
              : "browser tab";
        appLaunchDomContentLoaded(mode);
      };
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", onDomContentLoaded, {
          once: true,
        });
      } else {
        onDomContentLoaded();
      }
    }

    return {
      provide: {
        pwaInstall: {
          available: computed(() => !!deferredPrompt.value && !installed.value),
          install,
        },
      },
    };
  },
});
