<template>
  <section
    class="image-carousel"
    :class="{
      'image-carousel--interactive': isInteractive,
      'image-carousel--window': sideLayout === 'window',
      'image-carousel--natural': sideLayout === 'natural',
    }"
    aria-label="Image gallery">
    <fieldset
      v-if="comparisonEnabled && isInteractive"
      class="image-carousel__comparison">
      <legend>Side images (preview comparison)</legend>
      <label class="image-carousel__choice">
        <input
          v-model="sideLayout"
          type="radio"
          :name="`${trackId}-side-layout`"
          value="window" />
        Cropped windows
      </label>
      <label class="image-carousel__choice">
        <input
          v-model="sideLayout"
          type="radio"
          :name="`${trackId}-side-layout`"
          value="natural" />
        Original proportions
      </label>
    </fieldset>
    <div class="image-carousel__viewport">
      <div
        :id="trackId"
        ref="track"
        class="image-carousel__track"
        :class="{ 'image-carousel__track--dragging': isDragging }"
        role="group"
        aria-label="Gallery images"
        tabindex="0"
        @scroll.passive="updatePosition">
        <slot />
      </div>
      <Teleport :to="arrowTarget ?? 'body'" :disabled="!arrowTarget">
        <span
          class="image-carousel__arrows"
          :class="{ 'image-carousel__arrows--unavailable': !arrowTarget }">
          <u-tooltip
            v-if="currentIndex > 0"
            v-slot="{ trigger }"
            text="Previous image">
            <u-button
              v-bind="trigger"
              class="image-carousel__button image-carousel__button--previous"
              variant="icon"
              aria-label="Previous image"
              :aria-controls="trackId"
              @click="navigateToImage(currentIndex - 1)">
              <u-icon name="feather:arrow-left" aria-hidden="true" />
            </u-button>
          </u-tooltip>
          <u-tooltip
            v-if="currentIndex < count - 1"
            v-slot="{ trigger }"
            text="Next image">
            <u-button
              v-bind="trigger"
              class="image-carousel__button image-carousel__button--next"
              variant="icon"
              aria-label="Next image"
              :aria-controls="trackId"
              @click="navigateToImage(currentIndex + 1)">
              <u-icon name="feather:arrow-right" aria-hidden="true" />
            </u-button>
          </u-tooltip>
        </span>
      </Teleport>
    </div>
    <u-carousel-pagination
      v-if="isInteractive"
      class="image-carousel__pagination"
      :count="count"
      :current-index="currentIndex"
      :controls="trackId"
      @select="navigateToImage" />
    <p class="image-carousel__position" aria-live="polite" aria-atomic="true">
      <template v-if="isInteractive">
        Image {{ currentIndex + 1 }} of {{ count }}
      </template>
      <template v-else>{{ count }} images</template>
    </p>
  </section>
</template>

<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from "vue";

const props = defineProps<{
  /** Number of image slides grouped from the article's source. */ count: number;
}>();
const id = useId();
const trackId = `image-gallery-${id}`;
const track = useTemplateRef<HTMLDivElement>("track");
const currentIndex = ref(0);
const isInteractive = ref(false);
const isDragging = ref(false);
const sideLayout = ref<"window" | "natural">("window");
const comparisonEnabled = ref(false);
const arrowTarget = shallowRef<HTMLElement | null>(null);
let mouseDrag:
  { pointerId: number; x: number; y: number; scrollLeft: number } | undefined;
let suppressClick = false;
let resizeObserver: ResizeObserver | undefined;

const slidePosition = (index: number) => {
  const element = track.value;
  const slide = element?.children[index];
  return element && slide instanceof HTMLElement
    ? Math.max(
        0,
        Math.min(
          element.scrollWidth - element.clientWidth,
          slide.offsetLeft + (slide.offsetWidth - element.clientWidth) / 2,
        ),
      )
    : 0;
};

const updatePosition = () => {
  const element = track.value;
  if (!element) {
    return;
  }
  let nearest = 0;
  for (let index = 1; index < props.count; index++) {
    if (
      Math.abs(element.scrollLeft - slidePosition(index)) <
      Math.abs(element.scrollLeft - slidePosition(nearest))
    ) {
      nearest = index;
    }
  }
  currentIndex.value = nearest;
};

const updateActiveSlide = () => {
  for (const [index, slide] of Array.from(
    track.value?.children ?? [],
  ).entries()) {
    slide.toggleAttribute("data-current", index === currentIndex.value);
    if (index === currentIndex.value) {
      slide.removeAttribute("data-side");
    } else {
      slide.setAttribute(
        "data-side",
        index < currentIndex.value ? "before" : "after",
      );
    }
  }
  const frame = track.value?.children[currentIndex.value]?.querySelector(
    ":scope > p, :scope > figure > p",
  );
  if (!(frame instanceof HTMLElement) || frame === arrowTarget.value) {
    return;
  }
  const focused = document.activeElement;
  arrowTarget.value = frame;
  if (
    focused instanceof HTMLButtonElement &&
    focused.classList.contains("image-carousel__button")
  ) {
    void nextTick(() => {
      if (focused.isConnected && !focused.disabled) {
        focused.focus({ preventScroll: true });
      } else {
        track.value?.focus({ preventScroll: true });
      }
    });
  }
};

