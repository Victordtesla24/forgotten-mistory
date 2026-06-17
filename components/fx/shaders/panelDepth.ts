/**
 * panelDepth.ts — hand-authored GLSL for the telemetry-panel depth backdrop (System A).
 *
 * Two material pairs compose the "real 3D" surround that sits behind the crisp DOM
 * telemetry content:
 *   1. motes — instanced points spread across several Z-planes. Driven by a perspective
 *      camera + a pointer-tilted parent group, the near planes parallax more than the
 *      far ones, giving genuine depth (not a flat 2D tilt).
 *   2. glow — a billboard cone that tracks the pointer in panel space (the volumetric
 *      light source the rays read from).
 *
 * Monochrome discipline: colour enters only through the `uColor` uniform (lib/palette.ts).
 * Deterministic seeds (no Math.random) keep the twinkle reproducible.
 */

export const motesVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // Twinkle + soft depth fade so far motes recede.
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aSeed * 6.2831853);
    vAlpha = twinkle * clamp(1.0 + mv.z * 0.18, 0.15, 1.0);
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 0.001)) * (0.7 + 0.3 * twinkle);
  }
`;

export const motesFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;                         // tighter soft core
    a *= vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    // Soft volumetric cone — gaussian core with a faint wide halo.
    float a = (exp(-d * d * 3.2) + 0.18 * exp(-d * d * 0.7)) * uIntensity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;
