/**
 * Hero atmosphere — a single full-screen fragment program.
 *
 * One draw call, no geometry, no textures: the entire hero backdrop is computed
 * per pixel. The image is deliberately almost still — layered mist strata over a
 * low horizon, lit from high left, drifting at three different speeds so the
 * parallax reads as depth rather than as movement. Nothing pulses, nothing
 * sweeps, nothing announces itself.
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
  uniform vec3 uInk;         // deep background ink
  uniform vec3 uLight;       // luminous accent

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

  void main() {
    vec2 uv = vUv;
    // Aspect-corrected coordinates centred on the frame.
    vec2 p = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

    // Pointer parallax is deliberately tiny — a few pixels of drift. It should
    // register as the room breathing, never as an effect responding to input.
    vec2 parallax = uPointer * 0.035;

    // Three mist strata at different depths and speeds.
    float t = uTime * 0.012;
    float far = fbm(p * 1.6 + vec2(t, -t * 0.35) + parallax * 0.30);
    float mid = fbm(p * 2.9 - vec2(t * 1.7, t * 0.5) + parallax * 0.65);
    float near = fbm(p * 5.3 + vec2(t * 2.6, -t * 0.9) + parallax * 1.00);

    float mist = far * 0.55 + mid * 0.32 + near * 0.13;

    // A low horizon: density gathers toward the bottom of the frame and thins
    // out above, the way air does over a plain at night.
    float horizon = smoothstep(0.95, -0.15, uv.y);
    mist *= 0.35 + horizon * 0.85;

    // Key light, high and to the left, falling off quadratically.
    vec2 lightPos = vec2(-0.42, 0.34) + parallax * 0.5;
    float key = 1.0 - clamp(length(p - lightPos) * 0.78, 0.0, 1.0);
    key = pow(key, 2.6);

    float luma = mist * 0.42 + key * 0.30;

    // Vignette — closes the frame without crushing the corners to pure black.
    float vignette = smoothstep(1.35, 0.28, length(p));
    luma *= 0.35 + vignette * 0.75;

    // Fine grain at ~1.5%: enough to break up gradient banding on 8-bit panels,
    // far below the threshold where it reads as noise.
    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.015;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));

    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0));
  }
`;
