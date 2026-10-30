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
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
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
          onClickCapture(event: MouseEvent) {
            cancelPreview();
            const link = getLink(event);
            if (
              link &&
              profile.value &&
              !event.defaultPrevented &&
              event.button === 0 &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey
            ) {
              let sound = profile.value.activate;
              if (setting() === "content") {
                const url = new URL(link.href);
                if (url.origin !== location.origin) {
                  sound = "external-open";
                } else if (
                  url.pathname === location.pathname &&
                  url.search === location.search &&
                  url.hash
                ) {
                  sound = "anchor-jump";
                }
              }
              play(sound);
            }
          },
        }
      : {},
  );

  watch(enabled, (value) => {
    if (!value) cancelPreview();
  });
  watch(profile, cancelPreview);
  onBeforeUnmount(cancelPreview);
  return trigger;
}
