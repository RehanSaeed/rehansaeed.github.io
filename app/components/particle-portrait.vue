<template>
  <div
    ref="host"
    class="particle-portrait"
    aria-hidden="true"
    :data-state="state">
    <canvas ref="canvas" class="particle-portrait__canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
const host = useTemplateRef<HTMLDivElement>("host");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const state = ref("loading");
let dispose: (() => void) | undefined;
let disposed = false;
const isDisposed = () => disposed;

onMounted(async () => {
  const article = host.value?.closest("article");
  const surface = canvas.value;
  if (!article || !surface) {
    return;
  }
  const forcedColors = window.matchMedia("(forced-colors: active)");
  if (forcedColors.matches) {
    state.value = "fallback";
    return;
  }
  try {
    const THREE = await import("three");
    if (isDisposed()) {
      return;
    }
    const renderer = new THREE.WebGLRenderer({
      canvas: surface,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    dispose = () => {
      renderer.dispose();
      renderer.forceContextLoss();
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const windows = [
      ...article.querySelectorAll<HTMLElement>("[data-particle-chapter]"),
    ];
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.z = 6.5;
    const scene = new THREE.Scene();
    const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
    const materials: InstanceType<typeof THREE.ShaderMaterial>[] = [];
    let frame = 0;
    let visible = true;
    let ready = false;
    const isReady = () => ready;
    let pointerX = 0;
    let pointerY = 0;
    let width = 0;
    let height = 0;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const fallback = (error: unknown) => {
      console.warn(
        "Particle portrait unavailable; showing original artwork.",
        error,
      );
      stop();
      ready = false;
      state.value = "fallback";
      article.classList.remove("about--particles");
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      fallback(new Error("WebGL context lost"));
    };
    renderer.debug.onShaderError = (gl, program) => {
      fallback(
        new Error(
          gl.getProgramInfoLog(program) || "Portrait shader compilation failed",
        ),
      );
    };
    const points = new THREE.Group();
    scene.add(points);
    const palette = new THREE.Color();
    const updatePalette = () => {
      // Three.js expects legacy RGB/HSL syntax, not the site's space-separated HSL.
      palette.set(getComputedStyle(surface).color);
      for (const material of materials) {
        material.uniforms.accent!.value = palette;
        material.uniforms.dark!.value =
          document.documentElement.dataset.theme === "dark" ? 1 : 0;
      }
      requestRender();
    };
    const render = (time = 0) => {
      frame = 0;
      if (
        !ready ||
        isDisposed() ||
        document.hidden ||
        !visible ||
        forcedColors.matches
      ) {
        return;
      }
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      if (currentWidth !== width || currentHeight !== height) {
        width = currentWidth;
        height = currentHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height, false);
        for (const material of materials) {
          material.uniforms.pixelRatio!.value = renderer.getPixelRatio();
        }
      }
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.setScissorTest(true);
      let drewWindow = false;
      for (const [chapter, element] of windows.entries()) {
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= height || bounds.width <= 0) {
          continue;
        }
        const material = materials[chapter];
        if (!material) {
          continue;
        }
        drewWindow = true;
        points.children.forEach((child, index) => {
          child.visible = index === chapter;
        });
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
        const progress = Math.max(
          0,
          Math.min(1, (height - bounds.top) / (height * 0.75)),
        );
        material.uniforms.morph!.value =
          chapter === 0 ? 0 : reducedMotion.matches ? 1 : progress;
        material.uniforms.time!.value = reducedMotion.matches
          ? 0
          : time * 0.0003;
        points.rotation.y = reducedMotion.matches ? 0 : pointerX * 0.12;
        points.rotation.x = reducedMotion.matches ? 0 : pointerY * 0.08;
        renderer.setViewport(
          bounds.left,
          height - bounds.bottom,
          bounds.width,
          bounds.height,
        );
        renderer.setScissor(
          Math.max(0, bounds.left),
          Math.max(0, height - bounds.bottom),
          Math.min(width, bounds.right) - Math.max(0, bounds.left),
          Math.min(height, bounds.bottom) - Math.max(0, bounds.top),
        );
        renderer.render(scene, camera);
      }
      if (isReady() && drewWindow) {
        state.value = "ready";
      }
      if (isReady() && !reducedMotion.matches && drewWindow) {
        frame = requestAnimationFrame(render);
      }
    };
    const requestRender = () => {
      if (!frame && ready && !isDisposed()) {
        frame = requestAnimationFrame(render);
      }
    };
    const preferenceChanged = () => {
      stop();
      if (forcedColors.matches) {
        state.value = "fallback";
        article.classList.remove("about--particles");
        renderer.clear();
      } else if (ready) {
        state.value = "ready";
        article.classList.add("about--particles");
        updatePalette();
      }
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) {
        return;
      }
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
      requestRender();
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === article) {
          visible = entry.isIntersecting;
        }
      }
      if (!visible) {
        stop();
        renderer.setScissorTest(false);
        renderer.clear();
      } else {
        requestRender();
      }
    });
    observer.observe(article);
    const resizeObserver = new ResizeObserver(requestRender);
    resizeObserver.observe(article);
    windows.forEach((element) => {
      resizeObserver.observe(element);
    });
    const visibilityChanged = () => {
      if (document.hidden) {
        stop();
      } else {
        requestRender();
      }
    };
    surface.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    window.addEventListener("__themeChanged", updatePalette);
    article.addEventListener("pointermove", pointerMove, { passive: true });
    document.addEventListener("visibilitychange", visibilityChanged);
    reducedMotion.addEventListener("change", preferenceChanged);
    forcedColors.addEventListener("change", preferenceChanged);
    dispose = () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      surface.removeEventListener("webglcontextlost", contextLost);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      window.removeEventListener("__themeChanged", updatePalette);
      article.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("visibilitychange", visibilityChanged);
      reducedMotion.removeEventListener("change", preferenceChanged);
      forcedColors.removeEventListener("change", preferenceChanged);
      geometries.forEach((geometry) => {
        geometry.dispose();
      });
      materials.forEach((material) => {
        material.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      article.classList.remove("about--particles");
    };

    const image = new Image();
    image.src = "/images/author/Muhammad-Rehan-Saeed/Profile-320x480.jpg";
    await image.decode();
    if (isDisposed()) {
      return;
    }
    const sampler = document.createElement("canvas");
    sampler.width = 160;
    sampler.height = 240;
    const context = sampler.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Portrait image sampling is unavailable");
    }
    context.drawImage(image, 0, 0, 160, 240);
    const pixels = context.getImageData(0, 0, 160, 240).data;
    const positions: number[] = [];
    const colors: number[] = [];
    const targets = windows.map(() => [] as number[]);
    let index = 0;
    for (let y = 0; y < 240; y += 2) {
      for (let x = 0; x < 160; x += 2) {
        const pixel = (y * 160 + x) * 4;
        const r = pixels[pixel]! / 255;
        const g = pixels[pixel + 1]! / 255;
        const b = pixels[pixel + 2]! / 255;
        const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const px = (x / 160 - 0.5) * 2.3;
        const py = (0.5 - y / 240) * 3.45;
        positions.push(px, py, luminance * 0.6);
        const color = new THREE.Color(r, g, b).convertSRGBToLinear();
        colors.push(color.r, color.g, color.b);
        const u = x / 160;
        const v = y / 240;
        const angle = u * Math.PI * 2;
        const latitude = v * Math.PI;
        for (const [chapter, target] of targets.entries()) {
          if (chapter === 1) {
            // Longitude/latitude rows form a globe from the portrait's pixels.
            target.push(
              1.35 * Math.sin(latitude) * Math.cos(angle),
              1.35 * Math.cos(latitude),
              1.35 * Math.sin(latitude) * Math.sin(angle),
            );
          } else if (chapter === 2) {
            const radius = 0.3 + v * 1.4;
            target.push(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius * 0.6,
              Math.sin(v * Math.PI * 8) * 0.4,
            );
          } else if (chapter === 3) {
            const arm = index % 2 === 0 ? -1 : 1;
            target.push(
              arm * (0.35 + Math.abs(v - 0.5) * 2),
              (v - 0.5) * 2.5,
              (u - 0.5) * 0.8,
            );
          } else if (chapter === 4) {
            const radius = 1 + 0.3 * Math.cos(latitude * 8);
            target.push(
              radius * Math.cos(angle),
              radius * Math.sin(angle),
              0.5 * Math.sin(latitude * 8),
            );
          } else if (chapter === 5) {
            target.push(
              (u - 0.5) * 3,
              (Math.floor(v * 5) - 2) * 0.32 + Math.sin(angle) * 0.12,
              (((v * 5) % 1) - 0.5) * 0.8,
            );
          } else if (chapter === 6) {
            const radius = 1.1 + (v - 0.5) * 0.45;
            target.push(
              radius * Math.cos(angle),
              radius * Math.sin(angle),
              (v - 0.5) * 1.1,
            );
          } else {
            target.push(px, py, luminance * 0.6);
          }
        }
        index++;
      }
    }
    for (const [chapter, target] of targets.entries()) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.setAttribute(
        "target",
        new THREE.Float32BufferAttribute(target, 3),
      );
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          morph: { value: 0 },
          time: { value: 0 },
          accent: { value: palette },
          dark: { value: 0 },
          portrait: { value: chapter === 0 ? 1 : 0 },
          pixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
        },
        vertexShader: `
          attribute vec3 target;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vDepth;
          uniform float morph;
          uniform float time;
          uniform float portrait;
          uniform float pixelRatio;
          void main() {
            float blend = smoothstep(0.0, 1.0, morph);
            vec3 p = mix(position, target, blend);
            float angle = time * 0.18 * (1.0 - portrait);
            p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
            p.z += sin(p.x * 4.0 + time) * 0.035;
            vec4 view = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * view;
            gl_PointSize = clamp((portrait > 0.5 ? 19.0 : 13.0) / -view.z, 1.0, 5.0) * pixelRatio;
            vColor = color;
            vDepth = smoothstep(-1.6, 1.6, p.z);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vDepth;
          uniform vec3 accent;
          uniform float dark;
          uniform float portrait;
          void main() {
            float radius = length(gl_PointCoord - 0.5);
            if (radius > 0.5) discard;
            vec3 ink = mix(accent * 0.65, accent + vec3(0.22) * dark, vDepth);
            vec3 color = mix(ink, vColor, portrait * 0.88);
            gl_FragColor = vec4(color, (1.0 - smoothstep(0.28, 0.5, radius)) * mix(0.55, 1.0, vDepth));
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      });
      geometries.push(geometry);
      materials.push(material);
      points.add(new THREE.Points(geometry, material));
    }
    ready = true;
    article.classList.add("about--particles");
    updatePalette();
  } catch (error) {
    dispose?.();
    console.warn(
      "Particle portrait unavailable; showing original artwork.",
      error,
    );
    state.value = "fallback";
  }
});

onBeforeUnmount(() => {
  disposed = true;
  dispose?.();
});
</script>

<style lang="scss">
.particle-portrait {
  position: fixed;
  z-index: 2;
  inset: 0;
  color: var(--cp-accent);
  pointer-events: none;
}

.particle-portrait__canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

@media (forced-colors: active) {
  .particle-portrait {
    display: none;
  }
}
</style>
