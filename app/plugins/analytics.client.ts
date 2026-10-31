import {
  appLaunchDisplayModeChanged,
  appLaunchDomContentLoaded,
  pwaInstallAppInstalled,
} from "~/framework/analytics";

export default defineNuxtPlugin({
  name: "analytics",
  enforce: "pre",
  setup(nuxtApp) {
    const dataLayer = (window.dataLayer ??= []);
    window.gtag = (...args) => {
      dataLayer.push(args);
    };
    const displayMode = window.matchMedia(
      "(display-mode: standalone), (display-mode: minimal-ui), (display-mode: fullscreen)",
    );
    const launchMode = () =>
      "standalone" in navigator && navigator.standalone === true
        ? "standalone-ios"
        : displayMode.matches
          ? "standalone"
          : "browser tab";
    onNuxtReady(() => {
      appLaunchDomContentLoaded(launchMode());
    });
    displayMode.addEventListener("change", () => {
      appLaunchDisplayModeChanged(launchMode());
    });
    window.addEventListener("appinstalled", () => {
      pwaInstallAppInstalled();
    });
    nuxtApp.hook("service-worker:registration-failed", ({ error }) => {
      console.error("[pwa] Service worker registration failed.", error);
    });
    const id = useRuntimeConfig().public.googleAnalyticsId;
    if (!id) {
      console.info(
        "GA4 is disabled: configure NUXT_PUBLIC_GOOGLE_ANALYTICS_ID at build time.",
      );
      return;
    }
    useScriptGoogleAnalytics({
      id,
      scriptOptions: { trigger: "onNuxtReady" },
    });
  },
});
