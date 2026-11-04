<template>
  <div
    ref="stage"
    class="folded-paper"
    :class="{ 'folded-paper--ready': ready }"
    :data-state="state"
    :data-chapter="chapter"
    aria-hidden="true">
    <div class="folded-paper__heading">
      <span>A life, unfolding</span>
      <span>{{ String(chapter + 1).padStart(2, "0") }} / 07</span>
    </div>
    <div ref="surface" class="folded-paper__surface">
      <div class="folded-paper__fallback">
        <span v-for="fold in 7" :key="fold"></span>
      </div>
    </div>
    <div class="folded-paper__caption">
      <span>{{ chapters[chapter] }}</span>
      <span>One sheet. Many chapters.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

const chapters = [
  "The person",
  "London",
  "Watch & learn",
  "Open source",
  "Community",
  "Questions & answers",
  "An earlier chapter",
];
const stage = useTemplateRef<HTMLElement>("stage");
const surface = useTemplateRef<HTMLElement>("surface");
const ready = ref(false);
const state = ref("paper");
const chapter = ref(0);
let renderer: WebGLRenderer | undefined;
let geometry: BufferGeometry | undefined;
let material: MeshStandardMaterial | undefined;
let mesh: Mesh | undefined;
let scene: Scene | undefined;
let camera: PerspectiveCamera | undefined;
let observer: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let themeObserver: MutationObserver | undefined;
let reducedMotion: MediaQueryList | undefined;
let forcedColors: MediaQueryList | undefined;
let sections: HTMLElement[] = [];
let frame = 0;
let visible = false;
let disposed = false;
let loading = false;
let target = 0;
let position = 0;
let lastTime = 0;
const folds = 12;
const isDisposed = () => disposed;

const pause = () => {
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
};

const release = () => {
  pause();
  ready.value = false;
  resizeObserver?.disconnect();
  renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
  geometry?.dispose();
  material?.dispose();
  renderer?.dispose();
  renderer?.domElement.remove();
  renderer = undefined;
  geometry = undefined;
  material = undefined;
  mesh = undefined;
  scene = undefined;
  camera = undefined;
};

const fail = (error: unknown) => {
  console.warn(
    "Folded paper unavailable; retaining the paper illustration.",
    error,
  );
  state.value = "fallback";
  release();
};

const contextLost = (event: Event) => {
  event.preventDefault();
  fail(new Error("The decorative WebGL context was lost."));
};

const sculpt = () => {
  if (!geometry || !mesh) {
    return;
  }
  const vertices = geometry.getAttribute("position");
  const palette = geometry.getAttribute("color");
  const progress = reducedMotion?.matches ? 0 : position;
  const opening = 0.72 + Math.sin((progress * Math.PI) / 3 + 0.3) * 0.55;
  const points: { y: number; z: number }[] = [{ y: -3.2, z: 0 }];
  for (let i = 0; i < folds; i++) {
    const crease =
      (i % 2 === 0 ? 1 : -1) * opening +
      Math.sin(i * 0.62 + progress * 0.8) * 0.45;
    const angle = Math.max(-1.42, Math.min(1.42, crease));
    const previous = points[i]!;
    points.push({
      y: previous.y + Math.cos(angle) * 0.58,
      z: previous.z + Math.sin(angle) * 0.58,
    });
  }
  const middleY = (points[0]!.y + points[folds]!.y) / 2;
  const middleZ = (points[0]!.z + points[folds]!.z) / 2;
  for (let i = 0; i < folds; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const twistA = Math.sin(i * 0.5 + progress * 0.55) * 0.38;
    const twistB = Math.sin((i + 1) * 0.5 + progress * 0.55) * 0.38;
    // Shared hinge positions keep all twelve panels a continuous sheet.
    const corners = [
      [-1.25, a.y - middleY, a.z - middleZ - twistA],
      [1.25, a.y - middleY, a.z - middleZ + twistA],
      [-1.25, b.y - middleY, b.z - middleZ - twistB],
      [1.25, a.y - middleY, a.z - middleZ + twistA],
      [1.25, b.y - middleY, b.z - middleZ + twistB],
      [-1.25, b.y - middleY, b.z - middleZ - twistB],
    ];
    for (let j = 0; j < corners.length; j++) {
      const corner = corners[j]!;
      vertices.setXYZ(i * 6 + j, corner[0]!, corner[1]!, corner[2]!);
      const tint = i === Math.round(progress) + 2 ? 0.68 : 1;
      palette.setXYZ(i * 6 + j, tint, i % 4 === 1 ? 0.78 : tint, 1);
    }
  }
  vertices.needsUpdate = true;
  palette.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  mesh.rotation.set(
    -0.15 + Math.sin(progress * 0.6) * 0.2,
    -0.5 + progress * 0.16,
    -0.2 + Math.sin(progress) * 0.15,
  );
};

const render = (time: number) => {
  frame = 0;
  if (!renderer || !scene || !camera || !visible || document.hidden) {
    return;
  }
  const elapsed = Math.min((time - (lastTime || time - 16)) / 1000, 0.05);
  lastTime = time;
  position += (target - position) * (1 - Math.exp(-elapsed * 9));
  if (reducedMotion?.matches) {
    position = 0;
  }
  sculpt();
  renderer.render(scene, camera);
  if (!reducedMotion?.matches && Math.abs(target - position) > 0.001) {
    frame = requestAnimationFrame(render);
  } else {
    lastTime = 0;
  }
};

