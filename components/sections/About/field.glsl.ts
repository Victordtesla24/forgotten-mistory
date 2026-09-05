/**
 * The compass field — the instrument's own ten sectors, lit.
 *
 * The rose above this is inline SVG and stays that way: it is the section's
 * argument, it must be legible with no WebGL at all, and it costs no context.
 * This shader does not draw a second compass beside it — that mistake was
 * already made once in `#experience`, where a 3D copy of the DOM chart read as
 * a rendering bug (see `../Experience/strata.glsl.ts`). It draws the light the
 * rose's ten sectors sit in.
 *
 * So the geometry is deliberately the same geometry. `SECTORS` is the ten
 * dimensions the engine scores on; the annulus the light occupies is the same
 * band of radii the SVG's sector ring occupies (22 → 41 of a 100-unit face);
 * and `uRotation` is the identical angle the rose is rotated by, in radians —
 * so as the reader scrolls, the field turns underneath the engraving in
 * lockstep rather than drifting against it, and the sector carried up to the
 * index at twelve o'clock is the one that brightens.
 *
 * Monochrome, and never the site's one accent: that accent means a figure has a
 * source a reader can go and check, and a field of light is not a figure. The
 * two colours arrive as uniforms from `lib/palette.ts` — ink and light, nothing
 * else.
 *
 * Budget: one full-screen quad, no geometry, no textures, and three value-noise
 * lookups per pixel — the ceiling `CareerStrata` holds itself to — plus one
 * hash for grain.
 */

export const aboutFieldVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const aboutFieldFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  /** The rose's own rotation, in radians. Negative carries a sector clockwise. */
  uniform float uRotation;
  /** The dimension being read, 0..9, or -1 when the reader is between items. */
  uniform float uActive;
  /** 0 → 1 over the mount ramp; back to 0 if the context is lost. */
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;

  const float SECTORS = 10.0;
  const float TAU = 6.283185307179586;

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
    // The face is a disc, so the frame is squared before anything polar is
    // measured in it. r = 1 is the half-height of the stage.
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0) * 2.0;
    float r = length(p);

    // Twelve o'clock is up and the sectors run clockwise, numbered exactly as
    // the SVG numbers them. Subtracting uRotation puts this in the rose's own
    // frame; the +0.5 lands sector centres, not sector edges, at the index.
    float a = atan(p.x, p.y) - uRotation;
    float s = a / TAU * SECTORS + 0.5;
    float idx = floor(s);
    float within = fract(s);

    // A hairline of air between neighbours, so ten sectors read as ten — the
    // same 1.1° of separation the SVG leaves between its annular sectors.
    float band = smoothstep(0.0, 0.07, within) * smoothstep(1.0, 0.93, within);

    // The band of radii the rose's sector ring occupies, softened at both ends
    // so the light is under the engraving rather than around it.
    float ring = smoothstep(0.40, 0.58, r) * smoothstep(0.94, 0.72, r);

    // How far this sector is from the one being read, wrapped around the face.
    // At rest (uActive < 0) nothing is favoured, which is the rose's rest state
    // too: an instrument with no reading is not an instrument pointing at zero.
    float away = abs(idx - uActive);
    away = min(away, SECTORS - away);
    float lit = uActive < 0.0 ? 0.0 : 1.0 - smoothstep(0.0, 2.4, away);

    // Three lookups, and no more. One slow drift per sector so the ten are not
    // identical; one shimmer across each sector's own width; one wide, very low
    // frequency wash so the disc is not evenly lit.
    float drift = noise(vec2(idx * 3.7, uTime * 0.05));
    float shimmer = noise(vec2(within * 2.4 + idx * 7.1, r * 2.2 - uTime * 0.07));
    float wash = noise(p * 1.1 + vec2(uTime * 0.03, 0.0));

    float luma = band * ring
      * (0.055 + 0.30 * lit)
      * (0.62 + 0.38 * drift)
      * (0.70 + 0.44 * shimmer)
      * (0.74 + 0.34 * wash);

    // The scene has to end somewhere and it must not be anywhere a reader can
    // find: the field dies inside its own frame, so the canvas rectangle never
    // shows as a faintly lighter box against the page.
    luma *= 1.0 - smoothstep(0.86, 1.0, r);

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.012;
    luma = clamp(luma, 0.0, 1.0);

    // Light only. Alpha follows the luminance, so where the field is dark it
    // paints nothing at all and the stage's own pool of light shows through
    // undisturbed — the scene is never in the way of the instrument.
    vec3 colour = mix(uInk, uLight, clamp(luma * 3.2, 0.0, 1.0));
    gl_FragColor = vec4(colour, luma * clamp(uIntensity, 0.0, 1.0) * 0.95);
  }
`;
