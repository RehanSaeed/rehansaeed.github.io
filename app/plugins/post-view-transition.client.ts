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
  const isVisibleLoadedImage = (
    image: HTMLImageElement | null | undefined,
  ): image is HTMLImageElement =>
    !!image?.complete &&
    image.naturalWidth > 0 &&
    intersectsViewport(image.getBoundingClientRect());
  let selected:
    | ({
        permalink: string;
        source: HTMLElement;
        target?: HTMLElement;
      } & ({ kind: "post"; hero: string } | { kind: "tag"; title: string }))
    | undefined;
  let activeTransition: ViewTransition | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let historyDestination: string | undefined;
  const reset = () => {
    clearTimeout(deadline);
    activeTransition = undefined;
    const className =
      selected?.kind === "tag"
        ? "tag-view-transition__title"
        : "post-view-transition__hero";
    selected?.source.classList.remove(className);
    selected?.target?.classList.remove(className);
    root.classList.remove("post-view-transition");
    selected = undefined;
  };
  const skip = () => activeTransition?.skipTransition();
  const cancel = () => {
    skip();
    reset();
  };

  const isEligibleActivation = (event: MouseEvent, link: HTMLAnchorElement) =>
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !link.hasAttribute("download") &&
    (!link.target || link.target === "_self") &&
    !reducedMotion.matches &&
    !forcedColors.matches &&
    !document.hidden &&
    !document.querySelector('dialog[open], [aria-modal="true"]');

  const findSource = (link: HTMLAnchorElement) => {
    if (link.hasAttribute("data-tag-transition-link")) {
      const label = link.querySelector<HTMLElement>(
        "[data-tag-transition-label]",
      );
      if (
        link.origin !== location.origin ||
        link.search ||
        link.hash ||
        link.pathname === router.currentRoute.value.path ||
        !label?.textContent ||
        !intersectsViewport(label.getBoundingClientRect())
      ) {
        return;
      }
      return {
        kind: "tag" as const,
        permalink: link.pathname,
        title: label.textContent,
        source: label,
      };
    }
    const card = link.closest<HTMLElement>("[data-view-transition-source]");
    const image = card?.querySelector<HTMLImageElement>(
      "img[data-view-transition-image]",
    );
    if (
      !card ||
      !card.dataset.postHero ||
      link.href !== `${location.origin}${card.dataset.postPermalink}` ||
      link.pathname === router.currentRoute.value.path ||
      !isVisibleLoadedImage(image)
    ) {
      return;
    }
    return {
      kind: "post" as const,
      permalink: link.pathname,
      hero: card.dataset.postHero,
      source: image,
    };
  };

  const findDestination = (selection: NonNullable<typeof selected>) => {
    if (selection.kind === "tag") {
      const heading = document.querySelector<HTMLHeadingElement>(
        "[data-tag-transition-heading]",
      );
      const target = heading?.querySelector<HTMLElement>(
        "[data-tag-transition-label]",
      );
      if (
        router.currentRoute.value.fullPath !== selection.permalink ||
        heading?.dataset.tagTransitionHeading !== selection.permalink ||
        !target ||
        target.textContent !== selection.title
      ) {
        return;
      }
      return { target, heading };
    }
    const page = document.querySelector<HTMLElement>(
      "[data-view-transition-destination]",
    );
    const hero = page?.querySelector<HTMLImageElement>(
      "img[data-view-transition-image]",
    );
    const heading = page?.querySelector<HTMLHeadingElement>(
      "[data-view-transition-heading]",
    );
    if (
      router.currentRoute.value.fullPath !== selection.permalink ||
      page?.dataset.postPermalink !== selection.permalink ||
      page.dataset.postHero !== selection.hero ||
      !hero ||
      !heading
    ) {
      return;
    }
    return { target: hero, heading };
  };

  const selectSource = (event: MouseEvent) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>(
            "a[data-view-transition-link], [data-view-transition-link] a, a[data-tag-transition-link]",
          )
        : null;
    if (!link) {
      return;
    }
    if (selected || activeTransition) {
      cancel();
      return;
    }
    if (!isEligibleActivation(event, link)) {
      return;
    }
    selected = findSource(link);
    if (!selected) {
      return;
    }
    selected.source.classList.add(
      selected.kind === "tag"
        ? "tag-view-transition__title"
        : "post-view-transition__hero",
    );
    root.classList.add("post-view-transition");
  };

  const trackTransition = (transition: ViewTransition) => {
    clearTimeout(deadline);
    activeTransition = transition;
    deadline = setTimeout(() => {
      transition.skipTransition();
    }, 600);
    const cleanup = () => {
      if (activeTransition === transition) {
        reset();
      }
    };
    void transition.finished.then(cleanup, cleanup);
  };

  const prepareDestination = () => {
    clearTimeout(deadline);
    if (!activeTransition) {
      return;
    }
    if (!selected) {
      // Prepare ordinary page fades before Nuxt's deferred router scroll, too.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    const destination = findDestination(selected);
    if (!destination) {
      cancel();
      return;
    }
    const { target, heading } = destination;
    selected.target = target;
    target.classList.add(
      selected.kind === "tag"
        ? "tag-view-transition__title"
        : "post-view-transition__hero",
    );
    // Nuxt captures after page:finish; its normal router scroll waits another frame.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    heading.focus({ preventScroll: true });
    if (
      selected.kind === "post"
        ? !(target instanceof HTMLImageElement) || !isVisibleLoadedImage(target)
        : !intersectsViewport(target.getBoundingClientRect())
    ) {
      skip();
    }
  };

  const listeners = new AbortController();
  const disposers = [
    router.beforeEach((to) => {
      if (to.fullPath !== selected?.permalink) {
        cancel();
      }
      const options = {
        // Router guards can run before our popstate listener. Nuxt reads this at beforeResolve.
        get enabled() {
          return (
            to.fullPath !== historyDestination &&
            !to.hash &&
            !reducedMotion.matches &&
            !forcedColors.matches
          );
        },
      };
      to.meta.viewTransition = options;
      if (!options.enabled) {
        cancel();
      }
    }),
    router.afterEach((_to, _from, failure) => {
      historyDestination = undefined;
      if (failure || !activeTransition) {
        cancel();
      }
    }),
    router.onError(cancel),
    nuxtApp.hook("app:error", cancel),
    nuxtApp.hook("page:view-transition:start", trackTransition),
    nuxtApp.hook("page:finish", prepareDestination),
  ];
  const { signal } = listeners;
  document.addEventListener("click", selectSource, { capture: true, signal });

  reducedMotion.addEventListener("change", skip, { signal });
  forcedColors.addEventListener("change", skip, { signal });
  window.addEventListener(
    "popstate",
    () => {
      historyDestination = `${location.pathname}${location.search}${location.hash}`;
      cancel();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        cancel();
      }
    },
    { signal },
  );
  for (const event of ["wheel", "touchstart"]) {
    window.addEventListener(event, skip, { passive: true, signal });
  }
  document.addEventListener(
    "keydown",
    (event) => {
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
    },
    { signal },
  );

  const dispose = () => {
    if (signal.aborted) {
      return;
    }
    listeners.abort();
    for (const unregister of disposers) {
      unregister();
    }
    cancel();
  };
  nuxtApp.vueApp.onUnmount(dispose);
  if (import.meta.hot) {
    import.meta.hot.dispose(dispose);
  }
});
