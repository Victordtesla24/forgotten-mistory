/**
 * The telemetry reading: exactly 10,000 points, one for each concurrent device, in 100 blocks
 * of 100, filling the lattice from left to right, then a line that crosses it in 200 ms, the
 * P95 latency of the figure's scope. Points the line has reached stay lit. A hover or focus
 * sends the line across again. The pitch is a whole number of device pixels and every point
 * sits on a pixel, with no jitter, so the lattice is crisp at any ratio and never moires.
 * Every point is a real GL point, so the stage's own counters report them.
 */

import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Points,
  Scene,
  ShaderMaterial,
  type WebGLRenderer,
} from 'three';

import { points, pointPitch, pointSize } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, easeOut, readingGlsl, readingMask, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const pointVertex = /* glsl */ `
uniform vec2 uLattice;
uniform float uPitch;
uniform float uDot;
uniform float uReveal;
uniform float uTrail;

varying float vLit;
varying float vGlow;

${readingGlsl}

void main() {
  // The lattice is centred in the tile on whole device pixels; each dot sits in the middle of
  // its own pitch cell, so every point lands on a pixel and nothing is resampled.
  vec2 device = floor(uSize * uPixel + 0.5);
  vec2 origin = floor((device - uLattice * uPitch) * 0.5);
  float inset = floor((uPitch - uDot) * 0.5);
  vec2 corner = origin + position.xy * uPitch + inset;
  vec2 centre = vec2(corner.x, device.y - corner.y) + vec2(uDot * 0.5, -uDot * 0.5);
  float across = centre.x / device.x;
  float passed = uReveal - across;
  vLit = step(0.0, passed);
  vGlow = max(flashBand(across), vLit * exp(-max(passed, 0.0) * 16.0) * uTrail);
  gl_Position = vec4(centre / device * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uDot;
}
`;

const pointFragment = /* glsl */ `
uniform vec3 uProof;
uniform vec3 uAccent;

varying float vLit;
varying float vGlow;

${readingGlsl}
${readingMask}
${finish}

void main() {
  float strength = mix(0.4, 0.86, vLit) + 0.14 * uLift;
  float alpha = min(strength + 0.5 * vGlow, 1.0) * cornerMask();
  gl_FragColor = writePixel(mix(uProof, uAccent, 0.8 * vGlow), alpha);
}
`;

const lineVertex = /* glsl */ `
uniform float uX;

${readingGlsl}

void main() {
  float x = min(uX, 1.0 - 1.0 / uSize.x);
  gl_Position = vec4(x * 2.0 - 1.0, position.y, 0.0, 1.0);
}
`;

const lineFragment = /* glsl */ `
uniform vec3 uAccent;
uniform float uAlpha;

${readingGlsl}
${readingMask}
${finish}

void main() {
  gl_FragColor = writePixel(uAccent, uAlpha * cornerMask());
}
`;

/** The light the line leaves behind it fades over this long once it has crossed. */
const TRAIL_MS = 240;

/** Creates the telemetry reading. */
export function createReadingTelemetry(context: ViewContext): View {
  const { count, countMs, sweepMs } = points;
  const state = createReadingState('telemetry', context);

  // Left to right, so the fill wipes across like the DOM's: a point exists wherever neither its
  // column nor its row is one of the gutters between blocks.
  const lattice = new Float32Array(count * 3);
  const gutter = points.side;
  const stride = points.side + 1;
  let at = 0;
  for (let column = 0; column < points.columns; column += 1) {
    if (column % stride === gutter) continue;
    for (let row = 0; row < points.rows; row += 1) {
      if (row % stride === gutter) continue;
      lattice[at] = column;
      lattice[at + 1] = row;
      at += 3;
    }
  }
  const dots = new BufferGeometry();
  dots.setAttribute('position', new BufferAttribute(lattice, 3));

  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;
  const dotMaterial = new ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    uniforms: {
      ...state.uniforms,
      uLattice: { value: [points.columns, points.rows] },
      uPitch: { value: 1 },
      uDot: { value: 1 },
      uReveal: { value: 0 },
      uTrail: { value: 1 },
    },
    ...flags,
  });
  const cloud = new Points(dots, dotMaterial);
  cloud.frustumCulled = false;
  cloud.renderOrder = 1;

  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array([0, -1, 0, 0, 1, 0]), 3));
  const lineMaterial = new ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    uniforms: { ...state.uniforms, uX: { value: 1 }, uAlpha: { value: 0 } },
    ...flags,
  });
  const line = new LineSegments(lineGeometry, lineMaterial);
  line.frustumCulled = false;
  line.renderOrder = 2;

  const backdrop = createBackdrop(state);
  const scene = new Scene();
  scene.add(backdrop.mesh, cloud, line);
  const camera = createCamera();
  context.element.dataset.drawn = String(count);

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, flash, busy } = state.step(input);
      const pitch = pointPitch(Math.round(input.viewport.width * input.pixelRatio), Math.round(input.viewport.height * input.pixelRatio));
      dotMaterial.uniforms.uPitch.value = pitch;
      dotMaterial.uniforms.uDot.value = pointSize(pitch);
      dots.setDrawRange(0, Math.round(count * easeOut(t / countMs)));

      const reveal = unit((t - countMs) / sweepMs);
      const crossing = flash < 1;
      dotMaterial.uniforms.uReveal.value = reveal;
      dotMaterial.uniforms.uTrail.value = 1 - unit((t - countMs - sweepMs) / TRAIL_MS);
      lineMaterial.uniforms.uX.value = crossing ? unit(flash) : reveal;
      const moving = crossing || (t > countMs && reveal < 1);
      lineMaterial.uniforms.uAlpha.value = t < countMs ? 0 : moving ? 0.95 : 0.4 + 0.3 * state.uniforms.uLift.value;
      return busy || t < countMs + sweepMs + TRAIL_MS;
    },

    render(renderer: WebGLRenderer): void {
      renderer.render(scene, camera);
    },

    setTier(tier: LiveTier): void {
      context.tier = tier;
    },

    dispose(): void {
      delete context.element.dataset.drawn;
      backdrop.dispose();
      dots.dispose();
      lineGeometry.dispose();
      dotMaterial.dispose();
      lineMaterial.dispose();
    },
  };
}
