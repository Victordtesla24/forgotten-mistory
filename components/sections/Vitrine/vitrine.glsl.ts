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

    // Where the light may be bright, and where it may not, is decided by one
    // measured fact rather than by taste: the plate the rail has lit is
    // opacity: 1 over an opaque --ink-900 (Vitrine.module.css .plate[data-lit]),
    // so nothing behind it is ever composited into a caption; its neighbours are
    // opacity: 0.62 over the same ink, so everything behind *them* is. At 1440
    // the lit plate is 480 px of the stage's 1296 and stands at uCentre — 37% of
    // the slot where the light costs a reader nothing, and 63% where every extra
    // step of it comes straight off a --mist-200 caption at 11 px.
    //
    // So: the gather is bright and is matched to the lit plate's own width, and
    // the ambient that reaches the neighbours is held to a level their captions
    // can carry. TC-CONTRAST-01/02 measured 4.44:1 and 3.55:1 on
    // .Vitrine_metric dt when a single wide wash tried to do both jobs; the
    // split is what puts both back over 4.5.
    float across = smoothstep(0.0, 0.06, p.x) * smoothstep(1.0, 0.94, p.x);
    // The light comes from above the cabinet and dies before its floor, which
    // is where the rail's own hairline rule is: a pool that reached the rule
    // would read as a glow on it.
    float fall = smoothstep(-0.06, 0.22, p.y) * smoothstep(1.06, 0.78, p.y);
    float cabinet = across * fall;

    // The gallery spot, sized to the piece it is on. 24.0 puts the gather at a
    // sixteenth of its core by 0.20 of the stage either side of uCentre, which
    // at 1440 is the lit plate's own edge and the 24 px gap beyond it.
    float dx = (p.x - uCentre) * aspect;
    float pool = exp(-dx * dx * 24.0);

    // Three lookups, and no more. One slow wash so the pool is not a clean
    // ellipse; one drift carried by the rail's own scroll, so the grain travels
    // when the reader travels; one very low frequency variation seeded by the
    // plate index, so each plate stands in a light of its own.
    float wash = noise(vec2(p.x * 2.6 + uScroll * 3.1, p.y * 1.7 - uTime * 0.035));
    float drift = noise(vec2(p.x * 1.1 - uScroll * 6.2, uTime * 0.05));
    float seed = noise(vec2(uLit * 5.3, p.y * 0.9 + uTime * 0.02));

    // A slow breath travelling across the cabinet, so a rail nobody is touching
    // is still alive. It rides the gather, which is the third of the slot the
    // captions cannot see: a breath on the ambient would have to be paid for in
    // contrast on every unlit plate at once.
    float breath = 0.5 + 0.5 * sin(p.x * 2.3 - uTime * 0.85);

    // The neighbours are *waiting*, not absent (G-V1) — but only just: at this
    // level the still and the shader together leave a --mist-200 caption on an
    // unlit plate at better than 4.7:1.
    float ambient = cabinet * (0.055 + 0.035 * wash);
    float gather = cabinet * pool
      * (0.56 + 0.16 * seed)
      * (0.80 + 0.26 * breath)
      * (0.86 + 0.20 * drift);

    float luma = ambient + gather;

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.012;
    luma = clamp(luma, 0.0, 1.0);

    // Light only, and the light carried by alpha alone. Ramping the colour
    // toward white *and* setting alpha to the same figure paints a fraction of
    // a fraction — the mistake that cost AboutField its visibility the first
    // time, and the shape this field had before it was ever measured. Where the
    // field is dark it paints nothing at all and the plates keep their own
    // contrast: the scene is never in the way of the cabinet.
    gl_FragColor = vec4(uLight, luma * clamp(uIntensity, 0.0, 1.0));

    // uInk participates in no branch above; it is kept so the two colours still
    // arrive together from lib/palette.ts and a field that quietly stopped
    // reading one of them would be the first place a palette drift could hide.
    gl_FragColor.rgb = mix(uInk, gl_FragColor.rgb, clamp(luma * 4.0, 0.0, 1.0));
  }
`;
