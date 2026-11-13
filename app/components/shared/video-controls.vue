<template>
  <fieldset ref="controls" class="prose-video__controls">
    <legend class="prose-video__visually-hidden">{{ controlsLabel }}</legend>
    <div class="prose-video__seek">
      <progress
        class="prose-video__progress"
        :value="currentTime"
        :max="duration || 1"
        aria-hidden="true"></progress>
      <label class="prose-video__seek-label">
        <span class="prose-video__visually-hidden">Video position</span>
        <u-tooltip
          v-slot="{ trigger }"
          :text="seekTooltip"
          :disabled="controlsHidden || menuOpen"
          follow-pointer>
          <input
            v-bind="trigger"
            class="prose-video__seek-input"
            type="range"
            min="0"
            :max="duration || 1"
            step="1"
            :value="currentTime"
            :disabled="!canSeek"
            :aria-valuetext="`${formatTime(currentTime)} of ${formatTime(duration)}`"
            @pointerenter="onSeekPointerMove"
            @pointermove="onSeekPointerMove"
            @focus="seekPreviewTime = null"
            @keydown="seekPreviewTime = null"
            @input="onSeek" />
        </u-tooltip>
      </label>
    </div>
    <div class="prose-video__row">
      <div class="prose-video__playback">
        <u-tooltip
          v-slot="{ trigger }"
          :text="ended ? 'Replay' : playing ? 'Pause' : 'Play'"
          :disabled="controlsHidden || menuOpen">
          <u-button
            v-bind="trigger"
            variant="icon"
            class="prose-video__button"
            :aria-label="
              ended ? 'Replay video' : playing ? 'Pause video' : 'Play video'
            "
            @click="emit('togglePlayback')">
            <u-icon
              :name="
                ended
                  ? 'fa-solid:undo'
                  : playing
                    ? 'fa-solid:pause'
                    : 'fa-solid:play'
              " />
          </u-button>
        </u-tooltip>
        <u-tooltip
          v-slot="{ trigger }"
          :text="muted ? 'Unmute' : 'Mute'"
          :disabled="controlsHidden || menuOpen">
          <u-button
            v-bind="trigger"
            variant="icon"
            class="prose-video__button"
            :aria-label="muted ? 'Unmute video' : 'Mute video'"
            :aria-pressed="muted"
            @click="emit('toggleMute')">
            <u-icon
              :name="
                muted || volume === 0
                  ? 'fa-solid:volume-mute'
                  : 'fa-solid:volume-up'
              " />
          </u-button>
        </u-tooltip>
        <label v-if="volumeSupported" class="prose-video__volume">
          <span class="prose-video__visually-hidden">Volume</span>
          <u-tooltip
            v-slot="{ trigger }"
            :text="`Volume: ${volumePercent}%`"
            :disabled="controlsHidden || menuOpen">
            <input
              v-bind="trigger"
              class="prose-video__volume-input"
              type="range"
              min="0"
              max="100"
              step="1"
              :value="volumePercent"
              :aria-valuetext="`${volumePercent} percent`"
              @input="onVolume" />
          </u-tooltip>
        </label>
        <span class="prose-video__time"
          >{{ formatTime(currentTime)
          }}<span class="prose-video__duration">
            / {{ formatTime(duration) }}</span
          ></span
        >
      </div>
      <div class="prose-video__spacer"></div>
      <div class="prose-video__utilities">
        <details
          v-if="captionTracks.length"
          class="prose-video__disclosure"
          @toggle="onMenuToggle">
          <u-tooltip
            v-slot="{ trigger }"
            text="Captions"
            :disabled="controlsHidden || menuOpen">
            <summary
              v-bind="trigger"
              role="button"
              tabindex="0"
              class="button button--icon prose-video__button prose-video__summary"
              :class="{
                'prose-video__button--active': selectedCaption !== -1,
                'prose-video__summary--pressed':
                  pressedDisclosure === 'captions',
              }"
              @keydown.space="pressedDisclosure = 'captions'"
              @keydown.enter="pressedDisclosure = 'captions'"
              @keyup.space="pressedDisclosure = null"
              @keyup.enter="pressedDisclosure = null"
              @blur="clearPressedDisclosure"
              :aria-label="
                selectedCaption === -1
                  ? 'Captions: off'
                  : `Captions: ${captionTracks[selectedCaption]?.label || captionTracks[selectedCaption]?.language}`
              ">
              <u-icon name="fa-solid:closed-captioning" />
            </summary>
          </u-tooltip>
          <fieldset class="prose-video__menu">
            <legend class="prose-video__visually-hidden">
              Caption language
            </legend>
            <button
              class="prose-video__menu-button"
              type="button"
              :aria-pressed="selectedCaption === -1"
              @click="selectCaptionOption(-1, $event)">
              Off
            </button>
            <button
              v-for="(track, index) in captionTracks"
              :key="index"
              class="prose-video__menu-button"
              type="button"
              :aria-pressed="selectedCaption === index"
              @click="selectCaptionOption(index, $event)">
              {{ track.label || track.language || `Track ${index + 1}` }}
            </button>
          </fieldset>
        </details>
        <details class="prose-video__disclosure" @toggle="onMenuToggle">
          <u-tooltip
            v-slot="{ trigger }"
            text="Playback speed"
            :disabled="controlsHidden || menuOpen">
            <summary
              v-bind="trigger"
              role="button"
              tabindex="0"
              class="button button--icon prose-video__button prose-video__summary"
              :class="{
                'prose-video__summary--pressed': pressedDisclosure === 'speed',
              }"
              @keydown.space="pressedDisclosure = 'speed'"
              @keydown.enter="pressedDisclosure = 'speed'"
              @keyup.space="pressedDisclosure = null"
              @keyup.enter="pressedDisclosure = null"
              @blur="clearPressedDisclosure"
              :aria-label="`Playback speed: ${playbackRate === 1 ? 'Normal' : `${playbackRate}×`}`">
              <u-icon name="fa-solid:tachometer-alt" />
            </summary>
          </u-tooltip>
          <fieldset class="prose-video__menu prose-video__menu--speed">
            <legend class="prose-video__visually-hidden">
              Playback speed options
            </legend>
            <strong class="prose-video__menu-title">Playback Speed</strong>
            <output
              class="prose-video__speed-value"
              aria-label="Current playback speed"
              >{{ playbackRate.toFixed(2) }}×</output
            >
            <div class="prose-video__speed-adjust">
              <u-button
                variant="icon"
                class="prose-video__menu-button prose-video__speed-step"
                aria-label="Decrease playback speed"
                :disabled="playbackRate <= minimumSpeed"
                @click="adjustSpeed(-speedStep)">
                <u-icon name="fa-solid:minus" />
              </u-button>
              <label class="prose-video__speed-label">
                <span class="prose-video__visually-hidden">Playback speed</span>
                <input
                  class="prose-video__speed-input"
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
                class="prose-video__menu-button prose-video__speed-step"
                aria-label="Increase playback speed"
                :disabled="playbackRate >= maximumSpeed"
                @click="adjustSpeed(speedStep)">
                <u-icon name="fa-solid:plus" />
              </u-button>
            </div>
            <div class="prose-video__speed-presets">
              <button
                v-for="speed in speeds"
                :key="speed"
                class="prose-video__menu-button prose-video__speed-preset"
                type="button"
                :aria-label="speed === 1 ? 'Normal' : `${speed}×`"
                :aria-pressed="playbackRate === speed"
                @click="selectSpeed(speed, $event)">
                {{ speed.toFixed(1) }}
              </button>
            </div>
          </fieldset>
        </details>
        <u-tooltip
          v-if="pipSupported"
          v-slot="{ trigger }"
          text="Picture-in-picture"
          :disabled="controlsHidden || menuOpen">
          <u-button
            v-bind="trigger"
            variant="icon"
            class="prose-video__button prose-video__pip"
            :aria-label="
              inPictureInPicture
                ? 'Exit picture-in-picture'
                : 'Enter picture-in-picture'
            "
            @click="emit('togglePictureInPicture')">
            <u-icon name="fa-solid:clone" />
          </u-button>
        </u-tooltip>
        <u-tooltip
          v-if="fullscreenSupported"
          v-slot="{ trigger }"
          :text="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          :disabled="controlsHidden || menuOpen">
          <u-button
            v-bind="trigger"
            variant="icon"
            class="prose-video__button"
            :aria-label="fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            @click="emit('toggleFullscreen')">
            <u-icon
              :name="fullscreen ? 'fa-solid:compress' : 'fa-solid:expand'" />
          </u-button>
        </u-tooltip>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRefs,
  useTemplateRef,
} from "vue";

