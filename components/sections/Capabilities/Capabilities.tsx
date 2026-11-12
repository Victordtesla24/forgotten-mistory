import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { Container } from '@/components/ui/Container';
import { capabilities, domains } from '@/content/capabilities';

import styles from './Capabilities.module.css';
import { capabilityPanel, Field } from './Field';
import { Filters } from './Filters';
import { CapabilitiesBehaviour } from './CapabilitiesBehaviour';
import { Key } from './Key';
import { Narrow } from './Narrow';
import { PanelBody } from './PanelBody';
import { PanelLead } from './PanelLead';

const domainName = new Map(domains.map((domain) => [domain.id, domain.name]));

/** One panel for each capability, grouped by domain as the content is, so Previous and Next walk them in that order. */
const items: readonly DetailItem[] = capabilities.map((capability) => ({
  id: capabilityPanel(capability.id),
  eyebrow: domainName.get(capability.domain),
  title: capability.label,
  attributes: { 'data-capability-item': capability.id },
  lead: <PanelLead capability={capability} />,
  children: <PanelBody capability={capability} />,
}));

/**
 * What the page can do and where each thing was applied, as a map: five domains, seventeen
 * capabilities and twelve sources joined by the links the content states, and each capability opens
 * its panel at every width. From 1024 px the whole map stands under a row of domain filters that
 * dims what is outside the one chosen; below it the field shows one domain at a time under a snapping
 * row of the five (`Narrow.tsx`). Both are in the HTML and a media query chooses between them; the
 * filters answer through `behaviour.ts`, loaded after the page is up.
 */
export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className={`${styles.section} pt-[clamp(4rem,5vw,4.5rem)]`}>
      <Container>
        <header className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p className="type-eyebrow text-muted">Capabilities</p>
          <h2 id="capabilities-title">
            Skills, linked to where they were <em className="type-serif-em">applied</em>
          </h2>
        </header>
      </Container>
      <CapabilitiesBehaviour />
      <DetailSet label="Capabilities" items={items}>
        <Container>
          <Filters />
          <div data-map="">
            <Field />
          </div>
          <Narrow />
          <Key />
        </Container>
      </DetailSet>
    </section>
  );
}
