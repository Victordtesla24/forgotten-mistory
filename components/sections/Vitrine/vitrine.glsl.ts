/**
 * The cabinet's light — the raking light the rail already has, made a field.
 *
 * `#vitrine` is a lit cabinet: the plate the rail has snapped to takes the
 * light and its neighbours fall into shadow. That effect is CSS and stays CSS,
 * because it has to survive on a phone and on a machine with no WebGL. This
 * shader does not repeat it and does not draw a seventh plate: it draws the
 * pool of light the cabinet is standing in, under the rail, and lets the plates
 * sit in it.
 *
 * Two things drive it, and both come from the section's own state rather than
 * from a clock of the shader's own — the same discipline `CareerStrata` keeps:
 *
 * - `uCentre` is where the lit plate actually is, across the field, 0 → 1. The
 *   pool goes there, so the light under the cabinet and the light on the plate
 *   can never disagree.
 * - `uScroll` is the rail's own progress (`scrollLeft / scrollWidth`). The
 *   grain of the pool drifts with it, so scrolling the rail moves the light
 *   over the cabinet instead of sliding a static gradient sideways.
 * - `uLit` is the plate's index, 0 → 5. It seeds the pool, so no two plates
 *   stand in an identical light — a cabinet lit six ways, not one gradient
 *   translated.
 *
 * Monochrome, and never the site's one accent: that accent means a figure has
 * a source a reader can go and check, and a pool of light is not a figure. The
 * two colours arrive as uniforms from `lib/palette.ts`.
 *
 * Budget: one full-screen quad, no geometry, no textures, three value-noise
 * lookups per pixel — the ceiling `CareerStrata` and `AboutField` hold to —
 * plus one hash for grain.
 */

export const vitrineFieldVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const vitrineFieldFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  /** The lit plate's index, 0 → 5. Seeds the pool so six plates read six ways. */
  uniform float uLit;
  /** Where the lit plate sits across the field, 0 → 1, eased toward its target. */
  uniform float uCentre;
  /** The rail's own progress: scrollLeft / scrollWidth. */
  uniform float uScroll;
  /** 0 → 1 over the mount ramp; back to 0 if the context is lost. */
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;

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
    // The field is the rail's own band, so it is measured in the rail's own
    // frame: x across the cabinet, y from its floor to its top.
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vUv;

    // A gallery spot, not a spotlight: wide across the cabinet, shallow through
    // it, centred on the plate that has the light. The width is a plate and a
    // half, so the neighbours are grazed rather than cut off — the same
    // falloff the CSS raking light has, in light rather than in opacity.
    float dx = (p.x - uCentre) * aspect;
    float pool = exp(-dx * dx * 5.4);

    // The light comes from above the cabinet and dies before its floor, which
    // is where the rail's own hairline rule is: a pool that reached the rule
    // would read as a glow on it.
    float fall = smoothstep(-0.12, 0.62, p.y) * smoothstep(1.02, 0.58, p.y);

    // Three lookups, and no more. One slow wash so the pool is not a clean
    // ellipse; one drift carried by the rail's own scroll, so the grain travels
    // when the reader travels; one very low frequency variation seeded by the
    // plate index, so each plate stands in a light of its own.
    float wash = noise(vec2(p.x * 2.6 + uScroll * 3.1, p.y * 1.7 - uTime * 0.035));
    float drift = noise(vec2(p.x * 1.1 - uScroll * 6.2, uTime * 0.05));
    float seed = noise(vec2(uLit * 5.3, p.y * 0.9 + uTime * 0.02));

    float luma = pool * fall
      * (0.10 + 0.24 * (0.55 + 0.45 * seed))
      * (0.66 + 0.40 * wash)
      * (0.74 + 0.34 * drift);

    // The scene has to end somewhere and it must not be anywhere a reader can
    // find: the field dies inside its own frame, so the canvas rectangle never
    // shows as a faintly lighter box against the page.
    luma *= smoothstep(0.0, 0.10, p.x) * smoothstep(1.0, 0.90, p.x);

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.010;
    luma = clamp(luma, 0.0, 1.0);

    // Light only. Alpha follows the luminance, so where the field is dark it
    // paints nothing at all and the plates keep their own contrast — the scene
    // is never in the way of the cabinet.
    vec3 colour = mix(uInk, uLight, clamp(luma * 3.0, 0.0, 1.0));
    gl_FragColor = vec4(colour, luma * clamp(uIntensity, 0.0, 1.0) * 0.92);
  }
`;
