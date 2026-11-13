<template>
  <section class="image-carousel" aria-label="Image gallery">
    <div class="image-carousel__viewport">
      <div
        :id="trackId"
        ref="track"
        class="image-carousel__track"
        :class="{
          'image-carousel__track--draggable': mounted,
          'image-carousel__track--dragging': dragging,
        }"
        role="group"
        aria-label="Gallery images; use Left and Right arrow keys to browse"
        tabindex="0"
        @scroll.passive="updatePosition">
        <slot />
      </div>
      <div v-if="mounted" class="image-carousel__arrows">
        <span class="image-carousel__arrow-shell">
          <u-button
            class="image-carousel__arrow"
            variant="icon"
            aria-label="Previous image"
            :aria-controls="trackId"
            :aria-disabled="currentIndex === 0"
            @click="navigate(currentIndex - 1)">
            <u-icon name="feather:arrow-left" aria-hidden="true" />
          </u-button>
        </span>
        <span class="image-carousel__arrow-shell">
          <u-button
            class="image-carousel__arrow"
            variant="icon"
            aria-label="Next image"
            :aria-controls="trackId"
            :aria-disabled="currentIndex === count - 1"
            @click="navigate(currentIndex + 1)">
            <u-icon name="feather:arrow-right" aria-hidden="true" />
          </u-button>
        </span>
      </div>
    </div>
    <div v-if="mounted" class="image-carousel__controls">
      <div
        class="image-carousel__pagination"
        role="group"
        aria-label="Choose image">
        <button
          v-for="number in count"
          :key="number"
          type="button"
          class="image-carousel__dot"
          :aria-label="`Go to image ${number} of ${count}`"
          :aria-controls="trackId"
          :aria-current="number - 1 === currentIndex ? 'true' : undefined"
          @click="navigate(number - 1)">
          <span aria-hidden="true" />
        </button>
      </div>
    </div>
    <p class="image-carousel__position" aria-live="polite" aria-atomic="true">
      {{ announcement }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from "vue";

const props = defineProps<{
  /** Number of consecutive image blocks in this article gallery. */
  count: number;
}>();
const trackId = `image-gallery-${useId()}`;
const track = useTemplateRef<HTMLDivElement>("track");
const mounted = ref(false);
const dragging = ref(false);
const currentIndex = ref(0);
const announcement = ref(`Image 1 of ${props.count}`);
let resizeObserver: ResizeObserver | undefined;
let announcementTimer: ReturnType<typeof setTimeout> | undefined;
let drag:
  | {
      pointerId: number;
      startX: number;
      scrollLeft: number;
    }
  | undefined;
let suppressClick = false;

const slides = () =>
  Array.from(track.value?.children ?? []).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

const positionFor = (slide: HTMLElement) =>
  slide.offsetLeft + (slide.offsetWidth - (track.value?.clientWidth ?? 0)) / 2;

const updatePosition = () => {
  const container = track.value;
  if (!container) {
    return;
  }
  const positions = slides().map((slide) =>
    Math.abs(positionFor(slide) - container.scrollLeft),
  );
  currentIndex.value = positions.indexOf(Math.min(...positions));
  clearTimeout(announcementTimer);
  announcementTimer = setTimeout(() => {
    announcement.value = `Image ${currentIndex.value + 1} of ${props.count}`;
  }, 180);
};

const navigate = (requested: number, instant = false) => {
  const slide = slides()[Math.max(0, Math.min(props.count - 1, requested))];
  if (slide) {
    track.value?.scrollTo({
      left: positionFor(slide),
      behavior:
        instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (
    event.target !== track.value ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  ) {
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
    navigate(destination);
  }
};

const onFocus = (event: FocusEvent) => {
  const index = slides().findIndex(
    (slide) => event.target instanceof Node && slide.contains(event.target),
  );
  if (index >= 0 && !drag) {
    // Reveal the complete focused link immediately, without moving document focus.
    navigate(index, true);
  }
};

const onPointerDown = (event: PointerEvent) => {
  suppressClick = false;
  if (
    event.pointerType !== "mouse" ||
    event.button !== 0 ||
    !event.isPrimary ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.target instanceof Element && event.target.closest("figcaption"))
  ) {
    return;
  }
  drag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    scrollLeft: track.value?.scrollLeft ?? 0,
  };
};

const onPointerMove = (event: PointerEvent) => {
  const container = track.value;
  if (!container || !drag || drag.pointerId !== event.pointerId) {
    return;
  }
  const distance = event.clientX - drag.startX;
  if (!dragging.value && Math.abs(distance) < 6) {
    return;
  }
  if (!dragging.value) {
    dragging.value = true;
    suppressClick = true;
    container.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  container.scrollTo({ left: drag.scrollLeft - distance, behavior: "instant" });
};

const finishDrag = () => {
  const pointerId = drag?.pointerId;
  drag = undefined;
  if (pointerId !== undefined && track.value?.hasPointerCapture(pointerId)) {
    track.value.releasePointerCapture(pointerId);
  }
  if (dragging.value) {
    dragging.value = false;
    updatePosition();
    navigate(currentIndex.value);
  }
};

const onPointerEnd = (event: PointerEvent) => {
  if (drag?.pointerId === event.pointerId) {
    finishDrag();
  }
};

const onDragStart = (event: DragEvent) => {
  if (drag) {
    event.preventDefault();
  }
};

const onClick = (event: MouseEvent) => {
  // Only the click generated by a mouse drag is cancelled; links still activate.
  if (suppressClick && event.detail > 0) {
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }
};

onMounted(() => {
  mounted.value = true;
  resizeObserver = new ResizeObserver(() => {
    navigate(currentIndex.value, true);
  });
  if (track.value) {
    track.value.addEventListener("keydown", onKeydown);
    track.value.addEventListener("focusin", onFocus);
    track.value.addEventListener("pointerdown", onPointerDown);
    track.value.addEventListener("lostpointercapture", onPointerEnd);
    track.value.addEventListener("dragstart", onDragStart);
    track.value.addEventListener("click", onClick, true);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("blur", finishDrag);
    resizeObserver.observe(track.value);
    const first = slides()[0];
    if (first) {
      resizeObserver.observe(first);
    }
  }
});

onBeforeUnmount(() => {
  track.value?.removeEventListener("keydown", onKeydown);
  track.value?.removeEventListener("focusin", onFocus);
  track.value?.removeEventListener("pointerdown", onPointerDown);
  track.value?.removeEventListener("lostpointercapture", onPointerEnd);
  track.value?.removeEventListener("dragstart", onDragStart);
  track.value?.removeEventListener("click", onClick, true);
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerEnd);
  window.removeEventListener("pointercancel", onPointerEnd);
  window.removeEventListener("blur", finishDrag);
  resizeObserver?.disconnect();
  clearTimeout(announcementTimer);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.image-carousel {
  container-type: inline-size;
  margin-block: var(--global-space-fixed-5);
}

.image-carousel__viewport {
  --gallery-image-size: min(
    calc(100cqi + 2 * var(--global-space-fluid-6)),
    calc(100vw - 2 * var(--global-space-fixed-3))
  );
  --gallery-step: var(--gallery-image-size);

  position: relative;
  isolation: isolate;
  inline-size: 100vw;
  margin-inline: calc(50% - 50vw);
}

.image-carousel__track {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--gallery-step);
  align-items: start;
  overflow: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-block: var(--global-space-fixed-4);
  padding-inline: calc((100% - var(--gallery-step)) / 2);

  &::-webkit-scrollbar {
    display: none;
  }

  &--draggable {
    cursor: grab;
  }

  &--dragging {
    scroll-snap-type: none;
    cursor: grabbing;
    user-select: none;
  }

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.image-carousel__slide {
  position: relative;
  min-inline-size: 0;
  scroll-snap-align: center;
}

.image-carousel__frame {
  inline-size: var(--gallery-image-size);
  margin-inline: calc((var(--gallery-step) - var(--gallery-image-size)) / 2);
}

.post__content .image-carousel__frame {
  > p,
  > figure,
  > figure > p {
    max-inline-size: none;
    min-inline-size: 0;
    margin: 0;
  }

  .prose-image {
    inline-size: 100%;
    margin-inline: 0;
  }

  figcaption {
    padding-inline: var(--global-space-fixed-3);
  }
}

.image-carousel__arrows {
  position: absolute;
  inset-block: var(--global-space-fixed-4);
  inset-inline: max(
    var(--global-space-fixed-3),
    calc((100% - var(--gallery-image-size)) / 2 + var(--global-space-fixed-3))
  );
  z-index: 20;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;

  .image-carousel__arrow[aria-disabled="true"] {
    --button-icon-color: rgb(255 255 255 / 65%);
    --button-icon-hover-color: rgb(255 255 255 / 65%);
    --button-icon-hover-background: rgb(255 255 255 / 15%);

    cursor: default;
  }
}

.image-carousel__arrow-shell {
  display: grid;
  border-radius: 50%;
  background: rgb(0 0 0 / 65%);
}

.image-carousel__arrows .image-carousel__arrow {
  --button-icon-color: #fff;
  --button-icon-hover-color: var(
    --gallery-button-hover-color,
    var(--global-accent-color)
  );
  --button-icon-hover-background: #fff;

  background-clip: content-box;
  font-size: 20px;
  padding: 4px;
  pointer-events: auto;

  &:focus-visible {
    outline-offset: -6px;
  }
}

[data-theme="dark"] .image-carousel__arrows {
  --gallery-button-hover-color: var(--global-alternate-accent-color);
}

@media (hover: hover) and (pointer: fine) {
  .image-carousel__arrow-shell {
    opacity: 0;
  }

  .image-carousel__arrows .image-carousel__arrow {
    pointer-events: none;
  }

  .image-carousel__viewport:hover,
  .image-carousel:focus-within {
    .image-carousel__arrow-shell {
      opacity: 1;
    }

    .image-carousel__arrow {
      pointer-events: auto;
    }
  }
}

.image-carousel__pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.image-carousel__dot {
  display: grid;
  place-items: center;
  inline-size: 28px;
  block-size: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--global-border-radius);
  background: transparent;
  cursor: pointer;

  span {
    inline-size: 10px;
    block-size: 10px;
    border: 1px solid currentColor;
    border-radius: 50%;
    background: var(--global-body-color);
  }

  &[aria-current="true"] span {
    inline-size: 16px;
    block-size: 16px;
    background: var(--global-accent-color);
  }

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.image-carousel__position {
  @include visually-hidden.visually-hidden();
}

@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  .image-carousel__dot span {
    transition:
      inline-size var(--global-duration-1) var(--ease-in-out-cubic),
      block-size var(--global-duration-1) var(--ease-in-out-cubic),
      background-color var(--global-duration-1) var(--ease-in-out-cubic);
  }
}

@keyframes gallery-cover-turn {
  from {
    transform: perspective(90rem) rotateY(-52deg) scale(0.76);
  }
  50% {
    transform: perspective(90rem) rotateY(0deg) scale(1);
  }
  to {
    transform: perspective(90rem) rotateY(52deg) scale(0.76);
  }
}

@keyframes gallery-cover-stack {
  from,
  to {
    z-index: 0;
  }
  50% {
    z-index: 10;
  }
}

// Keep geometry stable: only the frame turns, never the timeline's subject.
@supports (animation-timeline: view(inline)) {
  @media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
    .image-carousel__viewport {
      --gallery-step: calc(var(--gallery-image-size) * 0.66);
    }

    .image-carousel__slide {
      view-timeline-name: --gallery-cover;
      view-timeline-axis: inline;
      animation: gallery-cover-stack linear both;
      animation-timeline: --gallery-cover;
    }

    .image-carousel__frame {
      transform-origin: center;
      animation: gallery-cover-turn linear both;
      animation-timeline: --gallery-cover;
    }
  }
}

@media (forced-colors: active) {
  .image-carousel__track:focus-visible,
  .image-carousel__dot:focus-visible {
    outline-color: Highlight;
  }

  .image-carousel__dot span {
    background: ButtonText;
  }

  .image-carousel__dot[aria-current="true"] span {
    background: Highlight;
    forced-color-adjust: none;
  }

  .image-carousel__arrow-shell {
    background: ButtonFace;
  }

  .image-carousel__arrows [aria-disabled="true"] {
    --button-icon-color: GrayText;
    --button-icon-hover-color: GrayText;
  }
}
</style>
