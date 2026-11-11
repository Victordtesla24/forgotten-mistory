/**
 * The layout of a project's schematic, written once for every layer that draws it. Each
 * schematic is an isometric drawing of the three stages in `content/work.ts`, joined by the
 * path the work takes. The composition belongs to `schematic.id` (a line that ends in a gate,
 * a loop that returns to its first stage, stacked bands, a diamond chart, a source that
 * becomes pages and reaches an edge); the stages, their order and their ids come from the
 * data. The answer is plain geometry in a fixed drawing space, so the SVG the page draws, a
 * later stage view and a test all read the very same points and agree to the pixel.
 */

import type { Schematic } from '@/content/work';

import { duration } from './motion';

export type SchematicId = Schematic['id'];

export interface Point {
  x: number;
  y: number;
}

/** A line between two points of the drawing. */
export type Segment = readonly [Point, Point];

/** One box in isometric view: the faces that are seen. */
export interface Prism {
  top: readonly Point[];
  left: readonly Point[];
  right: readonly Point[];
}

export type NodeKind = 'block' | 'gate' | 'slab' | 'tile' | 'tower';

/** A stage of the work, drawn as one object. */
export interface SchematicNode {
  /** The stage's place in order, 0 to 2. */
  index: 0 | 1 | 2;
  /** The stage's id in `content/work.ts`. */
  id: string;
  kind: NodeKind;
  prisms: readonly Prism[];
  /** Fine lines on the object's top: the rows of a page, the cells of a grid. */
  lines: readonly Segment[];
  /** Where the path reaches the object: the middle of its top. */
  anchor: Point;
}

/** The way the work goes from one stage to the next, or back to an earlier one. */
export interface SchematicRoute {
  kind: 'forward' | 'return';
  from: 0 | 1 | 2;
  to: 0 | 1 | 2;
  /** A polyline; a curve is sampled finely enough to look smooth at any size it is drawn. */
  points: readonly Point[];
}

export interface SchematicLayout {
  id: SchematicId;
  /** The drawing space of its place, in the units every point is in. */
  width: number;
  height: number;
  /** Flat shapes on the floor under the objects: the chart of a diamond, the ground of an export. */
  floor: readonly (readonly Point[])[];
  /** Fine lines on the floor. */
  floorLines: readonly Segment[];
  /** The three stages in the order of the work. They are drawn in this order, and no composition lets a later one hide an earlier. */
  nodes: readonly [SchematicNode, SchematicNode, SchematicNode];
  routes: readonly SchematicRoute[];
}

export type Place = 'card' | 'panel';

/**
 * The drawing space a schematic is fitted to: a card's is upright, as its rail makes it; the panel's
 * lead is wider. The same composition is fitted to either, and each is only scaled to the box it is in.
 */
const SPACES: Readonly<Record<Place, { width: number; height: number }>> = {
  card: { width: 180, height: 224 },
  panel: { width: 240, height: 180 },
};

/** How long a running schematic lights one stage before it goes on to the next, in milliseconds. */
export const STAGE_STEP = duration.entrance;

/** Room kept clear around the drawing, so a line at its edge is never cut. */
const MARGIN = 6;

/** The id of the view that draws a project's schematic, as its placeholder carries it in `data-stage-view`. */
export function schematicView(id: SchematicId, place: Place): string {
  return place === 'card' ? `schematic-${id}` : `schematic-${id}-panel`;
}

// Isometric projection: an axis unit is one unit long on screen. `u` runs down and to the right,
// `v` down and to the left and `z` straight up.
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

const project = (u: number, v: number, z = 0): Point => ({ x: (u - v) * COS, y: (u + v) * SIN - z });

type Cell = readonly [u: number, v: number];

interface NodeSpec {
  /** Where it stands on the floor, and how far above it. */
  at: readonly [u: number, v: number, lift?: number];
  kind: NodeKind;
}

type Route = { kind: 'forward' } | { kind: 'return'; from: 0 | 1 | 2; to: 0 | 1 | 2; bulge: Cell };

