<template>
  <figure ref="figure" class="topography" :data-scene="state">
    <div class="topography__masthead">
      <p class="topography__eyebrow">A different perspective</p>
      <span class="topography__chapter" aria-hidden="true">{{ chapter }}</span>
    </div>
    <div class="topography__stage" aria-hidden="true">
      <svg
        class="topography__fallback"
        viewBox="0 0 1000 400"
        fill="none"
        aria-hidden="true">
        <g v-for="line in 24" :key="line">
          <ellipse
            :cx="390 + line * 3"
            :cy="205 - line * 1.8"
            :rx="30 + line * 13"
            :ry="12 + line * 5.5"
            transform="rotate(-17 500 200)" />
          <ellipse
            :cx="670 - line * 1.5"
            :cy="190 + line"
            :rx="12 + line * 5"
            :ry="8 + line * 3"
            transform="rotate(22 670 190)" />
        </g>
      </svg>
      <canvas ref="canvas" class="topography__canvas" />
      <p class="topography__title">Ideas take shape.</p>
    </div>
    <figcaption class="topography__caption">
      <span>Living topography</span>
      <span>
        Abstract artwork, not geography or achievement data.
        <span v-if="state === 'unavailable'">
          The 3D artwork is unavailable; a static drawing is shown.
        </span>
        <span v-else-if="state === 'ready' && !reducedMotion">
          Scroll to change the perspective.
        </span>
      </span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
type Sculpture = ReturnType<
  typeof import("~/utils/topography-scene").createTopographyScene
>;
const figure = useTemplateRef<HTMLElement>("figure");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const state = ref<"static" | "ready" | "unavailable">("static");
const chapter = ref("The person");
const reducedMotion = ref(true);
let sculpture: Sculpture | undefined;
let visibilityObserver: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let motionQuery: MediaQueryList | undefined;
let contrastQuery: MediaQueryList | undefined;
let visible = false;
let disposed = false;
let loading = false;
let frame = 0;
let progress = 0;
let target = 0;
const chapterIds = [
  "the-person",
  "location",
  "youtube",
  "github",
  "awards",
  "stackoverflow",
  "microsoft-mvp",
];
const chapterLabels = [
  "The person",
  "London",
  "YouTube",
  "GitHub",
  "Awards",
  "Stack Overflow",
  "Microsoft MVP",
];

const stopFrame = () => {
  cancelAnimationFrame(frame);
  frame = 0;
};

const removeScene = () => {
  stopFrame();
  sculpture?.dispose();
  sculpture = undefined;
};

const failScene = (error: unknown) => {
  console.error("Living topography is unavailable.", error);
  state.value = "unavailable";
  removeScene();
};

const draw = () => {
  frame = 0;
  const bounds = figure.value?.getBoundingClientRect();
  if (
    !sculpture ||
    !visible ||
    document.hidden ||
    contrastQuery?.matches ||
    !bounds ||
    bounds.bottom <= 0 ||
    bounds.top >= window.innerHeight ||
    bounds.right <= 0 ||
    bounds.left >= window.innerWidth
  ) {
    return;
  }
  progress = reducedMotion.value ? 0.48 : progress + (target - progress) * 0.12;
  try {
    sculpture.render(progress, reducedMotion.value);
    state.value = "ready";
  } catch (error) {
    failScene(error);
    return;
  }
  if (!reducedMotion.value && Math.abs(target - progress) > 0.0005) {
    frame = requestAnimationFrame(draw);
  }
};

const requestDraw = () => {
  if (!frame && visible && !document.hidden) {
    frame = requestAnimationFrame(draw);
  }
};

const updateScroll = () => {
  const chapters = chapterIds
    .map((id) => document.getElementById(id))
    .filter((element) => element !== null);
  const last = chapters.at(-1);
  const first = chapters[0];
  if (!first || !last) {
    return;
  }
  const firstY = first.getBoundingClientRect().top + window.scrollY;
  const lastY = last.getBoundingClientRect().top + window.scrollY;
  const readingLine = window.scrollY + window.innerHeight * 0.6;
  target = Math.max(0, Math.min(1, (readingLine - firstY) / (lastY - firstY)));
  const active = chapters.findLastIndex(
    (element) => element.getBoundingClientRect().top < window.innerHeight * 0.7,
  );
  chapter.value = chapterLabels[Math.max(0, active)] ?? "The person";
  if (!reducedMotion.value) {
    requestDraw();
  }
};

const canLoad = () => !disposed && visible && !contrastQuery?.matches;

const loadScene = async () => {
  if (sculpture || loading || !canLoad() || state.value === "unavailable") {
    return;
  }
  loading = true;
  try {
    const { createTopographyScene } = await import("~/utils/topography-scene");
    if (disposed || !visible || contrastQuery?.matches || !canvas.value) {
      return;
    }
    sculpture = createTopographyScene(canvas.value);
    requestDraw();
  } catch (error) {
    if (!disposed) {
      failScene(error);
    }
  } finally {
    loading = false;
  }
};

