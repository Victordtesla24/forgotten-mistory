/**
 * celestialOrbit.glsl.ts — orbit-trail fragment shader for the Jyotish/astro
 * cluster signature scene (CelestialSphere, SPEC §7 #8).
 *
 * Slow monochrome ephemeris trails that orbit a central sphere at varying
 * radii and inclination angles. Multiple orbit planes are rendered as
 * luminous, decaying trails — a celestial mechanics visual.
 *
 * Monochrome discipline (NFR-MONO): colour from uColorSteel only.
 */

export const celestialOrbitVertex = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const celestialOrbitFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uOrbitSpeed;
  uniform vec3  uColorSteel; // sourced from lib/palette.ts (NFR-MONO)
  varying vec2  vUv;

  #define TAU 6.28318530718
  #define ORBIT_COUNT 5

  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float ang = atan(p.y, p.x);

    float a = 0.0;

    // Multiple orbit rings at different radii, each with its own inclination illusion
    // (modulated by sin of the angle so they read as elliptical orbits seen edge-on).
    for (int i = 0; i < ORBIT_COUNT; i++) {
      float fi = float(i);
      float orbitR = 0.15 + fi * 0.14;               // orbit radius grows outward
      float inclination = 0.3 + fi * 0.12;            // each orbit has a different tilt
      float effectiveR = r / (1.0 + inclination * abs(sin(ang + fi * 0.8)) * 0.4);

      // Ring at this effective radius
      float ring = smoothstep(0.016, 0.0, abs(effectiveR - orbitR));
      // Fade toward centre and edge
      ring *= smoothstep(0.04, 0.1, r) * smoothstep(0.92, 0.82, r);
      a += ring * (0.3 + 0.15 * sin(fi * 2.1));
    }

    // Orbiting body (a luminous dot that travels the outermost orbit).
    float bodyAngle = mod(uTime * uOrbitSpeed * 0.3, TAU);
    vec2 bodyPos = vec2(cos(bodyAngle), sin(bodyAngle)) * 0.71;
    float bodyDist = length(p - bodyPos);
    float body = smoothstep(0.03, 0.0, bodyDist) * 1.2;
    // Trail behind the body
    float trailAngle = mod(uTime * uOrbitSpeed * 0.3 - 0.3, TAU);
    for (int j = 0; j < 8; j++) {
      float fj = float(j);
      float trailAng = bodyAngle - (fj + 1.0) * 0.06;
      vec2 trailPos = vec2(cos(trailAng), sin(trailAng)) * 0.71;
      float d = length(p - trailPos);
      float decay = 1.0 - fj / 8.0;
      a += smoothstep(0.022, 0.0, d) * decay * 0.55;
    }
    a += body;

    // Faint background star motes (nakshatra points).
    float hashVal = fract(sin(dot(floor(vUv * 42.0), vec2(12.9898, 78.233))) * 43758.5453);
    a += step(0.997, hashVal) * 0.22;

    a *= 0.78;
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColorSteel, clamp(a, 0.0, 1.0));
  }
`;
