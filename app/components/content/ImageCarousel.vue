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
        @scroll.passive="schedulePosition">
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
      <template v-if="isInteractive"
        >Image {{ currentIndex + 1 }} of {{ count }}</template
      >
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
  /** Number of consecutive image slides in this article gallery. */
  count: number;
}>();
const trackId = `image-gallery-${useId()}`;
const track = useTemplateRef<HTMLDivElement>("track");
const currentIndex = ref(0);
const isInteractive = ref(false);
const isDragging = ref(false);
const arrowTarget = shallowRef<HTMLElement | null>(null);
let frame = 0;
let settleFrame = 0;
let previousStep = 0;
let navigationTarget: number | undefined;
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
  // A resize can emit scroll before ResizeObserver restores the selected slide.
  if (previousStep && step !== previousStep && !drag) {
    navigateToImage(navigationTarget ?? currentIndex.value, true);
  }
  previousStep = step;
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
  if (!track.value) {
    return;
  }
  const left = Math.min(
    index * slideStep(),
    track.value.scrollWidth - track.value.clientWidth,
  );
  if (Math.abs(track.value.scrollLeft - left) <= 1) {
    navigationTarget = undefined;
    return;
  }
  navigationTarget = index;
  track.value.scrollTo({
    left,
    behavior: instant || motionPreference?.matches ? "instant" : "smooth",
  });
};

const settlePosition = () => {
  if (!drag && !settleFrame) {
    updatePosition();
    navigateToImage(navigationTarget ?? currentIndex.value);
  }
};

const interruptNavigation = () => {
  navigationTarget = undefined;
};

const updateArrowTarget = () => {
  const target = track.value?.children[currentIndex.value]?.querySelector(
    ":scope > p, :scope > figure > p",
  );
  if (!(target instanceof HTMLElement) || target === arrowTarget.value) {
    return;
  }
  const focused = document.activeElement;
  arrowTarget.value = target;
  if (
    !drag &&
    focused instanceof HTMLButtonElement &&
    focused.classList.contains("image-carousel__button")
  ) {
    void nextTick(() => {
      if (focused.isConnected) {
        focused.focus({ preventScroll: true });
      } else {
        track.value?.focus({ preventScroll: true });
      }
    });
  }
};

watch(currentIndex, updateArrowTarget);

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
  if (
    drag ||
    !(event.target instanceof Element) ||
    event.target.closest(".image-carousel__button") ||
    !track.value
  ) {
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
    event.isPrimary &&
    event.button === 0 &&
    track.value &&
    event.target instanceof Element &&
    !event.target.closest("button, a:not(:has(img))") &&
    (event.pointerType !== "mouse" || event.target.closest("img"))
  ) {
    interruptNavigation();
    cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    track.value.scrollTo({
      left: track.value.scrollLeft,
      behavior: "instant",
    });
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
  // Touch transfers implicit image capture to the rail on first movement.
  if (
    event.type === "lostpointercapture" &&
    track.value?.hasPointerCapture(event.pointerId)
  ) {
    return;
  }
  suppressClick = isDragging.value;
  drag = undefined;
  isDragging.value = false;
  if (track.value?.hasPointerCapture(event.pointerId)) {
    track.value.releasePointerCapture(event.pointerId);
  }
  settleFrame = requestAnimationFrame(() => {
    settleFrame = 0;
    settlePosition();
  });
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
  track.value.scrollTo({
    left: drag.left - distance,
    behavior: "instant",
  });
  updatePosition();
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
  track.value?.addEventListener("scrollend", settlePosition);
  track.value?.addEventListener("wheel", interruptNavigation, {
    passive: true,
  });
  configureMotion();
  updateArrowTarget();
  resizeObserver = new ResizeObserver(() => {
    if (!drag) {
      navigateToImage(navigationTarget ?? currentIndex.value, true);
      updatePosition();
    }
  });
  if (track.value) {
    resizeObserver.observe(track.value);
  }
  isInteractive.value = true;
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  cancelAnimationFrame(settleFrame);
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
  track.value?.removeEventListener("scrollend", settlePosition);
  track.value?.removeEventListener("wheel", interruptNavigation);
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

// Native snapping can settle a scripted pointer move before the gesture ends.
.image-carousel--interactive .image-carousel__track {
  scroll-snap-type: none;
  touch-action: pan-y pinch-zoom;
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
  .image-carousel__track:focus-visible {
    outline-color: Highlight;
  }
}
</style>
