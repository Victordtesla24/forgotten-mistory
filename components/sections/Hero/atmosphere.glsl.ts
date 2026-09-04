/**
 * Hero atmosphere — a single full-screen fragment program.
 *
 * One draw call, no geometry, no textures: the entire hero backdrop is computed
 * per pixel. Layered mist strata over a low horizon, lit from high left, with
 * volumetric shafts raked through the near air — drifting at three different
 * speeds so the parallax reads as depth rather than as movement. Nothing
 * pulses, nothing sweeps, nothing announces itself.
 *
 * The first version of this was correct and invisible: the luminance it
 * produced was low enough that on most panels the hero backdrop was
 * indistinguishable from the flat CSS gradient underneath it, which meant a
 * shader compile was being spent on nothing anyone could see. The structure is
 * unchanged; what it now has is a ridged near layer stretched along the light
 * axis, radial shafts about the key, and a highlight shoulder instead of a
 * clamp.
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
  // structure moving through it. This is what gives the backdrop something to
  // look at without giving it anything to read.
  float ridged(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    // Three octaves, not four. The fourth is below the visible threshold once
    // the layer is stretched 2.6x along the beam, and this program already
    // costs sixteen noise lookups a pixel at up to 1.75x device scale.
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

    // Deep-space parallax: pointer drift + scroll depth, scaled by layer distance.
    // Far field moves least; near filaments move most — readable depth without gimmick.
    vec2 parallax = uPointer * 0.055 + vec2(0.0, -uScroll.x * 0.12);

    // The key. High and to the left, the same direction everything else on the
    // page is lit from, so the whole site reads as having one light source.
    vec2 lightPos = vec2(-0.62, 0.40) + parallax * 0.35;
    vec2 toLight = p - lightPos;
    float distLight = length(toLight);

    float t = uTime * 0.012;

    // ── Deep space starfield (sparse, monochrome) ─────────────────────────
    // Hash-scattered points behind the mist so scroll/pointer parallax reads as
    // void depth rather than as a flat fog sheet.
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

    // ── The strata ────────────────────────────────────────────────────────
    // Three depths, three speeds. The near layer is ridged and stretched along
    // the light direction, so the closest air reads as filaments drawn through
    // the beam rather than as another sheet of fog.
    vec2 beamAxis = normalize(vec2(0.86, -0.5));
    mat2 alignBeam = mat2(beamAxis.x, -beamAxis.y, beamAxis.y, beamAxis.x);

    float far = fbm(p * 1.55 + vec2(t, -t * 0.35) + parallax * 0.18);
    float mid = fbm(p * 2.9 - vec2(t * 1.7, t * 0.5) + parallax * 0.55);
    // The near layer and the shafts are the expensive half of this program.
    // On a phone they are also the half nobody can resolve, so uQuality
    // drops them rather than shipping a frame budget the device cannot hold.
    // Branching on a uniform is uniform control flow: every fragment takes the
    // same path, so it costs nothing to test.
    float near = 0.0;
    if (uQuality > 0.5) {
      vec2 nearP = alignBeam * (p * vec2(1.0, 2.6)) * 3.4;
      near = ridged(nearP + vec2(t * 3.1, -t * 1.1) + parallax * 1.15);
    }

    float mist = far * 0.48 + mid * 0.28 + near * 0.34 + stars * 0.55;

    // A low horizon: density gathers toward the bottom of the frame and thins
    // out above, the way air does over a plain at night.
    float horizon = smoothstep(1.02, -0.20, uv.y);
    mist *= 0.30 + horizon * 0.95;

    // ── Volumetric shafts ─────────────────────────────────────────────────
    // Radial striations about the key, modulated by the same drifting field, so
    // the light appears to be passing through the air rather than sitting in
    // front of it. Cheap: one angle, one noise lookup, no marching.
    float shafts = 0.0;
    if (uQuality > 0.5) {
      float angle = atan(toLight.y, toLight.x);
      float shaft = fbm(vec2(angle * 2.4, distLight * 0.9 - t * 2.2));
      shaft = pow(clamp(shaft, 0.0, 1.0), 2.4);
      // The shafts only exist near the source and die away with distance,
      // otherwise they read as a starburst filter rather than as light in air.
      float shaftFall = exp(-distLight * 1.35);
      shafts = shaft * shaftFall * (0.35 + mist * 0.9);
    }

    // The key itself, falling off quadratically.
    float key = 1.0 - clamp(distLight * 0.72, 0.0, 1.0);
    key = pow(key, 2.4);

    float luma = mist * 0.40 + key * 0.42 + shafts * 0.55;

    // Vignette — closes the frame without crushing the corners to pure black.
    float vignette = smoothstep(1.42, 0.24, length(p));
    luma *= 0.26 + vignette * 0.88;

    // A shoulder rather than a clamp: the highlights roll off instead of
    // flattening into a disc around the key.
    luma = luma / (1.0 + luma * 0.55);

    // Fine grain at ~1.8%: enough to break up gradient banding on 8-bit panels,
    // far below the threshold where it reads as noise.
    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.018;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));

    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0));
  }
`;
