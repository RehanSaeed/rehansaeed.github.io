<template>
  <div
    ref="host"
    class="ribbon-journey"
    :data-state="state"
    :data-chapter="chapter"
    aria-hidden="true">
    <svg
      class="ribbon-journey__fallback"
      viewBox="0 0 800 800"
      focusable="false">
      <path
        d="M 400 80 C 740 80 740 540 400 540 S 60 240 400 240 S 740 720 400 720 S 60 80 400 80"
        fill="none"
        stroke="currentColor"
        stroke-width="36" />
    </svg>
    <canvas ref="canvas" class="ribbon-journey__canvas" />
  </div>
</template>

<script setup lang="ts">
const host = useTemplateRef<HTMLElement>("host");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const state = ref("static");
const chapter = ref("the-person");
let dispose: (() => void) | undefined;
let disposed = false;

onMounted(async () => {
  const element = host.value;
  const surface = canvas.value;
  if (!element || !surface) return;
  const forcedColors = window.matchMedia("(forced-colors: active)");
  if (forcedColors.matches) return;
  try {
    const THREE = await import("three");
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({
      canvas: surface,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    const sculpture = new THREE.Group();
    scene.add(sculpture);
    scene.add(new THREE.HemisphereLight("white", "black", 3));
    const key = new THREE.DirectionalLight("white", 5);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight("white", 6);
    rim.position.set(4, -1, -3);
    scene.add(rim);

    const segments = 420;
    const positions = new Float32Array((segments + 1) * 2 * 3);
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute("position", position);
    geometry.setIndex(indices);
    const material = new THREE.MeshPhysicalMaterial({
      metalness: 0.58,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(geometry, material);
    sculpture.add(ribbon);
    const edgeMaterial = new THREE.LineBasicMaterial();
    const edges = [0, 1].map(() => {
      const edgeGeometry = new THREE.BufferGeometry();
      edgeGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3),
      );
      const edge = new THREE.Line(edgeGeometry, edgeMaterial);
      sculpture.add(edge);
      return edge;
    });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = [
      "the-person",
      "location",
      "youtube",
      "github",
      "awards",
      "stackoverflow",
      "microsoft-mvp",
    ];
    let target = 0;
    let current = 0;
    let frame = 0;
    let visible = true;
    let lost = false;
    const draw = () => {
      frame = 0;
      if (
        disposed ||
        lost ||
        !visible ||
        document.hidden ||
        forcedColors.matches
      )
        return;
      current = reducedMotion.matches
        ? 0
        : current + (target - current) * 0.085;
      const weave = Math.sin(current * Math.PI * 0.32);
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const radius = 2.25 + 0.7 * Math.cos(3 * t + current * 0.4);
        const twist = t * 1.5 + current * 0.32;
        for (let side = 0; side < 2; side++) {
          const width = (side === 0 ? -1 : 1) * 0.24;
          const x = (radius + width * Math.cos(twist)) * Math.cos(2 * t);
          const y = (radius + width * Math.cos(twist)) * Math.sin(2 * t);
          const z =
            (0.95 + weave * 0.45) * Math.sin(3 * t) + width * Math.sin(twist);
          position.setXYZ(i * 2 + side, x, y * (1 + weave * 0.18), z);
          edges[side]?.geometry
            .getAttribute("position")
            .setXYZ(i, x, y * (1 + weave * 0.18), z);
        }
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      for (const edge of edges) {
        edge.geometry.getAttribute("position").needsUpdate = true;
      }
      sculpture.rotation.set(0.3 + current * 0.12, current * 0.45, -0.2);
      const narrow = element.clientWidth < 700;
      camera.position.set(
        Math.sin(current * 0.6) * 0.6,
        Math.sin(current * 0.4) * 0.4,
        (narrow ? 18 : 13.5) + Math.sin(current * 0.45) * 1.2,
      );
      camera.lookAt(narrow ? 0 : -2.6, 0, 0);
      renderer.render(scene, camera);
      state.value = "ready";
      if (!reducedMotion.matches && Math.abs(target - current) > 0.002) {
        frame = requestAnimationFrame(draw);
      }
    };
    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const updateScroll = () => {
      const anchor = window.innerHeight * 0.55;
      let next = 0;
      for (const [index, id] of sections.entries()) {
        const bounds = document.getElementById(id)?.getBoundingClientRect();
        if (bounds && bounds.top <= anchor) {
          next =
            index +
            Math.min(1, Math.max(0, (anchor - bounds.top) / bounds.height));
          chapter.value = id;
        }
      }
      target = next;
      requestDraw();
    };
    const resize = new ResizeObserver(() => {
      renderer.setSize(element.clientWidth, element.clientHeight, false);
      camera.aspect = element.clientWidth / Math.max(1, element.clientHeight);
      camera.updateProjectionMatrix();
      updateScroll();
    });
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      requestDraw();
    });
    const updateTheme = () => {
      material.color.set(getComputedStyle(element).color);
      edgeMaterial.color.copy(material.color).lerp(new THREE.Color("white"), 0.6);
      requestDraw();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      state.value = "unavailable";
      cancelAnimationFrame(frame);
      frame = 0;
      console.warn("Ribbon journey: WebGL context lost; using static artwork.");
    };
    const contextRestored = () => {
      lost = false;
      requestDraw();
    };
    dispose = () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("__themeChanged", updateTheme);
      document.removeEventListener("visibilitychange", requestDraw);
      reducedMotion.removeEventListener("change", requestDraw);
      forcedColors.removeEventListener("change", requestDraw);
      surface.removeEventListener("webglcontextlost", contextLost);
      surface.removeEventListener("webglcontextrestored", contextRestored);
      geometry.dispose();
      material.dispose();
      edges.forEach((edge) => edge.geometry.dispose());
      edgeMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
    resize.observe(element);
    visibility.observe(element);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("__themeChanged", updateTheme);
    document.addEventListener("visibilitychange", requestDraw);
    reducedMotion.addEventListener("change", requestDraw);
    forcedColors.addEventListener("change", requestDraw);
    surface.addEventListener("webglcontextlost", contextLost);
    surface.addEventListener("webglcontextrestored", contextRestored);
    updateTheme();
  } catch (error) {
    dispose?.();
    state.value = "unavailable";
    console.warn("Ribbon journey unavailable; using static artwork.", error);
  }
});

onBeforeUnmount(() => {
  disposed = true;
  dispose?.();
});
</script>

<style lang="scss">
.ribbon-journey {
  position: sticky;
  inset-block-start: 4rem;
  block-size: calc(100svh - 4rem);
  margin-block-end: calc(-100svh + 4rem);
  overflow: hidden;
  pointer-events: none;
  color: var(--global-accent-color);
}

.ribbon-journey__canvas,
.ribbon-journey__fallback {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}

.ribbon-journey__fallback {
  inset-inline-start: 45%;
  inline-size: 55%;
  opacity: 0.16;
}

.ribbon-journey:not([data-state="ready"]) .ribbon-journey__canvas,
.ribbon-journey[data-state="ready"] .ribbon-journey__fallback {
  visibility: hidden;
}

@media (forced-colors: active) {
  .ribbon-journey {
    visibility: hidden;
  }
}
</style>
