<template>
  <fieldset
    class="carousel-pagination"
    :class="[
      `carousel-pagination--${variant}`,
      { 'carousel-pagination--comparison': label },
    ]">
    <legend
      class="carousel-pagination__legend"
      :class="{ 'carousel-pagination__legend--visible': label }">
      {{ label ?? "Choose image" }}
    </legend>
    <template v-if="variant === 'counter'">
      <button
        class="carousel-pagination__button"
        type="button"
        :aria-label="label ? `${label}: Previous image` : 'Previous image'"
        :aria-controls="controls"
        :aria-disabled="currentIndex === 0"
        @click="emit('select', currentIndex - 1)">
        <span aria-hidden="true">&larr;</span>
      </button>
      <span class="carousel-pagination__counter" aria-hidden="true">
        {{ currentIndex + 1 }} / {{ count }}
      </span>
      <button
        class="carousel-pagination__button"
        type="button"
        :aria-label="label ? `${label}: Next image` : 'Next image'"
        :aria-controls="controls"
        :aria-disabled="currentIndex === count - 1"
        @click="emit('select', currentIndex + 1)">
        <span aria-hidden="true">&rarr;</span>
      </button>
    </template>
    <select
      v-else-if="variant === 'select'"
      class="carousel-pagination__select"
      :aria-label="label ? `${label}: Choose image` : 'Choose image'"
      :aria-controls="controls"
      :value="currentIndex"
      @change="onChange">
      <option
        v-for="imageNumber in count"
        :key="imageNumber"
        :value="imageNumber - 1">
        Image {{ imageNumber }} of {{ count }}
      </option>
    </select>
    <template v-else>
      <button
        v-for="imageNumber in count"
        :key="imageNumber"
        class="carousel-pagination__button"
        type="button"
        :aria-label="
          label
            ? `${label}: Select image ${imageNumber} of ${count}`
            : `Go to image ${imageNumber} of ${count}`
        "
        :aria-controls="controls"
        :aria-current="imageNumber - 1 === currentIndex ? 'true' : undefined"
        @click="emit('select', imageNumber - 1)">
        <span
          v-if="['dots', 'pills', 'rings', 'segments'].includes(variant)"
          class="carousel-pagination__dot"
          aria-hidden="true" />
        <span v-else class="carousel-pagination__label" aria-hidden="true">
          {{ variant === "links" ? `Image ${imageNumber}` : imageNumber }}
        </span>
      </button>
    </template>
  </fieldset>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Total number of images in the carousel. */
    count: number;
    /** Zero-based index of the image nearest the carousel's centre. */
    currentIndex: number;
    /** ID of the scroll container controlled by these buttons. */
    controls: string;
    /** Visual alternative; dots remain the selected production design. */
    variant?:
      | "dots"
      | "pills"
      | "rings"
      | "discs"
      | "tabs"
      | "segments"
      | "steps"
      | "counter"
      | "select"
      | "links";
    /** Visible comparison name, also included in each control's accessible name. */
    label?: string;
  }>(),
  { variant: "dots" },
);
const emit = defineEmits<{ select: [index: number] }>();
const onChange = (event: Event) => {
  if (event.currentTarget instanceof HTMLSelectElement) {
    emit("select", Number(event.currentTarget.value));
  }
};
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

.carousel-pagination__legend:not(.carousel-pagination__legend--visible) {
  @include visually-hidden.visually-hidden();
}

.carousel-pagination__legend--visible {
  font-weight: var(--global-font-weight-semi-bold);
  text-align: center;
  margin-block-end: var(--global-space-fixed-2);
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
  inline-size: 10px;
  block-size: 10px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background-color: var(--global-body-color);
}

.carousel-pagination__button[aria-current="true"] .carousel-pagination__dot {
  background-color: var(--global-accent-color);
}

.carousel-pagination--dots
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__dot {
  inline-size: 16px;
  block-size: 16px;
}

