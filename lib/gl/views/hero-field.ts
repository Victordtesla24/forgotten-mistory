/**
 * The hero field: receding lanes of fine ruler ticks behind the type. On load the lanes
 * unfurl from the nearest to the farthest, a band of light crosses them once, and the
 * drift eases to a stop; after that the field is still and the page draws nothing. A fine
 * pointer leans the camera, and carries a bloom, about 200 px across, that lights the ticks it
 * passes over; both settle again when it stops. The field is held back behind the headline
 * and the line under it, to 15% with a soft falloff of 48 px, so a tick never strikes through
 * a word. Everything is a function of the view's clock, so a frame at any moment can be
 * reproduced.
 */

import {
  LineSegments,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector3,
  Vector4,
  type WebGLRenderer,
} from 'three';

import { entrance } from '../../entrance';
import { spring, stagger, stepSpring, type SpringState } from '../../motion';
import { hairline } from '../glsl/aa';
import { finish } from '../glsl/finish';
import { palette } from '../palette';
import { createRulerGeometry, type RulerLane } from '../ruler';
import type { LiveTier } from '../tier';
import type { FrameInput, View, ViewContext } from './types';

/** Seconds from the first frame until the drift has stopped. */
const SETTLE_S = 3.2;

/** Seconds the entrance takes: lanes start a stagger step apart and each grows for `entrance`. */
const ENTRANCE_S = entrance.field.for / 1000;
const STAGGER_S = stagger.max / 1000;
const LANE_STEPS = stagger.steps - 1;

/** Seconds the band of light takes to cross the field, starting just after the first lane. */
const SWEEP_START_S = 0.15;
const SWEEP_S = 1.3;

const FOV = 30;
const CAMERA_HEIGHT = 5.4;
const CAMERA_Z = 12;
const LOOK_AT = new Vector3(-2, -3.4, -34);

/** The wider-than-this aspect the field is composed for; narrower views crop it from the right. */
const MIN_ASPECT = 1.5;

/** What is left of the field under the type, and how far beyond the type it takes to come back, in CSS px. */
const TYPE_FLOOR = 0.15;
const TYPE_FALLOFF = 48;

/** The pointer's bloom: its spread (a standard deviation) in CSS px; the glow reaches about twice that. */
const BLOOM_SPREAD = 95;

/** How far the pointer leans the camera, in world units, at the edge of the view. */
const LEAN_X = 2.4;
const LEAN_Y = 1;

interface LaneSet {
  count: number;
  /** World distance between ticks. All lanes share it, so ticks line up from lane to lane. */
  pitch: number;
}

const LANES: Readonly<Record<LiveTier, LaneSet>> = {
  high: { count: 20, pitch: 0.42 },
  low: { count: 11, pitch: 0.66 },
  still: { count: 20, pitch: 0.42 },
};

/** World width the lanes must cover at distance d: the widest view the field is composed for, with margin. */
const WIDTH_PER_DISTANCE = 1.9;

/** The whole drift is this many ticks, so the field comes to rest on its grid. */
const DRIFT_TICKS = 12;

function createLanes(tier: LiveTier): RulerLane[] {
  const { count, pitch } = LANES[tier];
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const distance = 13 + 82 * t ** 1.6;
    // An even count puts a tick at x = 0 on every lane, and the phase makes it a major one.
    const ticks = 2 * Math.ceil((WIDTH_PER_DISTANCE * distance) / pitch / 2);
    return {
      ticks,
      pitch,
      depth: CAMERA_Z - distance,
      height: 0,
      phase: (((-ticks / 2) % 10) + 10) % 10,
    };
  });
}

/** GLSL both fragment shaders share: the type's mask and the pointer's bloom, in CSS pixels from the view's bottom left. */
const typeMask = /* glsl */ `
float typeMask(vec2 frag) {
  vec2 centre = 0.5 * (uMask.xy + uMask.zw);
  vec2 half_ = 0.5 * (uMask.zw - uMask.xy);
  vec2 beyond = max(abs(frag - centre) - half_, 0.0);
  return mix(${TYPE_FLOOR.toFixed(2)}, 1.0, smoothstep(0.0, ${TYPE_FALLOFF.toFixed(1)}, length(beyond) / uPixel));
}
`;

