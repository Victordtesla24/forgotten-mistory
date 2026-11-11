/**
 * The portfolio reading: one mark for each of up to 40 practitioners, as one cohort, two rows
 * of twenty on a single baseline. The CV gives the squads (5+) and the largest team (up to
 * 40) but not how the people divide among them, so no squad is drawn. The marks arrive column
 * by column and each grows into place. A hover or focus sends a band of light across them.
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

import { cohort } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, readingGlsl, readingMask, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const COHORT_SHAPE = `
const float COUNT = ${cohort.count.toFixed(1)};
const float COLUMNS = ${cohort.columns.toFixed(1)};
const float ROWS = ${cohort.rows.toFixed(1)};
const float COUNT_MS = ${cohort.countMs.toFixed(1)};

/** The pitch between marks, in CSS pixels, for a view this wide. */
float pitchFor(float width) {
  return clamp(width / 24.0, 9.0, 22.0);
}

/** Where a mark's centre sits, in CSS pixels from the bottom left. */
vec2 markCentre(vec2 mark, float width, float height) {
  float pitch = pitchFor(width);
  float x = width * 0.5 + (mark.x - (COLUMNS - 1.0) * 0.5) * pitch;
  float y = height * 0.5 + (mark.y - (ROWS - 1.0) * 0.5) * pitch;
  return vec2(x, y);
}

float bornAt(vec2 mark) {
  return (mark.x * ROWS + mark.y) / COUNT * COUNT_MS;
}
`;

const markVertex = /* glsl */ `
varying float vPop;
varying float vAcross;

${readingGlsl}
${COHORT_SHAPE}

void main() {
  vec2 centre = markCentre(position.xy, uSize.x, uSize.y);
  vPop = easeOut((uT - bornAt(position.xy)) / 200.0);
  vAcross = centre.x / uSize.x;
  gl_Position = vec4(centre / uSize * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = pitchFor(uSize.x) * 0.62 * uPixel * vPop;
}
`;

const markFragment = /* glsl */ `
uniform vec3 uProof;
uniform vec3 uAccent;

varying float vPop;
varying float vAcross;

${readingGlsl}
${readingMask}
${finish}

void main() {
  vec2 p = abs(gl_PointCoord - 0.5) * 2.0;
  float radius = 0.28;
  vec2 q = p - (1.0 - radius);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float cover = 1.0 - smoothstep(-0.05, 0.08, d);
  float flash = flashBand(vAcross);
  float alpha = min((0.86 + 0.14 * uLift) * vPop + 0.2 * flash, 1.0) * cover * cornerMask();
  gl_FragColor = writePixel(mix(uProof, uAccent, 0.7 * flash), alpha);
}
`;

const baseVertex = /* glsl */ `
attribute float aSide;

varying float vPop;

${readingGlsl}
${COHORT_SHAPE}

void main() {
  float pitch = pitchFor(uSize.x);
  float x = uSize.x * 0.5 + (aSide - 0.5) * pitch * (COLUMNS + 0.4);
  float y = uSize.y * 0.5 - ROWS * 0.5 * pitch - 0.45 * pitch;
  vPop = easeOut(uT / 200.0);
  gl_Position = vec4(vec2(x, floor(y) + 0.5) / uSize * 2.0 - 1.0, 0.0, 1.0);
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
  const { count, columns, rows, countMs } = cohort;
  const state = createReadingState('portfolio', context);

  const marks = new Float32Array(count * 3);
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      marks.set([column, row, 0], (column * rows + row) * 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(marks, 3));

  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;
  const markMaterial = new ShaderMaterial({
    vertexShader: markVertex,
    fragmentShader: markFragment,
    uniforms: { ...state.uniforms },
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
    uniforms: { ...state.uniforms },
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
