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
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec2  vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;            // 0 at centre, ~1 at edge
    float ang = atan(p.y, p.x);

    // concentric tick rings
    float rings = smoothstep(0.5, 0.46, abs(fract(r * 8.0) - 0.5));

    // rotating radar sweep (trailing falloff) — slowed to 0.25 rad/s for calm authority (QT-4)
    float sweep = mod(ang + uTime * 0.25, 6.28318530718) / 6.28318530718;
    float beam  = smoothstep(0.16, 0.0, sweep);

    // outer rim + a brighter inner ring
    float rim   = smoothstep(0.025, 0.0, abs(r - 0.98));
    float inner = smoothstep(0.02, 0.0, abs(r - 0.34));

    float a = (rings * 0.28 + beam * 0.55 + rim + inner * 0.6) * uOpacity;
    a *= smoothstep(1.02, 0.9, r);        // fade past the edge
    a *= smoothstep(0.04, 0.12, r);       // hollow centre
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export const lightShaftFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec2  vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453); }

  void main() {
    vec2 p = vUv;
    // cone that narrows toward the top (a stage light from above)
    float width = mix(0.10, 0.46, p.y);
    float d = abs(p.x - 0.5) / width;
    float shaft = smoothstep(1.0, 0.0, d);
    shaft *= smoothstep(0.0, 0.28, p.y) * smoothstep(1.0, 0.5, p.y); // fade both ends

    // drifting volumetric dust motes
    float mote = hash(floor(vec2(p.x * 42.0, p.y * 42.0 - uTime * 2.5)));
    shaft += shaft * step(0.985, mote) * 0.6;

    float a = shaft * 0.5 * uOpacity;
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;