const bloom = /* glsl */ `
float pointerBloom(vec2 frag) {
  vec2 away = (frag - uPointer.xy * uSize) / uPixel;
  return uPointer.z * exp(-dot(away, away) / ${(2 * BLOOM_SPREAD * BLOOM_SPREAD).toFixed(1)});
}
`;

const lineVertex = /* glsl */ `
attribute float aLane;
attribute float aKind;
attribute float aSpan;

uniform float uTime;
uniform float uDrift;
uniform float uTickHeight;

varying float vKind;
varying float vVisible;

float easeOut(float x) {
  return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0);
}

void main() {
  float isTick = step(aKind, 2.5);
  float settle = 1.0 - pow(1.0 - clamp(uTime / ${SETTLE_S.toFixed(3)}, 0.0, 1.0), 4.0);
  float wrapped = mod(position.x - uDrift * settle + aSpan * 0.5, aSpan) - aSpan * 0.5;
  float x = mix(position.x, wrapped, isTick);

  float scale = aKind < 0.5 ? 0.38 : (aKind < 1.5 ? 0.62 : 1.0);
  float delay = floor(aLane * ${LANE_STEPS.toFixed(1)} + 0.5) * ${STAGGER_S.toFixed(3)};
  float grow = easeOut((uTime - delay) / ${ENTRANCE_S.toFixed(3)});

  vec4 view = modelViewMatrix * vec4(x, position.y * uTickHeight * scale * grow, position.z, 1.0);
  vKind = aKind;
  vVisible = grow * (0.2 + 0.8 * smoothstep(14.0, 34.0, -view.z)) * (1.0 - 0.8 * smoothstep(40.0, 105.0, -view.z));
  gl_Position = projectionMatrix * view;
}
`;

const lineFragment = /* glsl */ `
uniform vec3 uAccent;
uniform vec3 uMuted;
uniform vec3 uLine;
uniform float uDark;
uniform float uTime;
uniform float uQuiet;
uniform vec2 uOrigin;
uniform vec2 uSize;
uniform float uPixel;
uniform vec4 uMask;
uniform vec3 uPointer;

varying float vKind;
varying float vVisible;

${finish}

${typeMask}
${bloom}

float easeInOut(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uOrigin) / uSize;

  float minor = step(vKind, 0.5);
  float mid = step(0.5, vKind) * step(vKind, 1.5);
  float major = step(1.5, vKind) * step(vKind, 2.5);
  float baseline = step(2.5, vKind);

  vec3 tint = mix(uMuted, uAccent, 0.4 * mid + 0.75 * major);
  tint = mix(tint, mix(uLine, uMuted, 0.6), baseline);
  float strength = 0.5 * minor + 0.62 * mid + 0.8 * major + 0.6 * baseline;
  // Light ground: a hairline of muted grey needs more weight to read as much as the same line on dark.
  strength *= mix(1.7, 1.0, uDark);

  float sweepAt = mix(-0.25, 1.35, easeInOut((uTime - ${SWEEP_START_S.toFixed(3)}) / ${SWEEP_S.toFixed(3)}));
  float sweep = exp(-pow((uv.x - sweepAt) / 0.07, 2.0)) * (1.0 - baseline * 0.4);

  float glow = pointerBloom(gl_FragCoord.xy - uOrigin);

  float edge = smoothstep(0.0, 0.16, uv.y) * (1.0 - smoothstep(0.78, 1.0, uv.y));
  edge *= smoothstep(0.0, 0.05, uv.x) * (1.0 - smoothstep(0.95, 1.0, uv.x));
  float quiet = mix(1.0, mix(0.3, 1.0, smoothstep(0.3, 0.74, uv.x)), uQuiet);
  float held = typeMask(gl_FragCoord.xy - uOrigin);

  float alpha = strength * vVisible * edge * quiet;
  alpha = min(alpha + (0.55 * sweep + 0.9 * glow) * vVisible * edge * mix(0.5, 1.0, quiet), 1.0) * held;
  tint = mix(tint, uAccent, clamp(sweep + 1.4 * glow, 0.0, 1.0));

  gl_FragColor = writePixel(tint, alpha);
}
`;

const glowVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uAccent;
uniform float uDark;
uniform float uTime;
uniform vec2 uOrigin;
uniform vec2 uSize;
uniform float uPixel;
uniform vec4 uMask;
uniform vec3 uPointer;
uniform vec2 uHorizon;

${hairline}
${finish}

${typeMask}
${bloom}

void main() {
  vec2 uv = (gl_FragCoord.xy - uOrigin) / uSize;
  float enter = 1.0 - pow(1.0 - clamp(uTime / 1.2, 0.0, 1.0), 3.0);

  float band = exp(-pow((uv.y - uHorizon.y) / 0.13, 2.0)) * smoothstep(0.05, 0.95, uv.x);
  float bloom = exp(-dot((uv - uHorizon) * vec2(1.1, 2.4), (uv - uHorizon) * vec2(1.1, 2.4)) / 0.22);
  float line = hairline((uv.y - uHorizon.y) * uSize.y, 1.0) * smoothstep(0.2, 0.9, uv.x);

  float edge = smoothstep(0.0, 0.16, uv.y) * (1.0 - smoothstep(0.78, 1.0, uv.y));
  edge *= smoothstep(0.0, 0.05, uv.x) * (1.0 - smoothstep(0.95, 1.0, uv.x));

  float alpha = (mix(0.07, 0.15, uDark) * (0.55 * band + 0.7 * bloom) + 0.22 * line) * enter * edge;
  // The pointer's own light, soft and wide, held back behind the type like the ticks.
  alpha += mix(0.13, 0.17, uDark) * pointerBloom(gl_FragCoord.xy - uOrigin) * typeMask(gl_FragCoord.xy - uOrigin);
  alpha *= 1.0 + grain(gl_FragCoord.xy) * 0.2;

  gl_FragColor = writePixel(uAccent, max(alpha, 0.0));
}
`;

function spot(): SpringState {
  return { value: 0, velocity: 0 };
}

/** Creates the hero field for `context.tier`. */
export function createHeroField(context: ViewContext): View {
  const camera = new PerspectiveCamera(FOV, 2, 0.1, 400);
  const lean = { x: spot(), y: spot() };
  const light = { x: spot(), y: spot(), strength: spot() };
  light.x.value = 0.5;
  light.y.value = 0.5;

  const shared = {
    uTime: { value: 0 },
    uOrigin: { value: [0, 0] as [number, number] },
    uSize: { value: [1, 1] as [number, number] },
    uPixel: { value: 1 },
    uMask: { value: new Vector4(0, 0, 0, 0) },
    uPointer: { value: new Vector3(0.5, 0.5, 0) },
    uDark: palette.dark,
  };

  const lineMaterial = new ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    uniforms: {
      ...shared,
      uAccent: palette.colors.accent,
      uMuted: palette.colors.muted,
      uLine: palette.colors.lineStrong,
      uDrift: { value: DRIFT_TICKS * LANES[context.tier].pitch },
      uTickHeight: { value: 0.24 },
      uQuiet: { value: 1 },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });

  const glowMaterial = new ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: {
      ...shared,
      uAccent: palette.colors.accent,
      uHorizon: { value: [0.85, 0.7] as [number, number] },
    },
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });

  const glow = new Mesh(new PlaneGeometry(2, 2), glowMaterial);
  glow.frustumCulled = false;
  glow.renderOrder = 0;

  const built = createRulerGeometry({ lanes: createLanes(context.tier), mid: 5, major: 10 });
  const lines = new LineSegments(built.geometry, lineMaterial);
  lines.frustumCulled = false;
  lines.renderOrder = 1;

  const scene = new Scene();
  scene.add(glow, lines);
  let cropped = '';
  const probe = new Vector4();

  /** Frames the field for a view of this size: wide views see all of it, narrow ones its right side. */
  function frame(width: number, height: number): void {
    const wide = Math.max(width / height, MIN_ASPECT);
    const key = `${width}x${height}`;
    if (key === cropped) return;
    cropped = key;
    camera.aspect = wide;
    const fullWidth = height * wide;
    if (fullWidth > width) camera.setViewOffset(fullWidth, height, (fullWidth - width) * 0.7, 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    lineMaterial.uniforms.uQuiet.value = width / height > 1.3 ? 1 : 0.55;
  }

  /** Tells the shaders where the type is, so the field can stand back behind it. */
  function holdBackType(client: FrameInput['client'], height: number, pixelRatio: number): void {
    const type = document.getElementById('top')?.getBoundingClientRect();
    if (!type) {
      shared.uMask.value.set(0, 0, 0, 0);
      return;
    }
    shared.uMask.value.set(
      (type.left - client.left) * pixelRatio,
      (height - (type.bottom - client.top)) * pixelRatio,
      (type.right - client.left) * pixelRatio,
      (height - (type.top - client.top)) * pixelRatio,
    );
  }

  function aim(): void {
    camera.position.set(lean.x.value * LEAN_X, CAMERA_HEIGHT + lean.y.value * LEAN_Y, CAMERA_Z);
    camera.lookAt(LOOK_AT);
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    // Where the ground meets the sky: the direction straight ahead on the ground plane.
    probe.set(0, 0, -1, 0).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    const horizon = glowMaterial.uniforms.uHorizon.value as [number, number];
    horizon[0] = 0.86;
    horizon[1] = Math.min(Math.max(0.5 + (probe.y / probe.w) * 0.5, 0.05), 0.95);
  }

  return {
    pointer: true,
    syncToLoad: true,

    update(input: FrameInput): boolean {
      const { time, dt, viewport, pixelRatio, pointer, client } = input;
      frame(viewport.width, viewport.height);

      const seconds = dt / 1000;
      let target = { x: 0, y: 0, inside: false, u: 0.5, v: 0.5 };
      if (pointer.present && context.tier !== 'still') {
        const u = (pointer.x - client.left) / client.width;
        const v = 1 - (pointer.y - client.top) / client.height;
        const inside = u >= 0 && u <= 1 && v >= 0 && v <= 1;
        target = { x: (u - 0.5) * 2, y: (v - 0.5) * 2, inside, u, v };
      }
      const moving = [
        stepSpring(lean.x, target.inside ? target.x : 0, spring.drift, seconds),
        stepSpring(lean.y, target.inside ? target.y : 0, spring.drift, seconds),
        stepSpring(light.x, target.inside ? target.u : light.x.value, spring.drift, seconds),
        stepSpring(light.y, target.inside ? target.v : light.y.value, spring.drift, seconds),
        stepSpring(light.strength, target.inside ? 1 : 0, spring.settle, seconds),
      ].some(Boolean);

      const clock = Math.min(time / 1000, SETTLE_S + 1);
      shared.uTime.value = clock;
      shared.uOrigin.value = [viewport.x * pixelRatio, viewport.y * pixelRatio];
      shared.uSize.value = [viewport.width * pixelRatio, viewport.height * pixelRatio];
      shared.uPixel.value = pixelRatio;
      shared.uPointer.value.set(light.x.value, light.y.value, light.strength.value);
      holdBackType(client, viewport.height, pixelRatio);
      aim();

      return clock < SETTLE_S || moving;
    },

    render(renderer: WebGLRenderer): void {
      renderer.render(scene, camera);
    },

    setTier(tier: LiveTier): void {
      const next = createRulerGeometry({ lanes: createLanes(tier), mid: 5, major: 10 });
      lines.geometry.dispose();
      lines.geometry = next.geometry;
      lineMaterial.uniforms.uDrift.value = DRIFT_TICKS * LANES[tier].pitch;
      context.tier = tier;
    },

    dispose(): void {
      glow.geometry.dispose();
      lines.geometry.dispose();
      glowMaterial.dispose();
      lineMaterial.dispose();
    },
  };
}
