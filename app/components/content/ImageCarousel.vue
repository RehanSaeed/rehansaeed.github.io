<template>
  <section class="image-carousel" aria-label="Image gallery">
    <div class="image-carousel__viewport">
      <div
        :id="trackId"
        ref="track"
        class="image-carousel__track"
        :class="{ 'image-carousel__track--dragging': isDragging }"
        role="group"
        aria-label="Gallery images"
        tabindex="0"
        @scroll.passive="schedulePosition">
        <slot />
      </div>
    </div>
    <div v-if="isInteractive" class="image-carousel__controls">
      <u-button
        variant="icon"
        aria-label="Previous image"
        :aria-controls="trackId"
        :aria-disabled="currentIndex === 0"
        @click="navigateToImage(currentIndex - 1)">
        <u-icon name="feather:arrow-left" aria-hidden="true" />
      </u-button>
      <div
        class="image-carousel__pagination"
        role="group"
        aria-label="Choose image">
        <button
          v-for="number in count"
          :key="number"
          type="button"
          class="image-carousel__page"
          :aria-label="`Go to image ${number} of ${count}`"
          :aria-controls="trackId"
          :aria-current="number - 1 === currentIndex ? 'true' : undefined"
          @click="navigateToImage(number - 1)">
          <span aria-hidden="true">{{ String(number).padStart(2, "0") }}</span>
        </button>
      </div>
      <u-button
        variant="icon"
        aria-label="Next image"
        :aria-controls="trackId"
        :aria-disabled="currentIndex === count - 1"
        @click="navigateToImage(currentIndex + 1)">
        <u-icon name="feather:arrow-right" aria-hidden="true" />
      </u-button>
    </div>
    <p class="image-carousel__position" aria-live="polite" aria-atomic="true">
      <template v-if="isInteractive"
        >Image {{ currentIndex + 1 }} of {{ count }}</template
      >
      <template v-else>{{ count }} images</template>
    </p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from "vue";

const props = defineProps<{
  /** Number of consecutive image slides in this article gallery. */
  count: number;
}>();
const trackId = `image-gallery-${useId()}`;
const track = useTemplateRef<HTMLDivElement>("track");
const currentIndex = ref(0);
const isInteractive = ref(false);
const isDragging = ref(false);
let frame = 0;
let resizeObserver: ResizeObserver | undefined;
let motionPreference: MediaQueryList | undefined;
let contrastPreference: MediaQueryList | undefined;
let animations: Animation[] = [];
let drag: { id: number; x: number; y: number; left: number } | undefined;
let suppressClick = false;

const slideStep = () => {
  const first = track.value?.firstElementChild;
  const second = first?.nextElementSibling;
  return first instanceof HTMLElement && second instanceof HTMLElement
    ? second.offsetLeft - first.offsetLeft
    : 0;
};

const updatePosition = () => {
  const step = slideStep();
  if (!track.value || step <= 0) {
    return;
  }
  const position = track.value.scrollLeft / step;
  currentIndex.value = Math.max(
    0,
    Math.min(props.count - 1, Math.round(position)),
  );
  // Scrub paused animations, not a transition triggered by the nearest slide.
  for (const [index, animation] of animations.entries()) {
    animation.currentTime =
      (Math.max(-1, Math.min(1, position - index)) + 1) * 500;
  }
};

const schedulePosition = () => {
  if (!frame) {
    frame = requestAnimationFrame(() => {
      frame = 0;
      updatePosition();
    });
  }
};

const configureMotion = () => {
  for (const animation of animations) {
    animation.cancel();
  }
  animations = [];
  if (!motionPreference?.matches && !contrastPreference?.matches) {
    animations = Array.from(
      track.value?.querySelectorAll<HTMLElement>(".prose-image") ?? [],
      (image) => {
        const animation = image.animate(
          [
            { opacity: 0.45, transform: "translateX(-9%) scale(0.82)" },
            { opacity: 1, transform: "translateX(0) scale(1)" },
            { opacity: 0.45, transform: "translateX(9%) scale(0.82)" },
          ],
          { duration: 1000, fill: "both" },
        );
        animation.pause();
        return animation;
      },
    );
  }
  updatePosition();
};

const navigateToImage = (requestedIndex: number, instant = false) => {
  const index = Math.max(0, Math.min(props.count - 1, requestedIndex));
  track.value?.scrollTo({
    left: index * slideStep(),
    behavior: instant || motionPreference?.matches ? "instant" : "smooth",
  });
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.target !== track.value) {
    return;
  }
  const destinations: Record<string, number> = {
    ArrowLeft: currentIndex.value - 1,
    ArrowRight: currentIndex.value + 1,
    Home: 0,
    End: props.count - 1,
  };
  const destination = destinations[event.key];
  if (destination !== undefined) {
    event.preventDefault();
    navigateToImage(destination);
  }
};

const onFocus = (event: FocusEvent) => {
  if (!(event.target instanceof Element) || !track.value) {
    return;
  }
  const slide = event.target.closest(".image-carousel__slide");
  const index = Array.from(track.value.children).findIndex(
    (child) => child === slide,
  );
  if (index >= 0) {
    navigateToImage(index, true);
  }
};

const startDrag = (event: PointerEvent) => {
  suppressClick = false;
  if (
    event.pointerType === "mouse" &&
    event.button === 0 &&
    track.value &&
    event.target instanceof Element &&
    event.target.closest("img")
  ) {
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: track.value.scrollLeft,
    };
  }
};

