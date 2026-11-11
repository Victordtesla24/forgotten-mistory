/**
 * What the three readings share: the clock of a reading's own visual, the light that crosses
 * it when a reader hovers or focuses its card, and the uniforms every reading shader takes.
 * A reading is a function of the page's entrance clock and of one signal from the DOM, so a
 * frame at any moment can be reproduced and an idle reading draws nothing.
 */

import { Mesh, OrthographicCamera, PlaneGeometry, ShaderMaterial, type Color } from 'three';

import { spring, stepSpring, type SpringState } from '../../motion';
import { entrance } from '../../entrance';
import { cardStart, flashMs, readingView, visualStart, VISUAL_MS, type ReadingId } from '../../readings';
import { finish } from '../glsl/finish';
import { palette, type Uniform } from '../palette';
import { readSignal } from '../signal';
import type { FrameInput, ViewContext } from './types';

/** The flash is a band of light whose centre runs from -0.1 at the left edge to this much past the right edge. */
const FLASH_END = 1.4;

interface ReadingState {
  uniforms: {
    uSize: Uniform<[number, number]>;
    uOrigin: Uniform<[number, number]>;
    uRadius: Uniform<number>;
    uPixel: Uniform<number>;
    uDark: Uniform<number>;
    uLift: Uniform<number>;
    uFlash: Uniform<number>;
    uT: Uniform<number>;
    uEnter: Uniform<number>;
    uProof: Uniform<Color>;
    uAccent: Uniform<Color>;
    uLineStrong: Uniform<Color>;
  };
  /** Advances to this frame. `t` is milliseconds since the reading's visual began; `busy` is true while it needs another frame. */
  step(input: FrameInput): { t: number; flash: number; busy: boolean };
}

/** Clamps to 0..1. */
export const unit = (value: number): number => Math.min(Math.max(value, 0), 1);

/** Ease-out cubic: the token curve of things that arrive. */
export const easeOut = (value: number): number => 1 - (1 - unit(value)) ** 3;

/** The radius of a reading's card inside its 1 px border, in CSS pixels: the token the DOM rounds the card with. */
function cardRadius(): number {
  const radius = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-lg'));
  return Number.isFinite(radius) ? Math.max(radius - 1, 0) : 0;
}

export function createReadingState(id: ReadingId, context: ViewContext): ReadingState {
  const view = readingView(id);
  const start = visualStart(id);
  const arrives = cardStart(id);
  const flashFor = flashMs(id);
  const lift: SpringState = { value: 0, velocity: 0 };
  let epoch = readSignal(view).epoch;
  let flashAt = Number.NEGATIVE_INFINITY;

  const uniforms: ReadingState['uniforms'] = {
    uSize: { value: [1, 1] },
    uOrigin: { value: [0, 0] },
    uRadius: { value: cardRadius() },
    uPixel: { value: 1 },
    uDark: palette.dark,
    uLift: { value: 0 },
    uFlash: { value: FLASH_END * 2 },
    uT: { value: 0 },
    uEnter: { value: 0 },
    uProof: palette.colors.proof,
    uAccent: palette.colors.accent,
    uLineStrong: palette.colors.lineStrong,
  };

  return {
    uniforms,
    step(input) {
      const live = context.tier !== 'still';
      const signal = readSignal(view);
      if (signal.epoch !== epoch) {
        epoch = signal.epoch;
        if (live) flashAt = input.time;
      }
      const flash = (input.time - flashAt) / flashFor;
      const t = input.time - start;
      const lifting = stepSpring(lift, live && signal.active !== null ? 1 : 0, spring.snappy, input.dt / 1000);

      uniforms.uSize.value = [input.viewport.width, input.viewport.height];
      uniforms.uOrigin.value = [input.viewport.x * input.pixelRatio, input.viewport.y * input.pixelRatio];
      uniforms.uPixel.value = input.pixelRatio;
      uniforms.uLift.value = lift.value;
      uniforms.uFlash.value = flash < 1 ? flash * FLASH_END : FLASH_END * 2;
      uniforms.uT.value = t;
      uniforms.uEnter.value = easeOut((input.time - arrives) / entrance.readings.for);
      return { t, flash, busy: lifting || flash < 1 || t < VISUAL_MS };
    },
  };
}

/** Every reading shader writes NDC positions itself; the camera only satisfies `render`. */
export function createCamera(): OrthographicCamera {
  return new OrthographicCamera(-1, 1, 1, -1, 0, 1);
}

/**
 * Fragment GLSL for the card a reading sits in: its visual is the top of the card, and the canvas
 * is behind the page, so the card's rounded top corners do not clip it. This mask does.
 */
export const readingMask = /* glsl */ `
uniform vec2 uOrigin;
uniform float uRadius;

float cornerMask() {
  vec2 px = (gl_FragCoord.xy - uOrigin) / uPixel;
  vec2 edge = vec2(min(px.x, uSize.x - px.x), uSize.y - px.y);
  float outside = length(max(vec2(uRadius) - edge, 0.0)) - uRadius;
  return 1.0 - clamp(outside * uPixel + 0.5, 0.0, 1.0);
}
`;

/** GLSL every reading shader shares: the band of light that crosses a reading and the two token easings. */
export const readingGlsl = /* glsl */ `
uniform vec2 uSize;
uniform float uPixel;
uniform float uDark;
uniform float uLift;
uniform float uFlash;
uniform float uT;

float flashBand(float x) {
  return exp(-pow((x - (uFlash - 0.1)) / 0.09, 2.0));
}

float easeOut(float x) {
  return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0);
}

float easeInOut(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}
`;

/**
 * The panel a reading is drawn on. The canvas sits behind the page, so a card's own background
 * would dim the reading; each reading paints its own, in the surface token, and it lifts to
 * the raised token with the pointer. Added to a scene first, it is drawn first.
 */
export function createBackdrop(state: ReadingState): { mesh: Mesh; dispose(): void } {
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
uniform vec3 uSurface;
uniform vec3 uRaised;
uniform float uEnter;

${readingGlsl}
${readingMask}
${finish}

void main() {
  gl_FragColor = writePixel(mix(uSurface, uRaised, 0.7 * uLift), 0.72 * uEnter * cornerMask());
}
`,
    uniforms: { ...state.uniforms, uSurface: palette.colors.surface, uRaised: palette.colors.raised },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
