import {
  capabilities,
  domains,
  sources,
  type Capability,
  type Domain,
  type Source,
} from '@/content/capabilities';

/**
 * The capability map's one layout: where each of the five domains, seventeen capabilities and
 * twelve sources stands and the curve of every edge `content/capabilities.ts` states. It is a plain
 * function of the content, with no physics and nothing measured, so the server draws it as SVG and
 * any later layer that draws the same graph reads the same numbers. Units are the drawing's own
 * (a viewBox pixel); the drawing is never scaled below one.
 */
export const FIELD = {
  width: 944,
  /** Distance between two capability rows, and the height of the band each one sits in. */
  pitch: 21,
  band: 19,
  /** Extra space between two domains' rows. */
  groupGap: 8,
  top: 6,
  /** The domain's dot; its label ends to the left of it. */
  domainX: 148,
  bandX: 340,
  bandWidth: 320,
  /** The centre of every source mark. */
  sourceX: 922,
  /** The closest two sources may stand. */
  sourceGap: 26,
} as const;

export interface PlacedDomain {
  domain: Domain;
  x: number;
  y: number;
}

export interface PlacedCapability {
  capability: Capability;
  /** The centre of its band. */
  y: number;
  sources: readonly Source[];
}

export interface PlacedSource {
  source: Source;
  x: number;
  y: number;
  /** Domains of the capabilities it was applied in, in domain order. */
  domains: readonly Domain['id'][];
}

export interface PlacedEdge {
  /** A domain to a capability, or a capability to a source. */
  kind: 'domain' | 'source';
  capability: Capability['id'];
  domain: Domain['id'];
  source?: Source['id'];
  /** An S-curve with level tangents at both ends. */
  path: string;
}

export interface FieldLayout {
  width: number;
  height: number;
  domains: readonly PlacedDomain[];
  capabilities: readonly PlacedCapability[];
  sources: readonly PlacedSource[];
  edges: readonly PlacedEdge[];
}

const sourceById = new Map<Source['id'], Source>(sources.map((source) => [source.id, source]));

/** The sources a capability names, in the order it names them. */
export function sourcesOf(capability: Capability): readonly Source[] {
  return capability.sources.flatMap((id) => {
    const source = sourceById.get(id);
    return source ? [source] : [];
  });
}

const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

const round = (value: number): number => Math.round(value * 10) / 10;

/** A curve from one end to the other that leaves and arrives level, so it stays in the gap between two columns. */
function curve(x1: number, y1: number, x2: number, y2: number): string {
  const middle = (x1 + x2) / 2;
  return `M${round(x1)} ${round(y1)}C${round(middle)} ${round(y1)} ${round(middle)} ${round(y2)} ${round(x2)} ${round(y2)}`;
}

