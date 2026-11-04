<template>
  <div
    ref="host"
    class="orbital-gallery"
    :class="{ 'orbital-gallery--ready': ready }"
    :data-state="state"
    aria-hidden="true">
    <div class="orbital-gallery__fallback">
      <span />
      <span />
      <span />
    </div>
    <canvas ref="canvas" class="orbital-gallery__canvas" />
  </div>
</template>

<script setup lang="ts">
import type { WebGLRenderer } from "three";

const host = useTemplateRef<HTMLDivElement>("host");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const ready = ref(false);
const state = ref("loading");
let disposeScene: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  const element = host.value;
  const surface = canvas.value;
  if (!element || !surface) {
    return;
  }
  let renderer: WebGLRenderer | undefined;
  try {
    const THREE = await import("three");
    if (disposed) {
      return;
    }
    const forcedColors = window.matchMedia("(forced-colors: active)");
    if (forcedColors.matches) {
      state.value = "fallback";
      return;
    }
    renderer = new THREE.WebGLRenderer({
      canvas: surface,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    const mobile = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.68,
      roughness: 0.25,
    });
    const accent = new THREE.MeshStandardMaterial({
      metalness: 0.42,
      roughness: 0.2,
    });
    const rings: InstanceType<typeof THREE.Group>[] = [];
    const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
    const wireMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.3,
    });
    const chapters = [
      "the-person",
      "location",
      "youtube",
      "github",
      "awards",
      "stackoverflow",
      "microsoft-mvp",
    ].map((id) => document.getElementById(id));
    const ringGeometry = new THREE.TorusGeometry(1, 0.014, 8, 128);
    const beadGeometry = new THREE.IcosahedronGeometry(0.06, 1);
    const prismGeometry = new THREE.OctahedronGeometry(0.2);
    geometries.push(ringGeometry, beadGeometry, prismGeometry);
    for (let index = 0; index < 7; index++) {
      const pivot = new THREE.Group();
      const ring = new THREE.Mesh(
        ringGeometry,
        index % 2 === 0 ? accent : material,
      );
      const radius = 1.3 + index * 0.24;
      ring.scale.set(radius, radius * (index % 2 === 0 ? 1 : 0.8), 1);
      pivot.add(ring);
      const bead = new THREE.Mesh(beadGeometry, accent);
      bead.position.set(radius, 0, 0);
      pivot.add(bead);
      // Suspended facets and fine wires make a mobile, rather than planets.
      if (index % 2 === 0) {
        const pendant = new THREE.Mesh(prismGeometry, material);
        pendant.position.set(-radius * 0.65, -0.75, 0);
        pivot.add(pendant);
        const wireGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-radius * 0.65, radius * 0.6, 0),
          pendant.position,
        ]);
        geometries.push(wireGeometry);
        pivot.add(new THREE.Line(wireGeometry, wireMaterial));
      }
      pivot.rotation.set(0.35 + index * 0.2, index * 0.27, index * 0.3);
      rings.push(pivot);
      mobile.add(pivot);
    }
    scene.add(mobile);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x34304a, 3));
    const key = new THREE.DirectionalLight(0xffffff, 5);
    key.position.set(3, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 3);
    fill.position.set(-4, -2, 2);
    scene.add(fill);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let phase = 0;
    let previousTime = 0;
    let progress = 0;
    let targetProgress = 0;
    let pointerX = 0;
    let pointerY = 0;
    let lost = false;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };
    const render = (time = 0) => {
      frame = 0;
      if (disposed || lost || !visible || document.hidden) {
        return;
      }
      const moving = !motion.matches && !forcedColors.matches;
      if (moving) {
        phase += Math.min(time - (previousTime || time), 50) * 0.00006;
        progress += (targetProgress - progress) * 0.035;
        previousTime = time;
      }
      const position = moving ? progress : 0;
      mobile.rotation.set(
        0.12 + position * 0.16 + (moving ? pointerY * 0.07 : 0),
        -0.45 + position * 0.32 + (moving ? pointerX * 0.12 : 0),
        -0.25,
      );
      rings.forEach((ring, index) => {
        ring.rotation.y = index * 0.27 + phase * (index % 2 === 0 ? 1 : -1);
        ring.rotation.z = index * 0.3 + position * 0.09 * (index - 3);
        const scale = 1 + Math.max(0, 1 - Math.abs(position - index)) * 0.09;
        ring.scale.setScalar(scale);
      });
      const cameraOffset = element.clientWidth < 700 ? 0 : -1.65;
      camera.position.set(
        cameraOffset + Math.sin(position * 0.55) * 0.6,
        0.25 + position * 0.08,
        Math.max(9.5, 8 / camera.aspect),
      );
      camera.lookAt(cameraOffset, 0, 0);
      renderer?.render(scene, camera);
      if (moving) {
        frame = requestAnimationFrame(render);
      }
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(render);
      }
    };
    const updateScroll = () => {
      const focus = window.innerHeight * 0.45;
      targetProgress = 0;
      for (let index = chapters.length - 1; index >= 0; index--) {
        const chapter = chapters[index];
        if (chapter && chapter.getBoundingClientRect().top <= focus) {
          targetProgress = index;
          break;
        }
      }
      schedule();
    };
    const updatePointer = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    const updateTheme = () => {
      const style = getComputedStyle(element);
      // Computed colours normalise CSS space-separated HSL for Three.js.
      const color = style.color;
      const bodyColor = style.borderBlockStartColor;
      accent.color.set(color);
      accent.emissive.set(color);
      accent.emissiveIntensity = 0.18;
      material.color.set(bodyColor);
      wireMaterial.color.set(color);
      schedule();
    };
    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) {
        return;
      }
      renderer?.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      schedule();
    };
    const updatePreference = () => {
      stop();
      state.value =
        forcedColors.matches || lost
          ? "fallback"
          : motion.matches
            ? "static"
            : "animated";
      ready.value = !forcedColors.matches && !lost;
      schedule();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      stop();
      ready.value = false;
      state.value = "fallback";
      console.warn("Orbital gallery WebGL context lost; using static artwork.");
    };
    const contextRestored = () => {
      lost = false;
      updatePreference();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) {
        schedule();
      } else {
        stop();
      }
    });
    observer.observe(element);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("__themeChanged", updateTheme);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", updatePreference);
    forcedColors.addEventListener("change", updatePreference);
    surface.addEventListener("webglcontextlost", contextLost);
    surface.addEventListener("webglcontextrestored", contextRestored);
    disposeScene = () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("__themeChanged", updateTheme);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", updatePreference);
      forcedColors.removeEventListener("change", updatePreference);
      surface.removeEventListener("webglcontextlost", contextLost);
      surface.removeEventListener("webglcontextrestored", contextRestored);
      geometries.forEach((geometry) => {
        geometry.dispose();
      });
      material.dispose();
      accent.dispose();
      wireMaterial.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
    resize();
    updateTheme();
    updateScroll();
    updatePreference();
  } catch (error) {
    disposeScene?.();
    renderer?.dispose();
    ready.value = false;
    state.value = "fallback";
    console.warn("Orbital gallery unavailable; using static artwork.", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  disposeScene?.();
});
</script>

