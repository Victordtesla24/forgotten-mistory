/**
 * panelDepth.ts — hand-authored GLSL for PanelDepthScene.
 * Monochrome discipline: the only colours enter as uniforms sourced from lib/palette.ts.
 * Two programs: motes (instanced point particles on Z-layers) and glow (billboard plane).
 */

export const motesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;       // normalized pointer position [-0.5, 0.5]
  attribute vec3 aPosition;    // base position
  attribute float aLayer;      // Z-layer index (0..4)
  attribute float aOffset;     // per-mote phase offset (0..1)
  attribute float aSize;       // per-mote size
  varying float vAlpha;
  varying float vSize;

  void main() {
    vec3 pos = aPosition;

    // Subtle drift on X/Y — each mote orbits its base position slowly
    float phase = uTime * 0.3 + aOffset * 6.283185;
    pos.x += sin(phase) * 0.08 * aLayer;
    pos.y += cos(phase * 1.3) * 0.06 * aLayer;

    // Pointer-driven tilt applied to the group, vertex just receives it
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Fade based on distance from centre (perceived depth)
    float dist = length(pos.xy);
    vAlpha = smoothstep(2.2, 0.4, dist) * (0.35 + aLayer * 0.12);
    vAlpha *= smoothstep(0.0, 0.3, dist); // brighten near centre
    vSize = aSize * (0.6 + 0.4 * aLayer);
    gl_PointSize = vSize * (120.0 / -mvPosition.z);
  }
`;

export const motesFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vSize;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center) * 2.0;
    float glow = exp(-d * d * 3.8);
    float core = smoothstep(0.22, 0.0, d);
    float alpha = (glow * 0.55 + core * 0.85) * vAlpha;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export const glowVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec4 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec2 uPointer;  // normalized pointer [-0.5, 0.5]
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    // Billboard glow that follows the pointer
    vec2 center = vUv - 0.5;
    // Shift the glow centre toward the pointer position
    vec2 p = center - uPointer * 0.55;
    float d = length(p) * 1.6;
    float glow = exp(-d * d * 2.4);
    // Add a subtle breathing pulse
    glow *= 0.75 + 0.25 * sin(uTime * 1.2) * 0.5 + 0.5;
    // Soft edge falloff
    float edge = smoothstep(0.95, 0.0, length(center) * 1.3);
    float alpha = glow * edge * 0.32;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
