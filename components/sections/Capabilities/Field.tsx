import { DetailTrigger } from '@/components/ui/DetailPanel';
import { FIELD, field } from '@/lib/capability-field';

import { KIND_NAME, Mark, PendingMark } from './Mark';

/** The id of the panel a capability opens: the fragment it has always had. */
export const capabilityPanel = (id: string): string => `capability-${id}`;

/**
 * The capability map: the five domains, the seventeen capabilities and the twelve sources in three
 * columns read left to right, joined by the edges `content/capabilities.ts` states and no others
 * (a capability that names no source has no edge to the right). Every position is from `field`
 * (`lib/capability-field.ts`). Each capability is a link to its panel; the sources are marks, one
 * kind to a shape, named in their tooltip and in the panel. Drawn on the server, complete without script.
 */
export function Field() {
  const leftDot = FIELD.bandX - 6;
  const rightDot = FIELD.bandX + FIELD.bandWidth + 6;
  return (
    <svg
      role="group"
      aria-label="Capabilities by domain, and where each was applied"
      viewBox={`0 0 ${field.width} ${field.height}`}
      width={field.width}
      height={field.height}
      data-field=""
      data-domains={field.domains.length}
      data-capabilities={field.capabilities.length}
      data-sources={field.sources.length}
      data-edges={field.edges.length}
    >
      <g>
        {field.edges.map((edge) => (
          <path
            key={`${edge.capability}-${edge.source ?? 'domain'}`}
            d={edge.path}
            data-part="edge"
            data-edge={edge.kind}
            data-capability={edge.capability}
            data-source={edge.source}
            data-domain={edge.domain}
          />
        ))}
      </g>

      {field.domains.map(({ domain, x, y }) => (
        <g key={domain.id} data-node="domain" data-domain={domain.id}>
          <circle cx={x} cy={y} r={4.5} data-part="domain-dot" />
          <text x={x - 14} y={y} dy="0.35em" textAnchor="end" data-part="domain-label">
            {domain.name}
          </text>
        </g>
      ))}

      {field.capabilities.map(({ capability, y, sources }) => {
        const pending = sources.length === 0;
        const top = y - FIELD.band / 2;
        return (
          <DetailTrigger
            key={capability.id}
            panel={capabilityPanel(capability.id)}
            aria-label={
              pending ? capability.label : `${capability.label}. Applied at ${sources.map((source) => source.label).join(', ')}.`
            }
            data-node="capability"
            data-capability={capability.id}
            data-domain={capability.domain}
            data-sources={sources.length}
          >
            <rect
              x={FIELD.bandX}
              y={y - FIELD.pitch / 2}
              width={FIELD.bandWidth}
              height={FIELD.pitch}
              data-part="hit"
            />
            <rect
              x={FIELD.bandX}
              y={top}
              width={FIELD.bandWidth}
              height={FIELD.band}
              rx={4}
              data-part="band"
              data-pending={pending ? '' : undefined}
            />
            <rect
              x={FIELD.bandX - 2.5}
              y={top - 2.5}
              width={FIELD.bandWidth + 5}
              height={FIELD.band + 5}
              rx={6.5}
              data-part="ring"
            />
            <circle cx={leftDot} cy={y} r={2.5} data-part="dot" />
            {pending ? <PendingMark x={rightDot} y={y} /> : <circle cx={rightDot} cy={y} r={2.5} data-part="dot" />}
            <text x={FIELD.bandX + 12} y={y} dy="0.35em" data-part="label">
              {capability.label}
            </text>
          </DetailTrigger>
        );
      })}

      {field.sources.map(({ source, x, y, domains: used }) => (
        <g
          key={source.id}
          role="img"
          aria-label={`${source.label}, ${KIND_NAME[source.kind].toLowerCase()}`}
          data-node="source"
          data-source={source.id}
          data-kind={source.kind}
          data-domain={used.join(' ')}
        >
          <title>{`${source.label} (${KIND_NAME[source.kind].toLowerCase()})`}</title>
          <circle cx={x} cy={y} r={14} data-part="hit" />
          <Mark kind={source.kind} x={x} y={y} />
        </g>
      ))}
    </svg>
  );
}
