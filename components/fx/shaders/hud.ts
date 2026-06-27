/**
 * hud.ts — hand-authored GLSL for the JARVIS telemetry signature scene.
 * Monochrome discipline: the only colour enters as the `uColor` uniform
 * (sourced from lib/palette.ts) — no chromatic literals in the shader (FR-SHADER,
 * NFR-MONO). Two programs share one vertex shader:
 *   - holoRingFragment  — concentric tick-rings + rotating radar sweep + rim (the HUD)
 *   - lightShaftFragment — a faux-volumetric stage light cone with drifting motes (FR-LIGHT)
 */

export const hudVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const holoRingFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;       // sourced from lib/palette.ts (NFR-MONO)
  uniform float uOpacity;
  varying vec2  vUv;

  #define TAU 6.28318530718

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;            // 0 at centre, ~1 at edge
    float ang = atan(p.y, p.x);           // -PI..PI

    // ---- range rings (crisp, calibrated radii) ----
    float rings =
        ring(r, 0.30, 0.0055) * 0.55 +
        ring(r, 0.50, 0.0055) * 0.6  +
        ring(r, 0.70, 0.0055) * 0.65 +
        ring(r, 0.985, 0.012) * 1.0;      // outer rim
    // fine graticule ticks between the rings
    rings += smoothstep(0.5, 0.38, abs(fract(r * 22.0) - 0.5)) * 0.07
             * smoothstep(0.04, 0.10, r) * smoothstep(1.0, 0.9, r);

    // rotating radar sweep (trailing falloff) — slowed to 0.25 rad/s for calm authority (QT-4)
    float sweep = mod(ang + uTime * 0.25, TAU) / TAU;
    float beam  = smoothstep(0.16, 0.0, sweep);

    // ---- rotating sweep with a smooth trailing gradient (the radar arm) ----
    float d = mod(uTime * 0.45 - ang, TAU);     // 0 at the leading arm, grows behind
    float beam = pow(smoothstep(2.4, 0.0, d), 1.6);   // ~2.4rad luminous trail
    float arm  = smoothstep(0.05, 0.0, d) * 0.9;      // bright leading edge
    float sweep = (beam * 0.5 + arm) * smoothstep(0.985, 0.94, r) * smoothstep(0.04, 0.10, r);

    // ---- pulsing contact blips that flare as the arm passes over them ----
    float blips = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float ba = (fi * 2.3) - 1.4;                       // fixed bearing
      float br = 0.34 + fi * 0.2;                         // fixed range
      vec2  bp = vec2(cos(ba), sin(ba)) * (br * 0.5);     // back to plane coords
      float dist = length(p - bp);
      float dot = smoothstep(0.022, 0.0, dist);
      float since = mod(uTime * 0.45 - (-ba), TAU);       // time since arm swept this bearing
      float flare = exp(-since * 2.2);                    // decay after the ping
      blips += dot * (0.25 + flare * 1.0);
    }

    float a = (rings + spokes + sweep + blips) * uOpacity;
    a *= smoothstep(1.04, 0.96, r);       // fade past the edge
    a *= smoothstep(0.035, 0.085, r);     // hollow centre
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
  }
`;

export const lightShaftFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;       // sourced from lib/palette.ts (NFR-MONO)
  uniform float uOpacity;
  uniform vec2  uResolution;  // canvas resolution for half-res sampling (FR-LIGHT)
  varying vec2  vUv;

  // Deterministic hash — no dependency on Math.random, reproducible seed.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453); }

  void main() {
    vec2 p = vUv;
    // cone that narrows toward the top (a stage light from above)
    float width = mix(0.10, 0.46, p.y);
    float d = abs(p.x - 0.5) / width;
    float shaft = smoothstep(1.0, 0.0, d);
    shaft *= smoothstep(0.0, 0.28, p.y) * smoothstep(1.0, 0.5, p.y); // fade both ends

    // drifting volumetric dust motes — capped at 1 deterministic sample per cell (FR-LIGHT)
    float mote = hash(floor(vec2(p.x * 42.0, p.y * 42.0 - uTime * 2.5)));
    shaft += shaft * step(0.985, mote) * 0.6;

    // volumetric light scatter — a soft god-ray haze blooming off the cone axis,
    // breathing slowly so the shaft reads as light scattering through air (FR-LIGHT).
    float scatter = smoothstep(1.0, 0.0, d) * smoothstep(0.0, 0.62, p.y);
    scatter *= 0.28 + 0.18 * sin(uTime * 0.8 + p.y * 6.0);
    shaft += scatter;

    float a = shaft * 0.5 * uOpacity;
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;