const finishDrag = (event: PointerEvent) => {
  if (!drag || drag.id !== event.pointerId) {
    return;
  }
  suppressClick = isDragging.value;
  drag = undefined;
  isDragging.value = false;
  if (track.value?.hasPointerCapture(event.pointerId)) {
    track.value.releasePointerCapture(event.pointerId);
  }
};

const moveDrag = (event: PointerEvent) => {
  if (!drag || drag.id !== event.pointerId || !track.value) {
    return;
  }
  if (event.buttons !== 1) {
    finishDrag(event);
    return;
  }
  const distance = event.clientX - drag.x;
  if (!isDragging.value) {
    if (
      Math.abs(distance) < 8 ||
      Math.abs(distance) < Math.abs(event.clientY - drag.y)
    ) {
      return;
    }
    isDragging.value = true;
    track.value.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  track.value.scrollLeft = drag.left - distance;
};

const preventDraggedClick = (event: MouseEvent) => {
  if (suppressClick && event.detail > 0) {
    event.preventDefault();
    event.stopPropagation();
  }
  suppressClick = false;
};

const preventImageDrag = (event: DragEvent) => {
  if (
    event.target instanceof Element &&
    event.target.closest("img, a:has(img)")
  ) {
    event.preventDefault();
  }
};

const pointerHandlers = [
  ["pointerdown", startDrag],
  ["pointermove", moveDrag],
  ["pointerup", finishDrag],
  ["pointercancel", finishDrag],
  ["lostpointercapture", finishDrag],
] as const;

onMounted(() => {
  motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  contrastPreference = window.matchMedia("(forced-colors: active)");
  motionPreference.addEventListener("change", configureMotion);
  contrastPreference.addEventListener("change", configureMotion);
  for (const [event, handler] of pointerHandlers) {
    track.value?.addEventListener(event, handler);
  }
  track.value?.addEventListener("dragstart", preventImageDrag);
  track.value?.addEventListener("click", preventDraggedClick, true);
  track.value?.addEventListener("keydown", onKeydown);
  track.value?.addEventListener("focusin", onFocus);
  configureMotion();
  resizeObserver = new ResizeObserver(() => {
    navigateToImage(currentIndex.value, true);
    updatePosition();
  });
  if (track.value) {
    resizeObserver.observe(track.value);
  }
  isInteractive.value = true;
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  motionPreference?.removeEventListener("change", configureMotion);
  contrastPreference?.removeEventListener("change", configureMotion);
  for (const animation of animations) {
    animation.cancel();
  }
  for (const [event, handler] of pointerHandlers) {
    track.value?.removeEventListener(event, handler);
  }
  track.value?.removeEventListener("dragstart", preventImageDrag);
  track.value?.removeEventListener("click", preventDraggedClick, true);
  track.value?.removeEventListener("keydown", onKeydown);
  track.value?.removeEventListener("focusin", onFocus);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.image-carousel {
  container-type: inline-size;
  margin-block: var(--global-space-fixed-5);
}

.image-carousel__viewport {
  --image-carousel-slide-size: calc(100cqi + (2 * var(--global-space-fluid-6)));

  inline-size: 100vw;
  margin-inline: calc(50% - 50vw);
}

.image-carousel__track {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--image-carousel-slide-size);
  align-items: start;
  gap: var(--global-space-fixed-3);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-block: var(--global-space-fixed-2);
  padding-inline: calc((100vw - var(--image-carousel-slide-size)) / 2);

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.image-carousel__track img {
  cursor: grab;
}

.image-carousel__track--dragging {
  scroll-snap-type: none;
  user-select: none;

  img {
    cursor: grabbing;
  }
}

.image-carousel__slide {
  min-inline-size: 0;
  scroll-snap-align: center;
  scroll-snap-stop: always;

  > p,
  > figure,
  > figure > p {
    margin: 0;
    max-inline-size: none;
  }

  figcaption {
    padding-inline: var(--global-space-fixed-4);
  }
}

.post__content .image-carousel__slide > p,
.post__content .image-carousel__slide > figure > p {
  inline-size: fit-content;
  max-inline-size: 100%;
  min-inline-size: 0;
  margin-inline: auto;
}

.post__content .image-carousel__slide .prose-image {
  inline-size: 100%;
  margin-inline: 0;
}

.image-carousel__controls {
  display: grid;
  grid-template-columns: auto minmax(0, auto) auto;
  align-items: center;
  justify-content: center;
  gap: var(--global-space-fixed-2);
  margin-block-start: var(--global-space-fixed-2);
}

.image-carousel__controls [aria-disabled="true"] {
  opacity: 0.45;
  cursor: default;
}

.image-carousel__pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.image-carousel__page {
  min-inline-size: 44px;
  min-block-size: 44px;
  padding: var(--global-space-fixed-1);
  border: 0;
  border-block-end: 2px solid transparent;
  background: transparent;
  color: var(--global-body-color);
  font: inherit;
  cursor: pointer;

  &[aria-current="true"] {
    border-block-end-color: var(--global-accent-color);
    color: var(--global-title-color);
    font-weight: bold;
  }

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.image-carousel__position {
  @include visually-hidden.visually-hidden();
}

@media (forced-colors: active) {
  .image-carousel__page[aria-current="true"] {
    border-block-end-color: Highlight;
  }

  .image-carousel__track:focus-visible,
  .image-carousel__page:focus-visible {
    outline-color: Highlight;
  }

  .image-carousel__controls [aria-disabled="true"] {
    opacity: 1;
    color: GrayText;
  }
}
</style>
