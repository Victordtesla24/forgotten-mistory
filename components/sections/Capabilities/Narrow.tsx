import { DetailTrigger } from '@/components/ui/DetailPanel';
import { PHONE, phoneGroups } from '@/lib/capability-field';

import { capabilityPanel } from './Field';
import { KIND_NAME, MarkIcon, PendingMark } from './Mark';

/**
 * The map below 1024 px: one domain at a time, its capabilities in a column on the left and the
 * sources they name in a column on the right, joined by the same edges as the wide map. All five
 * domains are in the HTML and share one box, as tall as the tallest, so choosing a domain never
 * moves the page; the filters (`Filters.tsx`) bring one up and `behaviour.ts` re-forms the field
 * when they do. Without script every domain stands in turn, each under its name. Every position is
 * from `phoneGroups` (`lib/capability-field.ts`); a capability opens its panel as on the wide map.
 */
export function Narrow() {
  return (
    <div data-narrow="">
      {phoneGroups.map((group, index) => (
        <div
          key={group.domain.id}
          role="group"
          aria-label={group.domain.name}
          data-group={group.domain.id}
          data-shown={index === 0 ? '' : undefined}
        >
          <h3 data-part="group-name">{group.domain.name}</h3>
          <ul data-column="capabilities" style={{ height: group.height }}>
            {group.capabilities.map(({ capability, top, sources }) => {
              const pending = sources.length === 0;
              return (
                <li key={capability.id} style={{ top, height: PHONE.row }}>
                  <DetailTrigger
                    panel={capabilityPanel(capability.id)}
                    data-capability={capability.id}
                    data-pending={pending ? '' : undefined}
                    aria-label={
                      pending ? capability.label : `${capability.label}. Applied at ${sources.map((source) => source.label).join(', ')}.`
                    }
                  >
                    <span>{capability.label}</span>
                    {pending ? (
                      <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" data-part="icon">
                        <PendingMark x={7} y={7} />
                      </svg>
                    ) : null}
                  </DetailTrigger>
                </li>
              );
            })}
          </ul>
          <svg
            viewBox={`0 0 ${PHONE.gap} ${group.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            data-part="edges"
            style={{ height: group.height }}
          >
            {group.edges.map((edge) => (
              <path key={`${edge.capability}-${edge.source}`} d={edge.path} data-part="edge" data-capability={edge.capability} data-source={edge.source} />
            ))}
          </svg>
          <ul data-column="sources" style={{ height: group.height }}>
            {group.sources.map(({ source, y }) => (
              <li key={source.id} data-source={source.id} data-kind={source.kind} style={{ top: y }}>
                <MarkIcon kind={source.kind} />
                <span>
                  {source.label}
                  <span className="sr-only">{`, ${KIND_NAME[source.kind].toLowerCase()}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
