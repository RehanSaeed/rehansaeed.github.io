<template>
  <u-intersect :threshold="threshold" @change="onIntersectionChange">
    <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -- Each post adds its own <track> through the slot when the video has audio to caption; see AGENTS.md. -->
    <video ref="video" v-bind="$attrs" @play="onPlay" @pause="onPause">
      <slot />
    </video>
  </u-intersect>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";

defineOptions({ inheritAttrs: false });

const fullyVisibleRatio = 0.99;
const threshold = [0, fullyVisibleRatio, 1];
const video = useTemplateRef<HTMLVideoElement>("video");
const motion = usePreferredReducedMotion();
let expectingPlay = false;
let expectingPause = false;
let hasAutoplayed = false;
let userPaused = false;

const isFullyVisible = (entry: IntersectionObserverEntry): boolean =>
  entry.intersectionRatio >= fullyVisibleRatio ||
  // A video taller than the viewport can never be fully visible, so treat
  // filling the viewport as fully visible.
  (entry.rootBounds !== null &&
    entry.intersectionRect.height >= entry.rootBounds.height - 1);

const onPlay = (): void => {
  if (expectingPlay) {
    expectingPlay = false;
  } else {
    userPaused = false;
  }
};

const onPause = (): void => {
  if (expectingPause) {
    expectingPause = false;
  } else {
    userPaused = true;
  }
};

const play = (element: HTMLVideoElement): void => {
  if (
    !element.paused ||
    userPaused ||
    element.ended ||
    motion.value === "reduce"
  ) {
    return;
  }
  if (!hasAutoplayed) {
    // Browsers only allow autoplay without a user gesture when muted.
    element.muted = true;
    hasAutoplayed = true;
  }
  expectingPlay = true;
  element.play().catch(() => {
    expectingPlay = false;
  });
};

const pause = (element: HTMLVideoElement): void => {
  if (element.paused) {
    return;
  }
  expectingPause = true;
  element.pause();
};

const onIntersectionChange = (entries: IntersectionObserverEntry[]): void => {
  const element = video.value;
  if (!element) {
    return;
  }
  for (const entry of entries) {
    if (isFullyVisible(entry)) {
      play(element);
    } else if (!entry.isIntersecting) {
      pause(element);
    }
  }
};
</script>
