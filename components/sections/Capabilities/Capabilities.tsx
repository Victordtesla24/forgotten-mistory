import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Tag } from '@/components/ui/Tag';
import {
  capabilities,
  sources,
  statusLegend,
  type Capability,
  type EvidenceStatus,
  type SourceKind,
} from '@/content/capabilities';

const glyphs: Record<EvidenceStatus, string> = {
  production: '●',
  'non-production': '◐',
  pending: '○',
};

const statusOrder: readonly EvidenceStatus[] = ['production', 'non-production', 'pending'];

const groups: readonly { kind: SourceKind; heading: string }[] = [
  { kind: 'programme', heading: 'Proven on delivery programmes' },
  { kind: 'repository', heading: 'Proven in repositories' },
  { kind: 'credential', heading: 'Qualifications and credentials' },
];

const kindOfSource = new Map(sources.map((source) => [source.id, source.kind]));

/** Where a capability was proven is where its first source sits; with no source it is a credential. */
function groupOf(capability: Capability): SourceKind {
  const first = capability.sources[0];
  return (first && kindOfSource.get(first)) || 'credential';
}

function CapabilityCard({ capability }: { capability: Capability }) {
  return (
    <Card as="li" className="flex h-full flex-col gap-3">
      <Tag tone={capability.status === 'production' ? 'proof' : 'neutral'} className="self-start">
        {capability.standing ?? (
          <>
            <span aria-hidden="true" className="mr-1.5">
              {glyphs[capability.status]}
            </span>
            {statusLegend[capability.status]}
          </>
        )}
      </Tag>
      <h4 className="text-[1.0625rem]">{capability.capability}</h4>
      {capability.evidence ? <p className="type-small">{capability.evidence}</p> : null}
      {capability.caveat ? (
        <p className="type-small border-l-2 border-line-strong pl-3 text-muted">
          {capability.caveat}
        </p>
      ) : null}
      {capability.where ? <p className="type-meta mt-auto text-muted">{capability.where}</p> : null}
    </Card>
  );
}

export function Capabilities() {
  return (
    <Section
      id="capabilities"
      eyebrow="Capabilities"
      title="Seventeen capabilities, each with its evidence"
      accent="its evidence"
      lede="A capability is listed only with the evidence behind it, and its status says where that evidence was taken."
    >
      <ul className="reveal mb-12 flex flex-wrap gap-x-8 gap-y-2" aria-label="Status legend">
        {statusOrder.map((status) => (
          <li key={status} className="type-meta flex items-center gap-2 text-muted">
            <span aria-hidden="true">{glyphs[status]}</span>
            {statusLegend[status]}
          </li>
        ))}
      </ul>

      <div className="grid gap-14">
        {groups.map((group) => {
          const items = capabilities.filter((capability) => groupOf(capability) === group.kind);
          return (
            <div key={group.kind} className="grid gap-6">
              <h3 className="reveal">{group.heading}</h3>
              <ul className="reveal-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((capability) => (
                  <CapabilityCard key={capability.capability} capability={capability} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
