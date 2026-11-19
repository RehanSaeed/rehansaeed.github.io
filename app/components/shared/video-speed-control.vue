<template>
  <details class="prose-video__disclosure" @toggle="emit('menuToggle', $event)">
    <u-tooltip
      v-slot="{ trigger }"
      text="Playback speed"
      :disabled="tooltipDisabled">
      <summary
        v-bind="trigger"
        role="button"
        tabindex="0"
        class="button button--icon prose-video__button prose-video__summary"
        :class="{ 'prose-video__summary--pressed': pressed }"
        @keydown.space="pressed = true"
        @keydown.enter="pressed = true"
        @keyup.space="pressed = false"
        @keyup.enter="pressed = false"
        @blur="clearPressed"
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
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  /** Current playback speed relative to normal speed. */
  playbackRate: number;
  /** Whether hidden controls or an open disclosure suppress the tooltip. */
  tooltipDisabled: boolean;
}>();
const emit = defineEmits<{
  speed: [rate: number];
  dismiss: [event: Event];
  menuToggle: [event: Event];
}>();
const pressed = ref(false);
const clearPressed = (): void => {
  pressed.value = false;
};
const speeds = [1, 1.25, 1.5, 2, 2.5, 3];
const minimumSpeed = 0.5;
const maximumSpeed = 3;
const speedStep = 0.25;

const onSpeedInput = (event: Event): void => {
  if (event.target instanceof HTMLInputElement) {
    emit("speed", Number(event.target.value));
  }
};

const selectSpeed = (speed: number, event: Event): void => {
  emit("speed", speed);
  emit("dismiss", event);
};

const adjustSpeed = (change: number): void => {
  emit(
    "speed",
    Math.min(maximumSpeed, Math.max(minimumSpeed, props.playbackRate + change)),
  );
};

onMounted(() => {
  window.addEventListener("blur", clearPressed);
});
onUnmounted(() => {
  window.removeEventListener("blur", clearPressed);
});
</script>

<style lang="scss">
.prose-video__menu.prose-video__menu--speed {
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
  background-clip: content-box;
  font-size: 20px;
  padding: 4px;
  inline-size: 44px;
  block-size: 44px;
}

.prose-video__menu-button.prose-video__speed-preset {
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

@container (max-width: 340px) {
  .prose-video__speed-adjust,
  .prose-video__speed-presets {
    grid-template-columns: repeat(3, 44px);
  }

  @media (forced-colors: active) {
    .prose-video__speed-step.button,
    .prose-video__menu-button.prose-video__speed-preset {
      color: ButtonText;
      background: ButtonFace;
      border: 1px solid ButtonText;
    }
  }
}
</style>
