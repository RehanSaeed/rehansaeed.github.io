<template>
  <fieldset ref="controls" class="prose-video__controls">
    <legend class="prose-video__visually-hidden">{{ controlsLabel }}</legend>
    <u-video-seek-control
      :current-time="currentTime"
      :duration="duration"
      :can-seek="canSeek"
      :tooltip-disabled="controlsHidden || menuOpen"
      @seek="emit('seek', $event)" />
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
          >{{ formatVideoTime(currentTime)
          }}<span class="prose-video__duration">
            / {{ formatVideoTime(duration) }}</span
          ></span
        >
      </div>
      <div class="prose-video__spacer"></div>
      <div class="prose-video__utilities">
        <u-video-caption-control
          :caption-tracks="captionTracks"
          :selected-caption="selectedCaption"
          :tooltip-disabled="controlsHidden || menuOpen"
          @caption="emit('caption', $event)"
          @dismiss="closeMenu"
          @menu-toggle="onMenuToggle" />
        <u-video-speed-control
          :playback-rate="playbackRate"
          :tooltip-disabled="controlsHidden || menuOpen"
          @speed="emit('speed', $event)"
          @dismiss="closeMenu"
          @menu-toggle="onMenuToggle" />
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
import { formatVideoTime } from "../../utils/video";

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
const { muted, volume } = toRefs(props);
const controls = useTemplateRef<HTMLFieldSetElement>("controls");
const menuOpen = ref(false);
const volumePercent = computed(() =>
  muted.value ? 0 : Math.round(volume.value * 100),
);
const onVolume = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("volume", Number(event.target.value));
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
});

onUnmounted(() => {
  document.removeEventListener("pointerdown", dismissMenus);
  document.removeEventListener("keydown", onMenuKeydown);
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

.prose-video__button.button--icon {
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
  .prose-video__menu-button {
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
  .prose-video__button--active {
    border-block-end: 3px solid Highlight;
  }

  .prose-video__controls :focus-visible {
    outline-color: Highlight;
  }
}
</style>
