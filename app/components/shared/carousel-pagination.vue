<template>
  <div class="carousel-pagination" role="group" aria-label="Choose image">
    <button
      v-for="imageNumber in count"
      :key="imageNumber"
      class="carousel-pagination__button"
      type="button"
      :aria-label="`Go to image ${imageNumber} of ${count}`"
      :aria-controls="controls"
      :aria-current="imageNumber - 1 === currentIndex ? 'true' : undefined"
      @click="emit('select', imageNumber - 1)">
      <span class="carousel-pagination__dot" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** Total number of images in the carousel. */
  count: number;
  /** Zero-based index of the image nearest the carousel's centre. */
  currentIndex: number;
  /** ID of the scroll container controlled by these buttons. */
  controls: string;
}>();
const emit = defineEmits<{ select: [index: number] }>();
</script>

<style lang="scss">
.carousel-pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--global-space-fixed-1);
}

.carousel-pagination__button {
  display: grid;
  place-items: center;
  inline-size: 28px;
  block-size: 44px;
  padding: 0;

  border: 0;
  border-radius: var(--global-border-radius);
  background-color: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.carousel-pagination__dot {
  inline-size: 14px;
  block-size: 14px;
  border-radius: 50%;
  background-color: color-mix(
    in srgb,
    var(--global-body-color) 75%,
    var(--global-background-color)
  );
}

.carousel-pagination__button[aria-current="true"] .carousel-pagination__dot {
  inline-size: 20px;
  block-size: 20px;
  background-color: var(--global-title-color);
}

@media (forced-colors: active) {
  .carousel-pagination__dot {
    border: 1px solid ButtonText;
    background-color: Canvas;
    forced-color-adjust: none;
  }

  .carousel-pagination__button[aria-current="true"] .carousel-pagination__dot {
    border-color: Highlight;
    background-color: Highlight;
  }

  .carousel-pagination__button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
