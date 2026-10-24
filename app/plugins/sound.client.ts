import type { Howl } from "howler";
import { soundNames, type SoundEffect } from "~/composables/use-sound-effect";

const preferenceKey = "sound-effect-enabled";

export default defineNuxtPlugin((app) => {
  const enabled = useState("sound-effect-enabled", () => false);
  const error = useState("sound-effect-error", () => "");
  const sounds = new Map<SoundEffect, Howl>();
  let engine: typeof import("howler") | undefined;
  let loading: Promise<void> | undefined;
  let disposed = false;
  let preferenceChanged = false;

  function report(message: string, cause: unknown) {
    console.warn(`[ui-sound] ${message}`, cause);
    error.value = message;
  }

  function stop() {
    for (const sound of sounds.values()) sound.stop();
  }

  function prepare() {
    if (loading) return;
    loading = import("howler")
      .then((module) => {
        if (!enabled.value || disposed) return;
        engine = module;
        for (const name of soundNames) {
          if (sounds.has(name)) continue;
          const sound = new module.Howl({
            src: [`/sounds/v1/${name}.wav`],
            volume: 0.25,
            autoplay: false,
            loop: false,
            onloaderror(_id, cause) {
              report(
                "Sound effects could not be loaded. Try enabling them again when online.",
                cause,
              );
            },
            onplayerror(_id, cause) {
              report(
                "Sound playback was blocked. Try another click or turn sound effects off.",
                cause,
              );
            },
            onplay(id) {
              if (!enabled.value || disposed) sound.stop(id);
            },
          });
          sounds.set(name, sound);
        }
      })
      .catch((cause: unknown) => {
        report(
          "Sound effects could not be loaded. Try enabling them again when online.",
          cause,
        );
      })
      .finally(() => {
        loading = undefined;
      });
  }

  function setEnabled(value: boolean, persist = true) {
    if (persist) preferenceChanged = true;
    enabled.value = value;
    error.value = "";
    if (value) {
      for (const [name, sound] of sounds) {
        if (sound.state() !== "loaded") {
          sound.unload();
          sounds.delete(name);
        }
      }
      prepare();
    } else {
      stop();
    }
    if (persist) {
      try {
        localStorage.setItem(preferenceKey, String(value));
      } catch (cause) {
        report(
          "Your sound preference could not be saved. It will only apply to this tab.",
          cause,
        );
      }
    }
  }

  function play(name: SoundEffect) {
    if (!enabled.value || disposed) return;
    const sound = sounds.get(name);
    if (sound?.state() !== "loaded" || !engine) return;
    if (engine.Howler.usingWebAudio && engine.Howler.ctx.state !== "running") {
      // Resume during the gesture, but never replay a stale click after unlocking.
      void engine.Howler.ctx.resume().catch((cause: unknown) => {
        report(
          "Sound playback was blocked. Try another click or turn sound effects off.",
          cause,
        );
      });
      return;
    }
    stop();
    sound.play();
  }

  function storageChanged(event: StorageEvent) {
    if (
      event.storageArea === localStorage &&
      (event.key === preferenceKey || event.key === null)
    ) {
      setEnabled(event.newValue === "true", false);
    }
  }

  // Async layouts can still be hydrating at app:mounted.
  onNuxtReady(() => {
    try {
      // The user may interact before Nuxt's idle callback restores storage.
      if (!preferenceChanged) {
        setEnabled(localStorage.getItem(preferenceKey) === "true", false);
      }
    } catch (cause) {
      report(
        "Your sound preference could not be read. Sound effects are off.",
        cause,
      );
    }
    window.addEventListener("storage", storageChanged);
  });

  function dispose() {
    disposed = true;
    window.removeEventListener("storage", storageChanged);
    for (const sound of sounds.values()) sound.unload();
    sounds.clear();
  }
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  app.vueApp.onUnmount(dispose);

  return { provide: { uiSound: { setEnabled, play } } };
});
