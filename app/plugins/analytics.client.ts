export default defineNuxtPlugin({
  name: "analytics",
  enforce: "pre",
  setup() {
    window.dataLayer ??= [];
    window.gtag = (...args) => window.dataLayer.push(args);
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
