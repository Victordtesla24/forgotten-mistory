/**
 * Experience strata — sediment, not data.
 *
 * An earlier version of this scene drew the roles as 3D bars alongside the DOM
 * chart. Two drawings of the same eight spans, in two coordinate systems that
 * could not be kept in agreement, read as a rendering bug: bars appeared
 * doubled and slightly offset. Worse, it made a reader wonder which one was
 * right.
 *
 * So the scene stopped competing. The DOM chart is the data — real percentages
 * on a real axis, legible to a screen reader and correct with no WebGL at all.
 * This shader draws what is behind it: fine horizontal strata, like a section
 * cut through sediment, drifting slowly at different depths. It encodes
 * nothing, and is written not to look as though it does.
 */

export const strataVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = gl_Position.xy * 0.5 + 0.5;
  }
`;

export const strataFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
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
    vec2 uv = vUv;
    vec2 parallax = uPointer * 0.02;

    // Layers: each band is a slow horizontal smear, wider apart toward the
    // bottom of the frame so the field reads as receding rather than tiled.
    float t = uTime * 0.008;
    float bands = 0.0;
    for (int i = 0; i < 3; i++) {
      float depth = float(i) + 1.0;
      float y = uv.y * (7.0 + depth * 4.0) + parallax.y * depth;
      float drift = noise(vec2(uv.x * 2.0 + t * depth, floor(y))) ;
      // A thin line at each band boundary, softened by the drift value.
      float line = smoothstep(0.94, 1.0, fract(y + drift * 0.35));
      bands += line * (0.34 / depth);
    }

    // Horizon falloff: the field thins toward the top, where the heading sits.
    float fade = smoothstep(1.05, 0.1, uv.y);
    float luma = bands * fade * 0.34;

    // Dissolve at all four edges. Without this the canvas rectangle itself is
    // visible as a faintly lighter box against the page — the scene has to end
    // somewhere, and it must not be anywhere a reader can find.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.16), uv)
              * smoothstep(vec2(0.0), vec2(0.16), 1.0 - uv);
    luma *= edge.x * edge.y;

    // A wide, very soft key from the left so the strata are not evenly lit.
    vec2 p = (uv - vec2(0.18, 0.5)) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    float key = pow(1.0 - clamp(length(p) * 0.5, 0.0, 1.0), 2.2);
    luma += key * 0.07 * edge.x * edge.y;

    float grain = (hash(uv * uResolution + fract(uTime)) - 0.5) * 0.012;

    vec3 colour = mix(uInk, uLight, clamp(luma + grain, 0.0, 1.0));
    gl_FragColor = vec4(colour, clamp(uIntensity, 0.0, 1.0) * 0.85);
  }
`;
