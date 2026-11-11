/**
 * The evidence reading: one cell for each of the 200 SIT scenarios, and all 200 stay. The
 * cells appear full, the roughly three hours of evidence effort a scenario took, then the fill
 * falls to about fifteen minutes' worth, left to right: the effort per scenario falls ≈92%
 * while the count stays 200. A hover or focus sends a band of light across them.
 */

import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  Scene,
  ShaderMaterial,
  type WebGLRenderer,
} from 'three';

import { cells, readingLayout } from '../../readings';
import { finish } from '../glsl/finish';
import type { LiveTier } from '../tier';
import { createBackdrop, createCamera, createReadingState, easeOut, readingGlsl, readingMask, tileOf } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const vertex = /* glsl */ `
attribute vec2 aCell;

uniform vec2 uFrame;
uniform vec2 uPitch;
uniform vec2 uBox;

varying vec2 vLocal;
varying vec2 vUv;
varying vec2 vCell;

${readingGlsl}

void main() {
  // A cell's box, in whole device pixels from the tile's top left: where the layout puts it.
  vec2 device = floor(uSize * uPixel + 0.5);
  vec2 corner = uFrame + aCell * uPitch + position.xy * uBox;
  vLocal = position.xy;
  vCell = aCell;
  vUv = vec2(corner.x, device.y - corner.y) / device;
  gl_Position = vec4(vUv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
uniform vec2 uGrid;
uniform vec2 uBox;
uniform float uOutline;
uniform float uInset;
uniform float uFloor;
uniform float uRoom;
uniform vec3 uProof;
uniform vec3 uAccent;
uniform vec3 uLineStrong;
uniform float uCount;
uniform float uRest;
uniform float uAppear;
uniform float uSpread;
uniform float uFall;

varying vec2 vLocal;
varying vec2 vUv;
varying vec2 vCell;

${readingGlsl}
${readingMask}
${finish}

// Coverage of a shape whose edge is this many device pixels away (positive inside), one device pixel wide.
float cover(float distance) {
  return clamp(distance + 0.5, 0.0, 1.0);
}

void main() {
  // Everything below is in device pixels from the cell's top left, as the DOM layer draws it.
  vec2 px = vLocal * uBox;
  vec2 inside = min(px, uBox - px);
  float nearest = min(inside.x, inside.y);
  float box = cover(nearest);
  float room = cover(nearest - uOutline);
  float ring = box - room;

  float born = (vCell.x * uGrid.y + vCell.y) / uCount * uAppear;
  float shown = clamp((uT - born) / 90.0, 0.0, 1.0);

  float across = vCell.x / (uGrid.x - 1.0);
  float fall = easeInOut((uT - (uAppear + across * uSpread)) / uFall);
  float level = 1.0 - (1.0 - uRest) * fall;

  // The fill stands on the floor of the box inside the outline, a pixel in from each side so the
  // fills of neighbouring cells never touch, and is never under two device pixels tall.
  float fromBottom = uBox.y - px.y;
  float fillHeight = min(max(level * uRoom, uFloor), uRoom);
  float fill = cover(inside.x - uOutline - uInset) * cover(fromBottom - uOutline) * cover(uOutline + fillHeight - fromBottom);

  float flash = flashBand(vUv.x);
  float lit = fill * (0.86 + 0.1 * uLift);
  float tint = room * 0.05;
  vec3 fillColour = mix(uProof, uAccent, 0.8 * flash);

  // Tint, then the outline, then the fill, each laid over the one before (premultiplied).
  float alpha = tint;
  vec3 colour = uProof * tint;
  colour = uLineStrong * ring + colour * (1.0 - ring);
  alpha = ring + alpha * (1.0 - ring);
  colour = fillColour * lit + colour * (1.0 - lit);
  alpha = lit + alpha * (1.0 - lit);
  alpha += 0.2 * flash * fill * room * (1.0 - alpha);
  gl_FragColor = writePixel(colour / max(alpha, 0.0001), min(alpha * shown, 1.0) * cornerMask());
}
`;

/** Creates the evidence reading. */
export function createReadingEvidence(context: ViewContext): View {
  const { count, columns, rows, rest, appearMs, spreadMs, fallMs } = cells;
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
      uFrame: { value: [0, 0] },
      uPitch: { value: [1, 1] },
      uBox: { value: [1, 1] },
      uOutline: { value: 1 },
      uInset: { value: 1 },
      uFloor: { value: 2 },
      uRoom: { value: 1 },
      uCount: { value: count },
      uRest: { value: rest },
      uAppear: { value: appearMs },
      uSpread: { value: spreadMs },
      uFall: { value: fallMs },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
    // The cells are laid out from the tile's top left, so their quads wind the other way round.
    side: DoubleSide,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  const backdrop = createBackdrop(state);
  const scene = new Scene();
  scene.add(backdrop.mesh, mesh);
  const camera = createCamera();
  context.element.dataset.drawn = String(count);
  const { uniforms } = material;

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { t, busy } = state.step(input);
      const layout = readingLayout('evidence', tileOf(input));
      uniforms.uFrame.value = [layout.frame.x, layout.frame.y];
      uniforms.uPitch.value = [layout.pitchX, layout.pitchY];
      uniforms.uBox.value = [layout.boxX, layout.boxY];
      uniforms.uOutline.value = layout.outline;
      uniforms.uInset.value = layout.inset;
      uniforms.uFloor.value = layout.floor;
      uniforms.uRoom.value = layout.room;
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
