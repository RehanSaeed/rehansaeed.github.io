<template>
  <fieldset class="carousel-pagination">
    <legend class="carousel-pagination__legend">Choose image</legend>
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
  </fieldset>
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
@use "~/assets/style/abstracts/visually-hidden";

.carousel-pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.carousel-pagination__legend {
  @include visually-hidden.visually-hidden();
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
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.carousel-pagination__dot {
  position: relative;
  inline-size: 10px;
  block-size: 10px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background-color: var(--global-body-color);

  &::after {
    position: absolute;
    inset: calc(var(--global-space-fixed-1) * -1);
    border: var(--global-border-width-2) solid var(--global-accent-color);
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
    content: "";
  }
}

.carousel-pagination__button[aria-current="true"] .carousel-pagination__dot {
  inline-size: 1rem;
  block-size: 1rem;
  border-color: var(--global-accent-color);
  background-color: var(--global-accent-color);
}

@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  .carousel-pagination__dot {
    transition:
      inline-size var(--global-duration-1) var(--ease-in-out-cubic),
      block-size var(--global-duration-1) var(--ease-in-out-cubic),
      background-color var(--global-duration-1) var(--ease-in-out-cubic);
  }

  .carousel-pagination__button[aria-current="true"]
    .carousel-pagination__dot::after {
    animation: carousel-pagination-ripple var(--global-duration-3)
      var(--ease-out-cubic);
  }
}

@keyframes carousel-pagination-ripple {
  from {
    opacity: 0.8;
    transform: scale(0.65);
  }
  to {
    opacity: 0;
    transform: scale(1.8);
  }
}

@media (forced-colors: active) {
  .carousel-pagination__dot {
    border-color: ButtonText;
    background-color: ButtonText;
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
