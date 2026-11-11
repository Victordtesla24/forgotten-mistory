/**
 * The light of the Experience timeline. The DOM draws the axis, the eight bars, the playhead and
 * the card; this lays light on them, to the pixel, from the bars' own boxes: a column of light
 * over every bar, exactly as wide as the bar, that rises from its top edge and is gone within
 * about 220 px (the more months a role ran, the higher it reaches; the selected role's is the
 * brightest and reaches its card); a rim and a soft fill on each bar and a lip of light on the top
 * of the selected one, held to ten pixels; a light that travels along the bars' tops from the old
 * selection to the new in about 480 ms; a glint under the pointer; and the playhead as a line with
 * its foot. Every position is read from the DOM (the bars' rectangles, the card's, the playhead's
 * place on the track), so the light is where the page is at every width and pixel ratio, and a
 * theme change only recolours it. Nothing moves once the light has arrived: an idle timeline draws
 * no frames. The entrance, when it plays, is the DOM's own, read from `data-phase` and the moment
 * the section came into view.
 */

import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector4, type WebGLRenderer } from 'three';

import { duration, spring, stepSpring, type SpringState } from '../../motion';
import { careerBars } from '../../timeline';
import { finish } from '../glsl/finish';
import { palette } from '../palette';
import type { LiveTier } from '../tier';
import { createCamera, easeOut, unit } from './reading';
import type { FrameInput, View, ViewContext } from './types';

const BAR_COUNT = careerBars.length;

/**
 * The entrance's own times, as the stylesheet states them: each bar starts where it stands across
 * the first 200 ms and takes the state duration; the card and the connector arrive from 560 ms.
 * (The playhead's sweep is the page's: the light reads it from the playhead's own box.)
 */
const FRONT_MS = 200;
const BAR_MS = duration.state;
const ARRIVE_MS = 560;

/** How long the light takes to travel from one selected bar to the next: inside the panel duration. */
const TRAVEL_MS = 480;

/** How long the page's playhead takes to glide to a new place (`--glide` in the stylesheet), which the light keeps drawing for. */
const GLIDE_MS = 280;

/** A bar the pointer is over is lit this much of the way to a selected one. */
const HOVER_LEVEL = 0.4;

/** The least a column of light rises, and what the longest role adds to it, in CSS pixels. */
const REACH_MIN = 80;
const REACH_SPAN = 140;

/** The most the light of a bar's top edge reaches beyond the bar, in CSS pixels. */
const LIP = 10;

/** How far under the baseline the playhead's foot stands, in CSS pixels. */
const FOOT = 14;

const longest = Math.max(...careerBars.map((bar) => bar.months));
const reaches = careerBars.map((bar) => REACH_MIN + REACH_SPAN * (bar.months / longest));

const vertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
uniform vec2 uOrigin;
uniform vec2 uSize;
uniform float uPixel;
uniform float uDark;
uniform float uRadius;
uniform vec4 uBars[${BAR_COUNT}];
uniform vec2 uState[${BAR_COUNT}];
uniform float uReach[${BAR_COUNT}];
uniform float uCard;
uniform vec4 uPlay;
uniform vec3 uFoot;
uniform vec4 uTravel;
uniform vec2 uGlint;
uniform vec3 uAccent;
uniform vec3 uText;

${finish}

float span(float y, float from, float to) {
  return smoothstep(from - 0.5, from + 0.5, y) * (1.0 - smoothstep(to - 0.5, to + 0.5, y));
}

