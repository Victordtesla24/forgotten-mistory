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
 * ## The field is the section's plane, not the instrument's backing
 *
 * Through c22 the slot and the rose were the same 384 x 384 box. c23 grew the
 * slot to a 30rem stage and inset the engraving inside it at 0.78. Both shipped;
 * both were reviewed on live; both came back with the same finding, that a
 * recruiter's recall of `#about` is the SVG radar. That is what a field
 * confined to the widget's footprint gets you, and a 6rem halo around the same
 * widget is the same object with a wider margin.
 *
 * So from c24 the canvas is not in the instrument at all. It spans the whole
 * body — both columns — and is one screen tall, pinned, travelling with the
 * reader: the plane the section is drawn on, with the engraving standing on it
 * as chrome. Everything that had to line up with the rose still does, because
 * the plane is measured against the rose rather than the other way round:
 * `uCentre` is where the engraving's centre falls in this canvas and
 * `uRoseRadius` is how big it is here, both read from the DOM every frame
 * (`AboutField.tsx`) because the instrument is sticky and neither is a
 * constant. `rr` is this pixel's radius *in the engraving's frame*, so the
 * sector annulus, the numerals' groove and the answered bloom are written
 * exactly as they were. `r` — the plane's own frame — now carries the part of
 * the field the instrument never had: the ten sectors continued outward across
 * the whole section as a fan, and the wide haze they sit in.
 *
 * ## The light is bounded where the type is
 *
 * A plane this size is drawn under text, which no earlier version of this scene
 * was, so aiming the light away from the type is not enough — it has to be
 * bounded there. Two boxes arrive as `uGuard`: the reading column's top-left
 * corner, and the top of the instrument's own caption. Inside each, the light
 * is compressed toward a ceiling with `1 - exp(-luma/ceiling)`, which is smooth
 * everywhere and can never reach it, so no plateau shows where the compression
 * starts and no pixel under type can exceed the ground that type carries at
 * 4.5:1. The ceilings themselves are computed from `app/globals.css` and live
 * in `AboutField.tsx`, next to the measurement they apply to.
 *
 * Budget: one full-screen quad, no geometry, no textures, and three value-noise
 * lookups per pixel — the ceiling `CareerStrata` holds itself to — plus one
 * hash for grain. The masks add integer bit tests, not noise lookups, and the
 * fan and the guard reuse terms already computed.
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
  /** Where the engraving's centre falls in this canvas, in UV. */
  uniform vec2 uCentre;
  /** The engraving's radius, in the squared frame below (1.0 = half height). */
  uniform float uRoseRadius;
  /**
   * The two boxes the section's type occupies, in UV. xy is the reading
   * column's top-left corner — x rightward, y measured from the bottom like
   * every other coordinate here — and z is where the instrument's own caption
   * begins, again from the bottom. See the header for why they are bounds
   * rather than exclusions.
   */
  uniform vec3 uGuard;
  /** The most light allowed under the reading column, and under the caption. */
  uniform float uReadingCeiling;
  uniform float uInstrumentCeiling;

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
    // Polar about the instrument, wherever the instrument currently is. The
    // frame is squared first, so a fan drawn in it is round on a plane that is
    // not: r = 1 is half the plane's height.
    vec2 p = (vUv - uCentre) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0) * 2.0;
    float r = length(p);
    // The same point measured in the engraving's frame, where rr = 1 is the
    // rose's own edge. Everything that must line up with the SVG is written in
    // rr; r is the plane's own frame, and carries the fan and the haze.
    float rr = r / max(uRoseRadius, 0.0001);

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
    float ring = smoothstep(0.34, 0.52, rr) * smoothstep(0.98, 0.74, rr);

    // The numerals' own groove.
    // The ten labels are drawn at r = 36.2 in the rose's 100-unit viewBox —
    // 0.724 here — and over a lit annulus they sampled 2.49-3.67:1 even with
    // the ink outline the SVG now gives them (02-tests-failing.log, and the
    // run after the outline landed). The field cannot be dimmed as a whole
    // without taking the scene back under the visibility floor it was rebuilt
    // to clear, so it is dimmed exactly where the numbers are and nowhere
    // else. A channel at the numeral radius is also what an instrument face
    // does with its numerals: they sit in the metal, not on the light.
    ring *= 1.0 - 0.90 * exp(-pow((rr - 0.724) / 0.055, 2.0));

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
    float bloomR = exp(-pow((rr - 0.62) / 0.13, 2.0));
    sector += answered * band * bloomR * (0.17 + 0.21 * lit);
    sector += sourced * band * ring * (0.13 + 0.15 * lit);

    // The fan: the ten sectors continued past the bezel and out across the
    // whole plane. This is what makes the field the section's dominant surface
    // rather than the instrument's backing — the same ten spokes, the same
    // reading, the same two data states, carried to the edges of the body at a
    // weight that falls away with distance. Its inner edge is written in rr,
    // because it has to start exactly where the bezel ends; its falloff is
    // written in r, because how far it reaches is a fact about the plane.
    float fan = smoothstep(0.94, 1.30, rr) * exp(-pow(r / 1.35, 2.1));
    sector += fan * band * (0.42 + 0.30 * lit + 0.12 * gleam + 0.34 * sweep);
    sector += fan * band * (answered * 0.13 + sourced * 0.11) * (0.6 + 0.7 * lit);

    // The haze the fan sits in, so the plane is a surface and not ten spokes on
    // bare ink. Very low frequency, very low amplitude, and it reaches further
    // than the fan does — this is the light that makes the section feel lit at
    // all at the far corners, where no spoke arrives.
    float haze = exp(-pow(r / 1.55, 2.0)) * (0.11 + 0.055 * wash + 0.045 * lit);
    sector += haze;

    float luma = sector;

    // The scene has to end somewhere and it must not be anywhere a reader can
    // find: the field dies inside its own rectangle on all four sides, so the
    // canvas never shows as a faintly lighter box against the page. Measured in
    // UV rather than in r, because the plane is wide and its corners are not
    // equidistant from an instrument that has moved off its centre.
    vec2 edge = min(vUv, 1.0 - vUv);
    luma *= smoothstep(0.0, 0.075, edge.x) * smoothstep(0.0, 0.045, edge.y);

    // Grain, from the cheap hash rather than a fourth noise lookup.
    luma += (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.014;
    luma = clamp(luma, 0.0, 1.0);

    // The two ceilings. The reading column is the quadrant right of uGuard.x
    // and below uGuard.y — one corner describes it in both layouts, because at
    // 1440 the ten are beside the instrument (so the x test is the live one and
    // the y test is satisfied everywhere) and at 390 they are under it (so the
    // y test is the live one and the x test is satisfied everywhere). The
    // instrument's caption and key are everything below uGuard.z.
    //
    // Each ramp ends *at* its edge rather than straddling it: a smoothstep
    // centred on the boundary is only half applied at the boundary, and the
    // first line of type sits exactly there — the instrument's caption measured
    // 3.56:1 against a ground the ceiling should have held to 7.3:1, entirely
    // in the strip where the ramp had not finished (c24 probe, 1440).
    float toRight = smoothstep(uGuard.x - 0.06, uGuard.x, vUv.x);
    float belowList = smoothstep(uGuard.y + 0.06, uGuard.y, vUv.y);
    float reading = min(toRight, belowList);
    float caption = smoothstep(uGuard.z + 0.06, uGuard.z, vUv.y);
    float guarded = max(reading, caption);
    float ceiling = min(
      mix(1.0, uReadingCeiling, reading),
      mix(1.0, uInstrumentCeiling, caption)
    );
    // Asymptotic, so the bound is never actually reached and the transition
    // into it has no edge of its own. Outside both boxes guarded is 0 and the
    // field is untouched.
    luma = mix(luma, ceiling * (1.0 - exp(-luma / max(ceiling, 0.0001))), guarded);

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