interface Composition {
  nodes: readonly [NodeSpec, NodeSpec, NodeSpec];
  /** The forward routes run from stage 1 to 2 and from 2 to 3, in that order; a return follows them. */
  routes: readonly Route[];
  floor?: 'chart' | 'ground';
}

/**
 * Where each stage stands and how the work travels, for each schematic. Positions are cells of
 * the floor in the (u, v) plane; the layout turns them into points.
 */
const compositions: Readonly<Record<SchematicId, Composition>> = {
  // A line of work that ends in a gate.
  'pipeline-gate': {
    nodes: [{ at: [-4.5, -0.5], kind: 'block' }, { at: [0, -0.5], kind: 'block' }, { at: [4.5, -0.5], kind: 'gate' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }],
  },
  // Three stages round a triangle, and the last returns to the first by a long way round.
  'rebuild-loop': {
    nodes: [{ at: [-3.2, -3.2], kind: 'block' }, { at: [2.8, -1.4], kind: 'tile' }, { at: [-1.4, 2.8], kind: 'block' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }, { kind: 'return', from: 2, to: 0, bulge: [-3.6, -0.4] }],
  },
  // Work and its verifier go round a short loop; the exit leaves it.
  'verifier-loop': {
    nodes: [{ at: [-4, -3], kind: 'block' }, { at: [0, -3], kind: 'block' }, { at: [0, 4.4], kind: 'tower' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }, { kind: 'return', from: 1, to: 0, bulge: [0, -2] }],
  },
  // Three bands, one above the next, with the work rising through them.
  'reconstruction-bands': {
    nodes: [{ at: [0, 0, 0], kind: 'slab' }, { at: [0, 0, 3], kind: 'slab' }, { at: [0, 0, 6], kind: 'slab' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }],
  },
  // The Vedic chart: a diamond of houses, with the stages on its points.
  'diamond-chart': {
    nodes: [{ at: [-4.1, 4.1], kind: 'tower' }, { at: [-4.1, -4.1], kind: 'tower' }, { at: [4.1, -4.1], kind: 'tower' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }],
    floor: 'chart',
  },
  // A source, the pages built from it and the edge that serves them, on one stretch of ground.
  'static-export': {
    nodes: [{ at: [0, -5], kind: 'block' }, { at: [0, 0], kind: 'tile' }, { at: [0, 5], kind: 'slab' }],
    routes: [{ kind: 'forward' }, { kind: 'forward' }],
    floor: 'ground',
  },
};

// What each kind of object measures, in cells: width along u, depth along v, height up.
const sizes: Readonly<Record<NodeKind, readonly [w: number, d: number, h: number]>> = {
  block: [1.9, 1.9, 1.9],
  gate: [0.7, 0.7, 2.6],
  slab: [4.2, 3.2, 0.7],
  tile: [3.2, 3.2, 0.35],
  tower: [1.5, 1.5, 3.4],
};

/** The way between the two posts of a gate, in cells. */
const GATE_REACH = 1.5;

/** A box standing at (u, v), `lift` above the floor, as the three faces a viewer sees. */
function prism(u: number, v: number, lift: number, w: number, d: number, h: number): Prism {
  const [u0, u1, v0, v1] = [u - w / 2, u + w / 2, v - d / 2, v + d / 2];
  const roof = lift + h;
  return {
    top: [project(u0, v0, roof), project(u1, v0, roof), project(u1, v1, roof), project(u0, v1, roof)],
    right: [project(u1, v0, roof), project(u1, v1, roof), project(u1, v1, lift), project(u1, v0, lift)],
    left: [project(u0, v1, roof), project(u1, v1, roof), project(u1, v1, lift), project(u0, v1, lift)],
  };
}

/** Evenly spaced lines across a top face of `w` by `d` at height `z`, `cells` to a side. */
function gridLines(u: number, v: number, z: number, w: number, d: number, cells: number): Segment[] {
  const lines: Segment[] = [];
  for (let i = 1; i < cells; i += 1) {
    const du = -w / 2 + (w * i) / cells;
    const dv = -d / 2 + (d * i) / cells;
    lines.push([project(u + du, v - d / 2, z), project(u + du, v + d / 2, z)]);
    lines.push([project(u - w / 2, v + dv, z), project(u + w / 2, v + dv, z)]);
  }
  return lines;
}

