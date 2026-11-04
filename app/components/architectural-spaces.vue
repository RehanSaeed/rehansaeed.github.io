<template>
  <div ref="gallery" class="architecture" :data-scene="status">
    <div class="architecture__viewport" aria-hidden="true">
      <div class="architecture__fallback">
        <span v-for="frame in 6" :key="frame"></span>
      </div>
      <canvas ref="canvas" class="architecture__canvas"></canvas>
    </div>
    <div class="architecture__label">
      <p class="about__eyebrow">Architectural spaces</p>
      <p class="architecture__title">A walk through<br />the work.</p>
      <p>
        Scroll to move through the gallery <span aria-hidden="true">↓</span>
      </p>
      <p v-if="status === 'unavailable'" class="architecture__notice">
        The 3D gallery is unavailable. All profile content continues below.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WebGLRenderer } from "three";

const gallery = useTemplateRef<HTMLElement>("gallery");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const status = ref("static");
let dispose: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  const host = gallery.value;
  const surface = canvas.value;
  if (!host || !surface) {
    return;
  }
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = window.matchMedia("(forced-colors: active)");
  if (contrast.matches) {
    return;
  }

  let renderer: WebGLRenderer | undefined;
  try {
    const THREE = await import("three");
    if (disposed) {
      return;
    }
    renderer = new THREE.WebGLRenderer({
      canvas: surface,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 220);
    const stone = new THREE.MeshStandardMaterial({ roughness: 0.82 });
    const purple = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.35,
    });
    const light = new THREE.MeshBasicMaterial();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 240), stone);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.1, -90);
    scene.add(floor);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x74648c, 3));
    const sun = new THREE.DirectionalLight(0xffffff, 4);
    sun.position.set(-12, 20, 8);
    scene.add(sun);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const beam = (
      x: number,
      y: number,
      z: number,
      width: number,
      height: number,
      depth: number,
      material = stone,
    ) => {
      const mesh = new THREE.Mesh(box, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(width, height, depth);
      scene.add(mesh);
      return mesh;
    };
    for (let index = 0; index < 38; index++) {
      const z = 6 - index * 5;
      beam(-7, 5, z, 0.65, 10, 0.65);
      beam(7, 5, z, 0.65, 10, 0.65);
      beam(0, 10, z, 14.65, 0.65, 0.65);
      beam(-6.62, 5, z, 0.06, 9.5, 0.1, purple);
      beam(6.62, 5, z, 0.06, 9.5, 0.1, purple);
    }
    const sculptures = [
      new THREE.IcosahedronGeometry(1.3),
      new THREE.TorusKnotGeometry(0.9, 0.22, 72, 12),
      new THREE.OctahedronGeometry(1.6),
      new THREE.BoxGeometry(1.9, 1.9, 1.9),
      new THREE.DodecahedronGeometry(1.4),
      new THREE.TetrahedronGeometry(1.7),
      new THREE.TorusGeometry(1.1, 0.4, 16, 48),
    ];
    sculptures.forEach((geometry, room) => {
      const installation = new THREE.Group();
      installation.position.set(room % 2 ? -2.5 : 2.5, 3.8, -room * 25 - 8);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.15, 12, 80),
        purple,
      );
      ring.rotation.set(room * 0.35, room * 0.5, room * 0.2);
      installation.add(ring);
      const inner = new THREE.Mesh(geometry, purple);
      inner.rotation.set(room * 0.4, room * 0.7, 0.3);
      installation.add(inner);
      scene.add(installation);
      beam(
        installation.position.x,
        0.6,
        installation.position.z,
        4.5,
        1.2,
        4.5,
      );
    });
    for (const x of [-5.8, 5.8]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.025, 210),
        light,
      );
      strip.position.set(x, 0.01, -90);
      scene.add(strip);
    }
    let frame = 0;
    let visible = true;
    let target = 0;
    let position = 0;
    const render = () => {
      frame = 0;
      if (disposed || !visible || document.hidden || contrast.matches) {
        return;
      }
      position = motion.matches ? 0 : position + (target - position) * 0.09;
      camera.position.set(
        3.8 + Math.sin(position * Math.PI * 3) * 1.2,
        3.2,
        16 - position * 150,
      );
      camera.lookAt(-1.5, 4.8, camera.position.z - 24);
      renderer?.render(scene, camera);
      surface.dataset.progress = position.toFixed(3);
      if (!motion.matches && Math.abs(target - position) > 0.0001) {
        frame = requestAnimationFrame(render);
      }
    };
    const requestRender = () => {
      if (!frame) {
        frame = requestAnimationFrame(render);
      }
    };
    const updateScroll = () => {
      const article = host.closest("article");
      if (!article) {
        return;
      }
      const sections = article.querySelectorAll<HTMLElement>(
        ":scope > header, :scope > section[id]",
      );
      let progress = 0;
      sections.forEach((section, index) => {
        const bounds = section.getBoundingClientRect();
        if (bounds.top <= window.innerHeight * 0.6) {
          progress =
            index + Math.min(1, Math.max(0, -bounds.top / bounds.height));
        }
      });
      target = Math.min(1, progress / (sections.length - 1));
      requestRender();
    };
    const resize = () => {
      const { width, height } = surface.getBoundingClientRect();
      renderer?.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      updateScroll();
    };
    const updateTheme = () => {
      const accentElement = host.querySelector(".about__eyebrow");
      if (!accentElement) {
        throw new Error("The architectural gallery accent element is missing.");
      }
      const background = new THREE.Color(
        getComputedStyle(host).backgroundColor,
      );
      const accent = new THREE.Color(getComputedStyle(accentElement).color);
      scene.background = background;
      scene.fog = new THREE.Fog(background, 22, 100);
      stone.color.copy(background);
      purple.color.copy(accent);
      light.color.copy(accent);
      requestRender();
    };
    const updatePreference = () => {
      status.value = contrast.matches ? "static" : "ready";
      requestRender();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      status.value = "unavailable";
      console.warn("Architectural gallery: WebGL context lost.");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) {
        requestRender();
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(surface);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(surface);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("__themeChanged", updateTheme);
    document.addEventListener("visibilitychange", requestRender);
    motion.addEventListener("change", updatePreference);
    contrast.addEventListener("change", updatePreference);
    surface.addEventListener("webglcontextlost", contextLost);
    dispose = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeObserver.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("__themeChanged", updateTheme);
      document.removeEventListener("visibilitychange", requestRender);
      motion.removeEventListener("change", updatePreference);
      contrast.removeEventListener("change", updatePreference);
      surface.removeEventListener("webglcontextlost", contextLost);
      const geometries = new Set<{ dispose(): void }>();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh &&
          object.geometry instanceof THREE.BufferGeometry
        ) {
          geometries.add(object.geometry);
        }
      });
      geometries.forEach((geometry) => {
        geometry.dispose();
      });
      stone.dispose();
      purple.dispose();
      light.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
    updateTheme();
    resize();
    status.value = "ready";
  } catch (error) {
    renderer?.dispose();
    renderer?.forceContextLoss();
    status.value = "unavailable";
    console.warn("Architectural gallery unavailable:", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  dispose?.();
});
</script>

