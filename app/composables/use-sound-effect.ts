export type SoundEffect =
  "toggle-on" | "toggle-off" | "dialog-open" | "dialog-close";

export function useSoundEffect() {
  const app = useNuxtApp();
  const enabled = useState("ui-sound-enabled", () => false);
  const error = useState("ui-sound-error", () => "");

  return {
    enabled: readonly(enabled),
    error: readonly(error),
    setEnabled(value: boolean) {
      if (import.meta.client) app.$uiSound.setEnabled(value);
    },
    play(sound: SoundEffect) {
      if (import.meta.client) app.$uiSound.play(sound);
    },
  };
}
