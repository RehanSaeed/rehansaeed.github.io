<template>
  <span
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
    <span
      v-if="enhanced"
      class="prose-video__controls"
      role="group"
      :aria-label="controlsLabel">
      <span class="prose-video__seek">
        <progress
          class="prose-video__progress"
          :value="currentTime"
          :max="duration || 1"
          aria-hidden="true"></progress>
        <label>
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
      </span>
      <span class="prose-video__row">
        <span class="prose-video__playback">
          <u-button
            variant="icon"
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
          </u-button>
          <u-button
            variant="icon"
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
          </u-button>
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
            >{{ formatTime(currentTime)
            }}<span class="prose-video__duration">
              / {{ formatTime(duration) }}</span
            ></span
          >
        </span>
        <span class="prose-video__spacer"></span>
        <span class="prose-video__utilities">
          <details
            v-if="captionTracks.length"
            class="prose-video__disclosure"
            @toggle="onMenuToggle">
            <summary
              class="button button--icon prose-video__button"
              :class="{ 'prose-video__button--active': selectedCaption !== -1 }"
              :aria-label="
                selectedCaption === -1
                  ? 'Captions: off'
                  : `Captions: ${captionTracks[selectedCaption]?.label || captionTracks[selectedCaption]?.language}`
              "
              title="Captions">
              <u-icon name="fa-solid:closed-captioning" />
            </summary>
            <span
              class="prose-video__menu"
              role="group"
              aria-label="Caption language">
              <button
                type="button"
                :aria-pressed="selectedCaption === -1"
                @click="selectCaptionOption(-1, $event)">
                Off
              </button>
              <button
                v-for="(track, index) in captionTracks"
                :key="index"
                type="button"
                :aria-pressed="selectedCaption === index"
                @click="selectCaptionOption(index, $event)">
                {{ track.label || track.language || `Track ${index + 1}` }}
              </button>
            </span>
          </details>
          <details class="prose-video__disclosure" @toggle="onMenuToggle">
            <summary
              class="button button--icon prose-video__button"
              :aria-label="`Playback speed: ${playbackRate === 1 ? 'Normal' : `${playbackRate}×`}`"
              title="Playback speed">
              <u-icon name="fa-solid:tachometer-alt" />
            </summary>
            <span
              class="prose-video__menu prose-video__menu--speed"
              role="group"
              aria-label="Playback speed options">
              <output
                class="prose-video__speed-value"
                aria-label="Current playback speed"
                >{{ playbackRate.toFixed(2) }}×</output
              >
              <span class="prose-video__speed-adjust">
                <u-button
                  variant="icon"
                  aria-label="Decrease playback speed"
                  :disabled="playbackRate <= minimumSpeed"
                  @click="adjustSpeed(-speedStep)">
                  −
                </u-button>
                <label>
                  <span class="prose-video__visually-hidden"
                    >Playback speed</span
                  >
                  <input
                    type="range"
                    :min="minimumSpeed"
                    :max="maximumSpeed"
                    :step="speedStep"
                    :value="playbackRate"
                    :aria-valuetext="`${playbackRate.toFixed(2)} times normal speed`"
                    @input="onSpeedInput" />
                </label>
                <u-button
                  variant="icon"
                  aria-label="Increase playback speed"
                  :disabled="playbackRate >= maximumSpeed"
                  @click="adjustSpeed(speedStep)">
                  +
                </u-button>
              </span>
              <span class="prose-video__speed-presets">
                <button
                  v-for="speed in speeds"
                  :key="speed"
                  type="button"
                  :aria-label="speed === 1 ? 'Normal' : `${speed}×`"
                  :aria-pressed="playbackRate === speed"
                  @click="selectSpeed(speed, $event)">
                  {{ Number.isInteger(speed) ? speed.toFixed(1) : speed }}
                </button>
              </span>
            </span>
          </details>
          <u-button
            v-if="pipSupported"
            variant="icon"
            class="prose-video__button prose-video__pip"
            :aria-label="
              inPictureInPicture
                ? 'Exit picture-in-picture'
                : 'Enter picture-in-picture'
            "
            title="Picture-in-picture"
            @click="togglePictureInPicture">
            <u-icon name="fa-solid:clone" />
          </u-button>
          <u-button
            v-if="fullscreenSupported"
            variant="icon"
            class="prose-video__button"
            :aria-label="fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            :title="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
            @click="toggleFullscreen">
            <u-icon
              :name="fullscreen ? 'fa-solid:compress' : 'fa-solid:expand'" />
          </u-button>
        </span>
      </span>
    </span>
    <span
      v-if="enhanced && (message || buffering)"
      class="prose-video__status"
      role="status">
      {{ message || "Loading video…" }}
      <a v-if="message && sourceUrl" :href="sourceUrl">Open video file</a>
    </span>
  </span>
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
const player = useTemplateRef<HTMLSpanElement>("player");
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
const speeds = [1, 1.25, 1.5, 2, 2.5, 3];
const minimumSpeed = 0.5;
const maximumSpeed = 3;
const speedStep = 0.25;
const captionTracks = ref<TextTrack[]>([]);
const selectedCaption = ref(-1);
const repositionedCues = new Set<VTTCue>();
const fullscreenSupported = ref(false);
const fullscreen = ref(false);
const pipSupported = ref(false);
const inPictureInPicture = ref(false);
const idle = ref(false);
const menuOpen = ref(false);
const touch = ref(false);
const controlsHidden = computed(
  () =>
    idle.value &&
    playing.value &&
    !buffering.value &&
    !message.value &&
    !menuOpen.value &&
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
        cue.line = -4;
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
  if (!playing.value || touch.value || menuOpen.value) {
    return;
  }
  hideTimer = setTimeout(() => {
    if (!player.value?.contains(document.activeElement)) {
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
    "The video could not be loaded. Open the video file to try native playback.";
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
        "Playback could not start. Open the video file to try native playback.";
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

const closeMenu = (event: Event): void => {
  const element = event.target;
  if (!(element instanceof HTMLElement)) {
    return;
  }
  const menu = element.closest("details");
  if (menu) {
    menu.open = false;
    menu.querySelector("summary")?.focus();
  }
};

const onMenuToggle = (event: Event): void => {
  if (!(event.target instanceof HTMLDetailsElement)) {
    return;
  }
  if (event.target.open) {
    for (const menu of player.value?.querySelectorAll("details") ?? []) {
      if (menu !== event.target) {
        menu.open = false;
      }
    }
  }
  menuOpen.value = !!player.value?.querySelector("details[open]");
  scheduleHide();
};

const dismissMenus = (event: PointerEvent): void => {
  if (!(event.target instanceof Node)) {
    return;
  }
  for (const menu of player.value?.querySelectorAll<HTMLDetailsElement>(
    "details[open]",
  ) ?? []) {
    if (!menu.contains(event.target)) {
      menu.open = false;
    }
  }
};

const onMenuKeydown = (event: KeyboardEvent): void => {
  if (
    event.key === "Escape" &&
    event.target instanceof HTMLElement &&
    player.value?.contains(event.target) &&
    event.target.closest("details[open]")
  ) {
    event.preventDefault();
    event.stopPropagation();
    closeMenu(event);
  }
};

const selectSpeed = (speed: number, event: Event): void => {
  if (video.value) {
    video.value.playbackRate = speed;
    syncMedia();
  }
  closeMenu(event);
};

const adjustSpeed = (change: number): void => {
  if (video.value) {
    video.value.playbackRate = Math.min(
      maximumSpeed,
      Math.max(minimumSpeed, playbackRate.value + change),
    );
    syncMedia();
  }
};

const onSpeedInput = (event: Event): void => {
  if (video.value && event.target instanceof HTMLInputElement) {
    video.value.playbackRate = Number(event.target.value);
    syncMedia();
  }
};

const selectCaption = (index: number): void => {
  captionTracks.value.forEach((track, trackIndex) => {
    track.mode = trackIndex === index ? "showing" : "disabled";
  });
  syncCaptions();
};

const selectCaptionOption = (index: number, event: Event): void => {
  selectCaption(index);
  closeMenu(event);
};

const onFullscreenMouseMove = (): void => {
  if (!touch.value) {
    scheduleHide();
  }
};

const syncFullscreen = (): void => {
  fullscreen.value = document.fullscreenElement === player.value;
  // Fullscreen host input need not target the player or its descendants.
  if (fullscreen.value) {
    globalThis.addEventListener("mousemove", onFullscreenMouseMove);
  } else {
    globalThis.removeEventListener("mousemove", onFullscreenMouseMove);
  }
  scheduleHide();
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
      "Fullscreen is unavailable. Open the video file for native playback.";
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
  document.addEventListener("pointerdown", dismissMenus);
  document.addEventListener("keydown", onMenuKeydown);
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
  globalThis.removeEventListener("mousemove", onFullscreenMouseMove);
  document.removeEventListener("fullscreenchange", syncFullscreen);
  document.removeEventListener("pointerdown", dismissMenus);
  document.removeEventListener("keydown", onMenuKeydown);
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
  --video-panel: rgb(0 0 0 / 65%);
  --video-border: rgb(255 255 255 / 65%);
  --video-accent: var(--global-accent-color);
  --video-hover-foreground: var(--global-accent-color);
  --button-icon-color: var(--video-foreground);
  --button-icon-hover-color: var(--video-hover-foreground);
  --button-icon-hover-background: var(--video-foreground);

  position: relative;
  container-type: inline-size;

  video {
    display: block;
    block-size: auto;
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

[data-theme="dark"] .prose-video {
  --video-hover-foreground: var(--global-alternate-accent-color);
}

.prose-video__controls {
  display: grid;
  color: var(--video-foreground);
  background: transparent;
  padding: 0 8px 4px;

  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 1;
}

.prose-video__seek {
  display: grid;
  align-items: center;
  block-size: 8px;
  margin: 0;
  position: relative;
  min-inline-size: 0;

  label {
    margin: 0;
    position: absolute;
    inset: 0;
  }
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

.prose-video__seek input {
  appearance: none;
  padding-block-start: 28px;
  position: absolute;
  inset-block-end: 0;
  margin: 0;

  &::-webkit-slider-runnable-track {
    background: transparent;
    block-size: 4px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    background: var(--video-accent);
    border: 0;
    border-radius: 50%;
    inline-size: 12px;
    block-size: 12px;
    margin-block-start: -4px;
  }

  &::-moz-range-track,
  &::-moz-range-progress {
    background: transparent;
    block-size: 4px;
  }

  &::-moz-range-thumb {
    background: var(--video-accent);
    border: 0;
    border-radius: 50%;
    inline-size: 12px;
    block-size: 12px;
  }
}

.prose-video__progress {
  appearance: none;
  background: rgb(255 255 255 / 40%);
  border: 0;
  inline-size: 100%;
  block-size: 4px;
  position: absolute;
  inset-block-end: 6px;
  pointer-events: none;

  &::-webkit-progress-bar {
    background: rgb(255 255 255 / 40%);
  }

  &::-webkit-progress-value {
    background: var(--video-accent);
  }

  &::-moz-progress-bar {
    background: var(--video-accent);
  }
}

.prose-video__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0;
}

.prose-video__playback,
.prose-video__utilities {
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 0;
  background: var(--video-panel);
  border-radius: 999px;
}

.prose-video__button {
  &--active {
    box-shadow: inset 0 -3px currentColor;
  }
}

.prose-video__controls :focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}

.prose-video__volume {
  display: grid;
  align-items: center;
  inline-size: 72px;
  margin: 0;
}

.prose-video__time {
  font-family: var(--global-font-family-monospace);
  font-size: 0.75rem;
  white-space: nowrap;
  padding-inline: 12px 8px;
}

.prose-video__spacer {
  min-inline-size: 0;
}

.prose-video__disclosure {
  position: static;

  summary {
    list-style: none;

    &::marker,
    &::-webkit-details-marker {
      display: none;
    }
  }
}

.prose-video__menu {
  display: grid;
  gap: 0;
  background: var(--video-panel);
  border: 1px solid var(--video-border);
  border-radius: var(--global-border-radius);
  padding: 4px;
  inline-size: max-content;
  max-inline-size: calc(100% - 16px);
  max-block-size: min(280px, 40cqw, 60vh);
  overflow-y: auto;
  position: absolute;
  inset-inline-end: 8px;
  inset-block-end: 100%;
  z-index: 2;

  button {
    color: var(--video-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--global-border-radius);
    font: inherit;
    text-align: start;
    padding: 8px 16px;
    min-inline-size: 88px;
    min-block-size: 44px;
    inline-size: 100%;
    font-size: 0.875rem;
    overflow-wrap: anywhere;

    &:is(:hover, :focus-visible):not(:disabled) {
      color: var(--video-hover-foreground);
      background: var(--button-icon-hover-background);
    }

    &[aria-pressed="true"] {
      box-shadow: inset 3px 0 currentColor;
      font-weight: bold;
    }
  }
}

.prose-video__menu--speed {
  gap: 8px;
  padding: 12px;
  inline-size: 360px;
  max-block-size: min(280px, 70cqw, 60vh);
}

.prose-video__speed-value {
  color: var(--video-foreground);
  font-size: 1.125rem;
  font-weight: bold;
  line-height: 1.2;
  text-align: center;
}

.prose-video__speed-adjust {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 8px;

  label {
    display: grid;
    margin: 0;
    min-inline-size: 0;
  }

  input {
    appearance: auto;
    accent-color: var(--video-accent);
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
    inline-size: 100%;
    min-inline-size: 0;
    block-size: 44px;
  }

  button {
    background: rgb(255 255 255 / 15%);
    border-radius: 50%;
    font-size: 1.25rem;
    text-align: center;
    padding: 0;
    min-inline-size: 44px;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
}

.prose-video__speed-presets {
  display: grid;
  grid-template-columns: repeat(6, minmax(44px, 1fr));
  gap: 4px;

  button {
    background: rgb(255 255 255 / 15%);
    border-radius: 999px;
    font-size: 0.75rem;
    text-align: center;
    padding: 4px;
    min-inline-size: 44px;
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

.prose-video--idle:focus-within .prose-video__controls {
  opacity: 1;
  pointer-events: auto;
}

@container (max-width: 600px) {
  .prose-video__volume {
    display: none;
  }

  .prose-video__time {
    font-size: 0.6875rem;
    padding-inline: 8px 4px;
  }
}

@container (max-width: 420px) {
  .prose-video__duration {
    display: none;
  }
}

@container (max-width: 340px) {
  .prose-video__speed-presets {
    grid-template-columns: repeat(3, minmax(44px, 1fr));
  }
}

@media (forced-colors: active) {
  .prose-video__menu,
  .prose-video__status {
    color: CanvasText;
    background: Canvas;
    border: 1px solid CanvasText;
  }

  .prose-video__playback,
  .prose-video__utilities {
    color: CanvasText;
    background: Canvas;
    outline: 1px solid CanvasText;
  }

  .prose-video__button,
  .prose-video__menu button {
    color: ButtonText;
    background: ButtonFace;
    border: 1px solid ButtonText;

    &:is(:hover, :focus-visible):not(:disabled) {
      color: HighlightText;
      background: Highlight;
    }

    &[aria-pressed="true"],
    &.prose-video__button--active {
      border-block-end: 3px solid Highlight;
    }
  }

  .prose-video__controls :focus-visible {
    outline-color: Highlight;
  }

  .prose-video__progress,
  .prose-video__progress::-webkit-progress-bar {
    background: Canvas;
    border: 1px solid CanvasText;
  }

  .prose-video__progress::-webkit-progress-value {
    background: Highlight;
  }

  .prose-video__progress::-moz-progress-bar {
    background: Highlight;
  }

  .prose-video__seek input::-webkit-slider-thumb {
    background: Highlight;
    border: 1px solid CanvasText;
  }

  .prose-video__seek input::-moz-range-thumb {
    background: Highlight;
    border: 1px solid CanvasText;
  }
}
</style>
