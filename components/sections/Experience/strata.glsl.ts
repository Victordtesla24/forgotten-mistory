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
 * ## Why the strata are now visible
 *
 * The version this replaces was, measured, not there. Isolated from the chart
 * at 1440 it covered 0.00% of its own slot at a sixteenth of a stop above the
 * ink and peaked at 0.017 relative luminance — roughly `#0F0F0F` on `#0A0A0A`.
 * The owner, looking at the live section, reported no scene, and he was right.
 *
 * Three things were holding it down and all three are fixed here. The band
 * lines were a 6%-duty `smoothstep` at a third of their nominal weight, so the
 * sediment was a hairline rather than a stratum; the whole field was then
 * multiplied by a constant 0.85 alpha *on top of* a `luma` that never rose
 * above 0.15; and the edge dissolve ate 16% from every side, which cost more
 * than half the frame before anything else was counted. The bands are now
 * bands, the alpha carries the entrance and nothing else, and the dissolve is
 * tightened to the width it actually needs to hide the canvas rectangle.
 *
 * The bars above remain the brightest objects in the section by a wide margin:
 * they are `--white` at full opacity, and the sediment peaks well under that
 * even where a span crosses a band core.
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
  // 0 -> 1 across the same entry beat the bars grow on.
  uniform float uProgress;
  // Row index under the pointer, CPU-lerped; negative means no row.
  uniform float uHover;
  // The chart's travel through the viewport, 0 at the foot of the screen and 1
  // as it climbs off the top. Drives the depth parallax below: each band is
  // shifted by this by a factor of its own depth, so the three planes slide
  // past one another as the reader scrolls rather than moving as one sheet.
  // Zero when the field is not mounted (reduced motion / no WebGL), so the
  // no-motion still is unaffected.
  uniform float uScroll;

  // Half-height of a lit sediment band. A bar is ~9 px tall in a ~500 px
  // canvas; lighting only that would be invisible, and lighting much more
  // would read as a second, fatter bar. This is about three bars.
  const float ROW_HALF = 0.026;

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
    // Each drifts and breathes on its own period — the drift is what makes the
    // sediment settle, the breath is what stops the frame from being a still.
    float t = uTime * 0.008;
    float bands = 0.0;
    for (int i = 0; i < 3; i++) {
      float depth = float(i) + 1.0;
      // Depth parallax on scroll: the near plane (depth 1) travels slowest, the
      // far planes faster, so the strata separate as the chart crosses the
      // screen. The rate is uScroll scaled by depth — the two-position offset
      // test measures exactly this per-plane difference.
      float scrollShift = uScroll * (0.9 + depth * 1.1);
      float y = uv.y * (7.0 + depth * 4.0) + parallax.y * depth + uTime * 0.045 * depth + scrollShift;
      float drift = noise(vec2(uv.x * 2.0 + t * depth, floor(y)));
      // A stratum, not a hairline: the band occupies two thirds of its own
      // period, softened by the drift value so no two are the same width. At
      // the 6%-duty this replaced the field covered 0.00% of its slot; at the
      // 55% of the first pass it covered 13.26%, which is still under the 15%
      // the gate asks for — a sediment you have to look for is not sediment.
      float line = smoothstep(0.32, 1.0, fract(y + drift * 0.35));
      float breath = 0.84 + 0.16 * sin(uTime * 0.5 + depth * 2.1);
      bands += line * (0.52 / depth) * breath;
    }

    // Horizon falloff: the field thins toward the top, where the heading sits.
    float fade = smoothstep(1.15, 0.02, uv.y);
    float luma = bands * fade * 1.30;

    // The spans. Each row lifts the sediment under it, but only as far to the
    // right as the bar itself has grown — so the field is measured out with the
    // chart rather than switched on beneath it. The pointed-at row takes a
    // further lift, weighted by how far the CPU-side lerp has moved, which
    // keeps the answer continuous while the pointer travels.
    float sediment = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 span = uSpans[i];
      float live = step(0.0001, span.y);
      float inside = step(span.x, uv.x) * step(uv.x, span.x + span.y * uProgress);
      float band = 1.0 - smoothstep(0.0, ROW_HALF, abs(uv.y - span.z));
      float hovered = max(0.0, 1.0 - abs(float(i) - uHover));
      sediment += live * inside * band * (0.42 + 0.24 * hovered);
    }
    luma += sediment;

    // Dissolve at all four edges. Without this the canvas rectangle itself is
    // visible as a faintly lighter box against the page — the scene has to end
    // somewhere, and it must not be anywhere a reader can find. Ten per cent is
    // as much as that needs; the sixteen this used to take cost more than half
    // the frame's brightness to hide an edge nobody was looking for.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.10), uv)
              * smoothstep(vec2(0.0), vec2(0.10), 1.0 - uv);
    luma *= edge.x * edge.y;

    // A wide, soft key from the left so the strata are not evenly lit.
    vec2 p = (uv - vec2(0.18, 0.5)) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float key = pow(1.0 - clamp(length(p) * 0.5, 0.0, 1.0), 2.2);
    luma += key * 0.26 * edge.x * edge.y;

    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.014;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));

    // Alpha carries the entrance and nothing else. The constant 0.85 this used
    // to multiply in was a second, permanent attenuation on a field that was
    // already too dark to see.
    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0));
  }
`;
