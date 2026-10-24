export const soundNames = [
  "toggle-on",
  "toggle-off",
  "dialog-open",
  "dialog-close",
] as const;

export type SoundEffect = (typeof soundNames)[number];

export function useSoundEffect() {
  const app = useNuxtApp();
  const enabled = useState("sound-effect-enabled", () => false);
  const error = useState("sound-effect-error", () => "");

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