const props = defineProps<{
  /** Accessible name of the video control group. */
  controlsLabel: string;
  /** Whether pointer-idle playback has hidden the controls. */
  controlsHidden: boolean;
  /** Whether the video is currently playing. */
  playing: boolean;
  /** Whether playback has reached the end. */
  ended: boolean;
  /** Whether audio is muted. */
  muted: boolean;
  /** Current audio volume between zero and one. */
  volume: number;
  /** Whether the browser supports an in-page volume control. */
  volumeSupported: boolean;
  /** Current playback position in seconds. */
  currentTime: number;
  /** Finite media duration in seconds. */
  duration: number;
  /** Whether a seekable media range is available. */
  canSeek: boolean;
  /** Current playback speed relative to normal speed. */
  playbackRate: number;
  /** Successfully loaded caption and subtitle tracks. */
  captionTracks: TextTrack[];
  /** Index of the showing caption track, or minus one when disabled. */
  selectedCaption: number;
  /** Whether the player supports fullscreen. */
  fullscreenSupported: boolean;
  /** Whether the player currently occupies fullscreen. */
  fullscreen: boolean;
  /** Whether the video supports picture-in-picture. */
  pipSupported: boolean;
  /** Whether the video is currently in picture-in-picture. */
  inPictureInPicture: boolean;
}>();
const emit = defineEmits<{
  togglePlayback: [];
  toggleMute: [];
  seek: [position: number];
  volume: [percentage: number];
  speed: [rate: number];
  caption: [index: number];
  toggleFullscreen: [];
  togglePictureInPicture: [];
  menuOpen: [open: boolean];
}>();
const { muted, volume, currentTime, duration, canSeek, playbackRate } =
  toRefs(props);
