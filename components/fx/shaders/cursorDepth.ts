/**
 * cursorDepth.ts — GLSL shaders for a cursor-driven depth-of-field shimmer.
 *
 * Fragments near uCursor are brighter and sharper; fragments farther away
 * receive subtle darkening and a very mild blur approximation (luminance
 * falloff).  The effect is intended as a screen-space overlay quad.
 *
 * Monochrome palette: all colour enters via the uColor uniform.
 */

export const cursorDepthVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cursorDepthFragment = /* glsl */ `
  precision highp float;

  uniform vec2  uCursor;
  uniform float uTime;
  uniform vec3  uColor;

  varying vec2 vUv;

  void main() {
    // distance from this fragment to the cursor position (0…√2 range)
    float dist = distance(vUv, uCursor);

    // --- sharpness / brightness zone: near cursor = bright + sharp ---
    float sharpRadius = 0.12;
    float sharp = 1.0 - smoothstep(0.0, sharpRadius, dist);

    // --- mid zone: soft gradual darkening ---
    float mid = 1.0 - smoothstep(sharpRadius, 0.55, dist);
    mid = mid * 0.55; // mid is dimmer than sharp

    // --- far zone: deep falloff (simulates bokeh darkening) ---
    float farDark = 1.0 - smoothstep(0.5, 1.0, dist);
    farDark = farDark * 0.14;

    // --- subtle breathing pulse on the sharp zone ---
    float breathe = 0.7 + 0.3 * sin(uTime * 1.8 + dist * 4.5);

    float intensity = sharp * 0.75 * breathe
                    + mid
                    + farDark;

    if (intensity < 0.001) discard;

    gl_FragColor = vec4(uColor, intensity);
  }
`;
