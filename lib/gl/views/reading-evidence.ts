/**
 * The evidence reading: one cell for each of the 200 SIT scenarios. The cells appear full,
 * then the effort falls away, left to right: about 92% of the cells empty, the ≈92% of the
 * figure, and the rest, spread evenly, stay full. All 200 cells stay drawn. A hover or focus
 * sends a band of light across them.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Scene,
  ShaderMaterial,
  type WebGLRenderer,
} from 'three';

import { cells } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, easeOut, readingGlsl, readingMask } from './reading';
import type { FrameInput, View, ViewContext } from './types';

/** The cells sit this far in from the card's edges, in CSS pixels, so none is cut by the card's rounded corners. */
const INSET = { x: 10, y: 6 };

const vertex = /* glsl */ `
attribute vec2 aCell;

uniform vec2 uGrid;

varying vec2 vLocal;
varying vec2 vUv;
varying vec2 vCell;

${readingGlsl}

void main() {
  vLocal = position.xy;
  vCell = aCell;
  vec2 inset = vec2(${INSET.x.toFixed(1)}, ${INSET.y.toFixed(1)}) / uSize;
  vec2 uv = inset + (aCell + position.xy) / uGrid * (1.0 - 2.0 * inset);
  vUv = uv;
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
uniform vec2 uGrid;
uniform vec3 uProof;
uniform vec3 uAccent;
uniform vec3 uLineStrong;
uniform float uCount;
uniform float uKeep;
uniform float uAppear;
uniform float uSpread;
uniform float uFall;

varying vec2 vLocal;
varying vec2 vUv;
varying vec2 vCell;

${readingGlsl}
${readingMask}
${finish}

void main() {
  vec2 cellPx = (uSize - 2.0 * vec2(${INSET.x.toFixed(1)}, ${INSET.y.toFixed(1)})) / uGrid;
  vec2 px = vLocal * cellPx;
  float gap = 0.9;

  // Distance inside the cell's outline, in device pixels.
  vec2 edge = min(px, cellPx - px) - gap;
  float d = min(edge.x, edge.y) * uPixel;
  float inside = clamp(d + 0.5, 0.0, 1.0);
  float ring = inside * (1.0 - smoothstep(0.5, 1.5, d));

  float born = (vCell.x * uGrid.y + vCell.y) / uCount * uAppear;
  float shown = clamp((uT - born) / 90.0, 0.0, 1.0);

  float index = vCell.x * uGrid.y + vCell.y;
  float keeps = floor((index + 1.0) * uKeep / uCount) - floor(index * uKeep / uCount);
  float across = vCell.x / (uGrid.x - 1.0);
  float fall = easeInOut((uT - (uAppear + across * uSpread)) / uFall);
  float level = 1.0 - (1.0 - keeps) * fall;

  float innerHeight = cellPx.y - 2.0 * gap;
  float fill = clamp((level * innerHeight - (px.y - gap)) * uPixel + 0.5, 0.0, 1.0);

  float flash = flashBand(vUv.x);
  float body = inside * mix(0.05, 0.88 + 0.1 * uLift, fill);
  vec3 tint = mix(uLineStrong, uProof, fill);
  tint = mix(tint, uLineStrong, ring * (1.0 - fill));
  tint = mix(tint, uAccent, 0.8 * flash * fill);
  float alpha = max(body, ring * 0.75) + 0.2 * flash * fill * inside;
  gl_FragColor = writePixel(tint, min(alpha * shown, 1.0) * cornerMask());
}
`;

/** Creates the evidence reading. */
export function createReadingEvidence(context: ViewContext): View {
  const { count, columns, rows, keep, appearMs, spreadMs, fallMs } = cells;
  const state = createReadingState('evidence', context);

  const corner = new Float32Array(count * 4 * 3);
  const cell = new Float32Array(count * 4 * 2);
  const index = new Uint16Array(count * 6);
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const quad = column * rows + row;
      for (let vertex = 0; vertex < 4; vertex += 1) {
        const at = quad * 4 + vertex;
        corner.set([vertex % 2, Math.floor(vertex / 2), 0], at * 3);
        cell.set([column, row], at * 2);
      }
      const first = quad * 4;
      index.set([first, first + 1, first + 2, first + 2, first + 1, first + 3], quad * 6);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(corner, 3));
  geometry.setAttribute('aCell', new BufferAttribute(cell, 2));
  geometry.setIndex(new BufferAttribute(index, 1));

  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      ...state.uniforms,
      uGrid: { value: [columns, rows] },
      uCount: { value: count },
      uKeep: { value: keep },
      uAppear: { value: appearMs },
      uSpread: { value: spreadMs },
      uFall: { value: fallMs },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  const backdrop = createBackdrop(state);
  const scene = new Scene();
  scene.add(backdrop.mesh, mesh);
  const camera = createCamera();
  context.element.dataset.drawn = String(count);

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, busy } = state.step(input);
      geometry.setDrawRange(0, Math.round(count * easeOut(t / appearMs)) * 6);
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
      material.dispose();
    },
  };
}
