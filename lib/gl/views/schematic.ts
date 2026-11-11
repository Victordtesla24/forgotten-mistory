/**
 * The light layer of a Work card: its schematic's stages drawn as plates in light, on the very geometry of
 * the SVG beside it. `schematicLayout` gives both the same points in one drawing space, and `fitToBox` fits
 * that space to the SVG's own box in both, so a plate's edge in the view lies on the stroke the page draws
 * there. The view paints the scene's backdrop with a soft pool of light, the floor, a halo behind each stage,
 * the three faces of every object in the theme's shades and a rim of light along the edges of each top.
 * The page's drawing keeps the lines, the routes and the lit stage; it lets go of its fills once this
 * has drawn (`Work.module.css`), so the two never stack.
 *
 * Nothing here moves: the view is a function of its box, the theme and the card's entrance, and it asks for
 * another frame only while one of them is changing, so a card at rest draws nothing. While the rail arrives
 * it takes each card's opacity and place from the page, and while a card leans it follows the card's box.
 * The whole view is one draw call.
 */

import { BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, OrthographicCamera, Scene, ShaderMaterial, SRGBColorSpace, type WebGLRenderer } from 'three';

import { projects } from '@/content/work';

import { fitToBox, schematicLayout, type Box, type Point, type SchematicId, type SchematicLayout } from '../../schematic';
import { finish } from '../glsl/finish';
import { palette, type Uniform } from '../palette';
import { poke } from '../signal';
import type { LiveTier } from '../tier';
import type { FrameInput, View, ViewContext, ViewFactory } from './types';

/** What a triangle of the mesh is, in the order the scene is painted. */
const KIND = { backdrop: 0, floor: 1, top: 2, left: 3, right: 4, halo: 5, rim: 6 } as const;

/** How far a halo reaches past the object it lights, as a share of the object's size, and a fixed margin in drawing units. */
const HALO_REACH = 1.7;
const HALO_MARGIN = 6;

/** The rim of light along the top of an object reaches this far to either side of the edge, in CSS pixels. */
const RIM_HALF = 5;

/** The light stays off a card for this long after its rail last scrolled, in milliseconds. */
const RAIL_REST = 160;

/** The tone of a top face's four corners, back, right, front, left: the light comes from behind. */
const TONES = [1, 0.55, 0.1, 0.55] as const;

/** The strength of each light, on a dark and on a light page. */
const LIGHT = {
  pool: { dark: 0.05, light: 0.035 },
  halo: { dark: 0.14, light: 0.09 },
  rim: { dark: 0.3, light: 0.2 },
} as const;

/** The attributes of the one mesh: where a vertex is and what it is, and what its kind needs besides. */
interface Mesh3 {
  position: number[];
  a: number[];
  b: number[];
  c: number[];
}

function vertex(mesh: Mesh3, kind: number, at: Point, a: readonly [number, number] = [0, 0], b: readonly number[] = [0, 0, 0, 0], c: readonly number[] = [0, 0, 0, 0]): void {
  mesh.position.push(at.x, at.y, kind);
  mesh.a.push(a[0], a[1], 0, 0);
  mesh.b.push(b[0] ?? 0, b[1] ?? 0, b[2] ?? 0, b[3] ?? 0);
  mesh.c.push(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, c[3] ?? 0);
}

/** Two triangles for the four corners of a convex quad, in order round it. */
function quad(mesh: Mesh3, kind: number, corners: readonly Point[], tones: readonly number[] = [0, 0, 0, 0]): void {
  for (const at of [0, 1, 2, 0, 2, 3]) {
    const corner = corners[at];
    if (corner) vertex(mesh, kind, corner, [tones[at] ?? 0, 0]);
  }
}