<style lang="scss">
.architecture {
  position: sticky;
  inset-block-start: 0;
  block-size: 88svh;
  min-block-size: 420px;
  margin-block-end: 0;
  overflow: clip;
  background: var(--global-background-color);
  pointer-events: none;
}

.architecture__viewport,
.architecture__canvas,
.architecture__fallback {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}

.architecture__canvas {
  opacity: 0;
}

.architecture[data-scene="ready"] .architecture__canvas {
  opacity: 1;
}

.architecture__fallback {
  display: grid;
  place-items: center;
  perspective: 700px;
  color: var(--global-accent-color);
  background: var(--global-background-color);
}

.architecture__fallback span {
  position: absolute;
  inline-size: 65%;
  block-size: 80%;
  border: clamp(4px, 1vw, 14px) solid currentColor;
  transform: translateZ(-100px);
}

@for $index from 1 through 6 {
  .architecture__fallback span:nth-child(#{$index}) {
    transform: translateZ($index * -150px);
    opacity: 1 - $index * 0.12;
  }
}

.architecture__label {
  position: absolute;
  inset-block-end: 3rem;
  inset-inline-start: clamp(1.25rem, 6vw, 7rem);
  max-inline-size: calc(100% - 2.5rem);
  padding: clamp(1rem, 2vw, 2rem);
  border-inline-start: 2px solid var(--global-accent-color);
  background: var(--global-background-color);
}

.about .architecture__title {
  margin-block: 0 1rem;
  color: var(--global-title-color);
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 4vw, 4rem);
  line-height: 1.2;
}

.architecture__notice {
  max-inline-size: 35ch;
}

@media (forced-colors: active) {
  .architecture__canvas {
    display: none;
  }

  .architecture__fallback {
    color: CanvasText;
  }

  .architecture__label {
    border-color: CanvasText;
    background: Canvas;
  }
}
</style>
