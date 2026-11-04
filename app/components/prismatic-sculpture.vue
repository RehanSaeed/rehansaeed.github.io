<template>
  <div
    ref="gallery"
    class="prism"
    :class="{ 'prism--ready': ready }"
    aria-hidden="true">
    <div class="prism__frame">
      <div class="prism__legend">
        <span>Facets of a developer</span>
        <span>{{ chapter.toString().padStart(2, "0") }} / 07</span>
      </div>
      <div ref="surface" class="prism__surface">
        <svg class="prism__fallback" viewBox="0 0 500 600" focusable="false">
          <path class="prism__orbit" d="M45 380 250 485 455 380 250 275Z" />
          <path class="prism__orbit" d="M70 395 250 490 430 395" />
          <g class="prism__crystal">
            <path d="m250 80 110 145-110 255-110-255Z" />
            <path class="prism__facet" d="m250 80 15 190-125-45Z" />
            <path class="prism__light" d="m250 80 110 145-95 45Z" />
            <path class="prism__facet" d="m265 270 95-45-110 255Z" />
            <path
              class="prism__edge"
              d="m250 80 15 190-15 210M140 225l125 45 95-45" />
          </g>
          <g class="prism__satellite">
            <path d="m105 170 35 55-35 95-30-95Z" />
            <path class="prism__light" d="m105 170 35 55-35 95 5-95Z" />
            <path d="m395 285 30 55-30 95-35-95Z" />
            <path class="prism__light" d="m395 285 30 55-30 95 5-95Z" />
          </g>
        </svg>
      </div>
      <div class="prism__caption">
        <span class="prism__chapter">{{ chapters[chapter - 1] }}</span>
        <span>One story. Different facets.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WebGLRenderer } from "three";

const chapters = [
  "The person",
  "London",
  "Watch & learn",
  "Open source",
  "Community",
  "Questions & answers",
  "An earlier chapter",
];
const gallery = useTemplateRef<HTMLDivElement>("gallery");
const surface = useTemplateRef<HTMLDivElement>("surface");
const ready = ref(false);
const chapter = ref(1);
let dispose: (() => void) | undefined;

