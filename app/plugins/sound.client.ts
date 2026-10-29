import { soundNames, type SoundEffect } from "~/composables/use-sound-effect";

const preferenceKey = "sound-effect-enabled";

export default defineNuxtPlugin((app) => {
  const enabled = useState("sound-effect-enabled", () => true);
  const error = useState("sound-effect-error", () => "");
  const sounds = new Map<SoundEffect, AudioBuffer>();
  const loading = new Map<SoundEffect, AbortController>();
  let context: AudioContext | undefined;
  let volume: GainNode | undefined;
  let activeSource: AudioBufferSourceNode | undefined;
  let disposed = false;
  let preferenceChanged = false;
  let preferenceVersion = 0;

  function report(message: string, cause: unknown) {
    console.warn(`[sound-effect] ${message}`, cause);
    error.value = message;
  }

  function stop() {
    if (!activeSource) return;
    const source = activeSource;
    activeSource = undefined;
    source.onended = null;
    source.stop();
    source.disconnect();
  }

  function abortLoads() {
    for (const controller of loading.values()) controller.abort();
    loading.clear();
  }

  async function load(name: SoundEffect, audio: AudioContext) {
    const controller = new AbortController();
    loading.set(name, controller);
    try {
      const response = await fetch(`/sounds/v1/${name}.wav`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Loading ${name} failed with HTTP ${response.status}.`);
      }
      const data = await response.arrayBuffer();
      if (controller.signal.aborted || disposed) return;
      const buffer = await audio.decodeAudioData(data);
      if (!controller.signal.aborted && !disposed) sounds.set(name, buffer);
    } catch (cause) {
      if (!controller.signal.aborted && !disposed) {
        report(
          "Sound effects could not be loaded. Try enabling them again when online.",
          cause,
        );
      }
    } finally {
      if (loading.get(name) === controller) loading.delete(name);
    }
  }

  async function prepare() {
    try {
      if (!context) {
        const audio = new AudioContext();
        const gain = audio.createGain();
        gain.gain.value = 0.25;
        gain.connect(audio.destination);
        context = audio;
        volume = gain;
      }
      const pending = [];
      for (const name of soundNames) {
        if (!sounds.has(name) && !loading.has(name)) {
          pending.push(load(name, context));
        }
      }
      await Promise.all(pending);
    } catch (cause) {
      report("Sound effects could not be initialized in this browser.", cause);
    }
  }

  function unlock() {
    if (
      !enabled.value ||
      disposed ||
      !context ||
      context.state === "running" ||
      context.state === "closed"
    ) {
      return;
    }
    return context.resume().catch((cause: unknown) => {
      if (!disposed && enabled.value) {
        report(
          "Sound playback was blocked. Try another click or turn sound effects off.",
          cause,
        );
      }
    });
  }

  function setEnabled(value: boolean, persist = true) {
    if (disposed) return;
    const confirm = persist && value && !enabled.value;
    const version = ++preferenceVersion;
    if (persist) preferenceChanged = true;
    enabled.value = value;
    error.value = "";
    if (value) {
      abortLoads();
      const prepared = prepare();
      const unlocked = persist ? unlock() : undefined;
      if (confirm) {
        void Promise.all([prepared, unlocked]).then(() => {
          if (version === preferenceVersion) play("toggle-on");
        });
      }
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
    // A navigation preview must not cut off a confirmation or deliberate action.
    if (name === "link-hover" && activeSource) return;
    const buffer = sounds.get(name);
    if (!buffer || !context || !volume) return;
    if (context.state !== "running") {
      // Resume during the gesture, but never replay a stale click after unlocking.
      unlock();
      return;
    }
    stop();
    let source: AudioBufferSourceNode | undefined;
    try {
      source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(volume);
      source.onended = () => {
        source?.disconnect();
        if (activeSource === source) activeSource = undefined;
      };
      source.start();
      activeSource = source;
    } catch (cause) {
      source?.disconnect();
      report(
        "Sound playback failed. Try turning sound effects off and on.",
        cause,
      );
    }
  }

  function storageChanged(event: StorageEvent) {
    if (
      event.storageArea === localStorage &&
      (event.key === preferenceKey || event.key === null)
    ) {
      setEnabled(event.newValue !== "false", false);
    }
  }

  // Async layouts can still be hydrating at app:mounted.
  onNuxtReady(() => {
    if (disposed) return;
    try {
      // The user may interact before Nuxt's idle callback restores storage.
      if (!preferenceChanged) {
        setEnabled(localStorage.getItem(preferenceKey) !== "false", false);
      }
    } catch (cause) {
      setEnabled(false, false);
      report(
        "Your sound preference could not be read. Sound effects are off.",
        cause,
      );
    }
    window.addEventListener("storage", storageChanged);
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    abortLoads();
    stop();
    sounds.clear();
    volume?.disconnect();
    if (context && context.state !== "closed") {
      void context.close().catch((cause: unknown) => {
        report("Sound effects could not be released.", cause);
      });
    }
  }
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  app.vueApp.onUnmount(dispose);

  return { provide: { soundEffect: { setEnabled, play } } };
});
