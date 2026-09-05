/**
 * The stage MiniVic answers from.
 *
 * S7 of the seven signature scenes (docs/architecture/SIGNATURE-SCENES-v1.md
 * §4.7, decision D8). The other six are sections; this one is the plate behind
 * the avatar, and what it draws is a shallow pool of light that opens and closes
 * with the phoneme — so the face is lit *by what he is saying* rather than by a
 * lamp that happens to be on.
 *
 * Everything that moves here is a viseme. `uOpen` is the jaw drop, `uWide` the
 * lip width and `uRound` the rounding, read each frame from the same three refs
 * `components/MiniVicBot.tsx` hands its 2D mouth canvas
 * (`currentVisemeRef` / `targetVisemeRef` / `visemeLerpRef`, resolved through
 * `lerpVisemeShapes`). The lip-sync itself is not touched and not duplicated:
 * this shader is downstream of it, which is the whole point of D8 — the 2D mouth
 * stays byte-identical and remains the no-GL fallback, so R3 accuracy cannot
 * regress behind a decoration.
 *
 * Monochrome, and no gold. Gold on this site means one thing — *this figure has
 * a source you can go and check* — and a bot's stage light is not a figure. The
 * two colours arrive as uniforms from `lib/palette.ts`.
 *
 * Budget: one full-screen quad, no geometry, no textures, two value-noise
 * lookups per pixel plus one hash for grain — the same order as
 * `listen.glsl.ts`, on a slot that is 160 px tall.
 */

export const visemeStageVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const visemeStageFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  /** Jaw drop, 0 (closed) → 1 (fully open) — the viseme's own aperture. */
  uniform float uOpen;
  /** Lip width factor, ~0.6 → ~1.2, neutral at 1. Spreads or narrows the pool. */
  uniform float uWide;
  /** Lip rounding, 0 (spread) → 1 (rounded). Tightens the pool toward a ring. */
  uniform float uRound;
  /** 1 while he is actually speaking, 0 at rest — the difference between a
      stage that is lit and a stage that is waiting. */
  uniform float uSpeak;
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

    float open = clamp(uOpen, 0.0, 1.0);
    float round_ = clamp(uRound, 0.0, 1.0);
    // The pool is as wide as the lips are and as tall as the jaw is dropped:
    // a rounded 'oo' pulls it in, an open 'aa' opens it up. Rounding narrows
    // the horizontal reach because that is what rounding does to a mouth.
    float wide = 0.55 * clamp(uWide, 0.5, 1.4) * (1.0 - 0.18 * round_);
    float tall = 0.40 + 0.16 * open;

    // The pool sits where the face is: the plate is 'object-top', so the light
    // gathers a little above centre rather than at it.
    vec2 q = vec2((p.x - 0.5) / wide, (p.y - 0.56) / tall);
    float r2 = dot(q, q);

    float pool = exp(-r2 * 1.15);
    float core = exp(-r2 * 4.20);
    float room = exp(-r2 * 0.28);

    // Gone at every edge of the plate, so the canvas boundary is never a seam a
    // reader can find inside a 22 rem dialog.
    float across =
      smoothstep(0.0, 0.10, p.x) * smoothstep(1.0, 0.90, p.x) *
      smoothstep(0.0, 0.08, p.y) * smoothstep(1.0, 0.92, p.y);

    // Two lookups, no more: one slow wash so the pool is not a clean gradient,
    // one very low frequency drift so the light has a length across the plate.
    float wash = noise(vec2(p.x * 2.4, p.y * 3.1 - uTime * 0.04));
    float along = noise(vec2(p.x * 0.9 + uTime * 0.02, open * 1.7));

    // A room that is not being spoken in is still a room with a light in it.
    // The breath is the only clock in this shader, and it is the same rate the
    // listen field breathes at (1.05 rad/s, listen.glsl.ts) — enough phase
    // across a 1.5 s sampling window to clear the motion floor, slow enough
    // that nothing about it reads as an animation playing next to a face.
    float breath = 0.5 + 0.5 * sin(p.x * 1.6 - uTime * 1.05);

    // Speaking widens the core's swing rather than raising the whole plate:
    // the type in the panel sits below this slot, and lifting the ground under
    // it would buy brightness with legibility.
    float speak = clamp(uSpeak, 0.0, 1.0);

    float luma = across
      * (
          pool * (0.30 + 0.14 * open + 0.05 * speak)
          + core * (0.36 + 0.22 * open + 0.08 * speak)
          + room * (0.11 + 0.075 * breath)
        )
      * (0.88 + 0.20 * wash)
      * (0.92 + 0.14 * along);

    // Grain, from the cheap hash rather than a third noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.009;
    luma = clamp(luma, 0.0, 1.0);

    // Light only, carried by alpha alone: ramping the colour toward white *and*
    // setting alpha to the same figure paints a fraction of a fraction — a
    // shader that compiles perfectly and draws almost nothing. Where the pool
    // has not reached, it paints nothing at all, and the portrait behind it is
    // exactly as it was.
    gl_FragColor = vec4(uLight, luma * clamp(uIntensity, 0.0, 1.0));

    // uInk participates in no branch above; it is kept so the two colours still
    // arrive together from lib/palette.ts and a stage that quietly stopped
    // reading one of them would be the first place a palette drift could hide.
    gl_FragColor.rgb = mix(uInk, gl_FragColor.rgb, clamp(luma * 4.0, 0.0, 1.0));
  }
`;
