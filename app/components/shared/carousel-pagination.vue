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
}

.carousel-pagination__button {
  display: grid;
  place-items: center;
  inline-size: 44px;
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
  inline-size: 10px;
  block-size: 10px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background-color: var(--global-body-color);
}

.carousel-pagination__button[aria-current="true"] .carousel-pagination__dot {
  inline-size: 16px;
  block-size: 16px;
  background-color: var(--global-accent-color);
}

@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  .carousel-pagination__dot {
    transition:
      inline-size var(--global-duration-1) var(--ease-in-out-cubic),
      block-size var(--global-duration-1) var(--ease-in-out-cubic),
      background-color var(--global-duration-1) var(--ease-in-out-cubic);
  }
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
