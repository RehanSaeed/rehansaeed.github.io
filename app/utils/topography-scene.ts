import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { buildTopography } from "./topography";

const vertexShader = `
  uniform float phase;
  uniform float relief;
  varying vec3 vPosition;
  void main() {
    vec3 p = position;
    p.y *= relief * (0.86 + 0.14 * sin(p.x * 0.65 + phase));
    p.y += position.y * relief * 0.1 * cos(p.z * 0.7 - phase);
    vPosition = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

/** Creates the decorative renderer; imported only when its visible client mounts. */
export const createTopographyScene = (canvas: HTMLCanvasElement) => {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.debug.onShaderError = () => {
    throw new Error("The decorative terrain shader could not compile.");
  };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 80);
  const sculpture = new Group();
  scene.add(sculpture);
  const data = buildTopography();
  const geometry = (positions: Float32Array) => {
    const result = new BufferGeometry();
    result.setAttribute("position", new BufferAttribute(positions, 3));
    return result;
  };
  const surfaceGeometry = geometry(data.surface);
  const contourGeometry = geometry(data.contours);
  const uniforms = {
    phase: { value: 0 },
    relief: { value: 0.05 },
    ink: { value: new Color() },
    paper: { value: new Color() },
  };
  const surfaceMaterial = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: `
      uniform vec3 ink;
      uniform vec3 paper;
      varying vec3 vPosition;
      void main() {
        vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
        float light = abs(dot(normal, normalize(vec3(-0.4, 1.0, 0.6))));
        vec3 colour = mix(paper, ink, 0.07 + (1.0 - light) * 0.25);
        gl_FragColor = vec4(colour, 0.94);
        #include <colorspace_fragment>
      }
    `,
    side: DoubleSide,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const contourMaterial = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: `
      uniform vec3 ink;
      varying vec3 vPosition;
      void main() {
        gl_FragColor = vec4(ink, 0.5 + min(vPosition.y * 0.12, 0.45));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
  });
  sculpture.add(
    new Mesh(surfaceGeometry, surfaceMaterial),
    new LineSegments(contourGeometry, contourMaterial),
  );
  let width = 0;
  let height = 0;
  return {
    render: (progress: number, staticView: boolean) => {
      if (renderer.getContext().isContextLost()) {
        throw new Error("The decorative WebGL context was lost.");
      }
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        return;
      }
      if (width !== bounds.width || height !== bounds.height) {
        width = bounds.width;
        height = bounds.height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      const styles = getComputedStyle(canvas);
      uniforms.ink.value.set(styles.color);
      uniforms.paper.value.set(styles.backgroundColor);
      const position = staticView ? 0.48 : progress;
      uniforms.phase.value = position * Math.PI * 2;
      uniforms.relief.value = 0.04 + Math.sin(position * Math.PI * 0.7) * 1.3;
      const angle = 0.02 + position * 0.86;
      const distance = (camera.aspect < 1.5 ? 23 : 20) + position * 2;
      camera.position.set(
        Math.sin(position * 0.6) * 3,
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
      );
      camera.lookAt(0, 0.5, 0);
      sculpture.scale.x = Math.min(2.4, Math.max(1, camera.aspect / 1.5));
      sculpture.rotation.y = -0.08 + position * 0.3;
      renderer.render(scene, camera);
    },
    dispose: () => {
      surfaceGeometry.dispose();
      contourGeometry.dispose();
      surfaceMaterial.dispose();
      contourMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
};