function computeField(): FieldLayout {
  const domainOrder = new Map<Domain['id'], number>(domains.map((domain, index) => [domain.id, index]));
  const ordered = [...capabilities].sort(
    (a, b) => (domainOrder.get(a.domain) ?? 0) - (domainOrder.get(b.domain) ?? 0),
  );

  let y = FIELD.top + FIELD.band / 2;
  let previous: Domain['id'] | null = null;
  const placedCapabilities: PlacedCapability[] = ordered.map((capability) => {
    if (previous !== null && previous !== capability.domain) y += FIELD.groupGap;
    previous = capability.domain;
    const placed = { capability, y, sources: sourcesOf(capability) };
    y += FIELD.pitch;
    return placed;
  });
  const bottom = y - FIELD.pitch + FIELD.band / 2 + FIELD.top;

  const capabilityY = new Map<Capability['id'], number>(placedCapabilities.map((placed) => [placed.capability.id, placed.y]));

  const placedDomains: PlacedDomain[] = domains.map((domain) => ({
    domain,
    x: FIELD.domainX,
    y: mean(placedCapabilities.filter((placed) => placed.capability.domain === domain.id).map((placed) => placed.y)),
  }));

  // A source stands at the mean height of the capabilities that name it, so its edges run level
  // where they can; no two stand closer than `sourceGap`, and the first and last stay inside.
  const wanted = sources
    .map((source, index) => {
      const linked = placedCapabilities.filter((placed) => placed.capability.sources.includes(source.id));
      return { source, index, linked, y: linked.length > 0 ? mean(linked.map((placed) => placed.y)) : 0 };
    })
    .sort((a, b) => a.y - b.y || a.index - b.index);
  const lowest = bottom - FIELD.top - FIELD.band / 2;
  const heights = wanted.map((entry) => Math.max(entry.y, FIELD.top + FIELD.band / 2));
  for (let i = 1; i < heights.length; i += 1) heights[i] = Math.max(heights[i] ?? 0, (heights[i - 1] ?? 0) + FIELD.sourceGap);
  const last = heights.length - 1;
  if ((heights[last] ?? 0) > lowest) heights[last] = lowest;
  for (let i = last - 1; i >= 0; i -= 1) heights[i] = Math.min(heights[i] ?? 0, (heights[i + 1] ?? 0) - FIELD.sourceGap);

  const placedSources: PlacedSource[] = wanted.map((entry, index) => ({
    source: entry.source,
    x: FIELD.sourceX,
    y: heights[index] ?? 0,
    domains: domains
      .filter((domain) => entry.linked.some((placed) => placed.capability.domain === domain.id))
      .map((domain) => domain.id),
  }));
  const sourceY = new Map<Source['id'], number>(placedSources.map((placed) => [placed.source.id, placed.y]));

  const leftDot = FIELD.bandX - 6;
  const rightDot = FIELD.bandX + FIELD.bandWidth + 6;
  const edges: PlacedEdge[] = [];
  for (const placed of placedCapabilities) {
    const { capability } = placed;
    const from = placedDomains.find((entry) => entry.domain.id === capability.domain);
    if (from) {
      edges.push({
        kind: 'domain',
        capability: capability.id,
        domain: capability.domain,
        path: curve(from.x, from.y, leftDot, placed.y),
      });
    }
    for (const source of placed.sources) {
      edges.push({
        kind: 'source',
        capability: capability.id,
        domain: capability.domain,
        source: source.id,
        path: curve(rightDot, capabilityY.get(capability.id) ?? 0, FIELD.sourceX, sourceY.get(source.id) ?? 0),
      });
    }
  }

  return {
    width: FIELD.width,
    height: bottom,
    domains: placedDomains,
    capabilities: placedCapabilities,
    sources: placedSources,
    edges,
  };
}

/** The whole field, computed once from the content. */
export const field: FieldLayout = computeField();

/** The drawing of one capability in its panel: its domain above, the capability, its sources below. */
export const SUBGRAPH = {
  width: 448,
  domainY: 14,
  bandY: 56,
  band: 36,
  /** Where the first source stands under the band, and the distance between two. */
  sourceY: 122,
  sourcePitch: 34,
  /** The trunk the edges leave from and the column the source marks stand in. */
  trunkX: 22,
  markX: 52,
} as const;

export interface Subgraph {
  height: number;
  domain: Domain;
  capability: Capability;
  sources: readonly (Source & { y: number; path: string })[];
  /** From the domain's dot down to the band. */
  domainPath: string;
}

export function subgraph(capability: Capability): Subgraph {
  const domain = domains.find((entry) => entry.id === capability.domain) ?? domains[0];
  if (!domain) throw new Error('content/capabilities.ts has no domains');
  const placed = sourcesOf(capability).map((source, index) => {
    const y = SUBGRAPH.sourceY + index * SUBGRAPH.sourcePitch;
    return {
      ...source,
      y,
      path: `M${SUBGRAPH.trunkX} ${SUBGRAPH.bandY + SUBGRAPH.band}C${SUBGRAPH.trunkX} ${y} ${SUBGRAPH.trunkX + 6} ${y} ${SUBGRAPH.markX} ${y}`,
    };
  });
  const lastY = placed.length > 0 ? SUBGRAPH.sourceY + (placed.length - 1) * SUBGRAPH.sourcePitch : SUBGRAPH.bandY + SUBGRAPH.band;
  return {
    height: lastY + 16,
    domain,
    capability,
    sources: placed,
    domainPath: `M${SUBGRAPH.trunkX} ${SUBGRAPH.domainY}V${SUBGRAPH.bandY}`,
  };
}
