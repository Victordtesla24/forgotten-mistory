/**
 * The light of the career scale. The DOM draws the axis and the eight bars; this adds what
 * only light can: a front that runs along the axis as it draws in, ticks that catch it, a
 * soft bloom beneath the current role, and the same bloom, with the ticks of its span lit,
 * under whichever role a reader hovers or focuses. Nothing is lit ahead of the front: the
 * current role's bloom arrives as the front passes it and settles as the scale ends, and the
 * front itself is a short light on the tick row, clear of the numerals. Every position comes
 * from `lib/timeline`, the same module that placed the bars, so the light is on the bar to the
 * pixel. Remove this layer and nothing but light is lost.
 */

import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  type WebGLRenderer,
} from 'three';

import { entrance } from '../../entrance';
import { spring, stepSpring, type SpringState } from '../../motion';
import { careerBars, ticks } from '../../timeline';
import { finish } from '../glsl/finish';
import { CAREER_VIEW } from '../ids';
import { palette } from '../palette';
import { readSignal } from '../signal';
import type { LiveTier } from '../tier';
import { createCamera, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

/** The front takes three quarters of the scale's time, as the DOM's wipe does, and the light lingers for the last quarter, so it is gone as the scale's time ends. */
const FRONT_MS = entrance.scale.for * 0.75;
const AFTERGLOW_MS = entrance.scale.for - FRONT_MS;

/** The current role's bloom begins to rise just before the front reaches the end of the axis and is whole when the scale's time ends. */
const SETTLE_FROM = FRONT_MS * 0.9;

const BAR_COUNT = careerBars.length;
const CURRENT = Math.max(
  careerBars.findIndex((bar) => bar.current),
  0,
);

const common = /* glsl */ `
uniform vec2 uOrigin;
uniform vec2 uSize;
uniform float uPixel;
uniform float uRuler;
uniform float uDark;
uniform float uFront;
uniform float uFrontAmt;
uniform vec2 uSpan[${BAR_COUNT}];
uniform float uCurrent;
uniform float uHover;
uniform float uHoverAmt;
uniform float uSettle;
uniform float uTickY;

vec2 spanOf(float index) {
  vec2 span = vec2(0.0);
  for (int i = 0; i < ${BAR_COUNT}; i += 1) {
    if (float(i) == index) span = uSpan[i];
  }
  return span;
}

float inside(float x, vec2 span) {
  return step(span.x, x) * step(x, span.y);
}
`;

const tickVertex = /* glsl */ `
attribute float aLength;

varying float vLight;

${common}

void main() {
  float x = position.x;
  float band = exp(-pow((x - uFront + 0.012) / 0.03, 2.0)) * uFrontAmt;
  float lit = inside(x, spanOf(uHover)) * uHoverAmt + inside(x, spanOf(uCurrent)) * 0.7;
  vLight = max(band, lit) * step(x, uFront);
  float px = (floor(x * uSize.x * uPixel) + 0.5) / uPixel;
  float y = uRuler - position.y * aLength;
  gl_Position = vec4(vec2(px, y) / uSize * 2.0 - 1.0, 0.0, 1.0);
}
`;

const tickFragment = /* glsl */ `
uniform vec3 uAccent;

varying float vLight;

${common}
${finish}

void main() {
  gl_FragColor = writePixel(uAccent, min(vLight, 1.0) * mix(0.75, 0.95, uDark));
}
`;

const glowVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uAccent;

${common}
${finish}

float bloom(vec2 span, vec2 uv) {
  float centre = 0.5 * (span.x + span.y);
  float reach = 0.5 * (span.y - span.x) + 0.05;
  float across = exp(-pow((uv.x - centre) / reach, 2.0));
  float down = exp(-pow((uv.y - 0.75) / 0.34, 2.0));
  return across * down;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uOrigin) / (uSize * uPixel);
  float strength = mix(0.3, 0.4, uDark);

  // Nothing is lit to the right of the front: the light only ever follows the axis.
  float behind = 1.0 - smoothstep(uFront, uFront + 0.012, uv.x);
  float current = bloom(spanOf(uCurrent), uv) * uSettle;
  float hover = bloom(spanOf(uHover), uv) * uHoverAmt;

  // The front is a short light on the tick row, about 14 px across and 14 px tall, and half the strength
  // of a bloom: it stays above the numerals and out of the hairlines' way.
  float across = exp(-pow((uv.x - uFront + 0.006) / (14.0 / uSize.x), 2.0));
  float down = exp(-pow((uv.y - uTickY) / (7.0 / uSize.y), 2.0));
  float front = across * down * uFrontAmt * 0.5;

  float window = smoothstep(0.0, 0.22, uv.y) * (1.0 - smoothstep(0.78, 1.0, uv.y));
  float alpha = (max(current, hover) * strength + front * strength) * window * behind;
  gl_FragColor = writePixel(uAccent, min(alpha, 1.0));
}
`;

/** Creates the light of the career scale. */
export function createCareerScale(context: ViewContext): View {
  const lit: SpringState = { value: 0, velocity: 0 };
  let hovered = CURRENT;

  const uniforms = {
    uOrigin: { value: [0, 0] as [number, number] },
    uSize: { value: [1, 1] as [number, number] },
    uPixel: { value: 1 },
    uRuler: { value: 44 },
    uDark: palette.dark,
    uAccent: palette.colors.accent,
    uFront: { value: 0 },
    uFrontAmt: { value: 0 },
    uSpan: { value: careerBars.map((bar) => new Vector2(bar.start, bar.end)) },
    uCurrent: { value: CURRENT },
    uHover: { value: CURRENT },
    uHoverAmt: { value: 0 },
    uSettle: { value: 0 },
    uTickY: { value: 0.5 },
  };
  const flags = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false } as const;

  const glowGeometry = new PlaneGeometry(2, 2);
  const glowMaterial = new ShaderMaterial({ vertexShader: glowVertex, fragmentShader: glowFragment, uniforms, ...flags });
  const glow = new Mesh(glowGeometry, glowMaterial);
  glow.frustumCulled = false;
  glow.renderOrder = 0;

  const marks = new Float32Array(ticks.length * 2 * 3);
  const lengths = new Float32Array(ticks.length * 2);
  ticks.forEach((tick, index) => {
    const length = tick.major ? 15 : tick.year !== undefined ? 9 : 5;
    marks.set([tick.at, 0, 0, tick.at, 1, 0], index * 6);
    lengths.set([length, length], index * 2);
  });
  const tickGeometry = new BufferGeometry();
  tickGeometry.setAttribute('position', new BufferAttribute(marks, 3));
  tickGeometry.setAttribute('aLength', new BufferAttribute(lengths, 1));
  const tickMaterial = new ShaderMaterial({ vertexShader: tickVertex, fragmentShader: tickFragment, uniforms, ...flags });
  const rule = new LineSegments(tickGeometry, tickMaterial);
  rule.frustumCulled = false;
  rule.renderOrder = 1;

  const scene = new Scene();
  scene.add(glow, rule);
  const camera = createCamera();
  // The ticks hang from the ruler's baseline, which is the top of the ruler: its height up from the view's bottom edge.
  const ruler = context.element.closest('[data-career-scale]')?.querySelector<HTMLElement>('[data-ruler]');

  return {
    pointer: false,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { time, dt, viewport, pixelRatio } = input;
      const live = context.tier !== 'still';
      const t = time - entrance.scale.at;

      const active = live ? readSignal(CAREER_VIEW).active : null;
      const index = careerBars.findIndex((bar) => bar.id === active);
      if (index >= 0) hovered = index;
      const moving = stepSpring(lit, index >= 0 ? 1 : 0, spring.snappy, dt / 1000);

      const front = unit(t / FRONT_MS);
      uniforms.uOrigin.value = [viewport.x * pixelRatio, viewport.y * pixelRatio];
      uniforms.uSize.value = [viewport.width, viewport.height];
      uniforms.uPixel.value = pixelRatio;
      uniforms.uRuler.value = ruler?.clientHeight ?? uniforms.uRuler.value;
      uniforms.uTickY.value = uniforms.uRuler.value / viewport.height;
      uniforms.uSettle.value = unit((t - SETTLE_FROM) / (entrance.scale.for - SETTLE_FROM));
      uniforms.uFront.value = front;
      uniforms.uFrontAmt.value = t < 0 ? 0 : 1 - unit((t - FRONT_MS) / AFTERGLOW_MS);
      uniforms.uHover.value = hovered;
      uniforms.uHoverAmt.value = lit.value;
      return moving || t < FRONT_MS + AFTERGLOW_MS;
    },

    render(renderer: WebGLRenderer): void {
      renderer.render(scene, camera);
    },

    setTier(tier: LiveTier): void {
      context.tier = tier;
    },

    dispose(): void {
      glowGeometry.dispose();
      tickGeometry.dispose();
      glowMaterial.dispose();
      tickMaterial.dispose();
    },
  };
}
