import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import fontData from "~/assets/fonts/letterpress-relief.json";

type LetterpressEvents = {
  /** Whether the decorative canvas has successfully rendered. */
  onReady: (ready: boolean) => void;
  /** Visible chapter caption; the DOM headings remain authoritative. */
  onChapter: (label: string) => void;
};

const chapters = [
  { id: "the-person", word: "REHAN", label: "01 / The person" },
  { id: "location", word: "LONDON", label: "02 / Where I am" },
  { id: "youtube", word: "YOUTUBE", label: "03 / Watch & learn" },
  { id: "github", word: "GITHUB", label: "04 / Open source" },
  { id: "awards", word: "AWARDS", label: "05 / Community" },
  { id: "stackoverflow", word: "ANSWERS", label: "06 / Questions & answers" },
  { id: "microsoft-mvp", word: "MVP", label: "07 / An earlier chapter" },
];

export const mountLetterpress = (
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  events: LetterpressEvents,
) => {
  const registration = container.querySelector(".letterpress__registration");
  if (!registration) {
    throw new Error("The letterpress needs its themed registration caption.");
  }
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 25);
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (error) {
    console.warn(
      "WebGL letterpress unavailable; using static typography.",
      error,
    );
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const font = new FontLoader().parse(fontData);
  const face = new MeshStandardMaterial({ metalness: 0.25, roughness: 0.32 });
  const edge = new MeshStandardMaterial({ metalness: 0.45, roughness: 0.38 });
  scene.add(new AmbientLight(0xffffff, 2.4));
  const key = new DirectionalLight(0xffffff, 4);
  key.position.set(-5, 6, 9);
  const rim = new DirectionalLight(0xffffff, 3);
  rim.position.set(6, -2, 4);
  scene.add(key, rim);

  const words = chapters.map(({ word }) => {
    const group = new Group();
    let advance = 0;
    const letters = Array.from(word, (letter) => {
      const geometry = new TextGeometry(letter, {
        font,
        size: 2.7,
        depth: 0.75,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.055,
        bevelSize: 0.035,
        bevelSegments: 2,
      });
      geometry.computeBoundingBox();
      const mesh = new Mesh(geometry, [face, edge]);
      mesh.position.x = advance;
      advance +=
        (font.data.glyphs[letter]!.ha * 2.7) / font.data.resolution + 0.04;
      group.add(mesh);
      return { mesh, x: mesh.position.x };
    });
    const box = new Box3().setFromObject(group);
    const center = box.getCenter(new Vector3());
    const scale = Math.min(
      17 / Math.max(box.max.x - box.min.x, 1),
      3.4 / Math.max(box.max.y - box.min.y, 1),
    );
    group.scale.setScalar(scale);
    for (const letter of letters) {
      letter.x -= center.x;
      letter.mesh.position.set(letter.x, -center.y, 0);
    }
    group.visible = false;
    scene.add(group);
    return { group, letters, centerY: center.y };
  });

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const contrast = window.matchMedia("(forced-colors: active)");
  let visible = false;
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  let chapter = 0;
  let started = performance.now() - 1500;
  let scrollDepth = 0;
  let lastRender = 0;
  let transition = false;

  const render = (time: number) => {
    frame = 0;
    if (
      disposed ||
      !visible ||
      document.hidden ||
      contrast.matches ||
      contextLost
    ) {
      return;
    }
    const current = words[chapter]!;
    const progress = motion.matches ? 1 : Math.min(1, (time - started) / 1100);
    current.group.rotation.set(
      -0.14 + scrollDepth * 0.09,
      -0.18 + scrollDepth * 0.24,
      -0.025,
    );
    current.letters.forEach(({ mesh, x }, index) => {
      const local = Math.max(0, Math.min(1, progress * 1.6 - index * 0.075));
      const eased = 1 - (1 - local) ** 3;
      mesh.position.set(
        x + (1 - eased) * (index % 2 ? 2 : -2),
        -current.centerY + (1 - eased) * (index % 2 ? -4 : 4),
        (1 - eased) * (-8 - index),
      );
      mesh.rotation.set((1 - eased) * 0.9, (1 - eased) * -0.6, 0);
    });
    renderer.render(scene, camera);
    lastRender = time;
    events.onReady(true);
    transition = progress < 1;
    if (transition) {
      frame = requestAnimationFrame(render);
    }
  };
  const requestRender = () => {
    if (
      !frame &&
      !disposed &&
      visible &&
      !document.hidden &&
      !contrast.matches &&
      !contextLost
    ) {
      frame = requestAnimationFrame(render);
    }
  };
  const updateChapter = () => {
    const activationLine =
      container.getBoundingClientRect().bottom + window.innerHeight * 0.25;
    let next = 0;
    chapters.forEach(({ id }, index) => {
      const element = document.getElementById(id);
      if (element && element.getBoundingClientRect().top <= activationLine) {
        next = index;
      }
    });
    if (next !== chapter) {
      words[chapter]!.group.visible = false;
      chapter = next;
      words[chapter]!.group.visible = true;
      started = performance.now();
      events.onChapter(chapters[chapter]!.label);
    }
    const section = document.getElementById(chapters[chapter]!.id);
    scrollDepth =
      motion.matches || !section
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              -section.getBoundingClientRect().top / window.innerHeight,
            ),
          );
    requestRender();
  };
  const updateTheme = () => {
    face.color.set(getComputedStyle(registration).color);
    edge.color.copy(face.color).multiplyScalar(0.38);
    rim.color.set(getComputedStyle(container).color);
    requestRender();
  };
  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z =
      Math.max(10, 24 / camera.aspect / (2 * Math.tan((16 * Math.PI) / 180))) +
      1;
    camera.updateProjectionMatrix();
    requestRender();
  };
  const preferenceChanged = () => {
    if (contrast.matches) {
      events.onReady(false);
    }
    if (motion.matches) {
      started = performance.now() - 1500;
    }
    updateChapter();
  };
  const visibilityChanged = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      if (transition) {
        started += performance.now() - lastRender;
      }
      requestRender();
    }
  };
  const loseContext = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    events.onReady(false);
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    console.warn(
      "About letterpress context lost; static typography remains available.",
    );
  };
  const restoreContext = () => {
    contextLost = false;
    resize();
    updateTheme();
  };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (visible) {
      requestRender();
    }
  });
  const dimensions = new ResizeObserver(resize);
  intersection.observe(container);
  dimensions.observe(canvas);
  words[0]!.group.visible = true;
  updateTheme();
  resize();
  updateChapter();
  window.addEventListener("scroll", updateChapter, { passive: true });
  window.addEventListener("__themeChanged", updateTheme);
  document.addEventListener("visibilitychange", visibilityChanged);
  motion.addEventListener("change", preferenceChanged);
  contrast.addEventListener("change", preferenceChanged);
  canvas.addEventListener("webglcontextlost", loseContext);
  canvas.addEventListener("webglcontextrestored", restoreContext);

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    intersection.disconnect();
    dimensions.disconnect();
    window.removeEventListener("scroll", updateChapter);
    window.removeEventListener("__themeChanged", updateTheme);
    document.removeEventListener("visibilitychange", visibilityChanged);
    motion.removeEventListener("change", preferenceChanged);
    contrast.removeEventListener("change", preferenceChanged);
    canvas.removeEventListener("webglcontextlost", loseContext);
    canvas.removeEventListener("webglcontextrestored", restoreContext);
    for (const { letters } of words) {
      for (const { mesh } of letters) {
        mesh.geometry.dispose();
      }
    }
    face.dispose();
    edge.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
};
