/**
 * The telemetry reading: exactly 10,000 points, one for each concurrent device, in 100 blocks
 * of 100, filling the lattice from left to right, then a line that crosses it in 200 ms, the
 * P95 latency of the figure's scope, and fades out as it arrives. Points the line has reached
 * stay lit. A hover or focus sends the line across again. Where the points cannot be told
 * apart (a pitch under two device pixels) it draws 100 blocks of 100 instead, one point sprite
 * for each. Either way the layout is `readingLayout`'s, in whole device pixels, the same the DOM
 * drawing takes, so every mark sits on a device pixel with no jitter and nothing moires. Every
 * mark is a real GL point, so the stage's own counters report them.
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

import { READING_TRAIL } from '../../entrance';
import { points, readingLayout } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, easeOut, readingGlsl, readingMask, tileOf, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const pointVertex = /* glsl */ `
uniform vec2 uFrame;
uniform float uPitch;
uniform float uDot;
uniform float uReveal;
uniform float uTrail;

varying float vLit;
varying float vGlow;

${readingGlsl}

void main() {
  // The lattice stands where the layout puts it, on whole device pixels (uFrame is its top
  // left, from the tile's top left); each mark is uDot square at its own pitch, so every
  // point lands on a pixel and nothing is resampled.
  vec2 device = floor(uSize * uPixel + 0.5);
  vec2 corner = uFrame + floor(position.xy * uPitch + 0.5);
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

/** The line fades out over the last of its crossing, so it never rests on the card's edge. */
const FADE_MS = 120;

/** How bright the line is while it crosses. */
const LINE_ALPHA = 0.95;

/** Creates the telemetry reading. */
export function createReadingTelemetry(context: ViewContext): View {
  const { count, countMs, sweepMs } = points;
  const state = createReadingState('telemetry', context);

  // Left to right, so the fill wipes across like the DOM's: a point exists wherever neither its
  // column nor its row is one of the gutters between blocks.
  const lattice = new Float32Array(count * 3);
  const gutter = points.side;
  const stride = points.side + 1;
  const columns = points.blockColumns * stride - 1;
  const rows = points.blockRows * stride - 1;
  let at = 0;
  for (let column = 0; column < columns; column += 1) {
    if (column % stride === gutter) continue;
    for (let row = 0; row < rows; row += 1) {
      if (row % stride === gutter) continue;
      lattice[at] = column;
      lattice[at + 1] = row;
      at += 3;
    }
  }
  const dots = new BufferGeometry();
  dots.setAttribute('position', new BufferAttribute(lattice, 3));

  // Where the points cannot be told apart: one mark for each block of a hundred, in a grid of 20 by 5.
  const wholeBlocks = points.blockColumns * points.blockRows;
  const blockGrid = new Float32Array(wholeBlocks * 3);
  for (let column = 0; column < points.blockColumns; column += 1) {
    for (let row = 0; row < points.blockRows; row += 1) blockGrid.set([column, row, 0], (column * points.blockRows + row) * 3);
  }
  const blocks = new BufferGeometry();
  blocks.setAttribute('position', new BufferAttribute(blockGrid, 3));

  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;
  const dotMaterial = new ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    uniforms: {
      ...state.uniforms,
      uFrame: { value: [0, 0] },
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

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, flash, busy } = state.step(input);
      const layout = readingLayout('telemetry', tileOf(input));
      cloud.geometry = layout.mode === 'points' ? dots : blocks;
      context.element.dataset.drawn = String(layout.drawn);
      context.element.dataset.unit = String(layout.unit);
      dotMaterial.uniforms.uFrame.value = [layout.frame.x, layout.frame.y];
      dotMaterial.uniforms.uPitch.value = layout.pitch;
      dotMaterial.uniforms.uDot.value = layout.mark;
      cloud.geometry.setDrawRange(0, Math.round(layout.drawn * easeOut(t / countMs)));

      const reveal = unit((t - countMs) / sweepMs);
      const crossing = flash < 1;
      dotMaterial.uniforms.uReveal.value = reveal;
      dotMaterial.uniforms.uTrail.value = 1 - unit((t - countMs - sweepMs) / READING_TRAIL);
      // The line is bright while it crosses and gone once it has: at rest the card shows no line.
      const crossed = crossing ? unit(flash) : t < countMs ? 0 : reveal;
      lineMaterial.uniforms.uX.value = crossed;
      const fading = 1 - unit((crossed * sweepMs - (sweepMs - FADE_MS)) / FADE_MS);
      lineMaterial.uniforms.uAlpha.value = crossed > 0 ? LINE_ALPHA * fading : 0;
      return busy || t < countMs + sweepMs + READING_TRAIL;
    },

    render(renderer: WebGLRenderer): void {
      renderer.render(scene, camera);
    },

    setTier(tier: LiveTier): void {
      context.tier = tier;
    },

    dispose(): void {
      delete context.element.dataset.drawn;
      delete context.element.dataset.unit;
      backdrop.dispose();
      dots.dispose();
      blocks.dispose();
      lineGeometry.dispose();
      dotMaterial.dispose();
      lineMaterial.dispose();
    },
  };
}
