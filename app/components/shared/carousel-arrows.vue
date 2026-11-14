<template>
  <fieldset
    class="carousel-arrows"
    :class="{ 'carousel-arrows--dragging': dragging }">
    <legend class="carousel-arrows__legend">Gallery navigation</legend>
    <span
      ref="previousArrow"
      class="carousel-arrows__shell"
      :class="{ 'carousel-arrows__shell--unavailable': currentIndex === 0 }">
      <u-button
        class="carousel-arrows__button"
        variant="icon"
        aria-label="Previous image"
        :aria-controls="controls"
        :aria-disabled="currentIndex === 0"
        @click="emit('select', currentIndex - 1)">
        <u-icon name="feather:arrow-left" aria-hidden="true" />
      </u-button>
    </span>
    <span
      ref="nextArrow"
      class="carousel-arrows__shell"
      :class="{
        'carousel-arrows__shell--unavailable': currentIndex === count - 1,
      }">
      <u-button
        class="carousel-arrows__button"
        variant="icon"
        aria-label="Next image"
        :aria-controls="controls"
        :aria-disabled="currentIndex === count - 1"
        @click="emit('select', currentIndex + 1)">
        <u-icon name="feather:arrow-right" aria-hidden="true" />
      </u-button>
    </span>
  </fieldset>
</template>

<script setup lang="ts">
import { useTemplateRef, watch } from "vue";

const props = defineProps<{
  /** Total number of images in the carousel. */
  count: number;
  /** Zero-based index of the image nearest the carousel's centre. */
  currentIndex: number;
  /** ID of the scroll container controlled by these buttons. */
  controls: string;
  /** Whether an active horizontal gesture should hide both arrows. */
  dragging: boolean;
}>();
const emit = defineEmits<{ select: [index: number]; focusTrack: [] }>();
const previousArrow = useTemplateRef<HTMLSpanElement>("previousArrow");
const nextArrow = useTemplateRef<HTMLSpanElement>("nextArrow");

watch(
  () => props.currentIndex,
  (index) => {
    const unavailable =
      index === 0
        ? previousArrow.value
        : index === props.count - 1
          ? nextArrow.value
          : undefined;
    if (unavailable?.contains(document.activeElement)) {
      emit("focusTrack");
    }
  },
);
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.carousel-arrows {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;

  &--dragging {
    visibility: hidden;
  }
}

.carousel-arrows__legend {
  @include visually-hidden.visually-hidden();
}

.carousel-arrows__shell {
  border-radius: 50%;
  background-color: rgb(0 0 0 / 65%);

  &--unavailable {
    visibility: hidden;
  }
}

.carousel-arrows .carousel-arrows__button {
  --button-icon-color: #fff;
  --button-icon-hover-color: var(
    --carousel-arrows-hover-color,
    var(--global-accent-color)
  );
  --button-icon-hover-background: #fff;

  background-clip: content-box;
  font-size: var(--global-font-size-2);
  padding: var(--global-space-fixed-1);
  pointer-events: auto;

  &:focus-visible {
    outline-offset: calc(var(--global-focus-outline-offset) * -2);
  }
}

[data-theme="dark"] .carousel-arrows {
  --carousel-arrows-hover-color: var(--global-alternate-accent-color);
}

@media (hover: hover) and (pointer: fine) {
  .carousel-arrows__shell {
    opacity: var(--carousel-arrows-opacity, 0);
  }

  .carousel-arrows .carousel-arrows__button {
    pointer-events: var(--carousel-arrows-pointer-events, none);
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  .carousel-arrows__shell {
    transition: var(
      --carousel-arrows-transition,
      opacity var(--global-duration-1) var(--ease-in-out-cubic)
    );
  }
}

@media (any-pointer: coarse) {
  .carousel-arrows__shell {
    opacity: 1;
  }

  .carousel-arrows .carousel-arrows__button {
    pointer-events: auto;
  }
}

@media (forced-colors: active) {
  .carousel-arrows__shell {
    background-color: ButtonFace;
  }
}
</style>
