import type { VNode } from "vue";
import {
  linkSoundProfiles,
  type LinkSound,
  type LinkSoundProfile,
} from "#shared/utils/sounds";

export function useLinkSound(setting: () => boolean | LinkSound | undefined) {
  const { enabled, play } = useSoundEffect();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const profile = computed<LinkSoundProfile | undefined>(() => {
    const value = setting();
    return value
      ? linkSoundProfiles[value === true ? "navigation" : value]
      : undefined;
  });

  function cancelPreview() {
    clearTimeout(timer);
  }

  function getLink(event: Event) {
    if (!profile.value || !(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (
      !link ||
      link.closest("[data-sound-link]") !== event.currentTarget ||
      link.hasAttribute("download") ||
      link.getAttribute("aria-disabled") === "true"
    ) {
      return;
    }
    return link;
  }

  function activate(event: MouseEvent) {
    cancelPreview();
    const link = getLink(event);
    if (
      !link ||
      !profile.value ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    let sound = profile.value.activate;
    if (setting() === "content") {
      const url = new URL(link.getAttribute("href") ?? "", document.baseURI);
      if (url.origin !== location.origin) {
        sound = "external-open";
      } else if (
        url.pathname === location.pathname &&
        url.search === location.search &&
        (url.hash || link.getAttribute("href") === "#")
      ) {
        sound = "anchor-jump";
      }
    }
    play(sound);
  }

  const trigger = computed(() =>
    profile.value
      ? {
          "data-sound-link": "",
          onPointerover(event: PointerEvent) {
            const link = getLink(event);
            if (
              !enabled.value ||
              !profile.value?.hover ||
              event.pointerType !== "mouse" ||
              !link ||
              (event.relatedTarget instanceof Node &&
                link.contains(event.relatedTarget))
            ) {
              return;
            }
            cancelPreview();
            // Ignore quick pointer passes and let activation replace the preview.
            const sound = profile.value.hover;
            timer = setTimeout(() => play(sound), 100);
          },
          onPointerout(event: PointerEvent) {
            const link = getLink(event);
            if (
              link &&
              (!(event.relatedTarget instanceof Node) ||
                !link.contains(event.relatedTarget))
            ) {
              cancelPreview();
            }
          },
          onPointerdown: cancelPreview,
          onFocusin(event: FocusEvent) {
            const link = getLink(event);
            if (profile.value?.hover && link?.matches(":focus-visible")) {
              cancelPreview();
              play(profile.value.hover);
            }
          },
          onFocusout: cancelPreview,
        }
      : {},
  );

  function mount({ el }: VNode) {
    // Native capture avoids Vue stamping unrelated descendant clicks, including
    // actions mounted in the same millisecond or rendered with a fixed clock.
    if (el instanceof HTMLElement) el.addEventListener("click", activate, true);
  }

  function unmount({ el }: VNode) {
    if (el instanceof HTMLElement)
      el.removeEventListener("click", activate, true);
  }

  watch(enabled, (value) => {
    if (!value) cancelPreview();
  });
  watch(profile, cancelPreview);
  onBeforeUnmount(cancelPreview);
  return computed(() => ({
    ...trigger.value,
    onVnodeMounted: mount,
    onVnodeBeforeUnmount: unmount,
  }));
}
