export function useLinkSound(isEnabled: () => boolean) {
  const { enabled, play } = useSoundEffect();
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancelPreview() {
    clearTimeout(timer);
  }

  function getLink(event: Event) {
    if (!isEnabled() || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (
      !link ||
      link.closest("[data-sound-link]") !== event.currentTarget ||
      link.hasAttribute("download")
    ) {
      return;
    }
    return link;
  }

  const trigger = computed(() =>
    isEnabled()
      ? {
          "data-sound-link": "",
          onPointerover(event: PointerEvent) {
            const link = getLink(event);
            if (
              !enabled.value ||
              event.pointerType !== "mouse" ||
              !link ||
              (event.relatedTarget instanceof Node &&
                link.contains(event.relatedTarget))
            ) {
              return;
            }
            cancelPreview();
            // Ignore quick pointer passes and let activation replace the preview.
            timer = setTimeout(() => play("link-hover"), 100);
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
            if (link?.matches(":focus-visible")) {
              cancelPreview();
              play("link-hover");
            }
          },
          onFocusout: cancelPreview,
          onClickCapture(event: MouseEvent) {
            cancelPreview();
            if (
              getLink(event) &&
              !event.defaultPrevented &&
              event.button === 0 &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey
            ) {
              play("link-activate");
            }
          },
        }
      : {},
  );

  watch(enabled, (value) => {
    if (!value) cancelPreview();
  });
  onBeforeUnmount(cancelPreview);
  return trigger;
}
