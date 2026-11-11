/**
 * The finish every view shares: an interleaved-gradient dither that breaks up banding on dark
 * gradients, a still film grain, and the one way a view writes its pixel. Colours are linear
 * in the shader; `colorspace_fragment` encodes them as sRGB before the alpha is applied, so
 * the premultiplied canvas blends exactly the way the page's own colours do.
 */
export const finish = /* glsl */ `
float interleavedNoise(vec2 pixel) {
  return fract(52.9829189 * fract(dot(pixel, vec2(0.06711056, 0.00583715))));
}

float grain(vec2 pixel) {
  return fract(sin(dot(pixel, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}

vec4 writePixel(vec3 color, float alpha) {
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
  vec3 encoded = gl_FragColor.rgb * alpha;
  float lit = step(0.0004, alpha);
  float noise = (interleavedNoise(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0) * lit;
  return vec4(encoded + noise, alpha + noise);
}
`;
