/**
 * career-descent — sixteen years as a core sample, seen from above.
 *
 * The Gantt directly above this scene draws the eight role spans as **length**
 * on a horizontal axis. This shader draws the same eight spans as **depth**:
 * one stratum per role, stacked deepest-is-oldest, each one as thick as its
 * role is long. A nine-year band and a six-month seam are the same fact in a
 * different projection, which is the whole argument for drawing it twice —
 * unlike the version of `strata.glsl.ts` that once drew a second, misaligned
 * copy of the bars in the *same* projection and read as a rendering fault.
 *
 * `uDescent` is the camera. It is the sticky band's own scroll progress, 0 at
 * the surface (the current engagement, bright and near) and 1 at the floor
 * (2010, dim and far). The reader is falling, and what they fall past is their
 * own subtraction: the layer that takes longest to cross is the eight years at
 * ANZ.
 *
 * ## Immovables this file holds to
 *
 * - **Colour comes from `lib/palette.ts`.** There is no raw hex here and no
 *   claim-mark hue: that mark means *this figure has a source a reader can go
 *   and check*, and a field of light is not a figure
 *   (`docs/architecture/SIGNATURE-SCENES-v2.md` §3.2).
 * - **No light lands on type.** The caption and the year ticks sit over this
 *   field, so the shader keeps a dark gutter down the left third where the
 *   ticks live and never brightens the top band where the caption sits. Type
 *   contrast is first and the story is second.
 * - **Budget.** One `ScreenQuad`, one fragment program, zero geometry, zero
 *   textures, and three value-noise lookups per pixel plus an eight-iteration
 *   `smoothstep` loop — arithmetic, not sampling. The ceiling is four lookups
 *   (v2 §3.3): one for the sediment grain riding the strata, one for the near
 *   dust, one for the far floor.
 * - **Three distances, not one.** Near dust, the strata and a far floor answer
 *   the same `uDescent` at three different rates, and that difference is the
 *   whole of `TC-STORY-EXP-01`: a gradient answers a scroll delta with one
 *   pixel count, a camera answers it with three. `uQuality = 0` drops the far
 *   floor on the phone branch — uniform control flow, no divergence, exactly
 *   the way `atmosphere.glsl.ts` branches on a uniform.
 * - **The whole column is in frame.** The first cut of this scene windowed a
 *   third of the axis into view, so a reader could never count eight jobs in
 *   one picture and `TC-STORY-DESCENT-01` could not be satisfied by any amount
 *   of scrolling. The core sample is now shown whole and the camera is the
 *   drift and the depth of focus, not a crop.
 *
 * ## Uniforms — every one traces to data or to reader state
 *
 * `uSpans[i]` is `(startNorm, endNorm, depth, sourced)`, normalised on the CPU
 * in `CareerDescent.tsx` from `app/data/portfolio/experience.ts` using the same
 * `TIMELINE_START` / `NOW` the chart imports, so the descent and the Gantt can
 * never disagree about a date. `uSpanCount` is `roles.length` — a hard-coded 8
 * would silently drop a ninth role the day one is added. `sourced` is carried
 * but spent only in luminance, never in hue.
 */

