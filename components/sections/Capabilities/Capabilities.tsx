import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { Container } from '@/components/ui/Container';
import { capabilities, domains } from '@/content/capabilities';

import styles from './Capabilities.module.css';
import { capabilityPanel, Field } from './Field';
import { Filters } from './Filters';
import { Interim } from './Interim';
import { Key } from './Key';
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
 * capabilities and twelve sources joined by the links the content states. From 1024 px the map
 * stands (the heading, a row of domain filters, the drawing and its key) and each capability opens
 * its panel; below that the five cards of disclosures stand in its place until the map takes the
 * phone too. Both are in the HTML and a media query chooses between them.
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
      <DetailSet label="Capabilities" items={items}>
        <Container>
          <div data-map="" className={styles.map}>
            <Filters />
            <Field />
            <Key />
          </div>
          <div data-interim="" className="lg:hidden">
            <Interim />
          </div>
        </Container>
      </DetailSet>
    </section>
  );
}
