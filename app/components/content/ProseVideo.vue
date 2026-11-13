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
    <u-video-controls
      v-if="enhanced"
      :controls-label="controlsLabel"
      :controls-hidden="controlsHidden"
      :playing="playing"
      :ended="ended"
      :muted="muted"
      :volume="volume"
      :volume-supported="volumeSupported"
      :current-time="currentTime"
      :duration="duration"
      :can-seek="canSeek"
      :playback-rate="playbackRate"
      :caption-tracks="captionTracks"
      :selected-caption="selectedCaption"
      :fullscreen-supported="fullscreenSupported"
      :fullscreen="fullscreen"
      :pip-supported="pipSupported"
      :in-picture-in-picture="inPictureInPicture"
      @toggle-playback="togglePlayback"
      @toggle-mute="toggleMute"
      @seek="onSeek"
      @volume="onVolume"
      @speed="selectSpeed"
      @caption="selectCaption"
      @toggle-fullscreen="toggleFullscreen"
      @toggle-picture-in-picture="togglePictureInPicture"
      @menu-open="onControlsMenu" />
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

const onControlsMenu = (open: boolean): void => {
  menuOpen.value = open;
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

const onSeek = (target: number): void => {
  const element = video.value;
  if (element && canSeek.value) {
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

const onVolume = (percentage: number): void => {
  if (video.value) {
    video.value.volume = percentage / 100;
    video.value.muted = video.value.volume === 0;
  }
};

const selectSpeed = (speed: number): void => {
  if (video.value) {
    video.value.playbackRate = speed;
    syncMedia();
  }
};

const selectCaption = (index: number): void => {
  captionTracks.value.forEach((track, trackIndex) => {
    track.mode = trackIndex === index ? "showing" : "disabled";
  });
  syncCaptions();
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
  --video-accent: var(--global-accent-color);
  --video-hover-foreground: var(--global-accent-color);
  --video-control-gap: 8px;
  --button-icon-color: var(--video-foreground);
  --button-icon-hover-color: var(--video-hover-foreground);
  --button-icon-hover-background: var(--video-foreground);
  --button-icon-active-color: var(--video-foreground);
  --button-icon-active-background: var(--video-hover-foreground);
  --button-icon-disabled-color: rgb(255 255 255 / 65%);
  --button-icon-disabled-background: rgb(255 255 255 / 15%);

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

@media (forced-colors: active) {
  .prose-video__status {
    color: CanvasText;
    background: Canvas;
    border: 1px solid CanvasText;
  }
}
</style>