export const descentVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const descentFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  // 0..1 — the sticky band's own progress. THE CAMERA: 0 is the surface
  // (the current role), 1 is the floor (2010).
  uniform float uDescent;
  // (startNorm, endNorm, depth, sourced) per role, normalised against the
  // chart's own TIMELINE_START / NOW.
  uniform vec4 uSpans[8];
  // roles.length, never a literal.
  uniform float uSpanCount;
  // Row index hovered in the chart above, CPU-lerped; negative means none.
  uniform float uHover;
  // 1 = full depth stack, 0 = the phone branch. Uniform control flow only.
  uniform float uQuality;
  // Mount ramp, shared with every other scene.
  uniform float uIntensity;
  uniform vec3 uInk;
  uniform vec3 uLight;

  /**
   * Where the axis lands in the frame. t runs 0 at the top of the stage to 1
   * at its foot; the whole core sample is in frame at once, from the surface at
   * t = TOP_T down to 2010 at t = TOP_T + AXIS_T. Both ends are held clear
   * of the 10% edge dissolve and of the caption gutter at the foot, so no
   * stratum is ever lost to a fade and all eight are countable in one frame.
   */
  const float TOP_T = 0.09;
  const float AXIS_T = 0.66;

  /* The three rates. The strata drift slowly against the camera, the near dust
   * races, the far floor barely moves — one scroll delta, three pixel counts. */
  const float STRATA_RATE = 0.05;
  const float DUST_RATE = 2.6;
  const float FLOOR_RATE = 0.012;

  /** Half-width of the soft edge on a stratum boundary, in the same units. */
  const float EDGE = 0.007;

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

    // Where in the core this pixel is. t is 0 at the top of the stage (now)
    // and 1 at its foot (2010); the whole column is in frame, because sixteen
    // years is ONE object and the reader is looking down it. The camera is the
    // slow drift of that column against the scroll, centred on the travel so
    // neither the surface nor the floor is ever pushed into an edge fade.
    float t = 1.0 - uv.y;
    float drift = (uDescent - 0.5) * STRATA_RATE;
    float core = (t - TOP_T) / AXIS_T + drift;

    // The strata. Each role occupies (startNorm .. endNorm) of the axis, so its
    // drawn thickness IS its duration: the same quantity the bars above draw as
    // length. Brightness rises toward the surface — the layers get brighter as
    // the reader comes up to now — and the hovered row takes a further lift so
    // the answer to a pointer in the chart above arrives here as a swell.
    float body = 0.0;
    float seams = 0.0;
    for (int i = 0; i < 8; i++) {
      float live = step(float(i) + 0.5, uSpanCount);
      vec4 span = uSpans[i];
      float lower = min(span.x, span.y);
      float upper = max(span.x, span.y);

      float inside = smoothstep(lower - EDGE, lower + EDGE, core)
                   * (1.0 - smoothstep(upper - EDGE, upper + EDGE, core));

      // Recency: span.z is the role's own depth, 0 at the surface and 1 at the
      // floor, so this is bright-at-now without a second date arriving here.
      float recency = 1.0 - span.z;
      float hovered = max(0.0, 1.0 - abs(float(i) - uHover));
      // span.w carries the employer grade. It is spent in luminance only — a
      // checkable employer reads a shade cleaner, never a different hue.
      float grade = 0.92 + 0.08 * span.w;

      // The floor is dim and the surface is bright, but the floor is still a
      // stratum a reader can see: the version of career-strata this site shipped
      // once covered 0.00% of its own slot and the owner, looking at it, reported
      // no scene at all. A base of 0.26 is what keeps 2010 present without ever
      // approaching the bars above, which are --white at full opacity.
      body += live * inside * (0.26 + 0.42 * recency) * grade * (1.0 + 0.55 * hovered);

      // The boundary between two roles: a thin bright seam, which is what makes
      // the stack countable and the spacing measurable.
      float edge = exp(-pow((core - upper) / EDGE, 2.0) * 0.6);
      seams += live * edge * (0.34 + 0.34 * recency) * (1.0 + 0.7 * hovered);
    }

    // The surface. The eight strata are drawn by their OLDER boundary, which
    // gives eight seams and therefore seven gaps; the ninth edge is the top of
    // the core itself — the day the current engagement began — and with it the
    // gaps and the eight role durations are the same list. Without it the last
    // role has no thickness a reader (or TC-STORY-DESCENT-01) can measure.
    float surface = exp(-pow((core - uSpans[0].x) / EDGE, 2.0) * 0.6);
    seams += surface * 0.72;

    // Depth of focus: the layer the reader is currently passing is the brightest
    // one. This, not a crop, is what makes the whole column read as a fall — the
    // light travels down the core as the reader does. Multiplicative and gentle,
    // so it swells a stratum without inventing or erasing an edge.
    float focus = exp(-pow((core - uDescent) / 0.22, 2.0));
    float column = (body + seams) * mix(0.68, 1.06, focus);

    // Sediment grain riding the strata: fine ACROSS the column and slow DOWN
    // it, so it reads as material at a glance and cannot be mistaken for a
    // stratum boundary. The first cut varied it at 30 cycles down the axis and
    // put eight false edges into the row profile, which made the stack
    // uncountable — the grain has to be texture, never geometry. Lookup 1 of 3.
    float grain = noise(vec2(uv.x * 140.0, core * 2.0 + uTime * 0.02));
    column *= 0.90 + 0.14 * grain;

    // Near dust — the fastest plane. It answers the same camera at DUST_RATE,
    // roughly fifty times the strata's own drift, which is the near field of a
    // camera move. Fine speckle, so it is texture in front of the column rather
    // than a second set of bands competing with the strata. Lookup 2 of 3.
    float dust = noise(vec2(uv.x * 90.0 + uTime * 0.01, uv.y * 90.0 - uDescent * DUST_RATE));
    float near = smoothstep(0.66, 1.0, dust) * 0.10;

    // The far floor — the slowest plane, and the third distance. A soft horizon
    // beneath 2010: the bottom of the hole the reader is falling into. It moves
    // at FLOOR_RATE, barely at all, which is exactly how a far plane behaves.
    // uQuality drops it on the phone branch, uniform control flow, no divergence.
    // Lookup 3 of 3.
    float floorY = 0.16 + uDescent * FLOOR_RATE;
    float floorGrain = noise(vec2(uv.x * 1.9 - uDescent * 0.2, uv.y * 2.4));
    float far = exp(-pow((uv.y - floorY) / 0.045, 2.0)) * (0.13 + 0.07 * floorGrain) * uQuality;

    // Nothing exists above the top of the core. Without this the near dust
    // keeps drifting over the empty frame above the surface and reads, in a
    // luminance profile, as a stratum older than the current engagement — a
    // ninth layer the CV does not have.
    float inCore = smoothstep(-0.05, -0.005, core);

    float luma = (column + near) * inCore + far;

    // The gutter. The year ticks run down the left of the stage and the caption
    // sits across its foot, and neither may ever have light added behind it —
    // 4.5:1 first, story second. So the field is held down where the type is.
    // uv.y is 1 at the top of the frame, so the caption band is the low end.
    float gutterX = smoothstep(0.0, 0.30, uv.x);
    float captionY = 1.0 - (1.0 - smoothstep(0.04, 0.22, uv.y)) * 0.85;
    luma *= mix(0.18, 1.0, gutterX) * captionY;

    // Dissolve at all four edges: the scene has to end somewhere and it must
    // not be anywhere a reader can find. Same 10% as career-strata.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.10), uv)
              * smoothstep(vec2(0.0), vec2(0.10), 1.0 - uv);
    luma *= edge.x * edge.y;

    float dither = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.016;

    vec3 colour = mix(uInk, uLight, clamp(luma + dither, 0.0, 1.0));

    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0));
  }
`;
