<template>
  <div
    ref="installation"
    class="letterpress"
    :class="{ 'letterpress--ready': ready }"
    aria-hidden="true">
    <div class="letterpress__registration">
      <span>About / Muhammad Rehan Saeed</span>
      <span>Type in motion</span>
    </div>
    <div class="letterpress__stage">
      <span class="letterpress__fallback">REHAN</span>
      <canvas ref="canvas" class="letterpress__canvas" />
    </div>
    <div class="letterpress__registration">
      <span>A software developer's story</span>
      <span>{{ chapterLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const installation = useTemplateRef("installation");
const canvas = useTemplateRef("canvas");
const ready = ref(false);
const chapterLabel = ref("01 / The person");
let dispose: (() => void) | undefined;
let cancelled = false;

onMounted(async () => {
  try {
    const { mountLetterpress } = await import("~/utils/letterpress");
    if (cancelled || !canvas.value || !installation.value) {
      return;
    }
    dispose = mountLetterpress(canvas.value, installation.value, {
      onReady: (value) => {
        ready.value = value;
      },
      onChapter: (label) => {
        chapterLabel.value = label;
      },
    });
  } catch (error) {
    console.error("The decorative About letterpress could not load.", error);
  }
});

onBeforeUnmount(() => {
  cancelled = true;
  dispose?.();
});
</script>

<style lang="scss">
@use "~/assets/style/abstracts/breakpoints";

.letterpress {
  position: relative;
  z-index: 2;
  padding: 1rem clamp(1.25rem, 4vw, 4rem);
  border-block: 1px solid var(--cp-border);
  background: var(--cp-bg);
  pointer-events: none;
}

.letterpress__registration {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 2rem;
  color: var(--cp-accent);
  font-family: var(--global-font-family-monospace);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.letterpress__stage {
  position: relative;
  display: grid;
  place-items: center;
  block-size: clamp(12rem, 28vw, 23rem);
  overflow: clip;
}

.letterpress__fallback {
  color: var(--cp-accent);
  font-family: var(--font-heading);
  font-size: clamp(3rem, 13vw, 12rem);
  letter-spacing: -0.07em;
  text-shadow: 0.04em 0.04em var(--cp-border);
}

.letterpress__canvas {
  position: absolute;
  inset: 0;
  display: block;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
}

.letterpress--ready .letterpress__canvas {
  opacity: 1;
}

.letterpress--ready .letterpress__fallback {
  visibility: hidden;
}

@media (width >= 1100px) and (height >= 750px) {
  .letterpress {
    position: sticky;
    inset-block-start: 4rem;
    padding-inline-end: var(--global-space-main);
  }

  .letterpress__stage {
    block-size: min(28vh, 23rem);
  }

  article.about section[id],
  article.about h1[id] {
    scroll-margin-block-start: calc(min(28vh, 23rem) + 10rem);
  }
}

@include breakpoints.respond-above(xl) {
  .letterpress {
    padding-inline: var(--global-space-main);
  }
}

@media (forced-colors: active) {
  .letterpress__canvas {
    display: none;
  }

  .letterpress--ready .letterpress__fallback {
    visibility: visible;
  }
}
</style>
