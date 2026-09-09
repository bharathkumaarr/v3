import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { pageCurlConfig } from "./page-curl-config";
import {
  paperFragmentShader,
  paperVertexShader,
  shadowFragmentShader,
  shadowVertexShader,
} from "./paper-shaders";

export type PaperFrame = {
  /** Unit fold direction in page space (y points down). */
  dirX: number;
  dirY: number;
  creaseDistance: number;
  radius: number;
  /** 0 to 1, drives how much the reverse side has become the other theme. */
  progress: number;
};

export function supportsWebGl(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * Parse a CSS colour into linear 0-1 components without any colour management.
 *
 * The shaders write straight to an sRGB framebuffer, so passing values through
 * unconverted is what keeps the paper an exact match for the CSS background it sits
 * against. Running these through three's `Color` would convert to linear-sRGB and the
 * paper would visibly lift off the page.
 */
export function parseCssColor(input: string, fallback: [number, number, number]) {
  const value = input.trim();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;

    if (full.length >= 6) {
      const int = Number.parseInt(full.slice(0, 6), 16);
      if (Number.isFinite(int)) {
        return [
          ((int >> 16) & 255) / 255,
          ((int >> 8) & 255) / 255,
          (int & 255) / 255,
        ] as [number, number, number];
      }
    }
  }

  const numbers = value.match(/[\d.]+/g);
  if (value.startsWith("rgb") && numbers && numbers.length >= 3) {
    return [
      Number(numbers[0]) / 255,
      Number(numbers[1]) / 255,
      Number(numbers[2]) / 255,
    ] as [number, number, number];
  }

  return fallback;
}

/**
 * Grid biased toward the grabbed corner.
 *
 * Positions are normalized to -0.5..0.5 and scaled to pixels in the vertex shader, so a
 * viewport resize only updates a uniform instead of rebuilding buffers.
 */
function buildSheetGeometry(segments: number, bias: number): BufferGeometry {
  const n = segments;
  const stride = n + 1;
  const positions = new Float32Array(stride * stride * 3);

  let cursor = 0;
  for (let j = 0; j <= n; j++) {
    const fromTop = Math.pow(j / n, bias);
    for (let i = 0; i <= n; i++) {
      const fromRight = Math.pow(i / n, bias);
      positions[cursor++] = 1 - fromRight - 0.5;
      positions[cursor++] = 0.5 - fromTop;
      positions[cursor++] = 0;
    }
  }

  const quadCount = n * n;
  const vertexCount = stride * stride;
  const indices =
    vertexCount > 65535 ? new Uint32Array(quadCount * 6) : new Uint16Array(quadCount * 6);

  let index = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;

      // Wound counter-clockwise when viewed from the camera, so `gl_FrontFacing`
      // identifies the printed side of the sheet.
      indices[index++] = a;
      indices[index++] = b;
      indices[index++] = c;
      indices[index++] = b;
      indices[index++] = d;
      indices[index++] = c;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));

  return geometry;
}

const LIGHT_FALLBACK: [number, number, number] = [1, 1, 1];
const DARK_FALLBACK: [number, number, number] = [0.047, 0.059, 0.071];

/**
 * Imperative three.js wrapper.
 *
 * Deliberately not a React component: the interaction loop writes uniforms every frame
 * and going through the reconciler for that would be pure overhead. Objects are created
 * once and only uniforms change afterwards, so the render loop allocates nothing.
 */
