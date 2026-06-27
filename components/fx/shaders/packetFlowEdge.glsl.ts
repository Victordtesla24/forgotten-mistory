/**
 * packetFlowEdge.glsl.ts — vertex-displacement + fragment shader for the
 * WebSocket packet-flow signature scene (PacketFlowGraph, SPEC §7 #2).
 * Energy particles travel along graph edges with a glow pulse; the P95
 * readout drives the flow speed uniform so the visualisation stays evidence-led.
 *
 * Monochrome discipline (NFR-MONO): all colour comes from uColorStroke
 * (sourced from lib/palette.ts) — no chromatic literals.
 */

export const packetFlowVertex = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFlow;
  varying vec2 vUv;
  varying float vDistortion;

  // Simple displacement along edges — energy ripple that travels with uFlow.
  void main() {
    vUv = uv;
    float wave = sin(uv.x * 12.0 + uTime * uFlow * 3.0) * 0.025;
    vDistortion = abs(wave) * 40.0;
    vec3 pos = position + normal * wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const packetFlowEdgeFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFlow;
  uniform float uP95;
  uniform vec3  uColorStroke; // sourced from lib/palette.ts (NFR-MONO)
  varying vec2  vUv;
  varying float vDistortion;

  #define TAU 6.28318530718

  void main() {
    // Base edge — a steady hairline that fades at the terminals.
    float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x);
    edge *= smoothstep(0.0, 0.15, vUv.y) * smoothstep(0.0, 0.15, 1.0 - vUv.y);

    // Travelling energy packet — a luminous pulse that starts at x=0 and sweeps to x=1,
    // wrapping every ~2 s modulated by uFlow (which is fed from real telemetry readout).
    float packetPhase = mod(uTime * uFlow * 0.7, 1.0);
    float packet = exp(-pow((vUv.x - packetPhase) * 6.0, 2.0)); // Gaussian bell centred on the packet
    packet *= 0.85;

    // Secondary pulse trailing behind the main packet (the wake).
    float trailPhase = mod(uTime * uFlow * 0.7 - 0.15, 1.0);
    float trail = exp(-pow((vUv.x - trailPhase) * 4.5, 2.0)) * 0.35;

    // Data-thickness glow — broader at the P95 readout area (mid-span).
    float thickness = 0.02 + uP95 / 2000.0; // wider when P95 is high
    float core = smoothstep(thickness, 0.0, abs(vUv.y - 0.5));

    // Compose: base edge + travelling packet + trail + distortion shimmer.
    float a = (edge * 0.25 + packet + trail + vDistortion * 0.03) * core;
    a *= 0.85;
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColorStroke, clamp(a, 0.0, 1.0));
  }
`;
