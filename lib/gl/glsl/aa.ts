/**
 * Analytic anti-aliasing: coverage of a hairline from its distance in the shader's own
 * units, using the screen-space derivative, so an edge is one pixel wide at any scale and
 * never shimmers.
 */
export const hairline = /* glsl */ `
float hairline(float distanceFromLine, float widthInPixels) {
  float fw = max(fwidth(distanceFromLine), 1e-6);
  return 1.0 - smoothstep(0.0, fw, abs(distanceFromLine) - 0.5 * widthInPixels * fw);
}
`;