const requestRender = () => {
  if (!frame && renderer && visible && !document.hidden) {
    frame = requestAnimationFrame(render);
  }
};

const updateChapter = () => {
  const anchor = window.innerHeight * 0.45;
  let next = 0;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i]!.getBoundingClientRect().top <= anchor) {
      next = i;
    }
  }
  chapter.value = next;
  const current = sections[next]?.getBoundingClientRect();
  target =
    next +
    (current
      ? Math.max(0, Math.min(1, (anchor - current.top) / current.height))
      : 0);
  requestRender();
};

const resize = () => {
  if (!surface.value || !renderer || !camera) {
    return;
  }
  const { width, height } = surface.value.getBoundingClientRect();
  if (!width || !height) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.position.z = Math.max(9.5, 5 / camera.aspect);
  camera.updateProjectionMatrix();
  requestRender();
};

const updateTheme = () => {
  if (material && stage.value) {
    material.color.set(
      getComputedStyle(stage.value).getPropertyValue("--paper-colour").trim(),
    );
    requestRender();
  }
};

const initialise = async () => {
  if (
    isDisposed() ||
    renderer ||
    loading ||
    forcedColors?.matches ||
    !visible
  ) {
    return;
  }
  loading = true;
  try {
    const THREE = await import("three");
    if (isDisposed() || forcedColors?.matches || !surface.value) {
      return;
    }
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.className = "folded-paper__canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    surface.value.append(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x695678, 2.4));
    const key = new THREE.DirectionalLight(0xfff1de, 4);
    key.position.set(-4, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb095e8, 3);
    rim.position.set(4, 1, -3);
    scene.add(rim);
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(folds * 18), 3),
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(new Float32Array(folds * 18), 3),
    );
    material = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.86,
      metalness: 0,
      vertexColors: true,
      flatShading: true,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    updateTheme();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface.value);
    resize();
    state.value = "webgl";
    ready.value = true;
    updateChapter();
  } catch (error) {
    if (!isDisposed()) {
      fail(error);
    }
  } finally {
    loading = false;
  }
};

const preferenceChanged = () => {
  if (forcedColors?.matches) {
    state.value = "paper";
    release();
  } else if (!renderer) {
    void initialise();
  } else {
    requestRender();
  }
};

const visibilityChanged = () => {
  if (document.hidden) {
    pause();
  } else {
    updateChapter();
  }
};

onMounted(() => {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  forcedColors = window.matchMedia("(forced-colors: active)");
  sections = [
    ...(stage.value
      ?.closest("article")
      ?.querySelectorAll<HTMLElement>(
        ":scope > header[id], :scope > section[id]",
      ) ?? []),
  ];
  reducedMotion.addEventListener("change", preferenceChanged);
  forcedColors.addEventListener("change", preferenceChanged);
  window.addEventListener("scroll", updateChapter, { passive: true });
  document.addEventListener("visibilitychange", visibilityChanged);
  themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) {
      if (state.value !== "fallback") {
        void initialise();
      }
      updateChapter();
    } else {
      pause();
    }
  });
  if (stage.value) {
    observer.observe(stage.value);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  release();
  observer?.disconnect();
  themeObserver?.disconnect();
  reducedMotion?.removeEventListener("change", preferenceChanged);
  forcedColors?.removeEventListener("change", preferenceChanged);
  window.removeEventListener("scroll", updateChapter);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style lang="scss">
.folded-paper {
  --paper-colour: #f1e8dc;

  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-inline-size: 0;
  padding: 1.5rem;
  color: var(--global-body-color);
  pointer-events: none;
}

[data-theme="dark"] .folded-paper {
  --paper-colour: #ddd1ee;
}

.folded-paper__heading,
.folded-paper__caption {
  display: grid;
  gap: 0.6rem;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.folded-paper__heading {
  grid-template-columns: 1fr auto;
  padding-block-end: 1rem;
  border-block-end: 1px solid var(--global-border-color);
}

.folded-paper__caption {
  padding-block-start: 1rem;
  border-block-start: 1px solid var(--global-border-color);
}

.folded-paper__caption > :first-child {
  color: var(--global-accent-color);
  font-size: 0.85rem;
}

.folded-paper__surface {
  position: relative;
  min-block-size: 0;
}

.folded-paper__canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.folded-paper__fallback {
  position: absolute;
  inset: 20% 14%;
  display: grid;
  transform: rotate(-15deg);
}

.folded-paper__fallback span {
  background: linear-gradient(
    160deg,
    var(--paper-colour),
    var(--global-content-background-color)
  );
  border-block-end: 1px solid var(--global-border-color);
  transform: skewY(-12deg);
}

.folded-paper__fallback span:nth-child(even) {
  transform: skewY(12deg);
}

.folded-paper--ready .folded-paper__fallback {
  display: none;
}

@media (forced-colors: active) {
  .about > .folded-paper {
    display: none;
  }
}
</style>
