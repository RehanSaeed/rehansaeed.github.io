<template>
  <div
    ref="host"
    class="dimensional-mosaic"
    :class="[
      `dimensional-mosaic--${composition}`,
      { 'dimensional-mosaic--ready': ready },
    ]"
    :data-scene-state="state">
    <div class="dimensional-mosaic__original"><slot /></div>
    <canvas
      ref="canvas"
      class="dimensional-mosaic__canvas"
      aria-hidden="true"
      @webglcontextlost="loseContext" />
    <span
      ref="registration"
      class="dimensional-mosaic__registration"
      aria-hidden="true">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { WebGLRenderer } from "three";

const props = defineProps<{
  /** Whether the page's motion and forced-colour preferences allow a relief. */
  enabled: boolean;
  /** Existing, same-origin artwork used for the decorative tile faces. */
  image: string;
  /** Ordered tile choreography associated with this chapter. */
  composition: "portrait" | "broadcast" | "honour" | "alumni";
  /** Decorative installation caption, not an additional content heading. */
  label: string;
}>();

const host = useTemplateRef<HTMLDivElement>("host");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const registration = useTemplateRef<HTMLSpanElement>("registration");
const ready = ref(false);
const state = ref("static");
let renderer: WebGLRenderer | undefined;
let destroyScene: (() => void) | undefined;
let observer: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let visible = false;
let disposed = false;
let loading = false;
let failed = false;
let frame = 0;
let requestRender: (() => void) | undefined;

const isUnavailable = () => disposed || failed;
const canEnhance = () => !isUnavailable() && visible && props.enabled;

const stopFrame = () => {
  cancelAnimationFrame(frame);
  frame = 0;
};

const fail = (message: string, error?: unknown) => {
  console.warn(`[About mosaic] ${message}`, error ?? "");
  failed = true;
  ready.value = false;
  state.value = "fallback";
  stopFrame();
  destroyScene?.();
  destroyScene = undefined;
};

const loseContext = (event: Event) => {
  event.preventDefault();
  fail("WebGL context lost; retaining the original artwork.");
};

