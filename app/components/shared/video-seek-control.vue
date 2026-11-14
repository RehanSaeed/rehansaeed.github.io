<template>
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
        :disabled="tooltipDisabled"
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
          :aria-valuetext="`${formatVideoTime(currentTime)} of ${formatVideoTime(duration)}`"
          @pointerenter="onSeekPointerMove"
          @pointermove="onSeekPointerMove"
          @focus="seekPreviewTime = null"
          @keydown="seekPreviewTime = null"
          @input="onSeek" />
      </u-tooltip>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { formatVideoTime } from "../../utils/video";

const props = defineProps<{
  /** Current playback position in seconds. */
  currentTime: number;
  /** Finite media duration in seconds. */
  duration: number;
  /** Whether a seekable media range is available. */
  canSeek: boolean;
  /** Whether hidden controls or an open disclosure suppress the tooltip. */
  tooltipDisabled: boolean;
}>();
const emit = defineEmits<{ seek: [position: number] }>();
const seekPreviewTime = ref<number | null>(null);
const seekTooltip = computed(() =>
  props.canSeek
    ? formatVideoTime(seekPreviewTime.value ?? props.currentTime)
    : "",
);

const onSeek = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("seek", Number(event.target.value));
  }
};

const onSeekPointerMove = (event: PointerEvent): void => {
  if (
    event.pointerType !== "mouse" ||
    !(event.currentTarget instanceof HTMLInputElement) ||
    !props.canSeek
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
    props.duration,
    Math.round(props.duration * fraction),
  );
};
</script>

<style lang="scss">
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

.prose-video__seek-input {
  appearance: none;
  accent-color: var(--video-accent);
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  padding-block-start: 24px;
  inline-size: 100%;
  min-inline-size: 0;
  block-size: 44px;
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

@media (forced-colors: active) {
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
