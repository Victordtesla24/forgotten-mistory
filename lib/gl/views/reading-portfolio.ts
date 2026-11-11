/**
 * The portfolio reading: one mark for each of up to 40 practitioners, in five squads, each
 * two marks wide and four tall on its own baseline. The squads arrive one after another, and
 * each mark grows into place. A hover or focus sends a band of light across them.
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

import { squads } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, readingGlsl, readingMask, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const SQUAD_SHAPE = `
const float GROUPS = ${squads.groups.toFixed(1)};
const float PER_GROUP = ${squads.perGroup.toFixed(1)};
const float COLUMNS = ${squads.columns.toFixed(1)};
const float ROWS = ${squads.rows.toFixed(1)};
const float COUNT_MS = ${squads.countMs.toFixed(1)};

/** The pitch between marks, in CSS pixels, for a view this wide. */
float pitchFor(float width) {
  return clamp(width / 28.0, 11.0, 18.0);
}

/** Where a mark's centre sits, in CSS pixels from the bottom left. */
vec2 markCentre(vec3 mark, float width, float height) {
  float pitch = pitchFor(width);
  float x = (mark.x + 0.5) / GROUPS * width + (mark.y - (COLUMNS - 1.0) * 0.5) * pitch;
  float y = height * 0.5 + (mark.z - (ROWS - 1.0) * 0.5) * pitch;
  return vec2(x, y);
}

float bornAt(vec3 mark) {
  return (mark.x * PER_GROUP + mark.y * ROWS + mark.z) / (GROUPS * PER_GROUP) * COUNT_MS;
}
`;

const markVertex = /* glsl */ `
varying float vPop;
varying float vAcross;

${readingGlsl}
${SQUAD_SHAPE}

void main() {
  vec2 centre = markCentre(position, uSize.x, uSize.y);
  vPop = easeOut((uT - bornAt(position)) / 200.0);
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
${SQUAD_SHAPE}

void main() {
  float pitch = pitchFor(uSize.x);
  float x = (position.x + 0.5) / GROUPS * uSize.x + (aSide - 0.5) * pitch * COLUMNS * 1.15;
  float y = uSize.y * 0.5 - ROWS * 0.5 * pitch - 0.45 * pitch;
  vPop = easeOut((uT - position.x / GROUPS * COUNT_MS) / 200.0);
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
  const { count, groups, perGroup, columns, rows } = squads;
  const state = createReadingState('portfolio', context);

  const marks = new Float32Array(count * 3);
  for (let group = 0; group < groups; group += 1) {
    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        marks.set([group, column, row], (group * perGroup + column * rows + row) * 3);
      }
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
  const cluster = new Points(geometry, markMaterial);
  cluster.frustumCulled = false;
  cluster.renderOrder = 2;

  const feet = new Float32Array(groups * 2 * 3);
  const side = new Float32Array(groups * 2);
  for (let group = 0; group < groups; group += 1) {
    feet.set([group, 0, 0, group, 0, 0], group * 6);
    side.set([0, 1], group * 2);
  }
  const baselines = new BufferGeometry();
  baselines.setAttribute('position', new BufferAttribute(feet, 3));
  baselines.setAttribute('aSide', new BufferAttribute(side, 1));
  const baseMaterial = new ShaderMaterial({
    vertexShader: baseVertex,
    fragmentShader: baseFragment,
    uniforms: { ...state.uniforms },
    ...flags,
  });
  const ground = new LineSegments(baselines, baseMaterial);
  ground.frustumCulled = false;
  ground.renderOrder = 1;

  const backdrop = createBackdrop(state);
  const scene = new Scene();
  scene.add(backdrop.mesh, ground, cluster);
  const camera = createCamera();
  context.element.dataset.drawn = String(count);
  context.element.dataset.drawnGroups = String(groups);

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, busy } = state.step(input);
      geometry.setDrawRange(0, Math.ceil(count * unit(t / squads.countMs)));
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
      delete context.element.dataset.drawnGroups;
      backdrop.dispose();
      geometry.dispose();
      baselines.dispose();
      markMaterial.dispose();
      baseMaterial.dispose();
    },
  };
}
