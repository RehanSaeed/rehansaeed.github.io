<template>
  <details
    v-if="captionTracks.length"
    class="prose-video__disclosure"
    @toggle="emit('menuToggle', $event)">
    <u-tooltip v-slot="{ trigger }" text="Captions" :disabled="tooltipDisabled">
      <summary
        v-bind="trigger"
        role="button"
        tabindex="0"
        class="button button--icon prose-video__button prose-video__summary"
        :class="{
          'prose-video__button--active': selectedCaption !== -1,
          'prose-video__summary--pressed': pressed,
        }"
        @keydown.space="pressed = true"
        @keydown.enter="pressed = true"
        @keyup.space="pressed = false"
        @keyup.enter="pressed = false"
        @blur="clearPressed"
        :aria-label="
          selectedCaption === -1
            ? 'Captions: off'
            : `Captions: ${captionTracks[selectedCaption]?.label || captionTracks[selectedCaption]?.language}`
        ">
        <u-icon name="fa-solid:closed-captioning" />
      </summary>
    </u-tooltip>
    <fieldset class="prose-video__menu">
      <legend class="prose-video__visually-hidden">Caption language</legend>
      <button
        class="prose-video__menu-button"
        type="button"
        :aria-pressed="selectedCaption === -1"
        @click="selectCaption(-1, $event)">
        Off
      </button>
      <button
        v-for="(track, index) in captionTracks"
        :key="index"
        class="prose-video__menu-button"
        type="button"
        :aria-pressed="selectedCaption === index"
        @click="selectCaption(index, $event)">
        {{ track.label || track.language || `Track ${index + 1}` }}
      </button>
    </fieldset>
  </details>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

defineProps<{
  /** Successfully loaded caption and subtitle tracks. */
  captionTracks: TextTrack[];
  /** Index of the showing caption track, or minus one when disabled. */
  selectedCaption: number;
  /** Whether hidden controls or an open disclosure suppress the tooltip. */
  tooltipDisabled: boolean;
}>();
const emit = defineEmits<{
  caption: [index: number];
  dismiss: [event: Event];
  menuToggle: [event: Event];
}>();
const pressed = ref(false);
const clearPressed = (): void => {
  pressed.value = false;
};
const selectCaption = (index: number, event: Event): void => {
  emit("caption", index);
  emit("dismiss", event);
};

onMounted(() => {
  window.addEventListener("blur", clearPressed);
});
onUnmounted(() => {
  window.removeEventListener("blur", clearPressed);
});
</script>

<style lang="scss">
.prose-video__menu:not(.prose-video__menu--speed)
  .prose-video__menu-button[aria-pressed="true"] {
  box-shadow: inset 3px 0 currentColor;
  font-weight: bold;
}

@media (forced-colors: active) {
  .prose-video__menu:not(.prose-video__menu--speed)
    .prose-video__menu-button[aria-pressed="true"] {
    border-block-end: 3px solid Highlight;
  }
}
</style>
