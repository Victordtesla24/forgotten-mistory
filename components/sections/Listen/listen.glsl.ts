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
 * Budget: one full-screen quad, no geometry, two value-noise lookups per pixel
 * — under the three `AboutField` and `CareerStrata` hold to, because an empty
 * screen should cost less than a full one — plus one hash for grain and two
 * taps of a single 256×1 texture: the greeting's own loudness (`uEnvelope`),
 * which is what the band draws instead of a sine.
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
  /**
   * The greeting's loudness as a 256×1 texture: the peak-normalised RMS
   * envelope of public/assets/minivic-greeting.mp3, built by
   * scripts/build/greeting_envelope.mjs into app/data/generated. The band's
   * height across x is a tap of this at p.x — the shape of him speaking, not a
   * sine. See listen.glsl.ts's header and LISTEN-FLAGSHIP.md C1.
   */
  uniform sampler2D uEnvelope;
  /** The greeting's length in seconds, so the field can read it back at real time. */
  uniform float uDuration;

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
    float close = clamp(uClose, 0.0, 1.0);

    // The band lies where the caliper lies, and it closes as the caliper does:
    // a soft wash while the jaws are wide, a hairline once they have arrived.
    // Same gesture, one scale up — the instrument's own drawing, in light.
    //
    // The reach is small on purpose, and the reason is a contrast budget rather
    // than a taste. The caliper's own row is the one full-width stripe of this
    // section with no type in it; the sentence's last line sits about 78 px
    // above it at 1440 and is --fs-h3, which tops out at 23 px and is therefore
    // *normal* text needing 4.5:1 — about rgb(113 113 113) of ground. At
    // 0.052 of the section's height the band is down to a tenth of its core by
    // the time it reaches that line, so the brightest light on this page is
    // 60 px from the nearest glyph and never on it.
    float reach = mix(0.070, 0.052, close);
    float dy = (p.y - (1.0 - uBand)) / reach;
    float band = exp(-dy * dy);
    // The hairline the jaws leave behind: the core the eye lands on, four and a
    // half times tighter than the band it sits in.
    float core = exp(-dy * dy * 4.5);
    // And the room the bench is in — three times the band's reach, a tenth of
    // its level. It is what the light has a *length* on, and what carries the
    // breath below: a beat confined to a 50 px stripe moved too little of the
    // frame to clear the motion floor.
    float room = exp(-dy * dy * 0.10);

    // Across the section the light runs the full width and is gone at both
    // gutters, so the canvas edge is never a seam a reader can find. It used to
    // narrow to the spine, which put every bright pixel behind the reading
    // column and none anywhere else — a band that avoided the type would have
    // been dimmer *and* safer.
    float across = smoothstep(0.0, 0.09, p.x) * smoothstep(1.0, 0.91, p.x);

    // Two noise lookups, no more. One slow wash so the band is not a clean
    // gradient; one very low frequency drift along it, so the light has a length.
    float wash = noise(vec2(p.x * 2.2, p.y * 3.4 - uTime * 0.03));
    float along = noise(vec2(p.x * 0.9 + uTime * 0.02, uClose * 1.7));

    // The band's height across x is the greeting's loudness at that moment: a
    // tap of the envelope at p.x, 0 at a pause and 1 at the loudest word. This
    // is the whole point of the section's rebuild — the closing light is the
    // shape of him speaking, not a sine (LISTEN-FLAGSHIP.md C1).
    float voice = texture2D(uEnvelope, vec2(clamp(p.x, 0.0, 1.0), 0.5)).r;

    // What keeps a bench nobody is touching alive is now the voice itself,
    // played back rather than invented: a reading head runs the same envelope
    // in real time (fract(uTime / uDuration) is where in the 25 s greeting the
    // room is), and its loudness breathes the widest term of the three — where
    // the old sine's swing already sat. The motion the frame is measured moving
    // by is the greeting playing, and it carries at least the 0.5-mean swing the
    // sine did because a peak-normalised envelope spends real time near 1.0.
    float playhead = texture2D(uEnvelope, vec2(fract(uTime / uDuration), 0.5)).r;

    // The band brightens as the jaws close, and never past the point where it
    // would compete with the type standing in it.
    float lift = 0.32 + 0.06 * close;

    float luma = across
      * (
          band * lift * (0.80 + 0.28 * voice)
          + core * (0.27 + 0.06 * close)
          + room * (0.030 + 0.075 * playhead)
        )
      * (0.86 + 0.20 * wash)
      * (0.90 + 0.16 * along);

    // Grain, from the cheap hash rather than a third noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.009;
    luma = clamp(luma, 0.0, 1.0);

    // Light only, and the light carried by alpha alone: ramping the colour
    // toward white *and* setting alpha to the same figure paints a fraction of
    // a fraction — a shader that compiles perfectly and draws almost nothing.
    // Where it is dark it paints nothing at all — the
    // emptiness of this screen is the design, and the scene must not fill it in.
    gl_FragColor = vec4(uLight, luma * clamp(uIntensity, 0.0, 1.0));

    // uInk participates in no branch above; it is kept so the two colours still
    // arrive together from lib/palette.ts and a field that quietly stopped
    // reading one of them would be the first place a palette drift could hide.
    gl_FragColor.rgb = mix(uInk, gl_FragColor.rgb, clamp(luma * 4.0, 0.0, 1.0));
  }
`;