const start = async () => {
  if (loading || renderer || !canEnhance()) {
    return;
  }
  loading = true;
  state.value = "loading";
  try {
    const THREE = await import("three");
    if (!canEnhance()) {
      state.value = "static";
      return;
    }
    const element = host.value;
    const surface = canvas.value;
    if (!element || !surface) {
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
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 60);
    camera.position.set(0, 0, 12.5);
    const group = new THREE.Group();
    scene.add(group);
    const columns = 28;
    const rows = props.composition === "portrait" ? 32 : 18;
    const count = columns * rows;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const offsets = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      offsets[i * 2] = (i % columns) / columns;
      offsets[i * 2 + 1] = 1 - (Math.floor(i / columns) + 1) / rows;
    }
    geometry.setAttribute(
      "tileOffset",
      new THREE.InstancedBufferAttribute(offsets, 2),
    );
    const accent = new THREE.Color();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        artwork: { value: null },
        accent: { value: accent },
        grid: { value: new THREE.Vector2(columns, rows) },
      },
      vertexShader: `
        attribute vec2 tileOffset;
        uniform vec2 grid;
        varying vec2 imageUv;
        varying float face;
        varying float light;
        void main() {
          imageUv = tileOffset + uv / grid;
          face = step(0.5, normal.z);
          vec3 n = normalize(mat3(modelMatrix * instanceMatrix) * normal);
          light = 0.72 + 0.28 * max(dot(n, normalize(vec3(-0.4, 0.6, 1.0))), 0.0);
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D artwork;
        uniform vec3 accent;
        varying vec2 imageUv;
        varying float face;
        varying float light;
        void main() {
          vec4 photo = texture2D(artwork, imageUv);
          vec3 tile = mix(accent * 0.6, photo.rgb, face * photo.a);
          gl_FragColor = vec4(tile * light, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const tiles = new THREE.InstancedMesh(geometry, material, count);
    tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // The full installation can extend outside the original planar bounds.
    tiles.frustumCulled = false;
    group.add(tiles);
    let texture: InstanceType<typeof THREE.Texture> | undefined;
    destroyScene = () => {
      resizeObserver?.disconnect();
      texture?.dispose();
      texture = undefined;
      geometry.dispose();
      material.dispose();
      tiles.dispose();
      renderer?.dispose();
      renderer = undefined;
      requestRender = undefined;
    };
    const loadedTexture = await new THREE.TextureLoader().loadAsync(
      props.image,
    );
    if (isUnavailable()) {
      loadedTexture.dispose();
      return;
    }
    texture = loadedTexture;
    texture.colorSpace = THREE.SRGBColorSpace;
    material.uniforms.artwork!.value = texture;
    const tile = new THREE.Object3D();
    const pointer = new THREE.Vector2();
    let targetX = 0;
    let targetY = 0;
    let progress = 0;
    let lastTime = 0;
    let settled = 0;
    const portrait = props.composition === "portrait";
    const width = portrait ? 4.25 : 7.5;
    const height = portrait
      ? 6.375
      : props.composition === "alumni"
        ? 3.03
        : 4.22;

    const updateTheme = () => {
      if (registration.value) {
        // Computed RGB also resolves CSS colour syntax unsupported by Three.
        accent.set(getComputedStyle(registration.value).color);
      }
      requestRender?.();
    };
    const render = (time: number) => {
      frame = 0;
      if (!canEnhance() || document.hidden || !renderer) {
        return;
      }
      const bounds = element.getBoundingClientRect();
      const target = THREE.MathUtils.clamp(
        (window.innerHeight * 0.7 - bounds.top) /
          (window.innerHeight * 0.6 + bounds.height * 0.4),
        0,
        1,
      );
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const ease = 1 - Math.exp(-delta * 7);
      progress += (target - progress) * ease;
      pointer.x += (targetX - pointer.x) * ease;
      pointer.y += (targetY - pointer.y) * ease;
      const turn = Math.sin(progress * Math.PI);
      for (let i = 0; i < count; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = ((col + 0.5) / columns - 0.5) * width;
        const y = (0.5 - (row + 0.5) / rows) * height;
        const radius = Math.hypot(x, y);
        const wave = Math.sin(col * 0.2 + row * 0.16 - progress * 4);
        const diagonal = (col / columns + row / rows) / 2;
        const fold = Math.sin(
          THREE.MathUtils.clamp(progress * 2.4 - diagonal, 0, 1) * Math.PI,
        );
        let depth = wave * 0.18;
        let rotateX = 0;
        let rotateY = fold * 0.85;
        if (props.composition === "broadcast") {
          depth = Math.sin(col * 0.42) * turn * 1.1;
          rotateY = Math.cos(col * 0.42) * turn * 0.8;
        } else if (props.composition === "honour") {
          depth = Math.cos(radius * 2.2 - progress * 4) * turn * 0.8;
          rotateX = y * turn * 0.12;
          rotateY = -x * turn * 0.12;
        } else if (props.composition === "alumni") {
          depth = ((col + row) % 2 === 0 ? 1 : -1) * turn * 0.45;
          rotateY = fold * Math.PI;
        } else {
          depth += fold * 0.8;
          rotateX = Math.sin(row * 0.15) * turn * 0.16;
        }
        tile.position.set(x, y, depth);
        tile.rotation.set(rotateX, rotateY, 0);
        tile.scale.set(
          (width / columns) * 0.94,
          (height / rows) * 0.94,
          0.16 + turn * 0.12,
        );
        tile.updateMatrix();
        tiles.setMatrixAt(i, tile.matrix);
      }
      group.rotation.set(
        pointer.y * 0.12 + 0.035,
        pointer.x * 0.18 - 0.13,
        -0.035,
      );
      tiles.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      ready.value = true;
      state.value = "ready";
      settled =
        Math.abs(target - progress) < 0.001 &&
        Math.abs(targetX - pointer.x) + Math.abs(targetY - pointer.y) < 0.001
          ? settled + 1
          : 0;
      // No perpetual animation: settle after input, then sleep until the next event.
      if (settled < 4) {
        frame = requestAnimationFrame(render);
      }
    };
    requestRender = () => {
      settled = 0;
      if (!frame) {
        lastTime = performance.now() - 16;
        frame = requestAnimationFrame(render);
      }
    };
    const resize = () => {
      if (!renderer) {
        return;
      }
      const { width: size, height: blockSize } =
        element.getBoundingClientRect();
      if (!size || !blockSize) {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(size, blockSize, false);
      camera.aspect = size / blockSize;
      camera.position.z = Math.max(12.5, (width / camera.aspect) * 1.9);
      camera.updateProjectionMatrix();
      requestRender?.();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      const bounds = element.getBoundingClientRect();
      targetX = THREE.MathUtils.clamp(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -1,
        1,
      );
      targetY = THREE.MathUtils.clamp(
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
        -1,
        1,
      );
      requestRender?.();
    };
    const leave = () => {
      targetX = 0;
      targetY = 0;
      requestRender?.();
    };
    const cleanup = destroyScene;
    destroyScene = () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      window.removeEventListener("__themeChanged", updateTheme);
      cleanup();
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", leave);
    window.addEventListener("__themeChanged", updateTheme);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    updateTheme();
    resize();
  } catch (error) {
    if (!isUnavailable()) {
      fail(
        "Unable to initialise the relief; retaining the original artwork.",
        error,
      );
    }
  } finally {
    loading = false;
  }
};

const updatePreference = () => {
  if (!props.enabled) {
    stopFrame();
    ready.value = false;
    state.value = "static";
  } else if (renderer) {
    requestRender?.();
  } else {
    void start();
  }
};

watch(() => props.enabled, updatePreference);

const refresh = () => {
  if (document.hidden) {
    stopFrame();
  } else {
    requestRender?.();
  }
};

onMounted(() => {
  window.addEventListener("scroll", refresh, { passive: true });
  document.addEventListener("visibilitychange", refresh);
  if (!("IntersectionObserver" in window)) {
    return;
  }
  observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      if (renderer) {
        requestRender?.();
      } else {
        void start();
      }
    } else {
      stopFrame();
    }
  });
  if (host.value) {
    observer.observe(host.value);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  stopFrame();
  observer?.disconnect();
  destroyScene?.();
  window.removeEventListener("scroll", refresh);
  document.removeEventListener("visibilitychange", refresh);
});
</script>

<style lang="scss">
.dimensional-mosaic {
  position: relative;
  isolation: isolate;
  display: grid;
  align-items: center;
  min-inline-size: 0;
  inline-size: 100%;
  min-block-size: 22rem;
  aspect-ratio: 16 / 11;
  border: 1px solid var(--global-border-color);
  background:
    linear-gradient(var(--global-border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--global-border-color) 1px, transparent 1px),
    var(--global-content-background-color);
  background-size: 3rem 3rem;
  overflow: clip;
}

.dimensional-mosaic--portrait {
  min-block-size: 32rem;
  aspect-ratio: 1;
}

.dimensional-mosaic__original {
  position: relative;
  inline-size: 82%;
  margin-inline: auto;
}

.dimensional-mosaic--portrait .dimensional-mosaic__original {
  max-inline-size: 280px;
}

.dimensional-mosaic__canvas {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
  pointer-events: none;
}

.dimensional-mosaic--ready .dimensional-mosaic__canvas {
  opacity: 1;
}

.dimensional-mosaic--ready .dimensional-mosaic__original {
  opacity: 0;
}

.dimensional-mosaic__registration {
  position: absolute;
  inset-block-end: 1rem;
  inset-inline: 1rem;
  color: var(--global-accent-color);
  font-family: var(--global-font-family-monospace);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (width < 700px) {
  .dimensional-mosaic {
    min-block-size: 16rem;
  }

  .dimensional-mosaic--portrait {
    min-block-size: 26rem;
  }
}

@media (forced-colors: active), (prefers-reduced-motion: reduce) {
  .dimensional-mosaic__canvas {
    display: none;
  }

  .dimensional-mosaic .dimensional-mosaic__original {
    opacity: 1;
  }

  .dimensional-mosaic {
    background: Canvas;
    border-color: CanvasText;
  }
}
</style>