/** The layout of the SVG a schematic's card draws, and the mesh of its scene: every layer, in the order it is painted, from that layout. */
function build(id: SchematicId): { layout: SchematicLayout; mesh: Mesh3 } {
  const project = projects.find((entry) => entry.schematic.id === id);
  if (!project) throw new Error(`no project has the schematic ${id}`);
  const layout = schematicLayout(project.schematic, 'card');
  const mesh: Mesh3 = { position: [], a: [], b: [], c: [] };

  // The backdrop covers the whole view: its corners are in clip space.
  for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]] as const) vertex(mesh, KIND.backdrop, { x: 0, y: 0 }, [x, y]);
  for (const shape of layout.floor) quad(mesh, KIND.floor, shape);

  for (const node of layout.nodes) {
    const points = node.prisms.flatMap((prism) => [...prism.top, ...prism.left, ...prism.right]);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const [centre, reach] = [{ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, { x: ((x1 - x0) / 2) * HALO_REACH + HALO_MARGIN, y: ((y1 - y0) / 2) * HALO_REACH + HALO_MARGIN }];
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
    for (const at of [0, 1, 2, 0, 2, 3]) {
      const [x, y] = corners[at] ?? [0, 0];
      vertex(mesh, KIND.halo, { x: centre.x + x * reach.x, y: centre.y + y * reach.y }, [x, y]);
    }
  }

  for (const node of layout.nodes) {
    for (const prism of node.prisms) {
      quad(mesh, KIND.left, prism.left);
      quad(mesh, KIND.right, prism.right);
      quad(mesh, KIND.top, prism.top, TONES);
    }
    for (const prism of node.prisms) {
      const [p0, p1, p2, p3] = prism.top;
      if (!p0 || !p1 || !p2 || !p3) continue;
      const [x0, x1] = [Math.min(p0.x, p1.x, p2.x, p3.x), Math.max(p0.x, p1.x, p2.x, p3.x)];
      const [y0, y1] = [Math.min(p0.y, p1.y, p2.y, p3.y), Math.max(p0.y, p1.y, p2.y, p3.y)];
      const corners = [[x0, y0, -1, -1], [x1, y0, 1, -1], [x1, y1, 1, 1], [x0, y1, -1, 1]] as const;
      for (const at of [0, 1, 2, 0, 2, 3]) {
        const [x, y, dx, dy] = corners[at] ?? [0, 0, 0, 0];
        vertex(mesh, KIND.rim, { x, y }, [dx, dy], [p0.x, p0.y, p1.x, p1.y], [p2.x, p2.y, p3.x, p3.y]);
      }
    }
  }
  return { layout, mesh };
}