const navigateToImage = (requestedIndex: number) => {
  const index = Math.max(0, Math.min(props.count - 1, requestedIndex));
  track.value?.scrollTo({
    left: slidePosition(index),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
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
  const index = new Map([
    ["ArrowLeft", currentIndex.value - 1],
    ["ArrowRight", currentIndex.value + 1],
    ["Home", 0],
    ["End", props.count - 1],
  ]).get(event.key);
  if (index !== undefined) {
    event.preventDefault();
    navigateToImage(index);
  }
};

const startDrag = (event: PointerEvent) => {
  suppressClick = false;
  if (
    event.pointerType !== "mouse" ||
    event.button !== 0 ||
    !track.value ||
    !(event.target instanceof Element) ||
    !event.target.closest("img")
  ) {
    return;
  }
  mouseDrag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    scrollLeft: track.value.scrollLeft,
  };
};

const moveDrag = (event: PointerEvent) => {
  if (!mouseDrag || mouseDrag.pointerId !== event.pointerId || !track.value) {
    return;
  }
  if (event.buttons !== 1) {
    finishDrag(event);
    return;
  }
  const distance = event.clientX - mouseDrag.x;
  if (!isDragging.value) {
    if (
      Math.abs(distance) < 8 ||
      Math.abs(distance) < Math.abs(event.clientY - mouseDrag.y)
    ) {
      return;
    }
    isDragging.value = true;
    track.value.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
  track.value.scrollLeft = mouseDrag.scrollLeft - distance;
};

const finishDrag = (event: PointerEvent) => {
  if (!mouseDrag || mouseDrag.pointerId !== event.pointerId) {
    return;
  }
  suppressClick = isDragging.value;
  mouseDrag = undefined;
  isDragging.value = false;
  if (track.value?.hasPointerCapture(event.pointerId)) {
    track.value.releasePointerCapture(event.pointerId);
  }
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
    event.target instanceof HTMLImageElement ||
    (event.target instanceof HTMLAnchorElement &&
      event.target.querySelector("img"))
  ) {
    event.preventDefault();
  }
};

watch(currentIndex, updateActiveSlide);

const pointerHandlers = [
  ["pointerdown", startDrag],
  ["pointermove", moveDrag],
  ["pointerup", finishDrag],
  ["pointercancel", finishDrag],
  ["lostpointercapture", finishDrag],
] as const;

onMounted(() => {
  const requestedSideLayout = new URLSearchParams(window.location.search).get(
    "carousel-sides",
  );
  if (requestedSideLayout === "window" || requestedSideLayout === "natural") {
    sideLayout.value = requestedSideLayout;
    comparisonEnabled.value = true;
  }
  for (const [event, handler] of pointerHandlers) {
    track.value?.addEventListener(event, handler);
  }
  track.value?.addEventListener("dragstart", preventImageDrag);
  track.value?.addEventListener("click", preventDraggedClick, true);
  track.value?.addEventListener("keydown", onKeydown);
  updatePosition();
  updateActiveSlide();
  isInteractive.value = true;
  resizeObserver = new ResizeObserver(() => {
    track.value?.scrollTo({
      left: slidePosition(currentIndex.value),
      behavior: "instant",
    });
  });
  if (track.value) {
    resizeObserver.observe(track.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  for (const [event, handler] of pointerHandlers) {
    track.value?.removeEventListener(event, handler);
  }
  track.value?.removeEventListener("dragstart", preventImageDrag);
  track.value?.removeEventListener("click", preventDraggedClick, true);
  track.value?.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.image-carousel {
  --button-icon-color: #fff;
  --button-icon-hover-color: var(--global-accent-color);
  --button-icon-hover-background: #fff;

  container-type: inline-size;
  margin-block: var(--global-space-fixed-5);
}

.image-carousel__comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: var(--global-space-fixed-3);
  min-inline-size: 0;
  margin-block-end: var(--global-space-fixed-4);
}

.image-carousel__choice {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--global-space-fixed-3);
  min-block-size: 44px;
  cursor: pointer;
}

.image-carousel__choice input {
  accent-color: var(--global-accent-color);
  inline-size: 1.1em;
  block-size: 1.1em;
  min-inline-size: 0;
  margin: 0;
  padding: 0;

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: 2px;
  }
}

.image-carousel__viewport {
  --image-carousel-slide-size: calc(100cqi + (2 * var(--global-space-fluid-6)));
  --image-carousel-gap: clamp(0.75rem, 2vw, 2rem);

  position: relative;
  inline-size: 100vw;
  margin-inline: calc(50% - 50vw);
}

.image-carousel__track {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--image-carousel-slide-size);
  align-items: start;
  gap: var(--image-carousel-gap);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-block-start: var(--global-space-fixed-2);
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
  view-timeline-name: --image-window;
  view-timeline-axis: inline;

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
  position: relative;
  overflow: clip;
  inline-size: fit-content;
  max-inline-size: 100%;
  min-inline-size: 0;
  margin-inline: auto;
}

.post__content .image-carousel__slide .prose-image {
  inline-size: 100%;
  margin-inline: 0;
}

.image-carousel__slide > p > a,
.image-carousel__slide > figure > p > a {
  display: block;
}

.image-carousel__slide > p > a:focus-visible,
.image-carousel__slide > figure > p > a:focus-visible {
  outline: 2px solid var(--global-accent-color);
  outline-offset: -2px;
}

.post__content .image-carousel__slide .prose-image .prose-image__image {
  object-fit: contain;
  object-position: 50% 50%;
}

.image-carousel--window .image-carousel__slide[data-side="before"] > p,
.image-carousel--window
  .image-carousel__slide[data-side="before"]
  > figure
  > p {
  clip-path: inset(0 0 0 60%);
}

.image-carousel--window .image-carousel__slide[data-side="after"] > p,
.image-carousel--window .image-carousel__slide[data-side="after"] > figure > p {
  clip-path: inset(0 60% 0 0);
}

.image-carousel--natural .image-carousel__slide[data-side] > p,
.image-carousel--natural .image-carousel__slide[data-side] > figure > p {
  scale: 0.4;
  transform-origin: 0 50%;
}

.image-carousel--natural .image-carousel__slide[data-side="before"] > p,
.image-carousel--natural
  .image-carousel__slide[data-side="before"]
  > figure
  > p {
  transform-origin: 100% 50%;
}

// Keep the edges between neighbours fixed while cropping their outer edges.
@supports (animation-timeline: view(inline)) {
  @media (prefers-reduced-motion: no-preference) {
    .image-carousel--window .image-carousel__slide > p,
    .image-carousel--window .image-carousel__slide > figure > p {
      animation: image-window-aperture linear both;
      animation-timeline: --image-window;
    }

    .image-carousel--window .image-carousel__slide .prose-image__image {
      animation: image-window-pan linear both;
      animation-timeline: --image-window;
    }

    .image-carousel--natural .image-carousel__slide > p,
    .image-carousel--natural .image-carousel__slide > figure > p {
      animation:
        image-natural-scale linear both,
        image-natural-anchor steps(1, end) both;
      animation-timeline: --image-window, --image-window;
    }
  }
}

.image-carousel .image-carousel__slide:focus-within > p,
.image-carousel .image-carousel__slide:focus-within > figure > p {
  clip-path: none;
  scale: none;
  animation: none;
}

.image-carousel__slide:focus-within .prose-image__image {
  translate: none;
  animation: none;
}

@keyframes image-window-aperture {
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

@keyframes image-window-pan {
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

@keyframes image-natural-scale {
  from,
  to {
    scale: 0.4;
  }

  50% {
    scale: 1;
  }
}

@keyframes image-natural-anchor {
  from {
    transform-origin: 0 50%;
  }

  50%,
  to {
    transform-origin: 100% 50%;
  }
}

.image-carousel__arrows {
  position: absolute;
  inset-block: 0;
  inset-inline: var(--global-space-fixed-3);
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.image-carousel__arrows--unavailable {
  visibility: hidden;
}

.image-carousel__pagination {
  padding-inline: var(--global-space-fixed-3);
}

.image-carousel__position {
  @include visually-hidden.visually-hidden();
}

.image-carousel__button {
  background-color: rgb(0 0 0 / 65%);
  pointer-events: auto;
}

[data-theme="dark"] .image-carousel {
  --button-icon-hover-color: var(--global-alternate-accent-color);
}

.image-carousel__button--previous {
  grid-column: 1;
}

.image-carousel__button--next {
  grid-column: 2;
}

@media (hover: hover) and (pointer: fine) {
  .image-carousel__button {
    opacity: 0;
    pointer-events: none;
  }

  .image-carousel__viewport:is(:hover, :focus-within) .image-carousel__button {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (any-pointer: coarse) {
  .image-carousel__button {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (forced-colors: active) {
  .image-carousel__track:focus-visible,
  .image-carousel__choice input:focus-visible,
  .image-carousel__slide > p > a:focus-visible,
  .image-carousel__slide > figure > p > a:focus-visible {
    outline-color: Highlight;
  }
}
</style>
