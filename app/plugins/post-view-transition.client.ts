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
  let selected:
    | {
        permalink: string;
        hero: string;
        source: HTMLImageElement;
        sourceClass: string;
        target?: HTMLImageElement;
        transition?: ViewTransition;
        deadline?: ReturnType<typeof setTimeout>;
      }
    | undefined;
  const reset = () => {
    clearTimeout(selected?.deadline);
    selected?.source.classList.remove(selected.sourceClass);
    selected?.target?.classList.remove("post__photo--view-transition");
    root.classList.remove("post-view-transition");
    selected = undefined;
  };
  const skip = () => selected?.transition?.skipTransition();
  const cancel = () => {
    skip();
    reset();
  };

  const selectSource = (event: MouseEvent) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>(
            ".post-card__title a, .post-navigation__link",
          )
        : null;
    if (!link) {
      return;
    }
    if (selected) {
      cancel();
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
      document.querySelector('dialog[open], [aria-modal="true"]')
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
      !image?.complete ||
      image.naturalWidth === 0 ||
      !card.dataset.postHero ||
      link.href !== `${location.origin}${card.dataset.postPermalink}` ||
      link.pathname === router.currentRoute.value.path ||
      !intersectsViewport(image.getBoundingClientRect())
    ) {
      return;
    }
    const sourceClass = card.matches(".post-card")
      ? "post-card__image--view-transition"
      : "post-navigation__image--view-transition";
    selected = {
      permalink: link.pathname,
      hero: card.dataset.postHero,
      source: image,
      sourceClass,
    };
    image.classList.add(sourceClass);
    root.classList.add("post-view-transition");
  };

  const trackTransition = (transition: ViewTransition) => {
    const selection = selected;
    if (!selection) {
      transition.skipTransition();
      return;
    }
    selection.transition = transition;
    selection.deadline = setTimeout(() => {
      transition.skipTransition();
    }, 600);
    const cleanup = () => {
      if (selected === selection) {
        reset();
      }
    };
    void transition.finished.then(cleanup, cleanup);
  };

  const prepareDestination = () => {
    if (!selected?.transition) {
      return;
    }
    clearTimeout(selected.deadline);
    const page = document.querySelector<HTMLElement>(".post-page");
    const hero = page?.querySelector<HTMLImageElement>(".post__photo");
    const heading = page?.querySelector<HTMLHeadingElement>("h1");
    if (
      router.currentRoute.value.fullPath !== selected.permalink ||
      page?.dataset.postPermalink !== selected.permalink ||
      page.dataset.postHero !== selected.hero ||
      !hero ||
      !heading
    ) {
      cancel();
      return;
    }
    selected.target = hero;
    hero.classList.add("post__photo--view-transition");
    // Nuxt captures after page:finish; its normal router scroll waits another frame.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    heading.focus({ preventScroll: true });
    if (
      !hero.complete ||
      hero.naturalWidth === 0 ||
      !intersectsViewport(hero.getBoundingClientRect())
    ) {
      skip();
    }
  };

  router.beforeEach((to) => {
    to.meta.viewTransition =
      to.fullPath === selected?.permalink &&
      !reducedMotion.matches &&
      !forcedColors.matches;
    if (!to.meta.viewTransition) {
      cancel();
    }
  });
  router.afterEach((_to, _from, failure) => {
    if (failure || !selected?.transition) {
      cancel();
    }
  });
  router.onError(cancel);
  nuxtApp.hook("app:error", cancel);
  nuxtApp.hook("page:view-transition:start", trackTransition);
  nuxtApp.hook("page:finish", prepareDestination);
  document.addEventListener("click", selectSource, { capture: true });

  reducedMotion.addEventListener("change", skip);
  forcedColors.addEventListener("change", skip);
  window.addEventListener("popstate", cancel);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancel();
    }
  });
  for (const event of ["wheel", "touchstart"]) {
    window.addEventListener(event, skip, { passive: true });
  }
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
});
