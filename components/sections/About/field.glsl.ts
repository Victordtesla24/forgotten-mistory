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
 * That arrangement was measured in c25 and it was not enough: with the
 * engraving hidden, the ten sectors were all lit to within 1.49x of each other
 * and a reader could not tell answered from open by looking
 * (`TC-SCENE-ABOUT-10`, `02-tests-failing.log`). Every data term was additive,
 * so a state could add light but never withhold it, and the ring was a ring of
 * ten identical things. `state` is now multiplicative and is the exception the
 * paragraph above no longer describes: an answered sector carries the full
 * light, an open one carries a 45-degree hatch at about a third of it, and
 * the seven the page answers can be counted from the light alone. The floor
 * that keeps this above the flagship visibility gate is `state`'s own minimum,
 * not zero, so no sector ever goes dark.
 *
 * Multiplicative was necessary and was not sufficient. Folded into the ring and
 * the fan the way it first shipped, `state` moved only the part of the light
 * those two terms carried: the haze under them was untouched, and where the
 * type guards compressed the light toward a ceiling the two states arrived
 * different and left identical. Measured with nothing indexed — the screen a
 * reader arrives on, which is where ADV-REVIEW-20260905T2315Z F-2 measured it —
 * the ring told answered from open by 1.499x at 1440 and 1.039x at 390, against
 * a 1.6 bar this file's own test sets, and three of the ten seams inverted. So
 * `state` is now applied once, at the very end, to everything the pixel
 * carries and after both ceilings. See the gate itself for why each half of
 * that matters; the short version is that a wedge's whole light now says what
 * the wedge is, and a guard can no longer flatten the difference away.
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
    // A gap wide enough to count across. At 0.06 the seam between neighbours
    // was a hairline the eye integrated away and the ring read as one wash —
    // measured, the ten lobes were there in the source and not in the picture
    // (TC-SCENE-ABOUT-10). 0.10 of a sector is about 3.6 degrees of air, which
    // is the separation the SVG's own annular sectors leave.
    float band = smoothstep(0.0, 0.10, within) * smoothstep(1.0, 0.90, within);

    // The band of radii the rose's sector ring occupies, softened at both ends
    // so the light is under the engraving rather than around it.
    float ring = smoothstep(0.31, 0.50, rr) * smoothstep(1.02, 0.72, rr);

    // The numerals' own groove.
    // The ten labels are drawn at r = 36.2 in the rose's 100-unit viewBox —
    // 0.724 here — and over a lit annulus they sampled 2.49-3.67:1 even with
    // the ink outline the SVG now gives them (02-tests-failing.log, and the
    // run after the outline landed). The field cannot be dimmed as a whole
    // without taking the scene back under the visibility floor it was rebuilt
    // to clear, so it is dimmed exactly where the numbers are and nowhere
    // else. A channel at the numeral radius is also what an instrument face
    // does with its numerals: they sit in the metal, not on the light.
    float groove = 1.0 - 0.96 * exp(-pow((rr - 0.724) / 0.082, 2.0));
    ring *= groove;

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

    // The hatch, in light: a 45-degree ruling in the plane's own frame, which
    // is the mark the SVG draws over an open sector and the mark the open
    // caliper uses everywhere else on the site. It gives the three role-side
    // sectors structure without giving them brightness.
    float hatch = 0.5 + 0.5 * sin((p.x + p.y) * 42.0);
    // ...and the one multiplicative term in this shader. Until G-A3 every
    // sector was lit identically and only the indexed one changed, so a reader
    // could not tell answered from open by looking — the state lived in the
    // engraving, which is exactly why two reviews in a row recorded the
    // section's recall as the engraving. An answered sector carries the light;
    // an open one carries the hatch at a third of it, and reads as the absence
    // it is. Seven lit of ten, countable without the dial.
    //
    // It is applied once, at the very end, to everything this pixel carries —
    // see the gate below the ceilings for why it is no longer folded into the
    // individual terms. That makes it a whole-plane multiplier, and a
    // whole-plane multiplier written from idx alone would step at every seam
    // and draw ten hard spokes across the haze. So the wedge on the other side
    // of the nearer seam is read too and the two are crossfaded over the last
    // 14% of the wedge: at the seam itself the mix is exactly half and half,
    // which is the same value approached from either side, so the gate is
    // continuous everywhere while still being flat across each wedge's body.
    float nidx = mod(idx + (within < 0.5 ? -1.0 : 1.0), SECTORS);
    float openState = 0.26 + 0.22 * hatch;
    float stateHere = mix(openState, 1.0, answered);
    float stateThere = mix(openState, 1.0, maskBit(uAnsweredMask, nidx));
    float state = mix(stateHere, stateThere, 0.5 * smoothstep(0.72, 1.0, abs(within - 0.5) * 2.0));

    // Three lookups, and no more. One slow drift per sector so the ten are not
    // identical; one shimmer across each sector's own width; one wide, very low
    // frequency wash so the disc is not evenly lit. Their amplitudes are held
    // deliberately narrow: they are meant to keep the ring alive, not to take
    // any sector back below the threshold where it stops being visible.
    float drift = noise(vec2(idx * 3.7, uTime * 0.31));
    float shimmer = noise(vec2(within * 2.4 + idx * 7.1, r * 2.2 - uTime * 0.42));
    float wash = noise(p * 1.1 + vec2(uTime * 0.19, 0.0));

    // A gleam travelling round the ring, so the face is never twice the same
    // even while the reader is between dimensions and nothing is indexed.
    float gleam = 0.5 + 0.5 * sin(a * 2.0 - uTime * 1.05);

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
    float sector = band * ring * (0.62 + 0.58 * lit);
    sector *= 0.80 + 0.28 * drift;
    sector *= 0.82 + 0.28 * shimmer;
    sector *= 0.86 + 0.20 * wash;
    sector += band * ring * (0.42 * gleam + 0.42 * sweep);

    // The data terms, all additive so nothing here can drop a sector under the
    // floor above. An answered sector blooms up its mid-annulus — a soft core
    // the eye reads as "there is a reading here" — and the bloom lifts further
    // when that sector is the one being read. An open (role) sector answers
    // neither mask and keeps the flat floor, which is what the SVG's hatch says
    // in light: sought, and honestly nothing to measure. A sourced sector lifts
    // a further warm-neutral channel across its whole band, so the four rows the
    // page can actually mark read brighter than the three self-reported ones —
    // the same ranking the DOM draws, carried by luminance, never by the accent.
    // The answered bloom takes the groove too. It is centred at rr = 0.62 and
    // still worth 0.53 of itself at the numerals' radius, which is how the
    // active sector's "01" ended up at 4.50:1 with the numerals demoted to
    // --mist-400 — a number that has not passed AA (04-tests-passing.log).
    // Every term that lands on the numeral radius is grooved, or the groove is
    // decoration.
    float bloomR = exp(-pow((rr - 0.62) / 0.13, 2.0)) * groove;
    sector += answered * band * bloomR * (0.17 + 0.21 * lit);
    sector += sourced * band * ring * (0.13 + 0.15 * lit);

    // The fan: the ten sectors continued past the bezel and out across the
    // whole plane. This is what makes the field the section's dominant surface
    // rather than the instrument's backing — the same ten spokes, the same
    // reading, the same two data states, carried to the edges of the body at a
    // weight that falls away with distance. Its inner edge is written in rr,
    // because it has to start exactly where the bezel ends; its falloff is
    // written in r, because how far it reaches is a fact about the plane.
    float fan = smoothstep(0.94, 1.26, rr) * exp(-pow(r / 1.85, 2.1));
    sector += fan * band * (1.10 + 0.34 * lit + 0.22 * gleam + 0.34 * sweep);
    sector += fan * band * (answered * 0.15 + sourced * 0.12) * (0.6 + 0.7 * lit);

    // The haze the fan sits in, so the plane is a surface and not ten spokes on
    // bare ink. Very low frequency, very low amplitude, and it reaches further
    // than the fan does — this is the light that makes the section feel lit at
    // all at the far corners, where no spoke arrives.
    float haze = exp(-pow(r / 2.10, 2.0)) * (0.206 + 0.085 * wash + 0.045 * lit);
    // The face is recessed. Outside the bezel the haze is the plane's own light
    // and carries the section; under the engraving it is the ground the ten
    // numerals and the hub readout are read against, and a flat wash there is
    // what put them at 3.0-4.4:1 when the dial stopped painting in --white
    // (04-tests-passing.log, first run). So the haze is dimmed inside the rose
    // and dimmed hardest at the hub, where the readout sits — which is also
    // what an instrument face does: the glass is lit at the ring, not at the
    // pivot. The sector ring itself is untouched, so the ten sectors keep every
    // bit of their light and their separation.
    haze *= mix(0.40, 1.0, smoothstep(0.52, 1.02, rr));
    sector += haze;
    sector *= mix(0.42, 1.0, smoothstep(0.05, 0.34, rr));

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
    // The ramp is 0.12 of the plane, not 0.06: at the light this field now
    // carries, a ramp half that width read as a vertical seam down the page
    // where the reading column's ceiling began (06-about-1440-gl.png, first
    // capture). It still ends *at* the edge rather than straddling it, for the
    // reason below — it just takes longer to get there.
    float toRight = smoothstep(uGuard.x - 0.12, uGuard.x, vUv.x);
    float belowList = smoothstep(uGuard.y + 0.12, uGuard.y, vUv.y);
    float reading = min(toRight, belowList);
    float caption = smoothstep(uGuard.z + 0.10, uGuard.z, vUv.y);
    float guarded = max(reading, caption);
    float ceiling = min(
      mix(1.0, uReadingCeiling, reading),
      mix(1.0, uInstrumentCeiling, caption)
    );
    // Asymptotic, so the bound is never actually reached and the transition
    // into it has no edge of its own. Outside both boxes guarded is 0 and the
    // field is untouched.
    luma = mix(luma, ceiling * (1.0 - exp(-luma / max(ceiling, 0.0001))), guarded);

    // The state gate — last, and after the two ceilings rather than before
    // them. Both halves of that sentence are the fix ADV-REVIEW-20260905T2315Z
    // F-2 asked for, and both are load-bearing.
    //
    // *After the ceilings*, because 1 - exp(-luma/ceiling) is a saturating
    // curve: under the reading column it maps everything above about a third
    // onto the same 0.0999, so an answered sector and an open one arrived at
    // the guard four tenths apart and left it identical. That is why the ring
    // read answered/open 1.039 at 390, where the ten are under the instrument
    // and half the plane is guarded. Multiplying the compressed light instead
    // of the light going in keeps the ratio intact inside the guard — and
    // because the gate is never above 1.0 it can only ever take light away, so
    // no ceiling moves: the bound the type is read against is exactly the bound
    // it was before, at both boxes.
    //
    // *Everything*, because the haze was the one term the state never touched,
    // and on the annulus a reader actually sees it is a third of the light —
    // the numerals' groove takes the ring out of the middle of that band, so
    // what remains between the spokes is largely haze. An open sector at four
    // tenths of the ring plus all of the haze measured 1.499 against its
    // answered neighbours at 1440 with nothing indexed, and three of the ten
    // seams inverted (02-tests-failing.log). Gating the plane rather than the
    // spoke makes each wedge's whole light say what the wedge is, which is what
    // "answered sectors bloom, open ones hatch" claimed all along. The lifts
    // above (0.50 -> 0.62 on the ring, 0.92 -> 1.10 on the fan, 0.192 -> 0.206
    // on the haze) put back the light the three open wedges now give up, so the
    // plane keeps the weight TC-SCENE-ABOUT-11 measures it by; inside the two
    // guards those lifts are absorbed by the ceilings and change nothing.
    luma *= state;

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
