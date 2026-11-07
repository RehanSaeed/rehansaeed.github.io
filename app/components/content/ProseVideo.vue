<template>
  <div
    ref="player"
    class="prose-video"
    :class="{ 'prose-video--idle': controlsHidden }"
    @pointermove="onPointerActivity"
    @pointerdown="onPointerActivity"
    @focusin="showControls"
    @focusout="scheduleHide">
    <u-intersect :threshold="threshold" @change="onIntersectionChange">
      <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -- Each post supplies reviewed tracks for meaningful audio; see AGENTS.md. -->
      <video
        ref="video"
        v-bind="$attrs"
        :controls="!enhanced && nativeControls"
        @play="onPlay"
        @pause="onPause"
        @ended="syncMedia"
        @timeupdate="syncMedia"
        @durationchange="syncMedia"
        @loadedmetadata="syncMedia"
        @progress="syncMedia"
        @volumechange="syncMedia"
        @ratechange="syncMedia"
        @waiting="onWaiting"
        @playing="onPlaying"
        @canplay="onPlaying"
        @load.capture="syncCaptions"
        @error.capture="onMediaError">
        <slot />
      </video>
    </u-intersect>
    <div
      v-if="enhanced"
      class="prose-video__controls"
      role="group"
      :aria-label="controlsLabel">
      <label class="prose-video__seek">
        <span class="prose-video__visually-hidden">Video position</span>
        <input
          type="range"
          min="0"
          :max="duration || 1"
          step="1"
          :value="currentTime"
          :disabled="!canSeek"
          :aria-valuetext="`${formatTime(currentTime)} of ${formatTime(duration)}`"
          @input="onSeek" />
      </label>
      <div class="prose-video__row">
        <button
          type="button"
          class="prose-video__button"
          :aria-label="
            ended ? 'Replay video' : playing ? 'Pause video' : 'Play video'
          "
          :title="ended ? 'Replay' : playing ? 'Pause' : 'Play'"
          @click="togglePlayback">
          <u-icon
            :name="
              ended
                ? 'fa-solid:undo'
                : playing
                  ? 'fa-solid:pause'
                  : 'fa-solid:play'
            " />
        </button>
        <button
          type="button"
          class="prose-video__button"
          :aria-label="muted ? 'Unmute video' : 'Mute video'"
          :title="muted ? 'Unmute' : 'Mute'"
          :aria-pressed="muted"
          @click="toggleMute">
          <u-icon
            :name="
              muted || volume === 0
                ? 'fa-solid:volume-mute'
                : 'fa-solid:volume-up'
            " />
        </button>
        <label v-if="volumeSupported" class="prose-video__volume">
          <span class="prose-video__visually-hidden">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="muted ? 0 : volume * 100"
            :aria-valuetext="`${muted ? 0 : Math.round(volume * 100)} percent`"
            @input="onVolume" />
        </label>
        <span class="prose-video__time"
          >{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span
        >
        <span class="prose-video__spacer"></span>
        <button
          v-if="captionTracks.length"
          type="button"
          class="prose-video__button"
          aria-label="Captions"
          title="Captions"
          :aria-pressed="selectedCaption !== -1"
          @click="toggleCaptions">
          <u-icon name="fa-solid:closed-captioning" />
        </button>
        <details class="prose-video__settings" @toggle="onSettingsToggle">
          <summary
            class="prose-video__button"
            aria-label="Video settings"
            title="Settings">
            <u-icon name="fa-solid:cog" />
          </summary>
          <div class="prose-video__menu">
            <label
              >Playback speed
              <select :value="playbackRate" @change="onSpeed">
                <option v-for="speed in speeds" :key="speed" :value="speed">
                  {{ speed === 1 ? "Normal" : `${speed}×` }}
                </option>
              </select>
            </label>
            <label v-if="captionTracks.length"
              >Caption language
              <select :value="selectedCaption" @change="onCaptionSelection">
                <option :value="-1">Off</option>
                <option
                  v-for="(track, index) in captionTracks"
                  :key="index"
                  :value="index">
                  {{ track.label || track.language || `Track ${index + 1}` }}
                </option>
              </select>
            </label>
            <button type="button" @click="useNativeControls">
              Use browser controls
            </button>
          </div>
        </details>
        <button
          v-if="pipSupported"
          type="button"
          class="prose-video__button"
          :aria-label="
            inPictureInPicture
              ? 'Exit picture-in-picture'
              : 'Enter picture-in-picture'
          "
          title="Picture-in-picture"
          @click="togglePictureInPicture">
          <u-icon name="fa-solid:clone" />
        </button>
        <button
          v-if="fullscreenSupported"
          type="button"
          class="prose-video__button"
          :aria-label="fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :title="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click="toggleFullscreen">
          <u-icon
            :name="fullscreen ? 'fa-solid:compress' : 'fa-solid:expand'" />
        </button>
      </div>
    </div>
    <p
      v-if="enhanced && (message || buffering)"
      class="prose-video__status"
      role="status">
      {{ message || "Loading video…" }}
      <a v-if="message && sourceUrl" :href="sourceUrl">Open video file</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from "vue";

defineOptions({ inheritAttrs: false });

const fullyVisibleRatio = 0.99;
const threshold = [0, fullyVisibleRatio, 1];
const video = useTemplateRef<HTMLVideoElement>("video");
const motion = usePreferredReducedMotion();
const player = useTemplateRef<HTMLDivElement>("player");
const attrs = useAttrs();
const nativeControls = computed(
  () => attrs.controls !== undefined && attrs.controls !== false,
);
const controlsLabel = computed(
  () =>
    `${typeof attrs["aria-label"] === "string" ? attrs["aria-label"] : "Video"} controls`,
);
const enhanced = ref(false);
const playing = ref(false);
const ended = ref(false);
const muted = ref(false);
const volume = ref(1);
const volumeSupported = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const canSeek = ref(false);
const buffering = ref(false);
const message = ref("");
const sourceUrl = ref("");
const playbackRate = ref(1);
const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
const captionTracks = ref<TextTrack[]>([]);
const selectedCaption = ref(-1);
const repositionedCues = new Set<VTTCue>();
const fullscreenSupported = ref(false);
const fullscreen = ref(false);
const pipSupported = ref(false);
const inPictureInPicture = ref(false);
const idle = ref(false);
const settingsOpen = ref(false);
const touch = ref(false);
const controlsHidden = computed(
  () =>
    idle.value &&
    playing.value &&
    !buffering.value &&
    !message.value &&
    !settingsOpen.value &&
    !touch.value,
);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let expectingPlay = false;
let expectingPause = false;
let hasAutoplayed = false;
let userPaused = false;

const isFullyVisible = (entry: IntersectionObserverEntry): boolean =>
  entry.intersectionRatio >= fullyVisibleRatio ||
  // A video taller than the viewport can never be fully visible, so treat
  // filling the viewport as fully visible.
  (entry.rootBounds !== null &&
    entry.intersectionRect.height >= entry.rootBounds.height - 1);

const onPlay = (): void => {
  if (expectingPlay) {
    expectingPlay = false;
  } else {
    userPaused = false;
  }
  message.value = "";
  syncMedia();
  scheduleHide();
};

const onPause = (): void => {
  if (expectingPause) {
    expectingPause = false;
  } else {
    userPaused = true;
  }
  buffering.value = false;
  syncMedia();
  showControls();
};

const play = (element: HTMLVideoElement): void => {
  if (
    !element.paused ||
    userPaused ||
    element.ended ||
    motion.value === "reduce"
  ) {
    return;
  }
  if (!hasAutoplayed) {
    // Browsers only allow autoplay without a user gesture when muted.
    element.muted = true;
    hasAutoplayed = true;
  }
  expectingPlay = true;
  element.play().catch((error: unknown) => {
    expectingPlay = false;
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      message.value =
        "Automatic playback was blocked. Use Play to start the video.";
    }
  });
};

