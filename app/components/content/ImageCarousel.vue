<template>
  <section
    class="image-carousel"
    :class="{ 'image-carousel--interactive': isInteractive }"
    aria-label="Image gallery">
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
const arrowTarget = shallowRef<HTMLElement | null>(null);
let mouseDrag:
  { pointerId: number; x: number; y: number; scrollLeft: number } | undefined;
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
  if (track.value && step > 0) {
    currentIndex.value = Math.max(
      0,
      Math.min(props.count - 1, Math.round(track.value.scrollLeft / step)),
    );
  }
};

const updateActiveSlide = () => {
  for (const [index, slide] of Array.from(
    track.value?.children ?? [],
  ).entries()) {
    slide.toggleAttribute("data-current", index === currentIndex.value);
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
    left: index * slideStep(),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
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
  for (const [event, handler] of pointerHandlers) {
    track.value?.addEventListener(event, handler);
  }
  track.value?.addEventListener("dragstart", preventImageDrag);
  track.value?.addEventListener("click", preventDraggedClick, true);
  updatePosition();
  updateActiveSlide();
  isInteractive.value = true;
});

onBeforeUnmount(() => {
  for (const [event, handler] of pointerHandlers) {
    track.value?.removeEventListener(event, handler);
  }
  track.value?.removeEventListener("dragstart", preventImageDrag);
  track.value?.removeEventListener("click", preventDraggedClick, true);
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/visually-hidden";

.image-carousel {
  --image-carousel-inactive-scale: 0.88;
  --button-icon-color: #fff;
  --button-icon-hover-color: var(--global-accent-color);
  --button-icon-hover-background: #fff;

  container-type: inline-size;
  margin-block: var(--global-space-fixed-5);
}

.image-carousel__viewport {
  --image-carousel-slide-size: calc(100cqi + (2 * var(--global-space-fluid-6)));

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
  gap: var(--global-space-fixed-3);
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
  inline-size: fit-content;
  max-inline-size: 100%;
  min-inline-size: 0;
  margin-inline: auto;
}

.post__content .image-carousel__slide .prose-image {
  inline-size: 100%;
  margin-inline: 0;
}

.image-carousel--interactive .image-carousel__slide .prose-image {
  opacity: 0.5;
  scale: var(--image-carousel-inactive-scale);
  translate: 0;
  transition:
    opacity var(--global-duration-2) var(--ease-in-out-cubic),
    scale var(--global-duration-2) var(--ease-in-out-cubic),
    translate var(--global-duration-2) var(--ease-in-out-cubic);
}

// Offset half the scaled-away width so previews keep their inner edge nearby.
.image-carousel--interactive
  .image-carousel__slide:has(~ [data-current])
  .prose-image {
  translate: calc((1 - var(--image-carousel-inactive-scale)) * 50%);
}

.image-carousel--interactive
  .image-carousel__slide[data-current]
  ~ .image-carousel__slide
  .prose-image {
  translate: calc((var(--image-carousel-inactive-scale) - 1) * 50%);
}

.image-carousel--interactive .image-carousel__slide[data-current] .prose-image {
  opacity: 1;
  scale: 1;
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

@media (prefers-reduced-motion: reduce) {
  .image-carousel--interactive .image-carousel__slide .prose-image {
    transition: none;
  }
}

@media (forced-colors: active) {
  .image-carousel__track:focus-visible {
    outline-color: Highlight;
  }
}
</style>
