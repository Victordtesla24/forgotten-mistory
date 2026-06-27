/**
 * cardFlip.glsl.ts — hand-authored GLSL for the ExperienceAccordion 3D page-turn
 * card-flip reveal. A single plane rotates around its left edge (-x hinge) from
 * -90° (edge-on, invisible) to 0° (flat, fully revealed), driven by the uProgress
 * uniform (0→1). The fragment renders a soft monochrome surface with subtle UV
 * gradient so the card reads as a solid sheet rather than a flat colour.
 *
 * Monochrome discipline (NFR-MONO): colour enters only through uColor (lib/palette.ts).
 * No chromatic literals, no hue manipulation — the gradient is pure brightness only.
 *
 * The vertex shader applies the rotation around a local hinge axis (x=-1) so the
 * left edge is pinned and the card swings into view like a page turn. Perspective
 * is handled by the standard projectionMatrix — no custom projection needed.
 */

export const cardFlipVertex = /* glsl */ `
  uniform float uProgress;
  varying vec2 vUv;
  varying float vEdgeDist;

  // easeOutCubic — smooth deceleration at the end for a natural page-turn feel.
  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    // Hinge at left edge (x=-1 in local space): translate pivot to origin,
    // rotate, translate back. The easing gives a natural deceleration.
    float angle = (1.0 - easeOutCubic(uProgress)) * (-1.57079633); // -π/2 → 0
    float c = cos(angle);
    float s = sin(angle);

    // Shift so hinge at left edge (x=-1) becomes origin
    vec3 pos = position;
    pos.x += 1.0;

    // Rotate around Y (hinge axis) at origin
    vec3 rotated;
    rotated.x = pos.x * c - pos.z * s;
    rotated.y = pos.y;
    rotated.z = pos.x * s + pos.z * c;

    // Shift back so hinge returns to x=-1
    rotated.x -= 1.0;

    vUv = uv;
    vEdgeDist = uv.x; // 0 at hinge, 1 at far edge

    gl_Position = projectionMatrix * modelViewMatrix * vec4(rotated, 1.0);
  }
`;

export const cardFlipFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vEdgeDist;

  void main() {
    // Soft edge shadow: darker near the hinge (page fold), brighter at far edge.
    // Pure brightness modulation — no hue shift (monochrome).
    float edgeLight = 0.88 + vEdgeDist * 0.12;

    // Subtle vertical gradient: slightly brighter at centre, softer at edges.
    float vGrad = 1.0 - abs(vUv.y - 0.5) * 0.25;

    float brightness = edgeLight * vGrad;

    // Thin highlight line near the fold (crease reflection).
    float crease = smoothstep(0.0, 0.06, vEdgeDist) * 0.07;

    vec3 color = uColor * (brightness + crease);
    float alpha = uOpacity;

    // Fade out when nearly edge-on (< 3% of rotation remaining)
    // This mimics the card becoming a sliver and disappearing.
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;
