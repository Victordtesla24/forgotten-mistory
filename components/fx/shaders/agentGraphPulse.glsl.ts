/**
 * agentGraphPulse.glsl.ts — edge-pulse fragment shader for the multi-agent
 * orchestration graph signature scene (OrchestrationGraph, SPEC §7 #12).
 *
 * Renders a stylised node graph where edges pulse in a coordinated cascade
 * (agent-to-agent message propagation) and active edges glow brighter.
 *
 * Monochrome discipline (NFR-MONO): colour from uColorStroke only.
 */

export const agentGraphVertex = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const agentGraphPulseFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uActiveEdge;   // 0..1 — which edges are active
  uniform vec3  uColorStroke; // sourced from lib/palette.ts (NFR-MONO)
  varying vec2  vUv;

  #define TAU 6.28318530718
  #define NODE_COUNT 6

  // 2D hash for node positions (deterministic, not random per frame).
  float hash21(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
  }

  void main() {
    vec2 p = vUv;
    float a = 0.0;

    // Generate node positions deterministically from uv-space.
    // Each node gets a fixed 2D position based on its index.
    vec2 nodes[NODE_COUNT];
    for (int i = 0; i < NODE_COUNT; i++) {
      float fi = float(i);
      float angle = (fi / float(NODE_COUNT)) * TAU - 1.2;
      float radius = 0.28 + hash21(vec2(fi * 0.37, 0.0)) * 0.18;
      nodes[i] = vec2(0.5, 0.5) + vec2(cos(angle), sin(angle)) * radius;
    }

    // Draw each node as a small luminous dot.
    for (int i = 0; i < NODE_COUNT; i++) {
      float d = length(p - nodes[i]);
      float nodeGlow = smoothstep(0.04, 0.0, d);
      // Nodes pulse gently in a wave.
      float pulse = 0.6 + 0.4 * sin(uTime * 2.5 + float(i) * 1.7);
      a += nodeGlow * pulse * 0.65;
    }

    // Draw edges between nodes — each edge carries a travelling pulse.
    // Build a cycle: 0→1, 1→2, 2→3, 3→4, 4→5, 5→0
    for (int i = 0; i < NODE_COUNT; i++) {
      int j = (i + 1) % NODE_COUNT;
      vec2 from = nodes[i];
      vec2 to   = nodes[j];

      // Distance from p to the line segment from->to.
      vec2 dir = to - from;
      float len = length(dir);
      if (len < 0.001) continue;
      vec2 ndir = dir / len;
      float t = clamp(dot(p - from, ndir), 0.0, len);
      vec2 closest = from + ndir * t;
      float distToEdge = length(p - closest);

      // Hairline edge.
      float edge = smoothstep(0.008, 0.0, distToEdge) * 0.12;
      // Fade at endpoints.
      edge *= smoothstep(0.0, 0.04, t) * smoothstep(0.0, 0.04, len - t);
      a += edge;

      // Travelling pulse along this edge (cascading agent message).
      float pulsePhase = mod(uTime * 1.3 + float(i) * 0.5, 1.0);
      float pulsePos = pulsePhase * len;
      float pulseDist = abs(t - pulsePos);
      float pulse = exp(-pulseDist * pulseDist * 80.0) * 0.55;
      // Active edges glow brighter.
      float active = uActiveEdge > 0.5 ? 1.0 : 0.4;
      a += pulse * active * smoothstep(0.012, 0.0, distToEdge);
    }

    // Coordinated cascade: a wave of brightness that sweeps all edges.
    float cascade = 0.5 + 0.5 * sin(uTime * 0.8 + p.x * 4.5 + p.y * 3.2);
    a *= 0.6 + 0.4 * cascade;

    a *= 0.82;
    if (a < 0.001) discard;
    gl_FragColor = vec4(uColorStroke, clamp(a, 0.0, 1.0));
  }
`;