const pause = (element: HTMLVideoElement): void => {
  if (element.paused) {
    return;
  }
  expectingPause = true;
  element.pause();
};

const onIntersectionChange = (entries: IntersectionObserverEntry[]): void => {
  const element = video.value;
  if (!element) {
    return;
  }
  for (const entry of entries) {
    if (isFullyVisible(entry)) {
      play(element);
    } else if (!entry.isIntersecting) {
      pause(element);
    }
  }
};

const formatTime = (seconds: number): string => {
  const total = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  const minutes = Math.floor(total / 60);
  const time = `${minutes % 60}:${String(total % 60).padStart(2, "0")}`;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${time.padStart(5, "0")}`
    : time;
};

const syncCaptions = (): void => {
  captionTracks.value = Array.from(video.value?.textTracks ?? []).filter(
    (track) =>
      (track.kind === "captions" || track.kind === "subtitles") &&
      !Array.from(video.value?.querySelectorAll("track") ?? []).some(
        (element) =>
          element.track === track &&
          element.readyState === HTMLTrackElement.ERROR,
      ),
  );
  selectedCaption.value = captionTracks.value.findIndex(
    (track) => track.mode === "showing",
  );
  positionCaptions();
};

const positionCaptions = (): void => {
  const visible = enhanced.value && !controlsHidden.value;
  for (const cue of repositionedCues) {
    if (!visible) {
      cue.line = "auto";
    }
  }
  if (!visible) {
    repositionedCues.clear();
    return;
  }
  for (const track of captionTracks.value) {
    for (const cue of Array.from(track.activeCues ?? [])) {
      // Move only automatically positioned captions; preserve authored positions.
      if (
        cue instanceof VTTCue &&
        (cue.line === "auto" || repositionedCues.has(cue))
      ) {
        repositionedCues.add(cue);
        cue.line = (player.value?.clientWidth ?? 0) <= 600 ? -7 : -5;
      }
    }
  }
};

const syncMedia = (): void => {
  const element = video.value;
  if (!element) {
    return;
  }
  playing.value = !element.paused && !element.ended;
  ended.value = element.ended;
  currentTime.value = element.currentTime;
  duration.value = Number.isFinite(element.duration) ? element.duration : 0;
  canSeek.value =
    duration.value > 0 &&
    Array.from(
      { length: element.seekable.length },
      (_, index) => element.seekable.end(index) > element.seekable.start(index),
    ).some(Boolean) &&
    !element.error;
  muted.value = element.muted;
  volume.value = element.volume;
  playbackRate.value = element.playbackRate;
  sourceUrl.value = element.currentSrc || element.src;
  syncCaptions();
};

const showControls = (): void => {
  clearTimeout(hideTimer);
  idle.value = false;
};

const scheduleHide = (): void => {
  showControls();
  if (!playing.value || touch.value) {
    return;
  }
  hideTimer = setTimeout(() => {
    if (
      !player.value?.contains(document.activeElement) &&
      !settingsOpen.value
    ) {
      idle.value = true;
    }
  }, 2500);
};

const onPointerActivity = (event: PointerEvent): void => {
  touch.value = event.pointerType !== "mouse";
  scheduleHide();
};

const onWaiting = (): void => {
  buffering.value = true;
  showControls();
};

const onPlaying = (): void => {
  buffering.value = false;
  syncMedia();
  scheduleHide();
};

const onMediaError = (event: Event): void => {
  if (event.target instanceof HTMLTrackElement) {
    message.value = "The captions could not be loaded.";
    syncCaptions();
    showControls();
    return;
  }
  if (!(event.target instanceof HTMLVideoElement)) {
    return;
  }
  buffering.value = false;
  message.value =
    "The video could not be loaded. Try browser controls or open the video file.";
  syncMedia();
  showControls();
};

const togglePlayback = async (): Promise<void> => {
  const element = video.value;
  if (!element) {
    return;
  }
  if (!element.paused) {
    element.pause();
    return;
  }
  if (element.ended) {
    element.currentTime = 0;
  }
  try {
    await element.play();
  } catch (error: unknown) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      message.value =
        "Playback could not start. Try browser controls or open the video file.";
      showControls();
    }
  }
};

const toggleMute = (): void => {
  if (video.value) {
    video.value.muted = !video.value.muted;
  }
};

const onSeek = (event: Event): void => {
  const element = video.value;
  if (element && canSeek.value && event.target instanceof HTMLInputElement) {
    const target = Number(event.target.value);
    for (let index = 0; index < element.seekable.length; index++) {
      if (
        target >= element.seekable.start(index) &&
        target <= element.seekable.end(index)
      ) {
        element.currentTime = target;
        syncMedia();
        return;
      }
    }
    message.value =
      "That position is not yet available. Try again after the video has loaded.";
  }
};

const onVolume = (event: Event): void => {
  if (video.value && event.target instanceof HTMLInputElement) {
    video.value.volume = Number(event.target.value) / 100;
    video.value.muted = video.value.volume === 0;
  }
};

const onSpeed = (event: Event): void => {
  if (video.value && event.target instanceof HTMLSelectElement) {
    video.value.playbackRate = Number(event.target.value);
  }
};

const selectCaption = (index: number): void => {
  captionTracks.value.forEach((track, trackIndex) => {
    track.mode = trackIndex === index ? "showing" : "disabled";
  });
  syncCaptions();
};

const toggleCaptions = (): void => {
  selectCaption(selectedCaption.value === -1 ? 0 : -1);
};
const onCaptionSelection = (event: Event): void => {
  if (event.target instanceof HTMLSelectElement) {
    selectCaption(Number(event.target.value));
  }
};

const onSettingsToggle = (event: Event): void => {
  if (event.target instanceof HTMLDetailsElement) {
    settingsOpen.value = event.target.open;
    scheduleHide();
  }
};

const closeSettings = (event: KeyboardEvent): void => {
  if (event.key !== "Escape" || !(event.target instanceof Element)) {
    return;
  }
  const settings = event.target.closest("details");
  if (
    settings instanceof HTMLDetailsElement &&
    player.value?.contains(settings)
  ) {
    settings.open = false;
    settings.querySelector("summary")?.focus();
  }
};

const useNativeControls = (): void => {
  enhanced.value = false;
  positionCaptions();
  showControls();
  video.value?.focus();
};

const syncFullscreen = (): void => {
  fullscreen.value = document.fullscreenElement === player.value;
};

const toggleFullscreen = async (): Promise<void> => {
  try {
    if (fullscreen.value) {
      await document.exitFullscreen();
    } else {
      await player.value?.requestFullscreen();
    }
  } catch {
    message.value =
      "Fullscreen is unavailable. Use browser controls for native playback.";
    showControls();
  }
};

const syncPictureInPicture = (): void => {
  inPictureInPicture.value = document.pictureInPictureElement === video.value;
};

const togglePictureInPicture = async (): Promise<void> => {
  const element = video.value;
  if (!element) {
    return;
  }
  try {
    if (inPictureInPicture.value) {
      await document.exitPictureInPicture();
    } else {
      await element.requestPictureInPicture();
    }
  } catch {
    message.value = "Picture-in-picture is unavailable for this video.";
    showControls();
  }
};

onMounted(() => {
  const element = video.value;
  if (!element) {
    return;
  }
  syncMedia();
  touch.value = globalThis.matchMedia("(pointer: coarse)").matches;
  // iOS uses system volume even though the HTMLMediaElement property exists.
  volumeSupported.value =
    !/iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  fullscreenSupported.value =
    document.fullscreenEnabled &&
    typeof player.value?.requestFullscreen === "function";
  pipSupported.value =
    document.pictureInPictureEnabled &&
    typeof element.requestPictureInPicture === "function" &&
    !element.disablePictureInPicture;
  document.addEventListener("fullscreenchange", syncFullscreen);
  document.addEventListener("keydown", closeSettings);
  element.addEventListener("enterpictureinpicture", syncPictureInPicture);
  element.addEventListener("leavepictureinpicture", syncPictureInPicture);
  element.textTracks.addEventListener("addtrack", syncCaptions);
  element.textTracks.addEventListener("removetrack", syncCaptions);
  element.textTracks.addEventListener("change", syncCaptions);
  enhanced.value = nativeControls.value;
});

onUnmounted(() => {
  enhanced.value = false;
  positionCaptions();
  clearTimeout(hideTimer);
  document.removeEventListener("fullscreenchange", syncFullscreen);
  document.removeEventListener("keydown", closeSettings);
  const element = video.value;
  element?.removeEventListener("enterpictureinpicture", syncPictureInPicture);
  element?.removeEventListener("leavepictureinpicture", syncPictureInPicture);
  element?.textTracks.removeEventListener("addtrack", syncCaptions);
  element?.textTracks.removeEventListener("removetrack", syncCaptions);
  element?.textTracks.removeEventListener("change", syncCaptions);
});

watch(controlsHidden, positionCaptions);
</script>

<style lang="scss">
.prose-video {
  --video-foreground: #fff;
  --video-panel: rgb(0 0 0 / 82%);
  --video-border: rgb(255 255 255 / 65%);
  --video-accent: var(--global-alternate-accent-color);

  position: relative;
  container-type: inline-size;

  video {
    display: block;
    block-size: auto;
  }

  [data-theme="dark"] & {
    --video-accent: var(--global-accent-color);
  }

  .post__content &:fullscreen {
    inline-size: 100%;
    margin-inline: 0;
  }

  video::cue {
    color: #fff;
    background: #000;
  }

  &:fullscreen {
    display: grid;
    place-items: center;
    background: #000;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;

    video {
      object-fit: contain;
      max-block-size: 100%;
    }
  }
}

.prose-video__controls {
  display: grid;
  color: var(--video-foreground);
  background: linear-gradient(
    to bottom,
    rgb(0 0 0 / 0%),
    var(--video-panel) 40%
  );
  padding: 0 12px 8px;

  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 1;
}

.prose-video__seek {
  display: grid;
  align-items: center;
  background: var(--video-panel);
  border-radius: var(--global-border-radius);
  margin: 0;
}

.prose-video__seek input,
.prose-video__volume input {
  appearance: auto;
  accent-color: var(--video-accent);
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  inline-size: 100%;
  min-inline-size: 0;
  block-size: 44px;
}

.prose-video__row {
  display: grid;
  grid-template-columns: auto auto auto auto 1fr repeat(4, auto);
  align-items: center;
  gap: 4px;

  background: var(--video-panel);
  border-radius: var(--global-border-radius);
}

.prose-video__button {
  display: grid;
  place-items: center;
  color: var(--video-foreground);
  background: transparent;
  border: 0;
  border-radius: var(--global-border-radius);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  inline-size: 44px;
  block-size: 44px;
  padding: 8px;

  &:hover {
    background: rgb(255 255 255 / 15%);
  }

  &[aria-pressed="true"] {
    box-shadow: inset 0 -3px var(--video-accent);
  }
}

.prose-video__controls :focus-visible {
  outline: 2px solid var(--video-foreground);
  outline-offset: -2px;
}

.prose-video__volume {
  inline-size: 72px;
  margin: 0;
}

.prose-video__time {
  font-family: var(--global-font-family-monospace);
  font-size: 0.75rem;
  white-space: nowrap;
}

.prose-video__spacer {
  min-inline-size: 0;
}

.prose-video__settings {
  position: relative;

  summary {
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
  }
}

.prose-video__menu {
  display: grid;
  gap: 12px;

  background: var(--video-panel);
  border: 1px solid var(--video-border);
  border-radius: var(--global-border-radius);
  padding: 16px;
  inline-size: min(16rem, 75cqi);

  position: absolute;
  inset-inline-end: 0;
  inset-block-end: calc(100% + 8px);

  label {
    display: grid;
    gap: 4px;
    color: var(--video-foreground);
    font-size: 0.875rem;
  }

  button,
  select {
    color: var(--video-foreground);
    background: #000;
    border: 1px solid var(--video-border);
    border-radius: var(--global-border-radius);
    font: inherit;
    padding: 8px;
    min-inline-size: 0;
    min-block-size: 44px;
  }
}

.prose-video__status {
  color: var(--video-foreground);
  background: var(--video-panel);
  border-radius: var(--global-border-radius);
  padding: 12px;
  font-size: 0.875rem;
  max-inline-size: calc(100% - 24px);

  position: absolute;
  inset-block-start: 12px;
  inset-inline-start: 12px;

  a {
    color: var(--video-accent);
  }
}

.prose-video__visually-hidden {
  position: absolute;
  clip-path: inset(50%);
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
}

.prose-video--idle .prose-video__controls {
  opacity: 0;
  pointer-events: none;
}

.prose-video--idle:focus-within .prose-video__controls,
.prose-video--idle:has(details[open]) .prose-video__controls {
  opacity: 1;
  pointer-events: auto;
}

@container (max-width: 600px) {
  .prose-video__volume {
    display: none;
  }

  .prose-video__row {
    grid-template-columns: auto auto 1fr repeat(4, auto);
  }

  .prose-video__time {
    grid-column: 1 / -1;
    grid-row: 1;
    padding-inline: 8px;
    padding-block-start: 4px;
  }
}

@media (forced-colors: active) {
  .prose-video__controls,
  .prose-video__menu,
  .prose-video__status {
    color: CanvasText;
    background: Canvas;
    border: 1px solid CanvasText;
  }

  .prose-video__button {
    color: ButtonText;
    background: ButtonFace;
    border: 1px solid ButtonText;

    &[aria-pressed="true"] {
      border-block-end: 3px solid Highlight;
    }
  }

  .prose-video__controls :focus-visible {
    outline-color: Highlight;
  }
}
</style>