export class PaperRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly geometry: BufferGeometry;
  private readonly shadowGeometry: BufferGeometry;
  private readonly paperMaterial: ShaderMaterial;
  private readonly shadowMaterial: ShaderMaterial;

  private width = 1;
  private height = 1;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, segments: number) {
    const { paper, mesh, curl, shadow, fov } = pageCurlConfig;

    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(fov, 1, 1, 20000);

    this.geometry = buildSheetGeometry(segments, mesh.cornerBias);
    this.shadowGeometry = buildSheetGeometry(1, 1);

    this.paperMaterial = new ShaderMaterial({
      vertexShader: paperVertexShader,
      fragmentShader: paperFragmentShader,
      transparent: true,
      side: DoubleSide,
      // The flap arcs back over itself, so the reverse side has to occlude the front.
      depthTest: true,
      depthWrite: true,
      uniforms: {
        uSize: { value: new Vector2(1, 1) },
        uCorner: { value: new Vector2(0, 0) },
        uDir: { value: new Vector2(-1, 0) },
        uPerp: { value: new Vector2(0, -1) },
        uCrease: { value: 0 },
        uRadius: { value: 0 },
        uMaxAngle: { value: curl.maxAngle },
        uCone: { value: curl.cone },
        uConeSpan: { value: 1 },
        uSag: { value: 0 },
        uFrontColor: { value: new Vector3(...LIGHT_FALLBACK) },
        uBackColor: { value: new Vector3(...DARK_FALLBACK) },
        uReverseShade: { value: paper.reverseShade },
        uReverseBlend: { value: 0 },
        uLightDir: { value: new Vector3(...paper.lightDirection) },
        uAmbient: { value: paper.ambient },
        uSpecular: { value: paper.specular },
        uSpecularPower: { value: paper.specularPower },
        uFeather: { value: mesh.feather },
        uOcclusion: { value: paper.creaseOcclusion },
        uEdgeShade: { value: paper.edgeShade },
        uEdgeSpread: { value: paper.edgeSpread },
      },
    });

    this.shadowMaterial = new ShaderMaterial({
      vertexShader: shadowVertexShader,
      fragmentShader: shadowFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uSize: { value: new Vector2(1, 1) },
        uCorner: { value: new Vector2(0, 0) },
        uDir: { value: new Vector2(-1, 0) },
        uCrease: { value: 0 },
        uRadius: { value: 0 },
        uStrength: { value: shadow.strength },
        uSpread: { value: shadow.spread },
        uMaxSpread: { value: shadow.maxSpread },
        uSpill: { value: shadow.spill },
        uSpillReach: { value: shadow.spillReach },
        uMaxSpillReach: { value: shadow.maxSpillReach },
        uSpillOnset: { value: shadow.spillOnset },
        uMinContact: { value: shadow.minContact },
        uContactFade: { value: shadow.contactFade },
        uProgress: { value: 0 },
        uBackColor: { value: new Vector3(...DARK_FALLBACK) },
        uShadowColor: { value: new Vector3(0.04, 0.06, 0.08) },
      },
    });

    const shadowMesh = new Mesh(this.shadowGeometry, this.shadowMaterial);
    shadowMesh.frustumCulled = false;
    shadowMesh.renderOrder = 0;

    const paperMesh = new Mesh(this.geometry, this.paperMaterial);
    paperMesh.frustumCulled = false;
    paperMesh.renderOrder = 1;

    this.scene.add(shadowMesh, paperMesh);
  }

  setViewport(width: number, height: number, pixelRatio: number): void {
    if (this.disposed) return;

    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);

    this.camera.aspect = this.width / this.height;
    // Places the z=0 plane at exactly 1:1 with CSS pixels, so the flat sheet lines up
    // with the DOM and only lifted geometry picks up perspective.
    const fovRadians = (pageCurlConfig.fov * Math.PI) / 180;
    const distance = this.height / 2 / Math.tan(fovRadians / 2);
    this.camera.position.z = distance;

    // Everything sits in a shallow slab around the page plane. Clipping tightly to it
    // matters: where the flap folds back it runs almost tangent to itself, and a wide
    // near/far ratio leaves too little depth precision to resolve which side is on top,
    // which shows up as a sawtooth along the silhouette.
    this.camera.near = distance * 0.15;
    this.camera.far = distance + Math.hypot(this.width, this.height);
    this.camera.updateProjectionMatrix();

    const paper = this.paperMaterial.uniforms;
    const shadow = this.shadowMaterial.uniforms;

    (paper.uSize.value as Vector2).set(this.width, this.height);
    (shadow.uSize.value as Vector2).set(this.width, this.height);
    // Top-right corner in world space, where the origin is the viewport centre.
    (paper.uCorner.value as Vector2).set(this.width / 2, this.height / 2);
    (shadow.uCorner.value as Vector2).set(this.width / 2, this.height / 2);

    const diagonal = Math.hypot(this.width, this.height);
    paper.uConeSpan.value = diagonal * pageCurlConfig.curl.coneSpan;
    paper.uSag.value = pageCurlConfig.curl.sag;
  }

  /** `front` is the active theme's page background, `back` is the one underneath. */
  setThemeColors(front: string, back: string): void {
    if (this.disposed) return;

    const uniforms = this.paperMaterial.uniforms;
    const shadow = this.shadowMaterial.uniforms;
    const frontRgb = parseCssColor(front, LIGHT_FALLBACK);
    const backRgb = parseCssColor(back, DARK_FALLBACK);

    (uniforms.uFrontColor.value as Vector3).set(...frontRgb);
    (uniforms.uBackColor.value as Vector3).set(...backRgb);
    (shadow.uBackColor.value as Vector3).set(...backRgb);
  }

  draw(frame: PaperFrame): void {
    if (this.disposed) return;

    const paper = this.paperMaterial.uniforms;
    const shadow = this.shadowMaterial.uniforms;

    // Page space has y pointing down; world space has it pointing up.
    const worldDirX = frame.dirX;
    const worldDirY = -frame.dirY;

    (paper.uDir.value as Vector2).set(worldDirX, worldDirY);
    (paper.uPerp.value as Vector2).set(-worldDirY, worldDirX);
    (shadow.uDir.value as Vector2).set(worldDirX, worldDirY);

    paper.uCrease.value = frame.creaseDistance;
    paper.uRadius.value = frame.radius;
    paper.uReverseBlend.value = Math.min(1, Math.max(0, 0.35 + frame.progress * 1.8));

    shadow.uCrease.value = frame.creaseDistance;
    shadow.uRadius.value = frame.radius;
    shadow.uProgress.value = frame.progress;

    this.renderer.render(this.scene, this.camera);
  }

  clear(): void {
    if (this.disposed) return;
    this.renderer.clear();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.geometry.dispose();
    this.shadowGeometry.dispose();
    this.paperMaterial.dispose();
    this.shadowMaterial.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