const controls = useTemplateRef<HTMLFieldSetElement>("controls");
const menuOpen = ref(false);
const seekPreviewTime = ref<number | null>(null);
const pressedDisclosure = ref<"captions" | "speed" | null>(null);
const clearPressedDisclosure = () => {
  pressedDisclosure.value = null;
};
const volumePercent = computed(() =>
  muted.value ? 0 : Math.round(volume.value * 100),
);
const seekTooltip = computed(() =>
  canSeek.value ? formatTime(seekPreviewTime.value ?? currentTime.value) : "",
);
const speeds = [1, 1.25, 1.5, 2, 2.5, 3];
const minimumSpeed = 0.5;
const maximumSpeed = 3;
const speedStep = 0.25;

const onSeek = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("seek", Number(event.target.value));
  }
};

const onVolume = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("volume", Number(event.target.value));
  }
};

const onSpeedInput = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("speed", Number(event.target.value));
  }
};

const selectSpeed = (speed: number, event: Event): void => {
  emit("speed", speed);
  closeMenu(event);
};

const adjustSpeed = (change: number): void => {
  emit(
    "speed",
    Math.min(maximumSpeed, Math.max(minimumSpeed, playbackRate.value + change)),
  );
};

const selectCaptionOption = (index: number, event: Event): void => {
  emit("caption", index);
  closeMenu(event);
};

