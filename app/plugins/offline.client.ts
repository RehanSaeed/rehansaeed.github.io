export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  let controlled = false;
  const warmedResources = new Set<string>();
  const pendingResources = new Set<string>();

  function isLocalResource(name: string) {
    const url = new URL(name);
    return (
      url.origin === location.origin &&
      /^\/(?:_nuxt|_fonts|_ipx|images|content-images)\//.test(url.pathname)
    );
  }

  async function saveResource(url: string, document = false) {
    if (pendingResources.has(url) || (!document && warmedResources.has(url))) {
      return;
    }
    pendingResources.add(url);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: document ? { Accept: "text/html" } : {},
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (isLocalResource(url)) {
        warmedResources.add(url);
      }
    } catch (error) {
      console.warn("[offline] Could not cache a visited resource.", url, error);
    } finally {
      pendingResources.delete(url);
    }
  }

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
        .filter(isLocalResource),
    ];
    await Promise.all(
      [...new Set(resources)].map((url) =>
        saveResource(url, url === resources[0]),
      ),
    );
  }

  nuxtApp.hook("app:mounted", () => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const onControl = () => {
      controlled = Boolean(navigator.serviceWorker.controller);
      warmedResources.clear();
      void saveCurrentPage();
    };
    // Module preloads and fonts can finish after control changes or hydration.
    // Observe those completions rather than assuming a timing snapshot is complete.
    const resources = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          controlled &&
          entry instanceof PerformanceResourceTiming &&
          entry.initiatorType !== "fetch" &&
          isLocalResource(entry.name)
        ) {
          void saveResource(entry.name);
        }
      }
    });
    resources.observe({ type: "resource", buffered: true });
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
