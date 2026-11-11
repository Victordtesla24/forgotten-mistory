/**
 * The light of the Experience timeline. The DOM draws the axis, the eight bars and the playhead;
 * this lays light on them, to the pixel: each bar as a rim and a soft fill, the selected one
 * brighter and standing in a bloom, a column of light that rises from the selected bar to its
 * card, and the playhead as a line with a halo. Every position is read from the DOM's own boxes
 * (the bars' rectangles, the playhead's place on the track), so the light is where the page is at
 * every width and pixel ratio, and a theme change only recolours it. A selection eases the light
 * from one bar to the next in about 240 ms, the playhead's own rest and the column follow, and
 * nothing moves once they have arrived: an idle timeline draws no frames. The entrance, when it
 * plays, is the DOM's own, read from `data-phase` and the moment the section came into view.
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
 * The entrance's own times, as the stylesheet states them: the ruler is wiped in over the state
 * duration and each bar starts where it stands across it, then takes the state duration; the
 * playhead sweeps for the panel duration and the card and column arrive after it.
 */
const FRONT_MS = duration.state;
const BAR_MS = duration.state;
const SWEEP_MS = duration.panel;

/** A bar the pointer is over is lit this much of the way to a selected one. */
const HOVER_LEVEL = 0.4;

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
uniform vec4 uPlay;
uniform vec4 uColumn;
uniform vec3 uAccent;
uniform vec3 uText;

${finish}