function build(spec: NodeSpec, index: 0 | 1 | 2, id: string): SchematicNode {
  const [u, v, lift = 0] = spec.at;
  const [w, d, h] = sizes[spec.kind];
  if (spec.kind === 'gate') {
    // Two posts either side of the way, and the bar across them.
    const posts = [prism(u, v - GATE_REACH, lift, w, d, h), prism(u, v + GATE_REACH, lift, w, d, h)];
    const bar = prism(u, v, lift + h - 0.35, 0.7, GATE_REACH * 2 + d, 0.35);
    return { index, id, kind: 'gate', prisms: [...posts, bar], lines: [], anchor: project(u, v, lift + h / 2) };
  }
  // A tile shows its pages as a grid of three; a slab its rows as two lines across.
  const lines =
    spec.kind === 'tile' ? gridLines(u, v, lift + h, w, d, 3) : spec.kind === 'slab' ? gridLines(u, v, lift + h, w, d, 3).filter((_, at) => at % 2 === 1) : [];
  return { index, id, kind: spec.kind, prisms: [prism(u, v, lift, w, d, h)], lines, anchor: project(u, v, lift + h) };
}

/** The diamond of the Vedic chart, as a rhombus on the floor with the lines of its twelve houses. */
function chart(): { shape: Point[]; lines: Segment[] } {
  const r = 5.2;
  const at = (u: number, v: number) => project(u, v);
  const mids = [at(0, -r), at(r, 0), at(0, r), at(-r, 0)] as const;
  return {
    shape: [at(-r, -r), at(r, -r), at(r, r), at(-r, r)],
    lines: [
      [at(-r, -r), at(r, r)],
      [at(r, -r), at(-r, r)],
      [mids[0], mids[1]],
      [mids[1], mids[2]],
      [mids[2], mids[3]],
      [mids[3], mids[0]],
    ],
  };
}

/** The ground a source, its pages and their edge stand on. */
function ground(): Point[] {
  const [w, d] = [3.6, 13.6];
  return [project(-w / 2, -d / 2), project(w / 2, -d / 2), project(w / 2, d / 2), project(-w / 2, d / 2)];
}

/** Where a route meets a stage: the middle of its top, or the middle of the opening of a gate. */
function meeting(spec: NodeSpec): readonly [u: number, v: number, z: number] {
  const [u, v, lift = 0] = spec.at;
  const h = sizes[spec.kind][2];
  return [u, v, lift + (spec.kind === 'gate' ? h / 2 : h)];
}

/** How far a route stays clear of a stage, measured along the floor; a gate is entered. */
function clearance(kind: NodeKind): number {
  if (kind === 'gate') return 0.2;
  const [w, d] = sizes[kind];
  return Math.max(w, d) / 2 + 0.3;
}

/** The routes of a composition, as polylines drawn from the middle of one stage to the middle of the next. */
function routesOf(composition: Composition): SchematicRoute[] {
  const out: SchematicRoute[] = [];
  let leg = 0;
  for (const route of composition.routes) {
    const from = route.kind === 'forward' ? (leg as 0 | 1) : route.from;
    const to = route.kind === 'forward' ? ((leg + 1) as 1 | 2) : route.to;
    if (route.kind === 'forward') leg += 1;
    const a = composition.nodes[from];
    const b = composition.nodes[to];
    const [au, av, az] = meeting(a);
    const [bu, bv, bz] = meeting(b);
    const along = Math.hypot(bu - au, bv - av);
    if (along === 0) {
      // Stacked: the work crosses the gap between the two, from the top of the lower to the underside of the upper.
      const up = bz > az;
      const [z0, z1] = up ? [az + 0.25, (b.at[2] ?? 0) - 0.25] : [(a.at[2] ?? 0) - 0.25, bz + 0.25];
      out.push({ kind: route.kind, from, to, points: [project(au, av, z0), project(bu, bv, z1)] });
      continue;
    }
    // The share of the way, from each end, that is clear of the stage there.
    const [t0, t1] = [clearance(a.kind) / along, 1 - clearance(b.kind) / along];
    const at = (t: number, bow: number): Point => {
      const [bowU, bowV] = route.kind === 'return' ? route.bulge : [0, 0];
      return project(au + (bu - au) * t + bowU * bow, av + (bv - av) * t + bowV * bow, az + (bz - az) * t);
    };
    // A return edge bows out sideways, most in the middle; a forward one is straight.
    const steps = route.kind === 'return' ? 20 : 1;
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const t = t0 + ((t1 - t0) * i) / steps;
      return at(t, 4 * t * (1 - t));
    });
    out.push({ kind: route.kind, from, to, points });
  }
  return out;
}

