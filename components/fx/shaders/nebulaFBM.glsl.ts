/**
 * nebulaFBM.glsl.ts — Fractional Brownian Motion nebula field shader for SpaceScene.
 * Extracted from SpaceScene.tsx (R2 hardening). Renders soft, slow-moving nebula
 * clouds using FBM noise with a near-black monochrome palette.
 *
 * Monochrome discipline (NFR-MONO): colour comes from uColor (PALETTE.nebula)
 * — no chromatic literals, no hue. The shader adds only monochrome brightness
 * variation (+0.05 max per channel), keeping the field achromatic.
 *
 * Capped at 5 octaves; early discard on empty regions; no per-frame allocation.
 */

export const nebulaFBMVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFBMFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;       // sourced from lib/palette.ts (PALETTE.nebula)
  varying vec2  vUv;

  // Simple noise function — deterministic, no Math.random dependency.
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractional Brownian Motion — 5 octaves, capped samples (R2)
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Moving noise
    float n = fbm(uv * 3.0 + uTime * 0.05);
    float n2 = fbm(uv * 6.0 - uTime * 0.02);

    float cloud = n * n2;

    // Soft edges
    float alpha = smoothstep(0.3, 0.7, cloud);
    float dist = distance(uv, vec2(0.5));
    alpha *= 1.0 - smoothstep(0.0, 0.5, dist);

    // Monochrome only: brightness variation is identical across RGB channels.
    gl_FragColor = vec4(uColor + vec3(n * 0.05), alpha * 0.15);
  }
`;
