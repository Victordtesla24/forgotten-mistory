/**
 * The ruler: the site's one motif, as geometry. A ruler is a baseline with ticks standing on
 * it, every fifth a little taller and every tenth taller again. This builds a set of them
 * (lanes) as one `LineSegments` geometry, so any view that wants the motif shares the shape
 * and costs one draw call. How the lanes are laid out is the caller's choice.
 */

import { BufferAttribute, BufferGeometry } from 'three';

/** What each segment is, read by the vertex shader as `aKind`. */
export const KIND = { minor: 0, mid: 1, major: 2, baseline: 3 } as const;

export interface RulerLane {
  /** Number of ticks along the lane. */
  ticks: number;
  /** World distance between ticks. */
  pitch: number;
  /** World z of the lane. */
  depth: number;
  /** World y of the baseline. */
  height: number;
  /** Offsets the tick pattern along the lane, in ticks. */
  phase: number;
}

export interface RulerSpec {
  lanes: readonly RulerLane[];
  /** Every `mid`th tick is a mid tick and every `major`th is a major one. */
  mid: number;
  major: number;
}

/** Everything a view needs to know about the geometry it was given. */
export interface RulerGeometry {
  geometry: BufferGeometry;
  /** Line segments in the geometry: the ticks plus one baseline per lane. */
  segments: number;
}

/**
 * Builds the geometry. Per vertex: `position` (x along the lane, 0 at the foot or 1 at the
 * tip, depth), `aLane` (0 nearest to 1 farthest), `aKind` (see `KIND`) and `aSpan` (the lane's
 * length, so the vertex shader can wrap a drifting tick back to the start).
 */
export function createRulerGeometry(spec: RulerSpec): RulerGeometry {
  const segments = spec.lanes.reduce((total, lane) => total + lane.ticks + 1, 0);
  const position = new Float32Array(segments * 2 * 3);
  const lane = new Float32Array(segments * 2);
  const kind = new Float32Array(segments * 2);
  const span = new Float32Array(segments * 2);
  const last = Math.max(spec.lanes.length - 1, 1);

  let vertex = 0;
  const push = (x: number, y: number, z: number, laneIndex: number, k: number, length: number) => {
    position.set([x, y, z], vertex * 3);
    lane[vertex] = laneIndex / last;
    kind[vertex] = k;
    span[vertex] = length;
    vertex += 1;
  };

  spec.lanes.forEach((entry, index) => {
    const length = entry.ticks * entry.pitch;
    const start = -length / 2;
    push(start, 0, entry.depth, index, KIND.baseline, length);
    push(start + length, 0, entry.depth, index, KIND.baseline, length);
    for (let tick = 0; tick < entry.ticks; tick += 1) {
      const count = tick + entry.phase;
      const k = count % spec.major === 0 ? KIND.major : count % spec.mid === 0 ? KIND.mid : KIND.minor;
      const x = start + tick * entry.pitch;
      push(x, 0, entry.depth, index, k, length);
      push(x, 1, entry.depth, index, k, length);
    }
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aLane', new BufferAttribute(lane, 1));
  geometry.setAttribute('aKind', new BufferAttribute(kind, 1));
  geometry.setAttribute('aSpan', new BufferAttribute(span, 1));
  return { geometry, segments };
}
