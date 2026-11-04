<template>
  <div class="wave-study">
    <div
      ref="stage"
      class="wave-sculpture"
      :class="{ 'wave-sculpture--ready': ready }"
      :data-wave-state="state"
      :data-wave-chapter="chapter"
      aria-hidden="true">
      <div class="wave-sculpture__fallback"></div>
      <canvas ref="canvas" class="wave-sculpture__canvas"></canvas>
      <div ref="caption" class="wave-sculpture__caption">
        <span>Interference study</span>
        <span>{{ chapterNames[chapter] }} / {{ chapter + 1 }}&mdash;7</span>
      </div>
    </div>
    <Teleport
      v-if="ready && (state === 'running' || state === 'paused')"
      to="#about-art-controls">
      <button
        class="wave-study__pause"
        type="button"
        @click="toggleArtwork?.()">
        {{ paused ? "Resume artwork" : "Pause artwork" }}
      </button>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { WebGLRenderer } from "three";

const stage = useTemplateRef<HTMLElement>("stage");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const caption = useTemplateRef<HTMLElement>("caption");
const ready = ref(false);
const state = ref("static");
const chapter = ref(0);
const paused = ref(false);
let toggleArtwork: (() => void) | undefined;
const chapterNames = [
  "Origin",
  "Connection",
  "Transmission",
  "Collaboration",
  "Resonance",
  "Exchange",
  "Continuity",
];
let cleanup: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  const host = stage.value;
  const surface = canvas.value;
  const label = caption.value;
  if (!host || !surface || !label) {
    return;
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = window.matchMedia("(forced-colors: active)");
  let renderer: WebGLRenderer | undefined;
  let frame = 0;
  let previousFrame = 0;
  let visible = false;
  let observer: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let disposeScene: (() => void) | undefined;
  let renderScene: (() => void) | undefined;
  let resizeScene: (() => void) | undefined;
  let lost = false;

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const canRender = () =>
    visible &&
    !document.hidden &&
    !contrast.matches &&
    !lost &&
    !disposed &&
    !paused.value;
  const tick = (timestamp: number) => {
    frame = 0;
    if (!canRender()) {
      return;
    }
    if (motion.matches || timestamp - previousFrame >= 1000 / 30) {
      previousFrame = timestamp;
      renderScene?.();
    }
    if (!motion.matches) {
      frame = requestAnimationFrame(tick);
    }
  };
  const resume = () => {
    stop();
    previousFrame = 0;
    if (canRender()) {
      frame = requestAnimationFrame(tick);
    }
  };
  const preferenceChanged = () => {
    if (lost) {
      state.value = "unavailable";
      stop();
      return;
    }
    state.value = contrast.matches
      ? "static"
      : motion.matches
        ? "reduced-motion"
        : paused.value
          ? "paused"
          : "running";
    resume();
  };
  toggleArtwork = () => {
    paused.value = !paused.value;
    preferenceChanged();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    ready.value = false;
    state.value = "unavailable";
    stop();
    console.warn("About wave sculpture: WebGL context lost; using static art.");
  };
  const themeChanged = () => {
    if (visible && !document.hidden && !contrast.matches && !lost) {
      renderScene?.();
    }
    resume();
  };
  cleanup = () => {
    stop();
    observer?.disconnect();
    resizeObserver?.disconnect();
    motion.removeEventListener("change", preferenceChanged);
    contrast.removeEventListener("change", preferenceChanged);
    document.removeEventListener("visibilitychange", resume);
    window.removeEventListener("__themeChanged", themeChanged);
    surface.removeEventListener("webglcontextlost", contextLost);
    disposeScene?.();
    renderer?.dispose();
  };

  try {
    const THREE = await import("three");
    if (disposed) {
      return;
    }
    renderer = new THREE.WebGLRenderer({
      canvas: surface,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const scene = new THREE.Scene();
    const accent = new THREE.Color(getComputedStyle(label).color);
    const background = new THREE.Color(getComputedStyle(host).backgroundColor);
    const white = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    camera.position.set(0, 0.7, 14);
    camera.lookAt(0, 0, 0);
    const sculpture = new THREE.Group();
    scene.add(sculpture);
    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(accent.clone().lerp(white, 0.75), 4);
    key.position.set(-4, 6, 6);
    const rim = new THREE.DirectionalLight(0xffffff, 3);
    rim.position.set(5, -2, 4);
    scene.add(key, rim);

    // Thin solid ribbons, rather than a wireframe grid, reveal the folded surface.
    const ribbons = 100;
    const segments = 120;
    const positions = new Float32Array(ribbons * (segments + 1) * 2 * 3);
    const indices: number[] = [];
    for (let ribbon = 0; ribbon < ribbons; ribbon++) {
      for (let segment = 0; segment < segments; segment++) {
        const index = (ribbon * (segments + 1) + segment) * 2;
        indices.push(
          index,
          index + 1,
          index + 2,
          index + 1,
          index + 3,
          index + 2,
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", position);
    geometry.setIndex(indices);
    const material = new THREE.MeshStandardMaterial({
      color: accent,
      metalness: 0.62,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    sculpture.add(mesh);
    const echoMaterial = new THREE.MeshStandardMaterial({
      color: accent.clone().lerp(background, 0.45),
      metalness: 0.5,
      roughness: 0.38,
      side: THREE.DoubleSide,
    });
    const echo = new THREE.Mesh(geometry, echoMaterial);
    echo.position.z = -0.3;
    echo.rotation.z = 0.13;
    echo.frustumCulled = false;
    sculpture.add(echo);
    const sectionIds = [
      "the-person",
      "location",
      "youtube",
      "github",
      "awards",
      "stackoverflow",
      "microsoft-mvp",
    ];
    const sections = sectionIds.map((id) => document.getElementById(id));
    let phase = 0;
    let elapsed = 0;
    let previousTime = performance.now();
    let lastTheme = "";
    let horizontal = 0;
    const phases = [0, 0.7, 1.55, 2.4, 3.2, 4.1, 4.9];
    renderScene = () => {
      const currentTime = performance.now();
      const delta = Math.min((currentTime - previousTime) / 1000, 0.05);
      previousTime = currentTime;
      if (!motion.matches && !paused.value) {
        elapsed += delta;
      }
      let active = 0;
      for (let index = 0; index < sections.length; index++) {
        const bounds = sections[index]?.getBoundingClientRect();
        if (bounds && bounds.top < window.innerHeight * 0.65) {
          active = index;
        }
      }
      chapter.value = active;
      const target = phases[active] ?? 0;
      phase = motion.matches
        ? 0
        : paused.value
          ? phase
          : phase + (target - phase) * Math.min(delta * 2, 1);
      const theme = document.documentElement.dataset.theme ?? "light";
      if (theme !== lastTheme) {
        lastTheme = theme;
        material.color.set(getComputedStyle(label).color);
        background.set(getComputedStyle(host).backgroundColor);
        echoMaterial.color.copy(material.color).lerp(background, 0.45);
        key.color.copy(material.color).lerp(white, 0.75);
        material.metalness = theme === "dark" ? 0.58 : 0.35;
      }
      const time = motion.matches ? 0 : elapsed * 0.1;
      for (let ribbon = 0; ribbon < ribbons; ribbon++) {
        const v = (ribbon / (ribbons - 1) - 0.5) * 5.5;
        for (let segment = 0; segment <= segments; segment++) {
          const u = (segment / segments - 0.5) * 9;
          for (let edge = 0; edge < 2; edge++) {
            const y = v + (edge - 0.5) * 0.028;
            const radius = Math.hypot(u * 0.8, y);
            const envelope =
              Math.cos((u / 9) * Math.PI) * Math.cos((y / 7) * Math.PI);
            const wave =
              Math.sin(u * 1.15 + y * 0.85 + time + phase) * 0.65 +
              Math.cos(radius * 1.7 - time - phase * 0.6) * 0.6;
            const twist = Math.sin(u * 0.5 + phase) * y * 0.36;
            const offset = ((ribbon * (segments + 1) + segment) * 2 + edge) * 3;
            positions[offset] = u;
            positions[offset + 1] = y;
            positions[offset + 2] = wave * envelope + twist;
          }
        }
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      sculpture.rotation.set(
        -0.48 + Math.sin(phase) * 0.12,
        -0.3 + phase * 0.06,
        -0.33,
      );
      const targetX =
        host.clientWidth >= 1000 && active === 0 && !motion.matches ? 2.8 : 0;
      horizontal =
        ready.value && !paused.value && !motion.matches
          ? horizontal + (targetX - horizontal) * Math.min(delta * 2, 1)
          : targetX;
      sculpture.position.x = horizontal;
      renderer?.render(scene, camera);
      ready.value = true;
    };
    resizeScene = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) {
        return;
      }
      camera.aspect = width / height;
      camera.position.z = width < 600 ? 18 : 13.5;
      camera.updateProjectionMatrix();
      renderer?.setSize(width, height, false);
      if (visible && !contrast.matches && !lost) {
        renderScene?.();
      }
      resume();
    };
    disposeScene = () => {
      geometry.dispose();
      material.dispose();
      echoMaterial.dispose();
      scene.clear();
    };
    observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      resume();
    });
    observer.observe(host);
    resizeObserver = new ResizeObserver(() => resizeScene?.());
    resizeObserver.observe(host);
    motion.addEventListener("change", preferenceChanged);
    contrast.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("__themeChanged", themeChanged);
    surface.addEventListener("webglcontextlost", contextLost);
    preferenceChanged();
    resizeScene();
  } catch (error) {
    cleanup();
    ready.value = false;
    state.value = "unavailable";
    console.warn("About wave sculpture unavailable; using static art.", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  cleanup?.();
});
</script>

<style lang="scss">
.wave-study {
  position: relative;
}

.wave-study__pause {
  display: inline-block;
  padding: 0.6rem 0.9rem;
  margin-block-start: 1rem;
  border: 1px solid var(--cp-border-strong);
  border-radius: var(--global-border-radius);
  background: var(--cp-bg);
  color: var(--cp-accent);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.wave-sculpture {
  position: relative;
  isolation: isolate;
  inline-size: 100%;
  block-size: clamp(22rem, 49vw, 48rem);
  overflow: hidden;
  pointer-events: none;
  border-block: 1px solid var(--cp-border);
  background: var(--cp-bg);
}

.wave-sculpture__canvas,
.wave-sculpture__fallback {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}

.wave-sculpture__canvas {
  opacity: 0;
}

.wave-sculpture--ready .wave-sculpture__canvas {
  opacity: 1;
}

.wave-sculpture__fallback {
  inset: 18% 7%;
  inline-size: auto;
  block-size: auto;
  border-radius: 50%;
  background: repeating-radial-gradient(
    ellipse at 30% 45%,
    transparent 0 5px,
    var(--cp-accent) 6px 7px,
    transparent 8px 13px
  );
  transform: rotate(-15deg) skewY(12deg);
  opacity: 0.28;
}

.wave-sculpture--ready .wave-sculpture__fallback {
  visibility: hidden;
}

.wave-sculpture__caption {
  position: absolute;
  inset-inline: clamp(1.25rem, 6vw, 7rem);
  inset-block-end: 1.25rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--cp-accent);
  font-family: var(--global-font-family-monospace);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (forced-colors: active) {
  .wave-sculpture {
    display: none;
  }
}
</style>
