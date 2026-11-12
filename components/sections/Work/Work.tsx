import type { CSSProperties } from 'react';

import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { Container } from '@/components/ui/Container';
import { SnapRow } from '@/components/ui/SnapRow';
import { StageView } from '@/components/visuals/StageView';
import { projects } from '@/content/work';
import { stagger, staggerDelay } from '@/lib/motion';
import { schematicView } from '@/lib/schematic';

import { PanelBody } from './PanelBody';
import { PanelLead } from './PanelLead';
import { projectPanel } from './panels';
import { ProjectCard } from './ProjectCard';
import styles from './Work.module.css';
import { WorkBehaviour } from './WorkBehaviour';

/** The cards of the entrance start this far apart: the middle of the stagger rule, so the sixth lands well inside the ceiling. */
const ARRIVE_STEP = (stagger.min + stagger.max) / 2;

/** When the card at `index` begins to arrive, after the first one (`Work.module.css`, `behaviour.ts`). */
const arrival = (index: number): CSSProperties => ({ '--arrive': `${staggerDelay(index, ARRIVE_STEP)}ms` }) as CSSProperties;

/** One panel for each project, in the order of the rail, so Previous and Next walk the six. */
const items: readonly DetailItem[] = projects.map((project) => ({
  id: projectPanel(project),
  eyebrow: project.status,
  title: project.name,
  lead: (
    <PanelLead schematic={project.schematic}>
      <StageView view={schematicView(project.schematic.id, 'panel')} />
    </PanelLead>
  ),
  children: <PanelBody project={project} />,
}));

/**
 * Six projects as one rail of equal cards. From 1280 px all six stand side by side across the
 * browser; below that the rail is a row that snaps, with the next card showing at its edge. Each card
 * is a schematic of the project's three stages; its panel, shared by the six, opens from the card.
 * The heading is one row, as in Experience; the section has no timeline of its own, for the page's
 * one career axis is the one in Experience. The first time the rail comes into view its cards arrive
 * one after another, left to right (`behaviour.ts`); every card is in the HTML in its place from the start.
 */
export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="pt-[clamp(4rem,5vw,4.5rem)]">
      <Container>
        <header className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 md:mb-5">
          <p className="type-eyebrow text-muted">Work</p>
          <h2 id="work-title">
            Selected <em className="type-serif-em">work</em>
          </h2>
        </header>
      </Container>
      <WorkBehaviour />
      <DetailSet label="Selected work" items={items}>
        <SnapRow
          columns={6}
          aria-label="Projects"
          className="mx-0 grid grid-flow-col auto-cols-[min(84%,21rem)] grid-rows-[1fr_auto_auto_auto_auto] items-stretch gap-x-3 gap-y-0 sm:auto-cols-[clamp(15rem,36%,20rem)] xl:grid-flow-row xl:auto-cols-auto xl:px-[clamp(1rem,1.5vw,1.5rem)]"
        >
          {projects.map((project, index) => (
            <li key={project.repo} style={arrival(index)} className={`${styles.slot} row-span-5 grid grid-rows-subgrid`}>
              <ProjectCard project={project} />
            </li>
          ))}
        </SnapRow>
      </DetailSet>
    </section>
  );
}
