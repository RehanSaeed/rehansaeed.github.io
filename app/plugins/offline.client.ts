export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  let controlled = false;
  const warmedResources = new Set<string>();

  async function saveCurrentPage() {
    if (!controlled) {
      return;
    }
    const path = router.currentRoute.value.path;
    const resources = [
      new URL(path, location.origin).href,
      new URL(`${path}_payload.json`, location.origin).href,
      ...performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => {
          const url = new URL(name);
          return (
            !warmedResources.has(name) &&
            url.origin === location.origin &&
            /^\/(?:_nuxt|_fonts|_ipx|images|content-images)\//.test(
              url.pathname,
            )
          );
        }),
    ];
    await Promise.all(
      [...new Set(resources)].map(async (url) => {
        try {
          const response = await fetch(url, {
            cache: "no-store",
            headers: url === resources[0] ? { Accept: "text/html" } : {},
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          if (url !== resources[0] && url !== resources[1]) {
            warmedResources.add(url);
          }
        } catch (error) {
          console.warn(
            "[offline] Could not cache a visited resource.",
            url,
            error,
          );
        }
      }),
    );
  }

  nuxtApp.hook("app:mounted", () => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const onControl = () => {
      controlled = Boolean(navigator.serviceWorker.controller);
      void saveCurrentPage();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControl);
    onControl();
  });
  nuxtApp.hook("page:finish", saveCurrentPage);

  router.beforeEach(async (to, from) => {
    if (!controlled || to.path === from.path) {
      return;
    }
    try {
      const response = await fetch(`${to.path}_payload.json`, {
        cache: "no-store",
      });
      if (!response.ok) {
        // Preserve normal online 404 handling.
        return;
      }
    } catch {
      // A document navigation can use the accessible worker fallback; a missing
      // Nuxt payload cannot safely be replaced with HTML in the client router.
      location.assign(to.fullPath);
      return false;
    }
  });
});
