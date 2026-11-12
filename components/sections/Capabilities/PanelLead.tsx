import { SUBGRAPH, subgraph } from '@/lib/capability-field';
import type { Capability } from '@/content/capabilities';

import { Mark, PendingMark } from './Mark';

/**
 * What leads a capability's panel: its own part of the map, enlarged. The domain above, the
 * capability in its band and the sources it names below, each with its mark and its name, joined
 * by the same edges as the map. A capability that names no source is drawn alone.
 */
export function PanelLead({ capability }: { capability: Capability }) {
  const graph = subgraph(capability);
  const pending = graph.sources.length === 0;
  const { trunkX, markX, bandY, band, width } = SUBGRAPH;
  return (
    <svg
      role="img"
      aria-label={`${graph.domain.name}, ${capability.label}${pending ? '' : `, applied at ${graph.sources.map((source) => source.label).join(', ')}`}`}
      viewBox={`0 0 ${width} ${graph.height}`}
      width={width}
      height={graph.height}
      data-subgraph=""
      data-sources={graph.sources.length}
    >
      <path d={graph.domainPath} data-part="edge" />
      {graph.sources.map((source) => (
        <path key={source.id} d={source.path} data-part="edge" data-source={source.id} />
      ))}
      <circle cx={trunkX} cy={SUBGRAPH.domainY} r={4.5} data-part="domain-dot" />
      <text x={trunkX + 14} y={SUBGRAPH.domainY} dy="0.35em" data-part="lead-domain">
        {graph.domain.name}
      </text>
      <rect
        x={4}
        y={bandY}
        width={width - 8}
        height={band}
        rx={6}
        data-part="band"
        data-pending={pending ? '' : undefined}
      />
      <text x={18} y={bandY + band / 2} dy="0.35em" data-part="lead-label">
        {capability.label}
      </text>
      {pending ? <PendingMark x={width - 22} y={bandY + band / 2} /> : null}
      {graph.sources.map((source) => (
        <g key={source.id} data-source={source.id} data-kind={source.kind}>
          <Mark kind={source.kind} x={markX} y={source.y} />
          <text x={markX + 16} y={source.y} dy="0.35em" data-part="lead-source">
            {source.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
