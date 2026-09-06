/**
 * Hero atmosphere — a single full-screen fragment program.
 *
 * One draw call, no geometry, no textures: the entire hero backdrop is computed
 * per pixel. Two volumetric shafts raked down from the upper left through a fog
 * whose density visibly varies, and two pools where that light gathers — one
 * behind the name, one behind the portrait plate — all of it answering the
 * pointer through a lerped parallax.
 *
 * Two earlier versions of this were correct and invisible. The first produced a
 * luminance low enough that the hero backdrop was indistinguishable from the
 * flat CSS gradient underneath it. The second added a ridged near layer and
 * radial striations about the key, and measured — at 1440, with the scene
 * isolated from the type in front of it — 9.7% coverage and a peak of 0.13
 * relative luminance. `?gl=force` proved a canvas existed; no test ever asked
 * whether there was anything in it, and the owner, looking at the live site,
 * reported that there was not.
 *
 * What changed is the structure, not the palette. The radial striation became
 * two Gaussian shafts about a raked axis, so the light has a width, an edge and
 * a direction that crosses the whole frame instead of dying a third of a screen
 * from its source. The single key became two pools with subjects behind them.
 * The composite gained roughly a factor of two, and a soft scrim over the
 * reading column, so the frame can be bright where a visitor looks and quiet
 * where a visitor reads. `tests/overhaul/flagship-visibility.spec.ts` holds the
 * result to numbers rather than to adjectives.
 *
 * Strictly achromatic: the final colour is a single luminance ramped between two
 * :root ink tokens passed in as uniforms, so the scene can never drift off the
 * monochrome palette.
 */

