/**
 * materializeParticles.ts — hand-authored GLSL for the FloatingDetailBox 3D particle
 * materialization. Each point travels a real 3D trajectory from its start (scattered
 * around the originating card) to a target shell around the panel centre, eased and
 * staggered per-particle, brightest mid-flight and gone as it merges.
 *
 * `position` carries the start point; `aTarget` the destination. `uProgress` (0..1)
 * drives the convergence; `uTime` adds a faint orbital wobble. Additive, soft, round
 * points read as a volumetric glow (transparent-layer bloom). Colour is the palette
 * `uColor` uniform only — monochrome.
 */

export const materializeVertex = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aSeed;
  attribute float aSize;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    float phase = aSeed * 0.30;                       // staggered departure
    float local = clamp((uProgress - phase) / (1.0 - phase), 0.0, 1.0);
    float e = easeOutCubic(local);

    vec3 pos = mix(position, aTarget, e);
    float wob = (1.0 - e) * 0.06;
    pos.x += sin(uTime * 2.0 + aSeed * 6.2831853) * wob;
    pos.y += cos(uTime * 1.7 + aSeed * 6.2831853) * wob;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    vAlpha = sin(local * 3.14159265) * 0.9;           // brightest mid-flight
    gl_PointSize = aSize * uPixelRatio * (1.0 + (1.0 - e) * 2.2);
  }
`;

export const materializeFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;
