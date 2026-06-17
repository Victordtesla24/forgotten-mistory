/**
 * cursorDepth.ts — hand-authored GLSL for the volumetric cursor depth field.
 * Monochrome discipline: the only colour enters as the `uColor` uniform
 * (sourced from lib/palette.ts) — no chromatic literals in the shader.
 *
 * Renders a full-screen quad with two co-located effects:
 *   1. Volumetric light rays (god-rays from cursor position) — FR-LIGHT
 *   2. Floating depth particles (ambient motes with parallax) — creates the
 *      "floating in 3D space" sensation for the hero panels.
 *
 * Hyperframe optimised: single draw call, no allocation in the loop, early
 * fragment discard for empty regions. Palette-sourced uniforms only.
 */

export const cursorDepthVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cursorDepthFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform vec2  uCursor;     // normalised cursor position (0..1), (-1,-1) when idle
  uniform vec2  uResolution;
  uniform float uScroll;     // 0..1 scroll progress for depth parallax
  varying vec2  vUv;

  // Deterministic hash — no Math.random dependency
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Smooth noise for organic ray falloff
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractional Brownian Motion — 3 octaves, cheap
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = vec2(uv.x * aspect, uv.y); // aspect-corrected

    float alpha = 0.0;

    // ── Volumetric light rays from cursor ─────────────────────────
    if (uCursor.x >= 0.0) {
      // Aspect-corrected cursor position
      vec2 cursor = vec2(uCursor.x * aspect, 1.0 - uCursor.y);
      vec2 dir = st - cursor;
      float dist = length(dir);

      // Rays radiate outward; sample a narrow cone around each angle
      float angle = atan(dir.y, dir.x);
      float rayNoise = fbm(vec2(angle * 3.0, uTime * 0.12));

      // Ray visibility: strongest near cursor, fades with distance
      float rayCore = exp(-dist * 3.2);
      float rayEdge = exp(-dist * 1.8) * 0.3;

      // Narrow rays modulated by noise
      float rays = (rayCore + rayEdge * rayNoise);

      // Angular variation — 5-7 rays visible
      float rayPattern = sin(angle * 7.0 + rayNoise * 3.0) * 0.5 + 0.5;
      rays *= 0.4 + 0.6 * rayPattern;

      alpha += rays * 0.12;
    }

    // ── Floating depth particles (ambient motes) ──────────────────
    // Multiple depth layers for parallax sensation
    for (int layer = 0; layer < 3; layer++) {
      float depth = float(layer) * 0.35;
      float parallax = uScroll * depth * 0.04; // subtle scroll parallax

      // Particle grid — different offset per layer for visual richness
      vec2 gridUv = st * (8.0 + float(layer) * 5.0);
      float timeShift = uTime * (0.3 + float(layer) * 0.18) + parallax;
      vec2 particleUv = gridUv + vec2(0.0, timeShift);

      vec2 cell = floor(particleUv);
      vec2 cellFrac = fract(particleUv);

      // Each cell has up to 2 particles at pseudo-random positions
      for (int p = 0; p < 2; p++) {
        vec2 offset = vec2(
          hash(cell + vec2(float(p) * 47.0, 12.0)),
          hash(cell + vec2(float(p) * 89.0, 7.0))
        );
        float dist = length(cellFrac - offset);
        float brightness = exp(-dist * 22.0);

        // Layer 0: near (large, bright), Layer 2: far (small, dim)
        float size = 0.022 - float(layer) * 0.005;
        brightness *= smoothstep(size, 0.0, dist);

        // Diminish with layer depth
        brightness *= 0.7 - float(layer) * 0.2;

        // Time-based twinkle
        float twinkle = sin(uTime * 1.7 + hash(cell + vec2(float(p) * 31.0)) * 6.28) * 0.5 + 0.5;
        brightness *= 0.5 + 0.5 * twinkle;

        alpha += brightness * 0.09;
      }
    }

    // ── Ambient vignette halo ─────────────────────────────────────
    float vignette = (1.0 - length(uv - 0.5) * 1.4);
    vignette = smoothstep(0.0, 0.55, vignette);
    alpha += vignette * 0.015;

    // Global opacity
    alpha *= uOpacity;

    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