onMounted(() => {
  const host = surface.value;
  const root = gallery.value;
  if (!host || !root) {
    return;
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = window.matchMedia("(forced-colors: active)");
  const accentPaint = root.querySelector(".prism__legend")!;
  const surfacePaint = root.querySelector(".prism__light")!;
  const sections = [
    ...root
      .closest("article")!
      .querySelectorAll<HTMLElement>(":scope > header, :scope > section[id]"),
  ];
  let disposed = false;
  let visible = false;
  let loading = false;
  let failed = false;
  let frame = 0;
  let renderer: WebGLRenderer | undefined;
  let draw: (() => void) | undefined;
  let release: (() => void) | undefined;
  const unavailable = () => disposed || contrast.matches;

  const invalidate = () => {
    if (frame || !visible || document.hidden || contrast.matches || failed) {
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (visible && !document.hidden && !contrast.matches && !failed) {
        draw?.();
      }
    });
  };
  const fail = (error: unknown) => {
    failed = true;
    ready.value = false;
    console.warn("The decorative About sculpture is unavailable.", error);
    release?.();
    release = undefined;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    fail(new Error("WebGL context lost; showing the static sculpture."));
  };
  const load = async () => {
    if (loading || renderer || unavailable() || failed) {
      return;
    }
    loading = true;
    try {
      const THREE = await import("three");
      if (unavailable()) {
        return;
      }
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
      });
      if (!context) {
        throw new Error(
          "WebGL 2 is unavailable; showing the static sculpture.",
        );
      }
      release = () => context.getExtension("WEBGL_lose_context")?.loseContext();
      renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        alpha: true,
        antialias: true,
      });
      release = () => {
        renderer?.domElement.removeEventListener(
          "webglcontextlost",
          contextLost,
        );
        renderer?.domElement.remove();
        renderer?.dispose();
        renderer?.forceContextLoss();
      };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0, 0);
      renderer.domElement.className = "prism__canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
      host.append(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      const installation = new THREE.Group();
      scene.add(installation);
      const geometry = new THREE.OctahedronGeometry(1);
      const edges = new THREE.EdgesGeometry(geometry);
      const materials = Array.from(
        { length: 4 },
        () =>
          new THREE.MeshStandardMaterial({
            metalness: 0.32,
            roughness: 0.36,
            flatShading: true,
          }),
      );
      const outline = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.38,
      });
      const shards = Array.from({ length: 36 }, (_, index) => {
        const mesh = new THREE.Mesh(
          geometry,
          materials[index % materials.length],
        );
        mesh.add(new THREE.LineSegments(edges, outline));
        installation.add(mesh);
        return mesh;
      });
      const ambient = new THREE.HemisphereLight(0xffffff, 0x221133, 2.8);
      const key = new THREE.DirectionalLight(0xffffff, 4);
      key.position.set(-3, 5, 6);
      const rim = new THREE.DirectionalLight(0xffffff, 5);
      rim.position.set(4, 1, -3);
      scene.add(ambient, key, rim);

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 129 }, (_, index) => {
          const angle = (index / 128) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * 2.7,
            -2.35,
            Math.sin(angle) * 2.7,
          );
        }),
      );
      const orbitMaterial = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.35,
      });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbit);

      const pose = (index: number, part: number) => {
        const angle = (index / 36) * Math.PI * 2;
        const layer = Math.floor(index / 12);
        switch (part) {
          case 1:
            return [
              Math.cos(angle) * 1.95,
              Math.sin(angle) * 1.95,
              Math.sin(angle * 3) * 0.6,
              0.14,
              0.38,
              angle,
            ];
          case 2: {
            const edge = (index % 12) / 12;
            const side = Math.floor(index / 12);
            const vertices = [
              [-1.3, 1.75],
              [1.8, 0],
              [-1.3, -1.75],
              [-1.3, 1.75],
            ];
            const start = vertices[side]!;
            const end = vertices[side + 1]!;
            return [
              start[0]! + (end[0]! - start[0]!) * edge,
              start[1]! + (end[1]! - start[1]!) * edge,
              Math.sin(angle * 2) * 0.25,
              0.23,
              0.42,
              -angle,
            ];
          }
          case 3:
            return [
              ((index % 6) - 2.5) * 0.65,
              (Math.floor(index / 6) - 2.5) * 0.65,
              Math.sin(angle * 2) * 0.6,
              0.22,
              0.44,
              Math.PI / 4,
            ];
          case 4:
            return [
              Math.cos(angle) * (1.3 + layer * 0.16),
              -1 + Math.abs(Math.sin(angle * 3)) * 2.2,
              Math.sin(angle) * 1.3,
              0.22,
              0.95,
              angle * 0.2,
            ];
          case 5:
            return [
              Math.cos(angle) * 1.65,
              (layer - 1) * 1.15,
              Math.sin(angle) * 1.05,
              0.4,
              0.25,
              Math.PI / 2,
            ];
          case 6:
            return [
              Math.cos(angle) * 1.65,
              Math.sin(angle) * 2,
              Math.sin(angle * 2) * 0.45,
              0.19,
              0.65,
              -angle,
            ];
          default:
            return [
              Math.cos(angle) * (0.65 + layer * 0.18),
              Math.sin(angle * 3) * 0.8,
              Math.sin(angle) * (0.65 + layer * 0.18),
              0.3,
              1.6 + Math.cos(angle * 2) * 0.5,
              angle * 0.15,
            ];
        }
      };
      release = () => {
        renderer?.domElement.removeEventListener(
          "webglcontextlost",
          contextLost,
        );
        renderer?.domElement.remove();
        geometry.dispose();
        edges.dispose();
        materials.forEach((material) => {
          material.dispose();
        });
        outline.dispose();
        orbitGeometry.dispose();
        orbitMaterial.dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
      };
      draw = () => {
        if (!renderer) {
          return;
        }
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) {
          return;
        }
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const accent = new THREE.Color(getComputedStyle(accentPaint).color);
        const background = new THREE.Color(getComputedStyle(surfacePaint).fill);
        materials.forEach((material, index) => {
          material.color.copy(accent).lerp(background, index * 0.24);
        });
        outline.color.copy(background);
        orbitMaterial.color.copy(accent);
        rim.color.copy(accent);
        let progress = 0;
        if (!motion.matches) {
          const focus = window.innerHeight * 0.45;
          for (let index = 1; index < sections.length; index++) {
            const previous = sections[index - 1]!.getBoundingClientRect().top;
            const next = sections[index]!.getBoundingClientRect().top;
            if (previous <= focus) {
              progress =
                index -
                1 +
                THREE.MathUtils.clamp(
                  (focus - previous) / (next - previous),
                  0,
                  1,
                );
            }
          }
        }
        const from = Math.floor(progress);
        const blend = THREE.MathUtils.smoothstep(progress - from, 0.1, 0.9);
        chapter.value = Math.min(7, Math.round(progress) + 1);
        shards.forEach((shard, index) => {
          const start = pose(index, from);
          const end = pose(index, Math.min(6, from + 1));
          const value = (axis: number) =>
            THREE.MathUtils.lerp(start[axis]!, end[axis]!, blend);
          shard.position.set(value(0), value(1), value(2));
          shard.scale.set(value(3), value(4), value(3));
          shard.rotation.set(0.18 + index * 0.1, index * 0.35, value(5));
        });
        installation.rotation.set(0.12, progress * 0.24, -0.12);
        camera.position.set(
          Math.sin(progress * 0.35) * 1.5,
          0.9,
          camera.aspect < 0.7 ? 11.5 : 9.5,
        );
        camera.lookAt(0, 0, 0);
        key.position.x = -3 + Math.sin(progress) * 3;
        renderer.render(scene, camera);
        ready.value = true;
      };
      invalidate();
    } catch (error) {
      fail(error);
    } finally {
      loading = false;
    }
  };
  const refresh = () => {
    if (contrast.matches) {
      ready.value = false;
    } else {
      if (visible) {
        void load();
      }
      invalidate();
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (visible) {
      refresh();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  observer.observe(host);
  const resize = new ResizeObserver(invalidate);
  resize.observe(host);
  const scroll = () => {
    if (!motion.matches) {
      invalidate();
    }
  };
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("__themeChanged", invalidate);
  document.addEventListener("visibilitychange", invalidate);
  motion.addEventListener("change", invalidate);
  contrast.addEventListener("change", refresh);
  dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    resize.disconnect();
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("__themeChanged", invalidate);
    document.removeEventListener("visibilitychange", invalidate);
    motion.removeEventListener("change", invalidate);
    contrast.removeEventListener("change", refresh);
    release?.();
  };
});

