/**
 * The light the instrument is set down in.
 *
 * `#listen` has exactly one beat and it is silent (design council R-c1,
 * MOT-F-4): the caliper's jaws close over one `--motion-cine-long`, the reading
 * between them stays '—', and the hairline draws beneath as the last stroke.
 * A scene here could only be a second animation competing with that beat — so
 * this one has no clock of its own. `uClose` is the jaws' own progress, 0 → 1,
 * and everything the field does it does because the jaws are closing.
 *
 * What it draws is the band the instrument lies on: a hairline of light across
 * the section at the caliper's own height (`uBand`), dark and wide while the
 * jaws are open, narrowing and lifting as they arrive — the bench light coming
 * up on an instrument being put down. When the beat ends the field holds, like
 * every other element in the section.
 *
 * Monochrome, and never the site's one accent: this section makes no claim at
 * all — its reading is '—' — so there is nothing here for that accent to mark.
 * The two colours arrive as uniforms from `lib/palette.ts`.
 *
 * Budget: one full-screen quad, no geometry, no textures, two value-noise
 * lookups per pixel — under the three `AboutField` and `CareerStrata` hold to,
 * because an empty screen should cost less than a full one — plus one hash for
 * grain.
 */

export const listenFieldVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const listenFieldFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  /** The jaws' own progress, 0 → 1, over one --motion-cine-long. Nothing else moves. */
  uniform float uClose;
  /** The caliper's height within the section, 0 (top) → 1 (bottom). */
  uniform float uBand;
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
    vec2 p = vUv;

    // The band lies where the caliper lies, and it closes as the caliper does:
    // a soft wash while the jaws are wide, a hairline once they have arrived.
    // Same gesture, one scale up — the instrument's own drawing, in light.
    float reach = mix(0.26, 0.045, clamp(uClose, 0.0, 1.0));
    float dy = (p.y - (1.0 - uBand)) / reach;
    float band = exp(-dy * dy);

    // Across the section the light is widest at the spine, where the sentence
    // and the instrument sit, and gone at both gutters — so the canvas edge is
    // never a seam a reader can find.
    float across = smoothstep(0.0, 0.30, p.x) * smoothstep(1.0, 0.70, p.x);

    // Two lookups, no more. One slow wash so the band is not a clean gradient;
    // one very low frequency drift along it, so the light has a length.
    float wash = noise(vec2(p.x * 2.2, p.y * 3.4 - uTime * 0.03));
    float along = noise(vec2(p.x * 0.9 + uTime * 0.02, uClose * 1.7));

    // The band brightens as the jaws close, and never past the point where it
    // would compete with the type standing in it.
    float lift = 0.045 + 0.115 * clamp(uClose, 0.0, 1.0);

    float luma = band * across * lift
      * (0.68 + 0.38 * wash)
      * (0.78 + 0.30 * along);

    // Grain, from the cheap hash rather than a third noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.009;
    luma = clamp(luma, 0.0, 1.0);

    // Light only. Alpha follows the luminance, so where the field is dark it
    // paints nothing at all: the emptiness of this screen is the design, and
    // the scene must not fill it in.
    vec3 colour = mix(uInk, uLight, clamp(luma * 3.4, 0.0, 1.0));
    gl_FragColor = vec4(colour, luma * clamp(uIntensity, 0.0, 1.0) * 0.9);
  }
`;
