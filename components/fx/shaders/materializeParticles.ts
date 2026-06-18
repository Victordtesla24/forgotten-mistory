/**
 * materializeParticles.ts — hand-authored GLSL for DetailMaterialize.
 * Monochrome: colour enters via uColor uniform (sourced from lib/palette.ts).
 * Instanced particles: each vertex receives a progress, start/end positions, and renders as a soft point.
 */

export const materializeVertex = /* glsl */ `
  uniform float uProgress;    // 0→1 animation progress
  uniform float uTime;
  uniform float uAspect;
  attribute vec3 aStart;      // origin position (world space, pre-conversion)
  attribute vec3 aEnd;        // target position
  attribute float aPhase;     // per-particle phase (0..1)
  attribute float aSize;      // per-particle size
  varying float vAlpha;
  varying float vProgress;

  // Cubic bezier-like ease: particles arc outward mid-flight
  vec3 bezierEase(vec3 a, vec3 b, float t) {
    float localT = clamp((t - aPhase) / max(0.001, 1.0 - aPhase), 0.0, 1.0);
    // Ease-out cubic
    float e = 1.0 - pow(1.0 - localT, 3.0);
    // Add an arc: particles lift in Z and spread in XY mid-flight
    vec3 mid = mix(a, b, 0.5);
    mid.z += 1.4 * (1.0 - abs(localT - 0.5) * 2.0); // peak at centre
    // Quadratic bezier: a → mid → b
    vec3 c1 = mix(a, mid, e);
    vec3 c2 = mix(mid, b, e);
    return mix(c1, c2, e);
  }

  void main() {
    vec3 pos = bezierEase(aStart, aEnd, uProgress);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float localT = clamp((uProgress - aPhase) / max(0.001, 1.0 - aPhase), 0.0, 1.0);
    // Alpha bell curve: brightest mid-flight, fades at start and end
    vAlpha = sin(localT * 3.14159265) * 0.7;
    vAlpha *= smoothstep(0.0, 0.1, localT) * smoothstep(1.0, 0.9, localT);
    vProgress = localT;

    gl_PointSize = aSize * (80.0 / -mvPosition.z) * (0.5 + 0.5 * vAlpha);
  }
`;

export const materializeFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center) * 2.0;
    // Soft gaussian-like point
    float glow = exp(-d * d * 3.2);
    float core = smoothstep(0.18, 0.0, d);
    float alpha = (glow * 0.5 + core * 0.8) * vAlpha;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
