import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { Section } from '@/components/ui/Section';
import { SnapRow } from '@/components/ui/SnapRow';
import { Tag } from '@/components/ui/Tag';
import {
  capabilities,
  domains,
  sources,
  type Capability,
  type Domain,
  type Source,
} from '@/content/capabilities';

const sourceById = new Map<Source['id'], Source>(sources.map((source) => [source.id, source]));

function CapabilityRow({ capability }: { capability: Capability }) {
  return (
    <Disclosure
      id={`capability-${capability.id}`}
      summaryClassName="type-small items-center py-2"
      panelClassName="grid gap-2 pb-3"
      summary={<span className="font-medium">{capability.label}</span>}
    >
      <p className="type-small text-muted">{capability.detail}</p>
      {capability.sources.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {capability.sources.map((id) => (
            <li key={id}>
              <Tag className="whitespace-normal [overflow-wrap:anywhere]">
                {sourceById.get(id)?.label}
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </Disclosure>
  );
}

function DomainCard({ domain }: { domain: Domain }) {
  return (
    <Card as="div" role="group" aria-labelledby={`domain-${domain.id}`} className="p-4">
      <h3 id={`domain-${domain.id}`} className="text-[1.0625rem]">
        {domain.name}
      </h3>
      <ul className="mt-2 divide-y divide-line">
        {capabilities
          .filter((capability) => capability.domain === domain.id)
          .map((capability) => (
            <li key={capability.id}>
              <CapabilityRow capability={capability} />
            </li>
          ))}
      </ul>
    </Card>
  );
}

export function Capabilities() {
  return (
    <Section
      id="capabilities"
      eyebrow="Capabilities"
      title="Seventeen capabilities, five domains"
      accent="five domains"
    >
      <SnapRow columns={5} className="reveal">
        {domains.map((domain) => (
          <li key={domain.id}>
            <DomainCard domain={domain} />
          </li>
        ))}
      </SnapRow>
    </Section>
  );
}
