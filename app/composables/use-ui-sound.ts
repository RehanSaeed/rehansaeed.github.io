export type UiSound =
  "toggle-on" | "toggle-off" | "dialog-open" | "dialog-close";

export function useUiSound() {
  const app = useNuxtApp();
  const enabled = useState("ui-sound-enabled", () => false);
  const error = useState("ui-sound-error", () => "");

  return {
    enabled: readonly(enabled),
    error: readonly(error),
    setEnabled(value: boolean) {
      if (import.meta.client) app.$uiSound.setEnabled(value);
    },
    play(sound: UiSound) {
      if (import.meta.client) app.$uiSound.play(sound);
    },
  };
}