/** The corners of the arrowhead at the end of a route: a small triangle pointing along its last stretch. */
export function arrowHead(points: readonly Point[]): readonly Point[] {
  const tip = points[points.length - 1];
  const before = points[Math.max(0, points.length - 3)];
  if (!tip || !before) return [];
  const length = Math.hypot(tip.x - before.x, tip.y - before.y) || 1;
  const [dx, dy] = [(tip.x - before.x) / length, (tip.y - before.y) / length];
  const size = 6;
  const base = { x: tip.x - dx * size, y: tip.y - dy * size };
  const wing = size * 0.5;
  return [tip, { x: base.x - dy * wing, y: base.y + dx * wing }, { x: base.x + dy * wing, y: base.y - dx * wing }];
}

/**
 * The layout of one project's schematic, fitted to the space of its place. Pure: the same schematic always
 * gives the same points, which is what lets the DOM drawing and the stage view coincide.
 */
export function schematicLayout(schematic: Schematic, place: Place = 'card'): SchematicLayout {
  const space = SPACES[place];
  const composition = compositions[schematic.id];
  const nodes = composition.nodes.map((spec, at) => build(spec, at as 0 | 1 | 2, schematic.stages[at as 0 | 1 | 2].id)) as unknown as SchematicLayout['nodes'];
  const routes = routesOf(composition);
  const shape = composition.floor === 'chart' ? chart() : null;
  const floor = shape ? [shape.shape] : composition.floor === 'ground' ? [ground()] : [];
  const floorLines = shape?.lines ?? [];

  // Fit the whole drawing into the space, centred, at the largest size that leaves its margin.
  const points = [
    ...floor.flat(),
    ...floorLines.flat(),
    ...nodes.flatMap((node) => [...node.prisms.flatMap((p) => [...p.top, ...p.left, ...p.right]), ...node.lines.flat()]),
    ...routes.flatMap((route) => route.points),
  ];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min((space.width - 2 * MARGIN) / (x1 - x0), (space.height - 2 * MARGIN) / (y1 - y0));
  const ox = (space.width - (x1 - x0) * scale) / 2 - x0 * scale;
  const oy = (space.height - (y1 - y0) * scale) / 2 - y0 * scale;
  const fit = (p: Point): Point => ({ x: Math.round((p.x * scale + ox) * 100) / 100, y: Math.round((p.y * scale + oy) * 100) / 100 });
  const fitAll = (list: readonly Point[]) => list.map(fit);
  const fitSegments = (list: readonly Segment[]): Segment[] => list.map(([a, b]) => [fit(a), fit(b)]);

  return {
    id: schematic.id,
    width: space.width,
    height: space.height,
    floor: floor.map(fitAll),
    floorLines: fitSegments(floorLines),
    nodes: nodes.map((node) => ({
      ...node,
      prisms: node.prisms.map((p) => ({ top: fitAll(p.top), left: fitAll(p.left), right: fitAll(p.right) })),
      lines: fitSegments(node.lines),
      anchor: fit(node.anchor),
    })) as unknown as SchematicLayout['nodes'],
    routes: routes.map((route) => ({ ...route, points: fitAll(route.points) })),
  };
}