void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uPixel;
  p.y = uSize.y - p.y;
  float strength = mix(0.8, 1.0, uDark);
  float columns = mix(0.85, 1.0, uDark);
  float accent = 0.0;
  float text = 0.0;
  float rowTop = uBars[0].y;

  for (int i = 0; i < ${BAR_COUNT}; i += 1) {
    vec4 box = uBars[i];
    // Everything a bar draws, its fill, rim, lip and column, stands within its own width: a pixel beside it has nothing to ask of it.
    if (p.x < box.x - 1.5 || p.x > box.z + 1.5) continue;
    vec2 state = uState[i];
    vec2 centre = (box.xy + box.zw) * 0.5;
    vec2 halfSize = (box.zw - box.xy) * 0.5;
    vec2 q = abs(p - centre) - halfSize + uRadius;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float cover = clamp(0.5 - d * uPixel, 0.0, 1.0);
    float reveal = clamp((box.x + state.x * (box.z - box.x) - p.x) * uPixel + 0.5, 0.0, 1.0);
    float lit = state.y;

    // The bar's own light: a soft fill, brighter along its top, and a rim.
    float top = exp(-(p.y - box.y) / 9.0);
    float fill = cover * reveal * (0.05 + 0.1 * lit + top * (0.05 + 0.13 * lit));
    float rim = clamp(0.5 - abs(d + 0.5) * uPixel, 0.0, 1.0) * reveal * (0.16 + 0.6 * lit);

    // The lip: the selected bar's top edge, lit for at most ten pixels above it and exactly as wide as the bar, so it is the same on both sides of the bar's middle.
    float inside = clamp(min(p.x - box.x, box.z - p.x) * uPixel + 0.5, 0.0, 1.0);
    float above = box.y - p.y;
    float lip = inside * step(0.0, above) * (1.0 - smoothstep(${LIP.toFixed(1)} - 3.0, ${LIP.toFixed(1)}, above)) * exp(-above / 3.5) * lit * 0.34 * state.x;

    // The column: as wide as the bar, from its top edge up, fading out; brightest in its middle, and the selected one's reaches its card.
    float reach = uReach[i];
    float toCard = max(box.y - uCard + 6.0, reach);
    reach = mix(reach, toCard, smoothstep(0.5, 1.0, lit));
    float t = clamp(above / max(reach, 1.0), 0.0, 1.0);
    float across = (p.x - centre.x) / max(halfSize.x, 1.0);
    float shade = 1.0 - 0.42 * across * across;
    float column = step(0.0, uCard) * inside * step(0.0, above) * pow(1.0 - t, 1.6) * shade * (0.2 + 0.5 * lit) * smoothstep(0.0, 1.0, state.x) * columns;

    accent += (fill + rim + lip) * strength + column;
  }

  // The field itself is lit: a soft wash that stands over the bars and fades into the heading's side of the track, so the space above the bars carries light.
  float over = max(rowTop - p.y, 0.0);
  float wash = step(0.0, uCard) * smoothstep(0.0, 30.0, over) * (1.0 - smoothstep(120.0, 330.0, over)) * mix(0.04, 0.035, uDark);
  accent += wash;

  // The light that travels along the bars' tops from the old selection to the new.
  float along = exp(-pow((p.x - uTravel.x) / uTravel.z, 2.0));
  float travel = along * (exp(-abs(p.y - rowTop) / 4.0) * 0.6 + step(p.y, rowTop) * exp(-(rowTop - p.y) / 26.0) * 0.16) * uTravel.w;
  accent += travel * strength;

  // The glint under the pointer: a point of light on the top edge of the bars it passes.
  float glint = exp(-pow((p.x - uGlint.x) / 26.0, 2.0)) * exp(-abs(p.y - rowTop) / 2.5) * uGlint.y;
  accent += glint * 0.5 * strength;

  // The playhead: its line above the bars, and its foot under the baseline, with a halo that is only on the dark.
  float lineSegments = span(p.y, uPlay.y, uPlay.z) + span(p.y, uFoot.x, uFoot.y);
  float dx = (p.x - uPlay.x) * uPixel;
  float line = clamp(0.5 * uPixel + 0.5 - abs(dx), 0.0, 1.0);
  float halo = exp(-pow((p.x - uPlay.x) / 6.0, 2.0)) * 0.12 * uDark;
  text += line * lineSegments * 0.7 * uPlay.w;
  accent += halo * lineSegments * uPlay.w * strength;

  float total = accent + text;
  vec3 colour = (uAccent * accent + uText * text) / max(total, 1e-4);
  gl_FragColor = writePixel(colour, min(total, 1.0));
}
`;

/** What the page says this frame, relative to the view's top left corner, in CSS pixels. */
interface Measured {
  boxes: Vector4[];
  radius: number;
  /** Where the playhead is, 0 to 1 of the track, and where the page has told it to go. */
  target: number;
  /** The playhead's middle as the page draws it this frame, which is also where the light draws it. */
  playX: number;
  following: boolean;
  selected: number;
  hovered: number;
  phase: string;
  enteredAt: number;
  width: number;
  /** The card's lower edge where the card stands over the track, or -1 where it does not (a phone's card is above the axis). */
  card: number;
  /** The playhead's own top and bottom, which the light's line runs between. */
  playTop: number;
  playBottom: number;
}

export function createExperienceTimeline(context: ViewContext): View {
  const track = context.element.parentElement;
  const root = context.element.closest<HTMLElement>('[data-experience]');
  const levels: SpringState[] = Array.from({ length: BAR_COUNT }, () => ({ value: 0, velocity: 0 }));
  const glint: SpringState = { value: 0, velocity: 0 };
  const boxes = Array.from({ length: BAR_COUNT }, () => new Vector4());
  const states = Array.from({ length: BAR_COUNT }, () => new Vector2(1, 0));
  let selectedBefore = -1;
  let clockBefore = 0;
  let targetBefore = Number.NaN;
  let holdUntil = 0;
  let travel = { from: 0, to: 0, at: Number.NEGATIVE_INFINITY };

  const uniforms = {
    uOrigin: { value: [0, 0] as [number, number] },
    uSize: { value: [1, 1] as [number, number] },
    uPixel: { value: 1 },
    uDark: palette.dark,
    uRadius: { value: 4 },
    uBars: { value: boxes },
    uState: { value: states },
    uReach: { value: reaches },
    uCard: { value: -1 },
    uPlay: { value: new Vector4(0, 0, 0, 1) },
    uFoot: { value: [0, 0, 0] as [number, number, number] },
    uTravel: { value: new Vector4(0, 0, 40, 0) },
    uGlint: { value: new Vector2(0, 0) },
    uAccent: palette.colors.accent,
    uText: palette.colors.text,
  };

  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new Mesh(geometry, material);
  quad.frustumCulled = false;
  const scene = new Scene();
  scene.add(quad);
  const camera: OrthographicCamera = createCamera();

  /** Reads the page: where every bar is, which is selected, where the playhead rests, and how far the entrance has got. */
  function measure(input: FrameInput): Measured | null {
    if (!track || !root) return null;
    const bars = Array.from(track.querySelectorAll<HTMLElement>('[data-bar]'));
    if (bars.length !== BAR_COUNT) return null;
    const { client } = input;
    let selected = 0;
    let hovered = -1;
    let radius = 4;
    bars.forEach((bar, index) => {
      const box = bar.getBoundingClientRect();
      const fill = bar.firstElementChild;
      if (index === 0 && fill instanceof HTMLElement) radius = Number.parseFloat(getComputedStyle(fill, '::before').borderTopLeftRadius) || radius;
      // The fill sits one pixel in from the bar's own edge on each side, and fills its height.
      boxes[index]?.set(box.left - client.left + 1, box.top - client.top, box.right - client.left - 1, box.bottom - client.top);
      if (bar.dataset.selected === 'true') selected = index;
      if (bar.dataset.hover === 'true') hovered = index;
    });
    const head = track.querySelector<HTMLElement>('[data-playhead]')?.getBoundingClientRect();
    const card = root.querySelector<HTMLElement>('[data-lens]')?.getBoundingClientRect();
    const target = Number.parseFloat(track.style.getPropertyValue('--p'));
    return {
      boxes,
      radius,
      target: Number.isFinite(target) ? target : 0,
      playX: head ? head.left + head.width / 2 - client.left : 0,
      following: track.dataset.following === 'true',
      selected,
      hovered,
      phase: root.dataset.phase ?? 'idle',
      enteredAt: Number.parseFloat(root.getAttribute('data-entered-at') ?? '') || 0,
      width: client.width,
      card: card && card.bottom > client.top + 1 ? card.bottom - client.top : -1,
      playTop: head ? head.top - client.top : 0,
      playBottom: head ? head.bottom - client.top : 0,
    };
  }

  return {
    pointer: true,
    syncToLoad: false,

    update(input: FrameInput): boolean {
      const read = measure(input);
      if (!read) return false;
      const live = context.tier !== 'still';
      const seconds = live ? input.dt / 1000 : 0;
      const now = performance.now();
      let busy = false;

      // The entrance is the DOM's: armed shows nothing, play shows the part of it that has run, anything else is the settled page.
      // A stage that draws one frame for each change (the still tier) has no time to run it in, and shows the settled page.
      const elapsed = read.phase === 'play' && live ? now - read.enteredAt : Number.POSITIVE_INFINITY;
      const armed = read.phase === 'armed';
      const playing = elapsed < ARRIVE_MS + BAR_MS;
      busy ||= playing;

      read.boxes.forEach((box, index) => {
        const level = Math.max(index === read.selected ? 1 : 0, index === read.hovered ? HOVER_LEVEL : 0);
        const state = levels[index];
        if (!state) return;
        if (live) busy = stepSpring(state, level, spring.snappy, seconds) || busy;
        else state.value = level;
        const start = ((box.x - 1) / read.width) * FRONT_MS;
        const grown = armed ? 0 : easeOut((elapsed - start) / BAR_MS);
        states[index]?.set(Number.isFinite(grown) ? grown : 1, state.value);
      });

      // The line of light is the page's own playhead, read from its box each frame, so the two are one line; the stage keeps drawing while the page's playhead glides to a new place.
      if (read.target !== targetBefore) {
        targetBefore = read.target;
        holdUntil = now + GLIDE_MS;
      }
      busy ||= live && now < holdUntil;

      // A new selection sends a light along the bars' tops from where the last one stood to the new bar's middle, once the entrance is over.
      const centreOf = (index: number): number => {
        const box = read.boxes[index];
        return box ? (box.x + box.z) / 2 : 0;
      };
      // The light runs on the stage's own clock, so a frame at a chosen time (`window.__stage.seek`) shows it where it is at that time: a clock turned back puts the start of a light that has run at the new time.
      const clock = input.time;
      if (clock < clockBefore && Number.isFinite(travel.at)) travel = { ...travel, at: clock };
      clockBefore = clock;
      if (read.selected !== selectedBefore) {
        if (selectedBefore >= 0 && live && !playing && !armed) travel = { from: centreOf(selectedBefore), to: centreOf(read.selected), at: clock };
        selectedBefore = read.selected;
      }
      const run = live ? unit((clock - travel.at) / TRAVEL_MS) : 1;
      busy ||= run < 1;
      const eased = run * run * (3 - 2 * run);
      const pulse = Math.sin(Math.PI * run);

      if (live) busy = stepSpring(glint, read.following ? 1 : 0, spring.snappy, seconds) || busy;
      else glint.value = 0;

      const arrive = armed ? 0 : Number.isFinite(elapsed) ? easeOut((elapsed - ARRIVE_MS) / BAR_MS) : 1;
      const playX = read.playX;
      const barBottom = read.boxes[0]?.w ?? 0;

      uniforms.uOrigin.value = [input.viewport.x * input.pixelRatio, input.viewport.y * input.pixelRatio];
      uniforms.uSize.value = [input.viewport.width, input.viewport.height];
      uniforms.uPixel.value = input.pixelRatio;
      uniforms.uRadius.value = read.radius;
      uniforms.uCard.value = read.card < 0 ? -1 : read.card;
      uniforms.uPlay.value.set(playX, read.playTop, read.playBottom, armed ? 0 : 1);
      uniforms.uFoot.value = [barBottom, barBottom + FOOT, 0];
      uniforms.uTravel.value.set(travel.from + (travel.to - travel.from) * eased, 0, 46, pulse * 0.9 * arrive);
      uniforms.uGlint.value.set(playX, glint.value);
      return busy;
    },

    render(renderer: WebGLRenderer): void {
      renderer.render(scene, camera);
    },

    setTier(tier: LiveTier): void {
      context.tier = tier;
    },

    dispose(): void {
      geometry.dispose();
      material.dispose();
    },
  };
}
