<template>
  <section
    class="carousel"
    :class="{ 'carousel--interactive': isInteractive }"
    aria-label="Image gallery">
    <div class="carousel__viewport">
      <ol
        :id="trackId"
        ref="track"
        class="carousel__track"
        :class="{ 'carousel__track--dragging': isDragging }"
        aria-label="Gallery images"
        tabindex="0"
        @scroll.passive="schedulePosition">
        <slot />
      </ol>
      <u-carousel-arrows
        v-if="isInteractive"
        class="carousel__arrows"
        :count="count"
        :current-index="currentIndex"
        :controls="trackId"
        :dragging="isDragging"
        @select="navigateToImage"
        @focus-track="focusTrack" />
    </div>
    <u-carousel-pagination
      v-if="isInteractive"
      class="carousel__pagination"
      :count="count"
      :current-index="currentIndex"
      :controls="trackId"
      @select="navigateToImage" />
    <p class="carousel__position" aria-live="polite" aria-atomic="true">
      <template v-if="isInteractive"
        >Image {{ currentIndex + 1 }} of {{ count }}</template
      >
      <template v-else>{{ count }} images</template>
    </p>
  </section>
</template>

<script setup lang="ts">
import { useMediaQuery, usePreferredReducedMotion } from "@vueuse/core";
import {
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from "vue";

const props = defineProps<{
  /** Number of consecutive image slides in this article gallery. */
  count: number;
}>();
const trackId = `image-gallery-${useId()}`;
const track = useTemplateRef<HTMLOListElement>("track");
const preferredMotion = usePreferredReducedMotion();
const forcedColors = useMediaQuery("(forced-colors: active)");
const currentIndex = ref(0);
const isInteractive = ref(false);
const isDragging = ref(false);
let frame = 0;
let settleFrame = 0;
let previousStep = 0;
let navigationTarget: number | undefined;
let resizeObserver: ResizeObserver | undefined;
let animations: Animation[] = [];
let drag: { id: number; x: number; y: number; left: number } | undefined;
let suppressClick = false;

const slideStep = () => {
  const first = track.value?.firstElementChild;
  const second = first?.nextElementSibling;
  return first instanceof HTMLElement && second instanceof HTMLElement
    ? second.getBoundingClientRect().left - first.getBoundingClientRect().left
    : 0;
};

const updatePosition = () => {
  const step = slideStep();
  if (!track.value || step <= 0) {
    return;
  }
  // A resize can emit scroll before ResizeObserver restores the selected slide.
  if (previousStep && Math.abs(step - previousStep) > 0.01 && !drag) {
    navigateToImage(navigationTarget ?? currentIndex.value, true);
  }
  previousStep = step;
  const position = track.value.scrollLeft / step;
  currentIndex.value = Math.max(
    0,
    Math.min(props.count - 1, Math.round(position)),
  );
  // Scrub paused animations, not a transition triggered by the nearest slide.
  for (const animation of animations) {
    animation.currentTime = position * 1000;
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
  if (preferredMotion.value !== "reduce" && !forcedColors.value) {
    animations = Array.from(
      track.value?.querySelectorAll<HTMLElement>(".prose-image") ?? [],
      (image, index) => {
        const positions = [0, index - 1, index, index + 1, props.count - 1];
        const keyframes = [...new Set(positions)]
          .filter((position) => position >= 0 && position < props.count)
          .sort((left, right) => left - right)
          .map((position) => {
            const distance = position - index;
            const amount = Math.min(1, Math.abs(distance));
            // Account for every shrunken slide between this image and the centre.
            const translation =
              9 *
              (distance +
                Math.sign(distance) * Math.max(0, Math.abs(distance) - 1));
            return {
              offset: position / (props.count - 1),
              opacity: 1 - amount * 0.55,
              transform: `translateX(${translation}%) scale(${1 - amount * 0.18})`,
            };
          });
        const animation = image.animate(keyframes, {
          duration: (props.count - 1) * 1000,
          fill: "both",
        });
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
    behavior:
      instant || preferredMotion.value === "reduce" ? "instant" : "smooth",
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

const focusTrack = () => {
  track.value?.focus({ preventScroll: true });
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
    navigateToImage(destination);
  }
};

const onFocus = (event: FocusEvent) => {
  if (drag || !(event.target instanceof Element) || !track.value) {
    return;
  }
  const slide = event.target.closest(".carousel__slide");
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

watch([preferredMotion, forcedColors], () => {
  if (isInteractive.value) {
    configureMotion();
  }
});

onMounted(() => {
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

.carousel {
  container-type: inline-size;
  margin-block: var(--global-space-fixed-5);
}

.carousel__viewport {
  --carousel-slide-size: calc(100cqi + (2 * var(--global-space-fluid-6)));

  position: relative;
  isolation: isolate;
  inline-size: 100vw;
  margin-inline: calc(50% - 50vw);
}

.carousel__track {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--carousel-slide-size);
  align-items: start;
  gap: var(--global-space-fixed-3);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  list-style: none;
  margin: 0;
  padding-block: var(--global-space-fixed-2);
  padding-inline: calc((100vw - var(--carousel-slide-size)) / 2);

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid var(--global-accent-color);
    outline-offset: -2px;
  }
}

.carousel__track .prose-image__image {
  cursor: grab;
}

// Native snapping can settle a scripted pointer move before the gesture ends.
.carousel--interactive .carousel__track {
  scroll-snap-type: none;
  touch-action: pan-y pinch-zoom;
}

.carousel__track--dragging {
  scroll-snap-type: none;
  user-select: none;

  .prose-image__image {
    cursor: grabbing;
  }
}

.carousel__slide {
  min-inline-size: 0;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  margin: 0;

  > .carousel__media,
  > .carousel__figure,
  > .carousel__figure > .carousel__media {
    margin: 0;
    max-inline-size: none;
  }

  .carousel__caption {
    margin-inline: var(--global-space-fluid-6);
  }
}

.post__content .carousel__slide .carousel__media {
  position: relative;
  inline-size: fit-content;
  max-inline-size: 100%;
  min-inline-size: 0;
  margin-inline: auto;
}

.post__content .carousel__slide .prose-image {
  inline-size: 100%;
  margin-inline: 0;
}

.carousel__arrows {
  position: absolute;
  inset-block: var(--global-space-fixed-2);
  inset-inline: max(
    var(--global-space-fixed-3),
    calc((100% - var(--carousel-slide-size)) / 2 + var(--global-space-fixed-3))
  );
  z-index: 20;
}

.carousel .carousel__pagination {
  padding-inline: var(--global-space-fixed-3);
}

.carousel__position {
  @include visually-hidden.visually-hidden();
}

@media (hover: hover) and (pointer: fine) {
  .carousel:hover,
  .carousel:focus-within {
    --carousel-arrows-opacity: 1;
    --carousel-arrows-pointer-events: auto;
  }

  .carousel:focus-within {
    --carousel-arrows-transition: none;
  }
}

@media (forced-colors: active) {
  .carousel__track:focus-visible {
    outline-color: Highlight;
  }
}
</style>
