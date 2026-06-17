/**
 * sparkline.ts — hand-authored GLSL for the living telemetry sparkline (System B).
 *
 * A custom ShaderMaterial (vertex + fragment) renders the latency sparkline entirely
 * on the GPU: an anti-aliased stroke glow, a vertical gradient area-fill, a glowing
 * scan node at the latest sample, and a traveling glow that sweeps along the curve
 * driven by the `uTime` uniform. The N sample values arrive as the `uValues` uniform
 * array (normalised 0..1, bottom..top); the panel re-uploads them every tick.
 *
 * Monochrome discipline: the only colours are the `uColor` (luminous white) and
 * `uAccent` (steel) uniforms, both sourced from lib/palette.ts — no chromatic literal
 * lives in the GLSL. Distances are evaluated in pixel space (`uResolution`) so the glow
 * thickness reads uniformly despite the wide, short aspect of the card.
 *
 * Single draw call, no per-frame allocation; segment loop uses constant bounds so it
 * compiles clean on both WebGL1 and WebGL2.
 */

export const SPARK_COUNT = 9;

export const sparklineVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sparklineFragment = /* glsl */ `
  precision highp float;

  #define COUNT ${SPARK_COUNT}

  uniform float uTime;
  uniform float uValues[COUNT];   // normalised samples 0..1 (bottom..top)
  uniform vec3  uColor;           // luminous white accent (palette)
  uniform vec3  uAccent;          // steel secondary (palette)
  uniform float uOpacity;
  uniform vec2  uResolution;      // sparkline box size in CSS px

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;                       // x: 0..1 left→right, y: 0..1 bottom→top
    vec2 R  = uResolution;
    float N = float(COUNT - 1);

    float minDist = 1.0e4;               // px distance to the polyline
    float lineY   = -1.0;                // curve height at this x (for area fill)

    // Segment loop — constant bounds, loop-index uniform access (WebGL1-safe).
    for (int i = 0; i < COUNT - 1; i++) {
      float x0 = float(i) / N;
      float x1 = float(i + 1) / N;
      vec2  p0 = vec2(x0, uValues[i]);
      vec2  p1 = vec2(x1, uValues[i + 1]);

      // Perpendicular distance to the segment, evaluated in pixel space.
      vec2 pa = (uv - p0) * R;
      vec2 ba = (p1 - p0) * R;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0e-6), 0.0, 1.0);
      minDist = min(minDist, length(pa - ba * h));

      if (uv.x >= x0 && uv.x <= x1) {
        float t = (uv.x - x0) / max(x1 - x0, 1.0e-6);
        lineY = mix(uValues[i], uValues[i + 1], t);
      }
    }

    // ── Stroke glow — tight core + soft halo ──────────────────────────────
    float stroke = exp(-minDist * 0.85) + 0.30 * exp(-minDist * 0.22);

    // ── Gradient area-fill below the curve ────────────────────────────────
    float area = 0.0;
    if (lineY > 0.0 && uv.y < lineY) {
      float depth = (lineY - uv.y) / max(lineY, 1.0e-6); // 0 at line → 1 at base
      area = (1.0 - depth) * 0.42;                       // brightest under the line
    }

    // ── Traveling glow sweeping left→right along the curve ────────────────
    float head   = fract(uTime * 0.17);
    float along  = exp(-abs(uv.x - head) * 7.0);
    float travel = along * exp(-minDist * 0.55);

    // ── Scan node pinned to the latest sample ─────────────────────────────
    vec2  node  = vec2(1.0, uValues[COUNT - 1]);
    float nd    = length((uv - node) * R);
    float pulse = 0.62 + 0.38 * sin(uTime * 2.3);
    float scan  = (exp(-nd * 0.45) + 0.18 * exp(-nd * 0.14)) * pulse;

    vec3 strokeCol = mix(uAccent, uColor, 0.65);
    vec3 col  = strokeCol * stroke
              + uAccent  * area  * 0.5
              + uColor   * travel * 1.4
              + uColor   * scan   * 1.7;

    float alpha = clamp(stroke + area * 0.5 + travel + scan, 0.0, 1.0) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
