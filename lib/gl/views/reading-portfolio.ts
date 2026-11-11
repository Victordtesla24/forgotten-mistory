/**
 * The portfolio reading: one mark for each of up to 40 practitioners across 5+ squads, drawn
 * as one run of two rows of twenty on a single baseline; the CV gives no squad sizes, so no
 * squad is drawn. The marks arrive column by column and each grows into place. A hover or
 * focus sends a band of light across them. Their layout is `readingLayout`'s, in whole device
 * pixels, the same the DOM drawing takes.
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

import { cohort, readingLayout } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, readingGlsl, readingMask, tileOf, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const COHORT_SHAPE = `
const float COUNT = ${cohort.count.toFixed(1)};
const float COUNT_MS = ${cohort.countMs.toFixed(1)};

uniform vec2 uFrame;
uniform float uPitch;
uniform float uMark;

/** Where a mark's centre sits, in device pixels from the tile's top left: mark.x is its column, mark.y its row. */
vec2 markCentre(vec2 mark) {
  return uFrame + mark * uPitch + 0.5 * uMark;
}

float bornAt(vec2 mark) {
  return (mark.x * ${cohort.down.toFixed(1)} + mark.y) / COUNT * COUNT_MS;
}
`;

const markVertex = /* glsl */ `
attribute vec2 aMark;

varying float vPop;
varying float vAcross;

${readingGlsl}
${COHORT_SHAPE}

void main() {
  vec2 device = floor(uSize * uPixel + 0.5);
  vec2 centre = markCentre(aMark);
  vPop = easeOut((uT - bornAt(aMark)) / 200.0);
  vAcross = centre.x / device.x;
  gl_Position = vec4(vec2(centre.x, device.y - centre.y) / device * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uMark * vPop;
}
`;

const markFragment = /* glsl */ `
uniform vec3 uProof;
uniform vec3 uAccent;
uniform float uMark;

varying float vPop;
varying float vAcross;

${readingGlsl}
${readingMask}
${finish}

void main() {
  // A rounded square, its corners no rounder than two device pixels, so a small mark stays a crisp square.
  vec2 p = abs(gl_PointCoord - 0.5) * uMark * vPop;
  float radius = min(2.0, 0.18 * uMark);
  vec2 q = p - (0.5 * uMark * vPop - radius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float cover = clamp(0.5 - d, 0.0, 1.0);
  float flash = flashBand(vAcross);
  float alpha = min((0.86 + 0.14 * uLift) * vPop + 0.2 * flash, 1.0) * cover * cornerMask();
  gl_FragColor = writePixel(mix(uProof, uAccent, 0.7 * flash), alpha);
}
`;

const baseVertex = /* glsl */ `
attribute float aSide;

uniform vec3 uBaseline;

varying float vPop;

${readingGlsl}

void main() {
  vec2 device = floor(uSize * uPixel + 0.5);
  float x = uBaseline.x + aSide * uBaseline.z;
  vPop = easeOut(uT / 200.0);
  gl_Position = vec4(vec2(x, device.y - uBaseline.y - 0.5) / device * 2.0 - 1.0, 0.0, 1.0);
}
`;

const baseFragment = /* glsl */ `
uniform vec3 uLineStrong;

varying float vPop;

${readingGlsl}
${readingMask}
${finish}

void main() {
  gl_FragColor = writePixel(uLineStrong, 0.9 * vPop * cornerMask());
}
`;

/** Creates the portfolio reading. */
export function createReadingPortfolio(context: ViewContext): View {
  const { count, across, down, countMs } = cohort;
  const state = createReadingState('portfolio', context);

  // Column by column: the order they arrive in.
  const marks = new Float32Array(count * 2);
  for (let column = 0; column < across; column += 1) {
    for (let row = 0; row < down; row += 1) marks.set([column, row], (column * down + row) * 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aMark', new BufferAttribute(marks, 2));

  const frame = { uFrame: { value: [0, 0] }, uPitch: { value: 1 }, uMark: { value: 1 } };
  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;
  const markMaterial = new ShaderMaterial({
    vertexShader: markVertex,
    fragmentShader: markFragment,
    uniforms: { ...state.uniforms, ...frame },
    ...flags,
  });
  const crowd = new Points(geometry, markMaterial);
  crowd.frustumCulled = false;
  crowd.renderOrder = 2;

  const baseline = new BufferGeometry();
  baseline.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
  baseline.setAttribute('aSide', new BufferAttribute(new Float32Array([0, 1]), 1));
  const baseMaterial = new ShaderMaterial({
    vertexShader: baseVertex,
    fragmentShader: baseFragment,
    uniforms: { ...state.uniforms, ...frame, uBaseline: { value: [0, 0, 1] } },
    ...flags,
  });
  const ground = new LineSegments(baseline, baseMaterial);
  ground.frustumCulled = false;
  ground.renderOrder = 1;

  const backdrop = createBackdrop(state);
  const scene = new Scene();
  scene.add(backdrop.mesh, ground, crowd);
  const camera = createCamera();
  context.element.dataset.drawn = String(count);

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, busy } = state.step(input);
      const layout = readingLayout('portfolio', tileOf(input));
      frame.uFrame.value = [layout.frame.x, layout.frame.y];
      frame.uPitch.value = layout.pitch;
      frame.uMark.value = layout.mark;
      baseMaterial.uniforms.uBaseline.value = [layout.baseline.x, layout.baseline.y, layout.baseline.width];
      geometry.setDrawRange(0, Math.ceil(count * unit(t / countMs)));
      return busy;
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
      geometry.dispose();
      baseline.dispose();
      markMaterial.dispose();
      baseMaterial.dispose();
    },
  };
}