onBeforeUnmount(() => dispose?.());
</script>

<style lang="scss">
.prism {
  position: sticky;
  inset-block-start: 5rem;
  display: grid;
  align-self: start;
  grid-column: 1;
  grid-row: 1 / span 7;
  block-size: calc(100svh - 6rem);
  min-block-size: 30rem;
  pointer-events: none;
}

.prism__frame {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-inline-size: 0;
  padding: clamp(1rem, 3vw, 3rem);
  border-inline-end: 1px solid var(--cp-border);
}

.prism__legend,
.prism__caption {
  display: grid;
  gap: 0.6rem;
  font-family: var(--global-font-family-monospace);
  font-size: 0.65rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.prism__legend {
  grid-template-columns: 1fr auto;
  color: var(--cp-accent);
  padding-inline-start: 5rem;
}

.prism__chapter {
  color: var(--cp-accent);
  font-size: clamp(1rem, 1.5vw, 1.5rem);
}

.prism__surface {
  position: relative;
  min-block-size: 0;
}

.prism__canvas,
.prism__fallback {
  position: absolute;
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

.prism__fallback {
  fill: var(--cp-accent);
  stroke: var(--cp-border);
  stroke-width: 1;
}

.prism--ready .prism__fallback {
  visibility: hidden;
}

.prism__facet {
  fill: var(--cp-accent-hover);
}

.prism__light {
  fill: var(--cp-surface);
}

.prism__edge,
.prism__orbit {
  fill: none;
  stroke: var(--cp-accent);
}

.prism__satellite {
  opacity: 0.7;
}

@media (width < 1100px) {
  .prism {
    position: relative;
    inset-block-start: auto;
    grid-column: auto;
    grid-row: auto;
    block-size: 34rem;
    min-block-size: 0;
  }

  .prism__frame {
    border-inline-end: 0;
    border-block-end: 1px solid var(--cp-border);
    padding-inline: 1.5rem;
  }

  .prism__legend {
    padding-inline-start: 0;
  }
}

@media (forced-colors: active) {
  .prism__canvas {
    display: none;
  }

  .prism .prism__fallback {
    visibility: visible;
    fill: CanvasText;
    stroke: Canvas;
  }

  .prism__light,
  .prism__facet {
    fill: Canvas;
    stroke: CanvasText;
  }

  .prism__edge,
  .prism__orbit {
    stroke: CanvasText;
  }
}
</style>