const updatePreferences = () => {
  reducedMotion.value = motionQuery?.matches ?? true;
  stopFrame();
  if (contrastQuery?.matches) {
    state.value = "static";
  } else {
    void loadScene();
    requestDraw();
  }
};

const updateVisibility = () => {
  if (document.hidden) {
    stopFrame();
  } else {
    requestDraw();
  }
};

const loseContext = () => {
  if (!disposed && state.value === "ready") {
    failScene(new Error("The decorative WebGL context was lost."));
  }
};

onMounted(() => {
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  contrastQuery = window.matchMedia("(forced-colors: active)");
  motionQuery.addEventListener("change", updatePreferences);
  contrastQuery.addEventListener("change", updatePreferences);
  updatePreferences();
  window.addEventListener("scroll", updateScroll, { passive: true });
  window.addEventListener("resize", updateScroll, { passive: true });
  window.addEventListener("__themeChanged", requestDraw);
  document.addEventListener("visibilitychange", updateVisibility);
  canvas.value?.addEventListener("webglcontextlost", loseContext);
  updateScroll();
  if (!figure.value) {
    return;
  }
  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) {
      void loadScene();
      requestDraw();
    } else {
      stopFrame();
    }
  });
  visibilityObserver.observe(figure.value);
  resizeObserver = new ResizeObserver(requestDraw);
  if (canvas.value) {
    resizeObserver.observe(canvas.value);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  canvas.value?.removeEventListener("webglcontextlost", loseContext);
  window.removeEventListener("scroll", updateScroll);
  window.removeEventListener("resize", updateScroll);
  window.removeEventListener("__themeChanged", requestDraw);
  document.removeEventListener("visibilitychange", updateVisibility);
  motionQuery?.removeEventListener("change", updatePreferences);
  contrastQuery?.removeEventListener("change", updatePreferences);
  visibilityObserver?.disconnect();
  resizeObserver?.disconnect();
  removeScene();
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.topography {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  block-size: clamp(24rem, 45svh, 36rem);
  border-block-end: 1px solid var(--cp-border);
  background: var(--cp-bg);
  isolation: isolate;
}

.topography__masthead,
.topography__caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 2rem;
  padding-inline: clamp(1.25rem, 6vw, 7rem);
}

.topography__masthead {
  padding-block-start: 1.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.topography__eyebrow {
  margin: 0;
  color: var(--cp-accent);
}

.topography__chapter {
  color: var(--cp-text-muted);
}

.topography__stage {
  position: relative;
  min-block-size: 0;
  overflow: hidden;
  pointer-events: none;
}

.topography__canvas,
.topography__fallback {
  position: absolute;
  inset: 0;
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.topography__canvas {
  background-color: var(--cp-bg);
  color: var(--cp-accent);
  opacity: 0;
}

.topography__fallback {
  stroke: var(--cp-accent);
  stroke-width: 0.8;
}

.topography[data-scene="ready"] .topography__canvas {
  opacity: 1;
}

.topography[data-scene="ready"] .topography__fallback {
  visibility: hidden;
}

.about .topography__title {
  position: absolute;
  inset-block-end: 0.5rem;
  inset-inline-start: clamp(1.25rem, 6vw, 7rem);
  margin: 0;
  color: var(--cp-accent);
  font-family: var(--font-heading);
  font-size: clamp(1.4rem, 3.5vw, 3.5rem);
  line-height: 1.2;
  text-shadow: 0 2px var(--cp-bg);
}

.about .topography__caption {
  padding-block: 0.75rem;
  font-size: 0.65rem;
}

@include breakpoints.respond-above(xl) {
  .topography__masthead {
    padding-inline: 12rem 5rem;
  }

  .topography__stage {
    margin-inline: 10rem 5rem;
  }

  .about .topography__title {
    inset-inline-start: 2rem;
  }
}

@media (width >= 1000px) and (height >= 800px) and (forced-colors: none) {
  html:has(.topography) {
    scroll-padding-block-start: calc(38svh + 2rem);
  }

  .topography {
    position: sticky;
    inset-block-start: 0;
    block-size: 38svh;
    max-block-size: 32rem;
  }

  .about section[id],
  .about h1[id] {
    scroll-margin-block-start: 2rem;
  }
}

@media (forced-colors: active) {
  .topography {
    position: relative;
    border-color: CanvasText;
  }

  .topography__canvas {
    display: none;
  }

  .topography__fallback {
    visibility: visible;
    stroke: CanvasText;
  }

  .about .topography__title {
    color: CanvasText;
    text-shadow: none;
  }
}
</style>
