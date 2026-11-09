export default defineNuxtPlugin((nuxtApp) => {
  if (typeof document.startViewTransition !== "function") {
    return;
  }

  const router = useRouter();
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  const intersectsViewport = (box: DOMRect) =>
    box.width > 0 &&
    box.height > 0 &&
    box.bottom > 0 &&
    box.top < window.innerHeight &&
    box.right > 0 &&
    box.left < window.innerWidth;
  let active:
    { destination: string; cancel: () => void; skip: () => void } | undefined;

  router.beforeEach((to) => {
    if (active && to.fullPath !== active.destination) {
      active.cancel();
    }
  });
  const skip = () => active?.skip();
  reducedMotion.addEventListener("change", skip);
  forcedColors.addEventListener("change", skip);
  window.addEventListener("popstate", () => active?.cancel());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      active?.cancel();
    }
  });
  window.addEventListener("wheel", skip, { passive: true });
  window.addEventListener("touchstart", skip, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (
      [
        "Escape",
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      skip();
    }
  });

  document.addEventListener(
    "click",
    (event) => {
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link) {
        return;
      }
      if (active) {
        active.cancel();
        return;
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self") ||
        reducedMotion.matches ||
        forcedColors.matches ||
        document.hidden ||
        document.querySelector('dialog[open], [aria-modal="true"]') ||
        !link.matches(".post-card__title a, .post-navigation__link")
      ) {
        return;
      }
      const card = link.closest<HTMLElement>(
        ".posts .post-card, .post-navigation__card",
      );
      const image = card?.querySelector<HTMLImageElement>(
        ".post-card__image, .post-navigation__image",
      );
      if (
        !card ||
        !image ||
        !image.complete ||
        image.naturalWidth === 0 ||
        !card.dataset.postHero ||
        link.origin !== location.origin ||
        link.search ||
        link.hash ||
        link.pathname !== card.dataset.postPermalink ||
        link.pathname === router.currentRoute.value.path
      ) {
        return;
      }
      if (!intersectsViewport(image.getBoundingClientRect())) {
        return;
      }

      event.preventDefault();
      const destination = link.pathname;
      let canceled = false;
      let release!: () => void;
      const loaded = new Promise<void>((resolve) => {
        release = resolve;
      });
      let interrupt!: () => void;
      const interrupted = new Promise<void>((resolve) => {
        interrupt = resolve;
      });
      const cancel = () => {
        canceled = true;
        transition.skipTransition();
        release();
        interrupt();
      };
      const state = {
        destination,
        cancel,
        skip: () => {
          transition.skipTransition();
        },
      };
      active = state;
      const isCurrent = () =>
        !canceled && router.currentRoute.value.fullPath === destination;
      const sourceClass = card.matches(".post-card")
        ? "post-card__image--view-transition"
        : "post-navigation__image--view-transition";
      let targetImage: HTMLImageElement | undefined;
      image.classList.add(sourceClass);
      root.classList.add("post-view-transition");

      const unhookLoading = nuxtApp.hook("page:loading:end", async () => {
        if (!isCurrent()) {
          return;
        }
        const page = document.querySelector<HTMLElement>(".post-page");
        const hero = page?.querySelector<HTMLImageElement>(".post__photo");
        const heading = page?.querySelector<HTMLHeadingElement>("h1");
        if (
          page?.dataset.postPermalink !== destination ||
          page.dataset.postHero !== card.dataset.postHero ||
          !hero ||
          !heading
        ) {
          cancel();
          return;
        }
        targetImage = hero;
        hero.classList.add("post__photo--view-transition");
        // Public loading completion precedes Nuxt's deferred router scroll.
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        heading.focus({ preventScroll: true });
        // Flush Vue's rendered picture without waiting for a paint: native
        // transitions suppress rendering while their update callback is pending.
        await nextTick();
        if (!isCurrent()) {
          return;
        }
        if (
          !hero.complete ||
          hero.naturalWidth === 0 ||
          !intersectsViewport(hero.getBoundingClientRect())
        ) {
          transition.skipTransition();
        }
        release();
      });
      const unhookError = nuxtApp.hook("app:error", cancel);
      const unhookRouterError = router.onError(cancel);
      let deadline: ReturnType<typeof setTimeout> | undefined;
      const transition = document.startViewTransition(async () => {
        if (canceled) {
          return;
        }
        // Do not keep asynchronous Content or media loading visually frozen.
        deadline = setTimeout(() => {
          transition.skipTransition();
        }, 600);
        try {
          const failure = await Promise.race([
            router.push(destination),
            interrupted,
          ]);
          if (failure) {
            cancel();
          }
          await loaded;
        } catch (error) {
          cancel();
          console.error("[post-view-transition] Navigation failed.", error);
          await nuxtApp.runWithContext(() =>
            showError(
              error instanceof Error
                ? error
                : new Error("Article navigation failed.", { cause: error }),
            ),
          );
        } finally {
          clearTimeout(deadline);
        }
      });
      const cleanup = () => {
        clearTimeout(deadline);
        unhookLoading();
        unhookError();
        unhookRouterError();
        image.classList.remove(sourceClass);
        targetImage?.classList.remove("post__photo--view-transition");
        root.classList.remove("post-view-transition");
        if (active === state) {
          active = undefined;
        }
      };
      void transition.ready.catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("[post-view-transition] Capture failed.", error);
        }
      });
      void transition.finished.then(cleanup, (error: unknown) => {
        console.error("[post-view-transition] Transition failed.", error);
        cleanup();
      });
    },
    { capture: true },
  );
});