.carousel-pagination--comparison {
  align-content: start;
  align-items: center;
  padding: var(--global-space-fixed-3);
  border: var(--global-border-width-1) solid var(--global-border-color);
  border-radius: var(--global-border-radius);
}

.carousel-pagination--pills .carousel-pagination__dot {
  inline-size: var(--global-space-fixed-2);
  block-size: var(--global-space-fixed-2);
  border-radius: var(--global-space-fixed-3);
}

.carousel-pagination--pills
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__dot {
  inline-size: var(--global-space-fixed-5);
}

.carousel-pagination--rings .carousel-pagination__dot {
  inline-size: 1em;
  block-size: 1em;
  border-width: var(--global-border-width-2);
  background-color: transparent;
}

.carousel-pagination--rings
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__dot {
  border-color: var(--global-accent-color);
  background-color: transparent;
  outline: var(--global-border-width-2) solid var(--global-accent-color);
  outline-offset: var(--global-focus-outline-offset);
}

.carousel-pagination--discs .carousel-pagination__label,
.carousel-pagination--steps .carousel-pagination__label {
  z-index: 1;
  display: grid;
  place-items: center;
  inline-size: 1.75em;
  block-size: 1.75em;
  border: var(--global-border-width-1) solid currentColor;
  border-radius: 50%;
  background-color: var(--global-content-background-color);
}

.carousel-pagination--discs
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__label,
.carousel-pagination--steps
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__label {
  border-color: var(--global-accent-color);
  background-color: var(--global-accent-color);
  color: var(--global-content-background-color);
}

.carousel-pagination--tabs .carousel-pagination__label {
  padding: var(--global-space-fixed-2);
  border-block-end: var(--global-border-width-2) solid transparent;
}

.carousel-pagination--tabs
  .carousel-pagination__button[aria-current="true"]
  .carousel-pagination__label {
  border-color: var(--global-accent-color);
  font-weight: var(--global-font-weight-bold);
}

.carousel-pagination--segments .carousel-pagination__button {
  flex: 1;
}

.carousel-pagination--segments .carousel-pagination__dot {
  inline-size: 100%;
  block-size: var(--global-space-fixed-2);
  border-radius: 0;
}

.carousel-pagination--steps .carousel-pagination__button {
  position: relative;

  &:not(:last-child)::before {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    inline-size: 100%;
    border-block-start: var(--global-border-width-1) solid currentColor;
    content: "";
  }
}

.carousel-pagination__counter {
  font-variant-numeric: tabular-nums;
}

.carousel-pagination__select {
  min-block-size: 2.75rem;
  max-inline-size: 100%;
  padding: var(--global-space-fixed-2) var(--global-space-fixed-3);
  border: var(--global-border-width-1) solid currentColor;
  border-radius: var(--global-border-radius);
  background-color: var(--global-content-background-color);
  color: inherit;
  font: inherit;

  &:focus-visible {
    outline: var(--global-border-width-2) solid var(--global-accent-color);
    outline-offset: var(--global-focus-outline-offset);
  }
}

.carousel-pagination--links .carousel-pagination__button {
  inline-size: auto;
  min-inline-size: 2.75rem;
  padding-inline: var(--global-space-fixed-2);
}

.carousel-pagination--links .carousel-pagination__button[aria-current="true"] {
  text-decoration: underline;
  text-underline-offset: var(--global-focus-outline-offset);
  font-weight: var(--global-font-weight-bold);
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

  .carousel-pagination__button[aria-current="true"]
    .carousel-pagination__label {
    border-color: Highlight;
    background-color: Highlight;
    color: HighlightText;
    forced-color-adjust: none;
  }

  .carousel-pagination--rings
    .carousel-pagination__button[aria-current="true"]
    .carousel-pagination__dot {
    border-color: Highlight;
    background-color: Canvas;
    outline-color: Highlight;
  }
}
</style>
