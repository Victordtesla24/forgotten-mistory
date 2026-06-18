/**
 * sparkline.ts — hand-authored GLSL for SparklineGL.
 * Monochrome: colour enters via uColor uniform (sourced from lib/palette.ts).
 * Renders a polyline + area-fill + traveling scan node from uniform sample data.
 */

export const SPARK_COUNT = 9;

export const sparklineVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sparklineFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uValues[9];    // normalized sample values (0.14–0.88)
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float lineDist(vec2 a, vec2 b, vec2 p) {
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    vec2 proj = a + t * ab;
    return length(p - proj);
  }

  void main() {
    vec2 uv = vUv;

    // Map samples to UV space (x equally spaced, y from values)
    vec2 samples[9];
    for (int i = 0; i < 9; i++) {
      float x = float(i) / 8.0;
      samples[i] = vec2(x, uValues[i]);
    }

    // --- Area fill ---
    float areaAlpha = 0.0;
    {
      int inside = 0;
      for (int i = 0; i < 9; i++) {
        vec2 a = samples[i];
        vec2 b = samples[min(i + 1, 8)];
        if (((a.y > uv.y) != (b.y > uv.y)) && uv.x < a.x + (uv.y - a.y) * (b.x - a.x) / (b.y - a.y)) {
          inside = 1 - inside;
        }
      }
      if (inside > 0 && uv.y > 0.0) {
        float distAbove = uv.y - 0.0;
        areaAlpha = 1.0 - smoothstep(0.0, 0.88, distAbove);
        areaAlpha *= 0.12;
      }
    }

    // --- Stroke line ---
    float minDist = 1.0;
    for (int i = 0; i < 8; i++) {
      float d = lineDist(samples[i], samples[i + 1], uv);
      minDist = min(minDist, d);
    }
    float strokeAlpha = smoothstep(0.018, 0.0, minDist) * 0.82;

    // --- Scan node ---
    float nodeAlpha = 0.0;
    {
      float nodeX = 1.0;
      float nodeY = uValues[8];
      float dist = length(uv - vec2(nodeX, nodeY));
      // Pulsing glow
      float pulse = 0.7 + 0.3 * sin(uTime * 3.5) * 0.5 + 0.5;
      nodeAlpha = exp(-dist * dist * 420.0) * pulse * 0.9;
      // Outer ring
      float ring = smoothstep(0.042, 0.036, dist) * smoothstep(0.022, 0.03, dist);
      nodeAlpha += ring * 0.4;
    }

    float alpha = areaAlpha + strokeAlpha + nodeAlpha;
    alpha *= smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x);
    alpha *= smoothstep(0.0, 0.04, uv.y) * smoothstep(1.0, 0.96, uv.y);

    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;