const vertexShader = /* glsl */ `
attribute vec4 aA;
attribute vec4 aB;
attribute vec4 aC;

uniform vec2 uSize;
uniform vec3 uFit;
uniform float uHalf;

varying float vKind;
varying vec2 vCss;
varying vec2 vLocal;
varying float vTone;
varying vec4 vP01;
varying vec4 vP23;

/** A point of the drawing space, in CSS pixels from the view's top left. */
vec2 toCss(vec2 p) {
  return uFit.xy + p * uFit.z;
}

void main() {
  float kind = position.z;
  vKind = kind;
  vTone = 0.0;
  vLocal = vec2(0.0);
  vP01 = vec4(0.0);
  vP23 = vec4(0.0);
  vec2 css;
  if (kind < 0.5) {
    css = (vec2(aA.x, -aA.y) * 0.5 + 0.5) * uSize;
  } else {
    css = toCss(position.xy);
    if (kind < 2.5) {
      vTone = aA.x;
    } else if (kind > 4.5 && kind < 5.5) {
      vLocal = aA.xy;
    } else if (kind > 5.5) {
      css += aA.xy * uHalf;
      vP01 = vec4(toCss(aB.xy), toCss(aB.zw));
      vP23 = vec4(toCss(aC.xy), toCss(aC.zw));
    }
  }
  vCss = css;
  gl_Position = vec4(css.x / uSize.x * 2.0 - 1.0, 1.0 - css.y / uSize.y * 2.0, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec2 uSize;
uniform float uHalf;
uniform float uRadius;
uniform float uEnter;
uniform float uPool;
uniform float uHalo;
uniform float uRim;
uniform vec3 uBg;
uniform vec3 uAccent;
uniform vec3 uGround;
uniform vec3 uTop;
uniform vec3 uLeft;
uniform vec3 uRight;

varying float vKind;
varying vec2 vCss;
varying vec2 vLocal;
varying float vTone;
varying vec4 vP01;
varying vec4 vP23;

${finish}

/** The card is round at its top corners and the backdrop is cut to them: the canvas lies behind the card, which does not clip it. */
float cornerMask() {
  vec2 edge = vec2(min(vCss.x, uSize.x - vCss.x), vCss.y);
  float outside = length(max(vec2(uRadius) - edge, 0.0)) - uRadius;
  return 1.0 - clamp(outside + 0.5, 0.0, 1.0);
}

float edgeDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float along = clamp(dot(pa, ba) / max(dot(ba, ba), 0.000001), 0.0, 1.0);
  return length(pa - ba * along);
}

void main() {
  vec3 colour = uBg;
  float alpha = 1.0;
  if (vKind < 0.5) {
    vec2 c = (vCss / uSize - 0.5) * vec2(1.0, 0.9);
    colour = mix(uBg, uAccent, uPool * exp(-dot(c, c) * 6.0));
    alpha = cornerMask();
  } else if (vKind < 1.5) {
    colour = uGround;
  } else if (vKind < 2.5) {
    colour = mix(uTop, uAccent, 0.1 * vTone);
  } else if (vKind < 3.5) {
    colour = uLeft;
  } else if (vKind < 4.5) {
    colour = uRight;
  } else if (vKind < 5.5) {
    float fall = 1.0 - clamp(length(vLocal), 0.0, 1.0);
    colour = uAccent;
    alpha = uHalo * fall * fall;
  } else {
    float d = min(min(edgeDistance(vCss, vP01.xy, vP01.zw), edgeDistance(vCss, vP01.zw, vP23.xy)), min(edgeDistance(vCss, vP23.xy, vP23.zw), edgeDistance(vCss, vP23.zw, vP01.xy)));
    float fall = 1.0 - clamp(d / uHalf, 0.0, 1.0);
    colour = uAccent;
    alpha = uRim * fall * fall;
  }
  gl_FragColor = writePixel(colour, alpha * uEnter);
}
`;

const channels = { r: 0, g: 0, b: 0 };
const other = { r: 0, g: 0, b: 0 };

/** `from` taken `share` of the way to `to`, mixed in sRGB as the page's `color-mix(in srgb, ...)` mixes the same tokens. */
function mix(from: Color, to: Color, share: number, into: Color): Color {
  from.getRGB(channels, SRGBColorSpace);
  to.getRGB(other, SRGBColorSpace);
  return into.setRGB(channels.r + (other.r - channels.r) * share, channels.g + (other.g - channels.g) * share, channels.b + (other.b - channels.b) * share, SRGBColorSpace);
}

/** The radius of the card's inner edge: the token its corners are rounded with, less its hairline. */
function cardRadius(): number {
  const radius = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-md'));
  return Number.isFinite(radius) ? Math.max(radius - 1, 0) : 0;
}

/** `box` of `element` measured from the top left of `origin`, as the page lays them out now (a leaning card's included). */
function boxWithin(element: Element, origin: DOMRect): Box {
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
}