const onSeekPointerMove = (event: PointerEvent): void => {
  if (
    event.pointerType !== "mouse" ||
    !(event.currentTarget instanceof HTMLInputElement) ||
    !canSeek.value
  ) {
    return;
  }
  const bounds = event.currentTarget.getBoundingClientRect();
  if (bounds.width <= 0) {
    return;
  }
  const fraction = Math.max(
    0,
    Math.min(1, (event.clientX - bounds.left) / bounds.width),
  );
  seekPreviewTime.value = Math.min(
    duration.value,
    Math.round(duration.value * fraction),
  );
};

const formatTime = (seconds: number): string => {
  const total = Math.floor(Number.isFinite(seconds) ? Math.max(0, seconds) : 0);
  const minutes = Math.floor(total / 60);
  const time = `${minutes % 60}:${String(total % 60).padStart(2, "0")}`;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${time.padStart(5, "0")}`
    : time;
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
    for (const menu of controls.value?.querySelectorAll("details") ?? []) {
      if (menu !== event.target) {
        menu.open = false;
      }
    }
  }
  menuOpen.value = !!controls.value?.querySelector("details[open]");
  emit("menuOpen", menuOpen.value);
};

const dismissMenus = (event: PointerEvent): void => {
  if (!(event.target instanceof Node)) {
    return;
  }
  for (const menu of controls.value?.querySelectorAll<HTMLDetailsElement>(
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
    controls.value?.contains(event.target) &&
    event.target.closest("details[open]")
  ) {
    event.preventDefault();
    event.stopPropagation();
    closeMenu(event);
  }
};

onMounted(() => {
  document.addEventListener("pointerdown", dismissMenus);
  document.addEventListener("keydown", onMenuKeydown);
  window.addEventListener("blur", clearPressedDisclosure);
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", dismissMenus);
  document.removeEventListener("keydown", onMenuKeydown);
  window.removeEventListener("blur", clearPressedDisclosure);
});
</script>

<style lang="scss">
.prose-video__controls {
  display: grid;
  color: var(--video-foreground);
  background: transparent;
  border: 0;
  padding-block: 0 8px;
  padding-inline: 8px;
  margin: 0;
  min-inline-size: 0;

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
}

.prose-video__seek-label {
  margin: 0;
  position: absolute;
  inset: 0;
}

.prose-video__seek-input,
.prose-video__volume-input {
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

.prose-video__seek-input {
  appearance: none;
  padding-block-start: 24px;
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
  inset-block-end: 8px;
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

.prose-video__seek:is(:hover, :focus-within) .prose-video__progress {
  block-size: 6px;
  inset-block-end: 7px;
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
  gap: min(3px, var(--video-control-gap));
  background: var(--video-panel);
  border-radius: 999px;
}

.prose-video__button {
  &--active {
    box-shadow: inset 0 -3px currentColor;
  }
}

.prose-video__button.button--icon,
.prose-video__speed-step.button.button--icon {
  background-clip: content-box;
  font-size: 20px;
  padding: 4px;
}

.prose-video__controls :focus-visible {
  outline: var(--global-border-width-2) solid var(--video-accent);
  outline-offset: var(--global-focus-outline-offset);
}

.prose-video__volume {
  display: grid;
  align-items: center;
  inline-size: 72px;
  margin-block: 0;
  margin-inline: 0;
}

.prose-video__time {
  font-family: var(--global-font-family-monospace);
  font-size: 0.75rem;
  white-space: nowrap;
  padding-inline: 12px 16px;
}

.prose-video__spacer {
  min-inline-size: 0;
}

.prose-video__disclosure {
  position: static;
}

.prose-video__summary {
  list-style: none;

  &::marker,
  &::-webkit-details-marker {
    display: none;
  }
}

.prose-video__summary.button.button--icon.prose-video__summary--pressed:not(
    :disabled
  ) {
  color: var(--button-icon-active-color);
  background-color: var(--button-icon-active-background);
}

.prose-video__menu {
  display: grid;
  gap: 0;
  background: var(--video-panel);
  border: 0;
  border-radius: var(--global-border-radius);
  padding: 5px;
  margin: 0;
  inline-size: max-content;
  min-inline-size: 0;
  max-inline-size: calc(100% - 16px);
  max-block-size: min(280px, 40cqw, 60vh);
  overflow-y: auto;
  position: absolute;
  inset-inline-end: 8px;
  inset-block-end: calc(100% + 12px);
  z-index: 2;
}

.prose-video__menu-button {
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
    background-color: var(--button-icon-hover-background);
  }

  &:active:not(:disabled) {
    color: var(--button-icon-active-color);
    background-color: var(--button-icon-active-background);
  }
}

.prose-video__menu:not(.prose-video__menu--speed)
  .prose-video__menu-button[aria-pressed="true"] {
  box-shadow: inset 3px 0 currentColor;
  font-weight: bold;
}

.prose-video__menu--speed {
  gap: 4px;
  padding: 10px;
  inline-size: 314px;
  max-block-size: min(280px, 70cqw, 60vh);
}

.prose-video__menu-title {
  color: var(--video-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.prose-video__speed-value {
  color: var(--video-foreground);
  font-family: var(--global-font-family-monospace);
  font-size: 0.875rem;
  font-weight: normal;
  line-height: 1.2;
  text-align: center;
}

.prose-video__speed-adjust,
.prose-video__speed-presets {
  display: grid;
  grid-template-columns: repeat(6, 44px);
  justify-content: center;
  gap: min(6px, var(--video-control-gap));
}

.prose-video__speed-adjust {
  align-items: center;
}

.prose-video__speed-label {
  display: grid;
  grid-column: 2 / -2;
  margin: 0;
  min-inline-size: 0;
}

.prose-video__speed-input {
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

.prose-video__speed-step.button {
  background: rgb(255 255 255 / 15%);
  border-radius: 50%;
  text-align: center;
  min-inline-size: 44px;

  &:disabled {
    cursor: default;
  }
}

.prose-video__speed-step.button.button--icon {
  inline-size: 44px;
  block-size: 44px;
}

.prose-video__speed-preset {
  background: rgb(255 255 255 / 15%);
  background-clip: content-box;
  border-radius: 50%;
  font-family: var(--global-font-family-monospace);
  font-size: 0.75rem;
  text-align: center;
  padding: 4px;
  inline-size: 44px;
  min-inline-size: 44px;
  block-size: 44px;
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
    padding-inline: 8px 8px;
  }
}

@container (max-width: 420px) {
  .prose-video__duration {
    display: none;
  }
}

@container (max-width: 340px) {
  .prose-video__controls {
    --video-control-gap: 0px;
  }

  .prose-video__time {
    padding-inline-start: 4px;
  }

  .prose-video__speed-adjust,
  .prose-video__speed-presets {
    grid-template-columns: repeat(3, 44px);
  }
}

@media (forced-colors: active) {
  .prose-video__summary.button.button--icon.prose-video__summary--pressed:not(
      :disabled
    ) {
    color: ButtonFace;
    background-color: ButtonText;
    border-color: ButtonText;
  }

  .prose-video__menu {
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
  .prose-video__menu-button,
  .prose-video__speed-step.button {
    color: ButtonText;
    background: ButtonFace;
    border: 1px solid ButtonText;

    &:is(:hover, :focus-visible):not(:disabled) {
      color: HighlightText;
      background: Highlight;
    }

    &:active:not(:disabled) {
      color: ButtonFace;
      background-color: ButtonText;
      border-color: ButtonText;
    }
  }

  .prose-video__button[aria-pressed="true"],
  .prose-video__button--active,
  .prose-video__menu:not(.prose-video__menu--speed)
    .prose-video__menu-button[aria-pressed="true"] {
    border-block-end: 3px solid Highlight;
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

  .prose-video__seek-input::-webkit-slider-thumb {
    background: Highlight;
    border: 1px solid CanvasText;
  }

  .prose-video__seek-input::-moz-range-thumb {
    background: Highlight;
    border: 1px solid CanvasText;
  }
}
</style>
