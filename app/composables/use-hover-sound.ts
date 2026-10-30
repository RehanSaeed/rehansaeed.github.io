import type { HoverSoundEffect } from "#shared/utils/sounds";

export function useHoverSound(setting: () => HoverSoundEffect | undefined) {
  const { enabled, play } = useSoundEffect();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopPreview: (() => void) | undefined;
  let hovering = false;

  function cancelPreview() {
    clearTimeout(timer);
    timer = undefined;
    stopPreview?.();
    stopPreview = undefined;
    hovering = false;
  }

  watch(enabled, (value) => {
    if (!value) {
      cancelPreview();
    }
  });
  watch(setting, cancelPreview);
  onBeforeUnmount(cancelPreview);

  return computed(() =>
    setting()
      ? {
          "data-sound-hover": setting(),
          onPointerenter(event: PointerEvent) {
            const sound = setting();
            if (
              !enabled.value ||
              !sound ||
              hovering ||
              event.pointerType !== "mouse" ||
              (event.currentTarget instanceof Element &&
                (event.currentTarget.hasAttribute("download") ||
                  event.currentTarget.getAttribute("aria-disabled") === "true"))
            ) {
              return;
            }
            hovering = true;
            // Quick passes stay silent; leaving stops the accompanying preview.
            timer = setTimeout(() => {
              timer = undefined;
              if (!enabled.value) {
                return;
              }
              stopPreview = play(sound);
            }, 100);
          },
          onPointerleave: cancelPreview,
          onPointerdown: cancelPreview,
        }
      : {},
  );
}
