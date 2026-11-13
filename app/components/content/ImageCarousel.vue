<template>
  <section class="image-carousel" aria-label="Image gallery">
    <div class="image-carousel__viewport">
      <div
        :id="trackId"
        ref="track"
        class="image-carousel__track"
        :class="{
          'image-carousel__track--draggable': mounted,
          'image-carousel__track--dragging': dragging || settling,
        }"
        role="group"
        aria-label="Gallery images; use Left and Right arrow keys to browse"
        tabindex="0"
        @scroll.passive="updatePosition">
        <slot />
      </div>
      <div
        v-if="mounted"
        class="image-carousel__arrows"
        :class="{ 'image-carousel__arrows--dragging': dragging }">
        <span
          ref="previousArrow"
          class="image-carousel__arrow-shell"
          :class="{
            'image-carousel__arrow-shell--unavailable': currentIndex === 0,
          }">
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
        <span
          ref="nextArrow"
          class="image-carousel__arrow-shell"
          :class="{
            'image-carousel__arrow-shell--unavailable':
              currentIndex === count - 1,
          }">
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
      <u-carousel-pagination
        class="image-carousel__pagination"
        :count="count"
        :current-index="currentIndex"
        :controls="trackId"
        @select="navigate" />
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
const previousArrow = useTemplateRef<HTMLSpanElement>("previousArrow");
const nextArrow = useTemplateRef<HTMLSpanElement>("nextArrow");
const mounted = ref(false);
const dragging = ref(false);
const settling = ref(false);
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
let settlePosition: number | undefined;

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
  const index = positions.indexOf(Math.min(...positions));
  const unavailable =
    index === 0
      ? previousArrow.value
      : index === props.count - 1
        ? nextArrow.value
        : undefined;
  if (unavailable?.contains(document.activeElement)) {
    container.focus({ preventScroll: true });
  }
  currentIndex.value = index;
  if (
    settlePosition !== undefined &&
    Math.abs(container.scrollLeft - settlePosition) <= 1
  ) {
    settlePosition = undefined;
    settling.value = false;
  }
  clearTimeout(announcementTimer);
  announcementTimer = setTimeout(() => {
    announcement.value = `Image ${currentIndex.value + 1} of ${props.count}`;
  }, 180);
};

const navigate = (requested: number, instant = false) => {
  const slide = slides()[Math.max(0, Math.min(props.count - 1, requested))];
  if (slide) {
    if (settling.value) {
      settlePosition = positionFor(slide);
    }
    track.value?.scrollTo({
      left: positionFor(slide),
      behavior:
        instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  }
};

const finishSettling = () => {
  if (settling.value && !drag) {
    updatePosition();
    navigate(currentIndex.value);
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
  track.value?.scrollTo({
    left: track.value.scrollLeft,
    behavior: "instant",
  });
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
  if (event.buttons !== 1) {
    finishDrag();
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
    updatePosition();
    const slide = slides()[currentIndex.value];
    if (slide) {
      settlePosition = positionFor(slide);
      settling.value = true;
    }
    dragging.value = false;
    navigate(currentIndex.value);
    updatePosition();
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
    settlePosition = undefined;
    settling.value = false;
    navigate(currentIndex.value, true);
  });
  if (track.value) {
    track.value.addEventListener("keydown", onKeydown);
    track.value.addEventListener("scrollend", finishSettling);
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
  track.value?.removeEventListener("scrollend", finishSettling);
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

  > p,
  > figure > p {
    overflow: clip;
  }

  a:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
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

  &--unavailable {
    visibility: hidden;
  }
}

.image-carousel__arrows--dragging {
  visibility: hidden;
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

  .image-carousel__viewport:has(img:hover, .image-carousel__arrow:hover),
  .image-carousel:has(:focus-visible) {
    .image-carousel__arrow-shell {
      opacity: 1;
    }

    .image-carousel__arrow {
      pointer-events: auto;
    }
  }

  .image-carousel:has(:focus-visible) .image-carousel__arrow-shell {
    transition: none;
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none) {
  .image-carousel__arrow-shell {
    transition: opacity var(--global-duration-1) var(--ease-in-out-cubic);
  }
}

.image-carousel__position {
  @include visually-hidden.visually-hidden();
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

@keyframes gallery-window-aperture {
  from {
    clip-path: inset(0 60% 0 0);
  }
  50% {
    clip-path: inset(0);
  }
  to {
    clip-path: inset(0 0 0 60%);
  }
}

@keyframes gallery-window-pan {
  from {
    translate: -12% 0;
  }
  50% {
    translate: 0 0;
  }
  to {
    translate: 12% 0;
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

    .image-carousel__frame > p,
    .image-carousel__frame > figure > p {
      animation: gallery-window-aperture linear both;
      animation-timeline: --gallery-cover;
    }

    .image-carousel__frame .prose-image__image {
      animation: gallery-window-pan linear both;
      animation-timeline: --gallery-cover;
    }

    .image-carousel__slide:has(:focus-visible) {
      z-index: 11;
      animation: none;

      .image-carousel__frame {
        transform: none;
        animation: none;
      }

      .image-carousel__frame > p,
      .image-carousel__frame > figure > p {
        clip-path: none;
        animation: none;
      }

      .prose-image__image {
        translate: none;
        animation: none;
      }
    }
  }
}

@media (forced-colors: active) {
  .image-carousel__track:focus-visible,
  .image-carousel__frame a:focus-visible {
    outline-color: Highlight;
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