<style lang="scss">
.orbital-gallery {
  position: sticky;
  inset-block-start: 4rem;
  block-size: min(94svh, 1100px);
  inline-size: 100%;
  color: var(--global-accent-color);
  border-block-start-color: var(--global-body-color);
  overflow: hidden;
  pointer-events: none;
}

.orbital-gallery__canvas,
.orbital-gallery__fallback {
  position: absolute;
  inset: 0;
  block-size: 100%;
  inline-size: 100%;
}

.orbital-gallery__canvas {
  opacity: 0;
}

.orbital-gallery--ready .orbital-gallery__canvas {
  opacity: 1;
}

.orbital-gallery--ready .orbital-gallery__fallback {
  visibility: hidden;
}

.orbital-gallery__fallback {
  display: grid;
  place-items: center;

  span {
    position: absolute;
    inline-size: 70%;
    aspect-ratio: 1;
    border: 1px solid var(--global-accent-color);
    border-radius: 50%;
    transform: rotate(-25deg) scaleY(0.55);
  }

  span:nth-child(2) {
    transform: rotate(35deg) scaleY(0.65);
  }

  span:nth-child(3) {
    transform: rotate(85deg) scaleY(0.75);
  }
}

@media (forced-colors: active) {
  .orbital-gallery {
    display: none;
  }
}
</style>