/** The view of one schematic. */
export function createSchematicView(id: SchematicId): ViewFactory {
  return (context: ViewContext): View => {
    const { element } = context;
    const { layout, mesh: built } = build(id);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(built.position), 3));
    geometry.setAttribute('aA', new BufferAttribute(new Float32Array(built.a), 4));
    geometry.setAttribute('aB', new BufferAttribute(new Float32Array(built.b), 4));
    geometry.setAttribute('aC', new BufferAttribute(new Float32Array(built.c), 4));
    const colours = { ground: new Color(), top: new Color(), left: new Color(), right: new Color() };
    const uniforms: Record<string, Uniform<unknown>> = {
      uSize: { value: [1, 1] },
      uFit: { value: [0, 0, 1] },
      uHalf: { value: RIM_HALF },
      uRadius: { value: cardRadius() },
      uEnter: { value: 1 },
      uPool: { value: 0 },
      uHalo: { value: 0 },
      uRim: { value: 0 },
      uBg: palette.colors.bg,
      uAccent: palette.colors.accent,
      uGround: { value: colours.ground },
      uTop: { value: colours.top },
      uLeft: { value: colours.left },
      uRight: { value: colours.right },
    };
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      premultipliedAlpha: true,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const plates = new Mesh(geometry, material);
    plates.frustumCulled = false;
    const scene = new Scene();
    scene.add(plates);
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const drawing = element.parentElement?.querySelector<SVGSVGElement>(':scope > svg') ?? null;
    const section = element.closest<HTMLElement>('section');
    const slot = element.closest<HTMLElement>('li');
    // The page tells the view when its rail begins to arrive and when it has landed: one frame each, and the view wakes for them.
    const watcher = new MutationObserver(() => poke(element.dataset.stageView ?? ''));
    if (section) watcher.observe(section, { attributes: true, attributeFilter: ['data-entrance'] });
    let before = '';

    // A rail that scrolls sideways (below 1280 px) moves its cards ahead of the stage: while it does, and for a moment after,
    // the page's drawing shows in full (`data-moving`, `Work.module.css`), and the light returns on the card where it rests.
    const rail = element.closest('ul');
    let rest = 0;
    const onRail = () => {
      element.dataset.moving = '';
      window.clearTimeout(rest);
      rest = window.setTimeout(() => {
        delete element.dataset.moving;
        poke(element.dataset.stageView ?? '');
      }, RAIL_REST);
    };
    rail?.addEventListener('scroll', onRail, { passive: true });

    return {
      pointer: false,
      syncToLoad: false,

      update(input: FrameInput): boolean {
        const { client, viewport } = input;
        const origin = new DOMRect(client.left, client.top, client.width, client.height);
        const box = drawing ? boxWithin(drawing, origin) : { x: 0, y: 0, width: client.width, height: client.height };
        const fit = fitToBox(layout, box);
        const phase = section?.dataset.entrance;
        const arriving = phase === 'armed' || phase === 'play';
        const opacity = arriving && slot ? Number.parseFloat(getComputedStyle(slot).opacity) : 1;

        const dark = palette.dark.value;
        const { bg, surface, raised, text } = palette.colors;
        mix(bg.value, text.value, 0.04, colours.ground);
        if (dark === 1) {
          colours.top.copy(raised.value);
          colours.left.copy(surface.value);
          mix(surface.value, bg.value, 0.55, colours.right);
        } else {
          colours.top.copy(surface.value);
          colours.left.copy(raised.value);
          mix(bg.value, text.value, 0.09, colours.right);
        }
        const share = dark === 1 ? 'dark' : 'light';
        uniforms.uSize.value = [viewport.width, viewport.height];
        uniforms.uFit.value = [fit.x, fit.y, fit.scale];
        uniforms.uEnter.value = Number.isFinite(opacity) ? opacity : 1;
        uniforms.uPool.value = LIGHT.pool[share];
        uniforms.uHalo.value = LIGHT.halo[share];
        uniforms.uRim.value = LIGHT.rim[share];

        // Another frame while the card's own box or the entrance is changing; none once two frames in a row agree.
        const now = [box.x, box.y, box.width, box.height, client.width, client.height, opacity].map((value) => value.toFixed(3)).join(' ');
        const moving = now !== before;
        before = now;
        return moving || phase === 'play';
      },

      render(renderer: WebGLRenderer): void {
        renderer.render(scene, camera);
      },

      setTier(tier: LiveTier): void {
        context.tier = tier;
      },

      dispose(): void {
        watcher.disconnect();
        rail?.removeEventListener('scroll', onRail);
        window.clearTimeout(rest);
        delete element.dataset.moving;
        geometry.dispose();
        material.dispose();
      },
    };
  };
}
