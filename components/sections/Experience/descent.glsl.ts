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
 *   textures, and on this slice two value-noise lookups per pixel plus an
 *   eight-iteration `smoothstep` loop — arithmetic, not sampling. The ceiling
 *   is four lookups (v2 §3.3); slice `x2-s2` spends the remaining two on the
 *   third parallax layer.
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
   * How far the camera travels through the core, in normalised timeline units.
   * The whole axis is 1.0 wide; the camera starts a little above the surface and
   * ends a little below the floor so the first and last strata both get to
   * arrive rather than being clipped at the frame edge on the first frame.
   */
  const float TRAVEL_TOP = -0.16;
  const float TRAVEL_BOTTOM = 1.16;

  /** Half-width of the soft edge on a stratum boundary, in the same units. */
  const float EDGE = 0.012;

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

    // Where in the core this pixel is. The top of the frame is nearer the
    // surface than the bottom, and the camera slides the whole column past.
    float camera = mix(TRAVEL_TOP, TRAVEL_BOTTOM, uDescent);
    // A third of the axis is in frame at once, so a role shorter than about
    // four months is a seam rather than a band — which is the honest picture.
    float core = camera + (1.0 - uv.y) * 0.34;

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
      seams += live * edge * (0.22 + 0.26 * recency) * (1.0 + 0.7 * hovered);
    }

    // Sediment grain riding the strata, drifting with the camera so the column
    // reads as material the reader is moving through rather than a gradient
    // sliding under a window. Lookup 1 of 2.
    float grain = noise(vec2(uv.x * 3.2, core * 26.0 + uTime * 0.02));
    body *= 0.72 + 0.42 * grain;

    // Near dust: the one parallax term this slice carries, moving faster than
    // the strata against the same camera so the frame already has two distances
    // in it. Lookup 2 of 2. Slice x2-s2 adds the far floor as the third.
    float dust = noise(vec2(uv.x * 1.6 + uTime * 0.01, uv.y * 2.2 - uDescent * 2.6));
    float near = smoothstep(0.62, 1.0, dust) * 0.10 * uQuality;

    float luma = body + seams * 0.72 + near;

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
