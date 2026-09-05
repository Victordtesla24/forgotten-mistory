/**
 * Experience strata — sediment that follows the spans above it.
 *
 * An earlier version of this scene drew the roles as 3D bars alongside the DOM
 * chart. Two drawings of the same eight spans, in two coordinate systems that
 * could not be kept in agreement, read as a rendering bug: bars appeared
 * doubled and slightly offset. Worse, it made a reader wonder which one was
 * right. The version after that overcorrected: it drew texture and then said so
 * in its own header, disclaiming any meaning at all — which left the section's
 * signature scene arguing against the section's own thesis. A chart headed
 * "Sixteen years, to scale" cannot sit on decoration (council R-c8, MOT-F-1).
 *
 * So the field is bound to the chart without competing with it. The DOM chart
 * is still the data — real percentages on a real axis, legible to a screen
 * reader and correct with no WebGL at all. This shader never draws a bar, a
 * number or an edge a reader could mistake for one. What it does is *light the
 * ground underneath each span*: `uSpans` carries the eight bars in 0..1 chart
 * space (left, width, row centre), `uProgress` is the same entry beat the bars
 * grow on, so the sediment brightens left-to-right exactly as far as the bars
 * have travelled, and `uHover` is the row under the pointer, lerped on the CPU
 * so the answer arrives as a swell rather than a switch.
 *
 * Budget is unchanged: one screen quad, three noise lookups per pixel (the
 * three drifting bands), no geometry and no textures. The span loop is eight
 * `step`/`smoothstep` evaluations — arithmetic, not sampling.
 */

export const strataVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const strataFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;

  // The eight role spans in this canvas's own 0..1 space: x = left edge,
  // y = full width, z = the row's centre line, w unused. Measured from the DOM
  // chart itself in Experience.tsx, so the two can never drift apart.
  uniform vec4 uSpans[8];
  // 0 → 1 across the same entry beat the bars grow on.
  uniform float uProgress;
  // Row index under the pointer, CPU-lerped; negative means no row.
  uniform float uHover;

  // Half-height of a lit sediment band. A bar is ~9 px tall in a ~500 px
  // canvas; lighting only that would be invisible, and lighting much more
  // would read as a second, fatter bar. This is about two and a half bars.
  const float ROW_HALF = 0.022;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv;
    vec2 parallax = uPointer * 0.02;

    // Layers: each band is a slow horizontal smear, wider apart toward the
    // bottom of the frame so the field reads as receding rather than tiled.
    float t = uTime * 0.008;
    float bands = 0.0;
    for (int i = 0; i < 3; i++) {
      float depth = float(i) + 1.0;
      float y = uv.y * (7.0 + depth * 4.0) + parallax.y * depth;
      float drift = noise(vec2(uv.x * 2.0 + t * depth, floor(y))) ;
      // A thin line at each band boundary, softened by the drift value.
      float line = smoothstep(0.94, 1.0, fract(y + drift * 0.35));
      bands += line * (0.34 / depth);
    }

    // Horizon falloff: the field thins toward the top, where the heading sits.
    float fade = smoothstep(1.05, 0.1, uv.y);
    float luma = bands * fade * 0.34;

    // The spans. Each row lifts the sediment under it by 0.10, but only as far
    // to the right as the bar itself has grown — so the field is measured out
    // with the chart rather than switched on beneath it. The pointed-at row
    // takes a further 0.06, weighted by how far the CPU-side lerp has moved,
    // which keeps the answer continuous while the pointer travels.
    float sediment = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 span = uSpans[i];
      float live = step(0.0001, span.y);
      float inside = step(span.x, uv.x) * step(uv.x, span.x + span.y * uProgress);
      float band = 1.0 - smoothstep(0.0, ROW_HALF, abs(uv.y - span.z));
      float hovered = max(0.0, 1.0 - abs(float(i) - uHover));
      sediment += live * inside * band * (0.10 + 0.06 * hovered);
    }
    luma += sediment;

    // Dissolve at all four edges. Without this the canvas rectangle itself is
    // visible as a faintly lighter box against the page — the scene has to end
    // somewhere, and it must not be anywhere a reader can find.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.16), uv)
              * smoothstep(vec2(0.0), vec2(0.16), 1.0 - uv);
    luma *= edge.x * edge.y;

    // A wide, very soft key from the left so the strata are not evenly lit.
    vec2 p = (uv - vec2(0.18, 0.5)) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float key = pow(1.0 - clamp(length(p) * 0.5, 0.0, 1.0), 2.2);
    luma += key * 0.07 * edge.x * edge.y;

    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.012;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));
    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0) * 0.85);
  }
`;