export const atmosphereVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    // The screen-filling triangle carries clip-space positions, so they pass
    // straight through with no projection work per vertex.
    gl_Position = vec4(position.xy, 0.0, 1.0);
    // Derive the coordinate from the position rather than reading a uv
    // attribute: the triangle's geometry does not carry one, and sampling a
    // missing attribute yields zero for every fragment — which renders the
    // whole shader as one flat colour, indistinguishable from not drawing.
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;     // -1..1, already smoothed on the CPU
  uniform float uIntensity;  // 0..1 master fade, drives the entrance
  uniform vec2 uScroll;      // page scroll depth 0..1 (drives deep-space parallax)
  uniform vec3 uInk;         // deep background ink
  uniform vec3 uLight;       // luminous accent
  uniform float uQuality;    // 1 = full strata, 0 = the two cheap layers only
  // The figure's measured centre, in this shader's uv (origin bottom-left).
  // HERO-SETPIECE-v3 §4.2 / R7: written from the photograph's own
  // getBoundingClientRect() rather than from the brief's per-viewport table, so
  // the pool cannot drift from the CSS. The default is the constant it replaces
  // (p = (0.75·halfWidth, -0.04) → uv (0.875, 0.46)), so a frame drawn before
  // the first measurement is the frame this shader always drew.
  uniform vec2 uFigure;
  // The union of the fold's text rects, in uv (x0, y0, x1, y1), y up. The
  // luminance-suppression lobe below is bounded *by* this rect: its −50 %
  // contour is the rect's own boundary, which is inside the rect dilated 8 px
  // by construction, so the guard can never buy contrast by darkening plane
  // pixels that count in Σ_P m (§4.2, R3).
  uniform vec4 uCopyGuard;

  // -- Value noise ----------------------------------------------------------
  // Hash-based value noise rather than gradient noise: at these scales the
  // difference is invisible and this costs a third of the instructions.
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

  // Four octaves is the point of diminishing returns for mist this soft.
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  // Ridged noise. Folding the field about its midline turns billows into
  // filaments — the difference between fog, which has no form, and air with
  // structure moving through it.
  float ridged(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    // Three octaves, not four. The fourth is below the visible threshold once
    // the layer is stretched 2.6x along the beam.
    for (int i = 0; i < 3; i++) {
      float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
      value += amplitude * n * n;
      p *= 2.11;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    // Aspect-corrected coordinates centred on the frame.
    vec2 p = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

    // Deep-space parallax: pointer drift + scroll depth, scaled by layer
    // distance. The pointer term is what makes the light answer the visitor —
    // the shafts and both pools take it at different rates, so moving the
    // cursor opens the frame rather than sliding a picture across it.
    vec2 parallax = uPointer * 0.075 + vec2(0.0, -uScroll.x * 0.14);

    // The phone path drifts faster because it has fewer layers to drift.
    // uQuality drops the near layer and the second shaft below 900 px, and the
    // near layer is where nearly all of this scene's movement lived: measured
    // at 390 on ?gl=force the frame changed by a mean |dL| of 0.00057 over
    // 1.5 s against the 0.004 the flagship gate calls "a scene rather than a
    // still" (C22c 02-tests-failing.log). The two layers that remain were
    // rated against a third that is not there, so on that path they carry it.
    float t = uTime * mix(0.030, 0.012, step(0.5, uQuality));

    // -- Deep space starfield (sparse, monochrome) ------------------------
    float stars = 0.0;
    {
      vec2 sp = p * 48.0 + parallax * 0.15 + vec2(t * 0.2, -t * 0.08);
      vec2 si = floor(sp);
      vec2 sf = fract(sp) - 0.5;
      float sh = hash(si);
      float cell = step(0.992, sh);
      float glow = exp(-dot(sf, sf) * 90.0) * cell;
      stars = glow * (0.35 + 0.65 * hash(si + 17.0));
    }

    // -- The fog ----------------------------------------------------------
    // Three depths, three speeds, and — the point of this layer — a density
    // that visibly varies. An even fog is a grey wash; what makes air read as
    // air is that some of it is thick and some of it is clear, so the shafts
    // below are modulated by this field rather than merely drawn over it.
    vec2 beamAxis = normalize(vec2(0.86, -0.5));
    mat2 alignBeam = mat2(beamAxis.x, -beamAxis.y, beamAxis.y, beamAxis.x);

    float far = fbm(p * 1.35 + vec2(t, -t * 0.35) + parallax * 0.20);
    float mid = fbm(p * 2.70 - vec2(t * 1.7, t * 0.5) + parallax * 0.60);
    // The near layer and the shafts are the expensive half of this program.
    // On a phone they are also the half nobody can resolve, so uQuality drops
    // them rather than shipping a frame budget the device cannot hold.
    // Branching on a uniform is uniform control flow: every fragment takes the
    // same path, so it costs nothing to test.
    float near = 0.0;
    if (uQuality > 0.5) {
      vec2 nearP = alignBeam * (p * vec2(1.0, 2.6)) * 3.4;
      near = ridged(nearP + vec2(t * 3.1, -t * 1.1) + parallax * 1.15);
    }

    // Same reason: the near layer contributes 0.40 of the density on a desktop and
    // nothing on a phone, so the phone frame was a third thinner than the one
    // this scene was tuned as. The two remaining depths take part of that
    // weight back — part, not all: with the composition below now placed
    // against the frame's own half-width, the shafts and both pools are inside
    // a 390 frame again and full compensation on top of them washed the phone
    // hero out to a flat grey (coverage 100.00%). A lit room, not a lit wall.
    float hiQ = step(0.5, uQuality);
    float fog = far * mix(0.72, 0.66, hiQ) + mid * mix(0.40, 0.34, hiQ) + near * 0.40;

    // A low horizon: density gathers toward the bottom of the frame and thins
    // out above, the way air does over a plain at night.
    float horizon = smoothstep(1.15, -0.35, uv.y);
    float density = fog * (0.46 + horizon * 0.92);

    // -- Two volumetric shafts --------------------------------------------
    // Rays, not a starburst. Each shaft is a Gaussian band about a line raked
    // down from the upper left, so it has a width, an edge and a direction the
    // eye can follow the length of the frame.
    //
    // Both widths and both offsets breathe on slow, mutually prime periods, so
    // the pair never pulses together and the frame is never twice the same.
    // Every figure in this scene is placed against the frame's own half-width,
    // not against a constant. p.x is aspect-corrected, so it runs to +-0.8 at
    // 1440x900 and to +-0.207 at 390x844 — and both pools, the key and the
    // shafts' source were all written as constants sized to the first of
    // those. Measured at 390, that put every one of them outside the frame:
    // the shaft's Gaussian evaluated to zero across the whole phone viewport
    // and the scene was reduced to fog and a vignette (mean |dL| 0.00094 over
    // 1.5 s, coverage 13.58%). The factors below are the old constants divided
    // by 0.8, so at 1440x900 this composition is unchanged to the pixel and at
    // 390 it is the same composition rather than the empty middle of one.
    float halfWidth = (uResolution.x / max(uResolution.y, 1.0)) * 0.5;

    vec2 dir = normalize(vec2(0.60, -0.80));
    vec2 perp = vec2(-dir.y, dir.x);
    vec2 rel = p - (vec2(-1.15 * halfWidth, 0.78) + parallax * 0.30);
    float along = dot(rel, dir);
    float across = dot(rel, perp);

    float breathe = sin(uTime * 0.090);
    float a1 = across + 0.030 + 0.034 * breathe;
    float a2 = across - 0.360 + 0.028 * sin(uTime * 0.062 + 1.9);
    float w1 = 0.168 + 0.022 * breathe;
    float w2 = 0.104 + 0.018 * sin(uTime * 0.051 + 2.4);
    float s1 = exp(-(a1 * a1) / (w1 * w1));
    float s2 = exp(-(a2 * a2) / (w2 * w2));
    // Brightest where they leave the source, absorbed as they cross: light in
    // air, not a gradient pinned to the corner.
    float travel = smoothstep(-0.12, 0.55, along) * exp(-max(along, 0.0) * 0.34);
    float shafts;
    if (uQuality > 0.5) {
      shafts = (s1 + s2 * 0.78) * travel * (0.58 + density * 1.05);
    } else {
      // The phone keeps one shaft, and the fog keeps its grip on it — that
      // grip is the cheap half (mid is already sampled) and it is what makes
      // the beam breathe instead of sitting still. Only the second beam and
      // the near layer are dropped.
      shafts = s1 * travel * 0.85 * (0.62 + 0.62 * mid);
    }

    // -- The pools --------------------------------------------------------
    // Two places where the light gathers instead of passing through: one on
    // the left, behind the name, and one on the right, behind the portrait
    // plate. They are what give the hero backdrop a subject.
    vec2 q1 = (p - vec2(-0.90 * halfWidth, 0.10) - parallax * 0.22) * vec2(1.00, 1.30);
    float poolName = exp(-dot(q1, q1) * 2.10);
    // The plate pool follows the photograph. uFigure is uv, so this holds on
    // the uQuality = 0 phone branch too — the branch where every constant sized
    // to 1440's half-width evaluated outside the frame (see the note above the
    // shafts). aspect maps uv back into the aspect-corrected space p lives in.
    vec2 figCentre = (uFigure - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 q2 = (p - figCentre - parallax * 0.14) * vec2(1.20, 0.95);
    // 1.40, not 2.60. The plate pool was written to sit behind a portrait card;
    // it now has to *reach* the figure's outline, because TC-HERO-SET-04 measures
    // the light in an 8-24 px annulus around the photograph against the fold's
    // own mean. At 2.60 the Gaussian was down to 0.44 of its peak by the figure's
    // left and right edges and the annulus measured 1.05x the fold mean against
    // the 1.35 the case asks for (07-slice-tests.log). Widening the falloff — the
    // pool's radius, not its peak — carries it past the outline instead of
    // stopping inside it.
    float poolPlate = exp(-dot(q2, q2) * 1.40);
    // Both pools breathe, on periods prime to each other and to the shafts'.
    // Light gathering in air is not a still: a static pool took the frame's
    // mean |dL| over 1.5 s to 0.00244, and the first breath written here — a
    // 0.18 swing at 0.37 rad/s — only reached 0.00327, still under the 0.004
    // the gate calls a scene rather than a still (02-tests-failing.log and
    // this lane's first green run). Over a 1.5 s window a slow swing barely
    // moves, so the period is what was shortened rather than the amplitude
    // widened: 0.56 rad/s advances the phase far enough in that window to be
    // measured, while an 18-second cycle is still slower than anything a
    // reader would call a pulse. The centre goes up with it, not down, so the
    // scene's core is brighter at rest than it was, never dimmer.
    float poolBreath = 0.94 + 0.20 * sin(uTime * 0.56);
    float plateBreath = 0.94 + 0.20 * sin(uTime * 0.43 + 1.3);
    float pools = poolName * 0.98 * poolBreath + poolPlate * 1.15 * plateBreath;

    // The key itself, falling off quadratically.
    float distLight = length(p - (vec2(-0.775 * halfWidth, 0.40) + parallax * 0.35));
    float key = 1.0 - clamp(distLight * 0.72, 0.0, 1.0);
    key = pow(key, 2.4);

    float luma = density * 0.46 + shafts * 0.95 + pools * 0.62 + key * 0.30 + stars * 0.60;

    // Vignette — closes the frame without crushing the corners to pure black.
    float vignette = smoothstep(1.62, 0.20, length(p));
    luma *= 0.44 + vignette * 0.72;

    // -- The copy guard ---------------------------------------------------
    // What used to stand here was a scrim shaped to the *reading column*: a box
    // from uv.x 0.055 to 0.635 and uv.y 0.100 to 0.945, inside which the frame
    // gave up 58 % of its brightness. That is over half the fold, and almost all
    // of it is plane — pixels that carry Σ_P m and nothing else. Darkening them
    // bought contrast under three runs of type by switching off the half of the
    // frame the eye enters through, which is the composition ADV-2315Z failed
    // and HERO-SETPIECE-v3 §4.2 forbids: a guard may not raise contrast by
    // lowering SPD.
    //
    // So the lobe is bounded to the type itself. uCopyGuard is the union of
    // the fold's text rects, measured from the DOM, and the smoothstep pairs
    // below are centred *on that rect's own edges*: at x = uCopyGuard.x the
    // first factor is exactly 0.5, so the guard's −50 % contour is the rect
    // boundary. The rect is inside the same rect dilated 8 px — the dilation the
    // SPD instrument uses — by construction, at every width, on both paths, with
    // no tuning that could drift. Outside it the frame is at full brightness.
    // The feather is what keeps the box from having an edge a reader can find.
    // The feather is capped at 0.05 uv rather than taken as half the rect, so
    // the interior of the guard actually reaches its full strength instead of
    // peaking only at the centre of a 930 px headline. It is still centred on
    // the edge, so the −50 % contour does not move.
    float guardFeatherX = clamp(0.5 * (uCopyGuard.z - uCopyGuard.x), 0.001, 0.05);
    float guardFeatherY = clamp(0.5 * (uCopyGuard.w - uCopyGuard.y), 0.001, 0.05);
    float gx = smoothstep(uCopyGuard.x - guardFeatherX, uCopyGuard.x + guardFeatherX, uv.x)
             * smoothstep(uCopyGuard.z + guardFeatherX, uCopyGuard.z - guardFeatherX, uv.x);
    float gy = smoothstep(uCopyGuard.y - guardFeatherY, uCopyGuard.y + guardFeatherY, uv.y)
             * smoothstep(uCopyGuard.w + guardFeatherY, uCopyGuard.w - guardFeatherY, uv.y);

    // A shoulder rather than a clamp: the highlights roll off instead of
    // flattening into a disc around the key.
    luma = luma / (1.0 + luma * 0.42);

    // The guard is applied *after* the shoulder, and that is the whole of why it
    // works. Applied before it, the shoulder gives most of it back: measured at
    // 1440x900 on ?gl=force, luma under the name reached 4.13 raw, 1.74 after a
    // 0.58 guard, and 1.00 after the shoulder — the same saturated white the
    // unguarded frame draws, and the H1 measured 1.10:1 against the 95th
    // percentile beneath it (07-slice-tests.log). After the shoulder, 0.58 means
    // 58% of the light that is actually on screen.
    luma *= 1.0 - 0.58 * gx * gy;

    // Fine grain at ~1.8%: enough to break up gradient banding on 8-bit panels,
    // far below the threshold where it reads as noise.
    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.018;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));

    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0));
  }
`;
