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
 * band of radii the SVG's sector ring occupies; and `uRotation` is the
 * identical angle the rose is rotated by, in radians — so as the reader
 * scrolls, the field turns underneath the engraving in lockstep rather than
 * drifting against it, and the sector carried up to the index at twelve
 * o'clock is the one that brightens.
 *
 * ## Why the numbers here are not the numbers that shipped first
 *
 * The first version of this field was, measured, invisible: isolated from the
 * engraving at 1440 it covered 0.00% of its own slot at any meaningful
 * luminance and peaked at 0.033 — under a twentieth of what a person notices.
 * Two things caused that, and both are worth naming because they are easy to
 * repeat.
 *
 * First, the composite dimmed itself twice. The colour was ramped toward light
 * by `luma`, and then the *alpha* was set to `luma` as well, so a sector at
 * 0.30 painted 30% of a colour that was itself only 30% of the way to white —
 * about a tenth of the intended brightness. Alpha here now carries the light on
 * its own: the colour is the light, and `luma` decides how much of it lands.
 * Dark regions still paint nothing at all, which was the point of the original
 * arrangement, and the lit ones now actually arrive.
 *
 * Second, the faint sectors were too faint to be sectors. An instrument face
 * where only one of ten segments is visible is not a face; it is a smear. The
 * inactive floor is now high enough to read as a ring of ten, and the active
 * sector is far enough above it to be unmistakable.
 *
 * `tests/overhaul/flagship-visibility.spec.ts` pins all of this to numbers.
 *
 * Monochrome, and never the site's one accent: that accent means a figure has a
 * source a reader can go and check, and a field of light is not a figure. The
 * two colours arrive as uniforms from `lib/palette.ts` — ink and light, nothing
 * else.
 *
 * ## The field carries the section's data, not just its scroll position
 *
 * The rose above turns to the dimension being read, and the field turns with
 * it (`uRotation`, `uActive`). But the ten dimensions are not interchangeable,
 * and the SVG already says so: seven are computed from the candidate and are
 * answered on the page; three are computed from the role and are drawn open,
 * over a 45° hatch, because there is nothing about a person to measure in them;
 * and of the seven answered, four name a record a reader can open and carry the
 * site's one claim mark, while three are self-reported and stay unmarked. That
 * is three states — answered, open, sourced — and before this the light knew
 * none of them: every sector was lit identically and only the indexed one
 * changed. A recruiter's recall of `#about` was the SVG widget, because the
 * expensive thing behind it was carrying no information the widget did not.
 *
 * So the section hands the field the same two facts it hands the rose, as two
 * bit masks — one bit per dimension, set when that dimension is answered from
 * the candidate (`uAnsweredMask`) and when it has a checkable source
 * (`uSourcedMask`). The field reads its own sector's bits and shapes the light
 * from them: an answered sector blooms up its mid-annulus; a sourced sector
 * lifts a further, warm-neutral light channel; an open (role) sector does
 * neither and reads as the flatter floor the hatch means. All three additions
 * are strictly additive over the visibility floor the scene was rebuilt to
 * clear, so no sector is ever taken below it — the data can only add light, it
 * cannot dim the ring back under the gate. The claim mark itself never enters
 * the shader: sourced sectors are brighter, not accented, and the one accent
 * stays where a source can be clicked, in the SVG chrome.
 *
 * Budget: one full-screen quad, no geometry, no textures, and three value-noise
 * lookups per pixel — the ceiling `CareerStrata` holds itself to — plus one
 * hash for grain. The two masks add integer bit tests, not noise lookups.
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
  /** 0 -> 1 over the mount ramp; back to 0 if the context is lost. */
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;
  /**
   * One bit per dimension, LSB = dimension 0. Set where the engine computes the
   * dimension from the candidate and it is answered on the page (seven of ten).
   * The three that are clear are the role-side sectors the SVG draws open.
   */
  uniform float uAnsweredMask;
  /**
   * One bit per dimension. Set where the answer names a record a reader can go
   * and open — the sectors the DOM marks with the site's one accent. The shader
   * lifts their light; it never takes the accent's colour, which stays in the
   * SVG where the source is a link.
   */
  uniform float uSourcedMask;

  const float SECTORS = 10.0;
  const float TAU = 6.283185307179586;

  // Bit i of an integer-valued mask, as 0.0 or 1.0. No array indexing, so this
  // is portable to WebGL1, where a fragment shader may not index a uniform
  // array by a computed sector number.
  float maskBit(float mask, float i) {
    return mod(floor(mask / exp2(i)), 2.0);
  }

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
    // same separation the SVG leaves between its annular sectors.
    float band = smoothstep(0.0, 0.06, within) * smoothstep(1.0, 0.94, within);

    // The band of radii the rose's sector ring occupies, softened at both ends
    // so the light is under the engraving rather than around it.
    float ring = smoothstep(0.34, 0.52, r) * smoothstep(0.98, 0.74, r);

    // The numerals' own groove.
    // The ten labels are drawn at r = 36.2 in the rose's 100-unit viewBox —
    // 0.724 here — and over a lit annulus they sampled 2.49-3.67:1 even with
    // the ink outline the SVG now gives them (02-tests-failing.log, and the
    // run after the outline landed). The field cannot be dimmed as a whole
    // without taking the scene back under the visibility floor it was rebuilt
    // to clear, so it is dimmed exactly where the numbers are and nowhere
    // else. A channel at the numeral radius is also what an instrument face
    // does with its numerals: they sit in the metal, not on the light.
    ring *= 1.0 - 0.90 * exp(-pow((r - 0.724) / 0.055, 2.0));

    // How far this sector is from the one being read, wrapped around the face.
    // At rest (uActive < 0) nothing is favoured, which is the rose's rest state
    // too: an instrument with no reading is not an instrument pointing at zero.
    float away = abs(idx - uActive);
    away = min(away, SECTORS - away);
    float lit = uActive < 0.0 ? 0.0 : 1.0 - smoothstep(0.0, 2.2, away);

    // This sector's own state, read from the two masks the section hands down.
    // idx can fall outside 0..9 at the wrap seam; mod brings it home before the
    // bit test (GLSL mod is always non-negative for a positive divisor).
    float sidx = mod(idx, SECTORS);
    float answered = maskBit(uAnsweredMask, sidx);
    float sourced = maskBit(uSourcedMask, sidx);

    // Three lookups, and no more. One slow drift per sector so the ten are not
    // identical; one shimmer across each sector's own width; one wide, very low
    // frequency wash so the disc is not evenly lit. Their amplitudes are held
    // deliberately narrow: they are meant to keep the ring alive, not to take
    // any sector back below the threshold where it stops being visible.
    float drift = noise(vec2(idx * 3.7, uTime * 0.19));
    float shimmer = noise(vec2(within * 2.4 + idx * 7.1, r * 2.2 - uTime * 0.24));
    float wash = noise(p * 1.1 + vec2(uTime * 0.11, 0.0));

    // A gleam travelling round the ring, so the face is never twice the same
    // even while the reader is between dimensions and nothing is indexed.
    float gleam = 0.5 + 0.5 * sin(a * 2.0 - uTime * 0.42);

    // The entry sweep: as the section arrives, a wavefront of light runs once
    // around the face and hands over to the steady state. It is carried by the
    // same uIntensity ramp the mount already drives, so it costs no uniform and
    // cannot desynchronise from the fade-in.
    float phase = clamp(uIntensity, 0.0, 1.0);
    float around = fract(a / TAU + 1.0);
    float sweep = exp(-pow((around - phase) * 3.4, 2.0)) * (1.0 - phase);

    // The floor is what makes this a ring of ten rather than one lit wedge; the
    // 'lit' term is what makes it an instrument with a reading.
    // 0.42, not 0.36: at 1440 the compass is beside the list and a dimension is
    // always indexed, so the 'lit' term carries the peak. At 390 it is a header
    // ornament and uActive is -1 for most of the section's scroll — the ring
    // runs on its floor alone, and that floor composited to 0.2965 relative
    // luminance against the 0.35 the flagship gate calls a core the eye lands
    // on (C22 09-verification.md). The floor and the gleam below are what a
    // reader at rest actually sees, so that is where the light was added,
    // rather than in a term a phone never reaches.
    float sector = band * ring * (0.42 + 0.58 * lit);
    sector *= 0.86 + 0.16 * drift;
    sector *= 0.88 + 0.16 * shimmer;
    sector *= 0.90 + 0.14 * wash;
    sector += band * ring * (0.26 * gleam + 0.42 * sweep);

    // The data terms, all additive so nothing here can drop a sector under the
    // floor above. An answered sector blooms up its mid-annulus — a soft core
    // the eye reads as "there is a reading here" — and the bloom lifts further
    // when that sector is the one being read. An open (role) sector answers
    // neither mask and keeps the flat floor, which is what the SVG's hatch says
    // in light: sought, and honestly nothing to measure. A sourced sector lifts
    // a further warm-neutral channel across its whole band, so the four rows the
    // page can actually mark read brighter than the three self-reported ones —
    // the same ranking the DOM draws, carried by luminance, never by the accent.
    float bloomR = exp(-pow((r - 0.62) / 0.13, 2.0));
    sector += answered * band * bloomR * (0.17 + 0.21 * lit);
    sector += sourced * band * ring * (0.13 + 0.15 * lit);

    float luma = sector;

    // The scene has to end somewhere and it must not be anywhere a reader can
    // find: the field dies inside its own frame, so the canvas rectangle never
    // shows as a faintly lighter box against the page.
    luma *= 1.0 - smoothstep(0.88, 1.02, r);

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.014;
    luma = clamp(luma, 0.0, 1.0);

    // Light only, and the light carried by alpha alone. Where the field is dark
    // it paints nothing at all and the stage's own pool of light shows through
    // undisturbed; where it is lit, the full accent lands at the weight luma
    // asks for rather than at its square. See the header for why that
    // distinction cost this scene its visibility the first time.
    gl_FragColor = vec4(uLight, luma * clamp(uIntensity, 0.0, 1.0));

    // uInk participates in no branch above; it is kept in the signature because
    // every scene on this site takes its two colours from lib/palette.ts and a
    // field that quietly stopped reading one of them would be the first place a
    // palette drift could hide.
    gl_FragColor.rgb = mix(uInk, gl_FragColor.rgb, clamp(luma * 4.0, 0.0, 1.0));
  }
`;