void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uPixel;
  p.y = uSize.y - p.y;
  float strength = mix(0.8, 1.0, uDark);
  float accent = 0.0;
  float text = 0.0;

  for (int i = 0; i < ${BAR_COUNT}; i += 1) {
    vec4 box = uBars[i];
    vec2 state = uState[i];
    vec2 centre = (box.xy + box.zw) * 0.5;
    vec2 halfSize = (box.zw - box.xy) * 0.5;
    vec2 q = abs(p - centre) - halfSize + uRadius;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float cover = clamp(0.5 - d * uPixel, 0.0, 1.0);
    float reveal = clamp((box.x + state.x * (box.z - box.x) - p.x) * uPixel + 0.5, 0.0, 1.0);
    float lit = state.y;

    float top = exp(-(p.y - box.y) / 9.0);
    float fill = cover * reveal * (0.05 + 0.1 * lit + top * (0.05 + 0.13 * lit));
    float rim = clamp(0.5 - abs(d + 0.5) * uPixel, 0.0, 1.0) * reveal * (0.16 + 0.6 * lit);
    float bloom = exp(-max(d, 0.0) / 13.0) * (1.0 - cover) * lit * 0.34 * state.x;
    accent += (fill + rim + bloom) * strength;
  }

  float rise = smoothstep(0.0, 1.0, clamp(p.y / max(uColumn.z, 1.0), 0.0, 1.0));
  float spread = mix(5.0, uColumn.y, rise);
  float across = exp(-pow((p.x - uColumn.x) / spread, 2.0));
  accent += across * pow(rise, 1.7) * (1.0 - smoothstep(uColumn.z - 2.0, uColumn.z + 2.0, p.y)) * uColumn.w * 0.3 * strength;

  float along = smoothstep(uPlay.y - 6.0, uPlay.y + 2.0, p.y) * (1.0 - smoothstep(uPlay.z - 2.0, uPlay.z + 6.0, p.y));
  float dx = (p.x - uPlay.x) * uPixel;
  float line = clamp(0.5 * uPixel + 0.5 - abs(dx), 0.0, 1.0);
  float halo = exp(-pow((p.x - uPlay.x) / 8.0, 2.0)) * 0.22;
  text += line * along * 0.7 * uPlay.w;
  accent += halo * along * uPlay.w * strength;

  float total = accent + text;
  vec3 colour = (uAccent * accent + uText * text) / max(total, 1e-4);
  gl_FragColor = writePixel(colour, min(total, 1.0));
}
`;

/** One bar as the DOM has it, relative to the view's top left corner, in CSS pixels. */
interface Measured {
  boxes: Vector4[];
  radius: number;
  /** The playhead's rest and its place as the page states them, 0 to 1 of the track. */
  target: number;
  following: boolean;
  selected: number;
  hovered: number;
  phase: string;
  enteredAt: number;
  width: number;
  /** The selected bar's top edge, where the column of light starts. */
  columnTop: number;
  /** The playhead's own top and bottom, which the light's line runs between. */
  playTop: number;
  playBottom: number;
}

export function createExperienceTimeline(context: ViewContext): View {
  const track = context.element.parentElement;
  const root = context.element.closest<HTMLElement>('[data-experience]');
  const levels: SpringState[] = Array.from({ length: BAR_COUNT }, () => ({ value: 0, velocity: 0 }));
  const playhead: SpringState = { value: -1, velocity: 0 };
  const column: SpringState = { value: -1, velocity: 0 };
  const boxes = Array.from({ length: BAR_COUNT }, () => new Vector4());
  const states = Array.from({ length: BAR_COUNT }, () => new Vector2(1, 0));

  const uniforms = {
    uOrigin: { value: [0, 0] as [number, number] },
    uSize: { value: [1, 1] as [number, number] },
    uPixel: { value: 1 },
    uDark: palette.dark,
    uRadius: { value: 4 },
    uBars: { value: boxes },
    uState: { value: states },
    uPlay: { value: new Vector4(0, 0, 0, 1) },
    uColumn: { value: new Vector4(0, 24, 1, 1) },
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
      if (index === 0 && fill instanceof HTMLElement) radius = Number.parseFloat(getComputedStyle(fill).borderTopLeftRadius) || radius;
      // The fill sits one pixel in from the bar's own edge on each side, and fills its height.
      boxes[index]?.set(box.left - client.left + 1, box.top - client.top, box.right - client.left - 1, box.bottom - client.top);
      if (bar.dataset.selected === 'true') selected = index;
      if (bar.dataset.hover === 'true') hovered = index;
    });
    const head = track.querySelector<HTMLElement>('[data-playhead]')?.getBoundingClientRect();
    const target = Number.parseFloat(track.style.getPropertyValue('--p'));
    return {
      boxes,
      radius,
      target: Number.isFinite(target) ? target : 0,
      following: track.dataset.following === 'true',
      selected,
      hovered,
      phase: root.dataset.phase ?? 'idle',
      enteredAt: Number.parseFloat(root.getAttribute('data-entered-at') ?? '') || 0,
      width: client.width,
      columnTop: boxes[selected]?.y ?? 0,
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
      let busy = false;

      // The entrance is the DOM's: armed shows nothing, play shows the part of it that has run, anything else is the settled page.
      // A stage that draws one frame for each change (the still tier) has no time to run it in, and shows the settled page.
      const elapsed = read.phase === 'play' && live ? performance.now() - read.enteredAt : Number.POSITIVE_INFINITY;
      const armed = read.phase === 'armed';
      const playing = elapsed < SWEEP_MS + BAR_MS;
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

      const rest = read.boxes[read.selected];
      const columnTarget = rest ? (rest.x + rest.z) / 2 / read.width : 0;
      const playTarget = read.target;
      if (playhead.value < 0 || !live || read.following) {
        playhead.value = playTarget;
        playhead.velocity = 0;
      } else busy = stepSpring(playhead, playTarget, spring.settle, seconds) || busy;
      if (column.value < 0 || !live) {
        column.value = columnTarget;
        column.velocity = 0;
      } else busy = stepSpring(column, columnTarget, spring.settle, seconds) || busy;

      const sweep = armed ? 0 : Number.isFinite(elapsed) ? unit(elapsed / SWEEP_MS) : 1;
      const arrive = armed ? 0 : Number.isFinite(elapsed) ? easeOut((elapsed - SWEEP_MS) / BAR_MS) : 1;
      const front = sweep * sweep * (3 - 2 * sweep);
      const playX = (Number.isFinite(elapsed) ? playhead.value * front : playhead.value) * read.width;

      uniforms.uOrigin.value = [input.viewport.x * input.pixelRatio, input.viewport.y * input.pixelRatio];
      uniforms.uSize.value = [input.viewport.width, input.viewport.height];
      uniforms.uPixel.value = input.pixelRatio;
      uniforms.uRadius.value = read.radius;
      uniforms.uPlay.value.set(playX, read.playTop, read.playBottom, armed ? 0 : 1);
      uniforms.uColumn.value.set(column.value * read.width, Math.min(Math.max(((rest?.z ?? 0) - (rest?.x ?? 0)) / 4, 14), 70), read.columnTop, arrive);
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
