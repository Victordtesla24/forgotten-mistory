/**
 * The telemetry reading: exactly 10,000 points, one for each concurrent device, filling a
 * lattice column by column, then a line that crosses it in 200 ms, the P95 latency of the
 * figure's scope. Points the line has reached stay lit. A hover or focus sends the line
 * across again. Every point is a real GL point, so the stage's own counters report them.
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

import { points } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, easeOut, readingGlsl, readingMask, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const pointVertex = /* glsl */ `
uniform vec2 uGrid;
uniform float uReveal;
uniform float uTrail;

varying float vLit;
varying float vGlow;

${readingGlsl}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Each device sits inside its own cell of the lattice, a little off its centre, so the field
  // is an even grain at any pixel ratio and never a moire of rows and columns.
  vec2 jitter = vec2(hash(position.xy), hash(position.yx + 7.0)) - 0.5;
  vec2 uv = (position.xy + 0.5 + 0.8 * jitter) / uGrid;
  float passed = uReveal - uv.x;
  vLit = step(0.0, passed);
  vGlow = max(flashBand(uv.x), vLit * exp(-max(passed, 0.0) * 16.0) * uTrail);
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
  float pitch = uSize.x * uPixel / uGrid.x;
  gl_PointSize = clamp(pitch * 0.8, 1.5, 3.0);
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
  float d = length(gl_PointCoord - 0.5);
  float cover = 1.0 - smoothstep(0.15, 0.5, d);
  float strength = mix(0.34, 0.8, vLit) + 0.16 * uLift;
  float alpha = min(strength + 0.5 * vGlow, 1.0) * cover * cornerMask();
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
  const { count, columns, rows, countMs, sweepMs } = points;
  const state = createReadingState('telemetry', context);

  const lattice = new Float32Array(count * 3);
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const at = (column * rows + row) * 3;
      lattice[at] = column;
      lattice[at + 1] = row;
    }
  }
  const dots = new BufferGeometry();
  dots.setAttribute('position', new BufferAttribute(lattice, 3));

  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;
  const dotMaterial = new ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    uniforms: { ...state.uniforms, uGrid: { value: [columns, rows] }, uReveal: { value: 0 }, uTrail: { value: 1 } },
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
