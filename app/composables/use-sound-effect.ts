import type { SoundEffect } from "#shared/utils/sounds";

export function useSoundEffect() {
  const app = useNuxtApp();
  const enabled = useState("sound-effect-enabled", () => true);
  const error = useState("sound-effect-error", () => "");

  return {
    enabled: readonly(enabled),
    error: readonly(error),
    setEnabled(value: boolean) {
      if (import.meta.client) {
        app.$soundEffect.setEnabled(value);
      }
    },
    play(sound: SoundEffect) {
      if (import.meta.client) {
        return app.$soundEffect.play(sound);
      }
    },
  };
}
