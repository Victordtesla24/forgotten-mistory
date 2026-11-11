import { Plus } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { DetailTrigger } from '@/components/ui/DetailPanel';
import { Tag } from '@/components/ui/Tag';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { StageView } from '@/components/visuals/StageView';
import type { Project } from '@/content/work';
import { schematicView } from '@/lib/schematic';

import { projectPanel } from './panels';
import { Schematic } from './Schematic';
import styles from './Work.module.css';

/**
 * One project on the rail: its schematic, the line that names the stage that is lit, its name, its
 * status on a line of its own, its one line of value and the control that opens its panel. Pointing
 * at, focusing or tapping the schematic runs its stages (`behaviour.ts`; the control is off until
 * that has loaded); the plus opens the project, and so does the rest of the card.
 */
export function ProjectCard({ project }: { project: Project }) {
  const { schematic } = project;
  const headingId = `project-${project.repo}`;
  return (
    <Card as="article" aria-labelledby={headingId} data-project={project.repo} className={styles.card}>
      <div role="group" aria-label={schematic.label} data-schematic="" className={`${styles.scene} ${styles.visual}`}>
        <StageView view={schematicView(schematic.id, 'card')} />
        <Schematic schematic={schematic} place="card" />
        <ol>
          {schematic.stages.map((stage) => (
            <li key={stage.id}>
              <VisuallyHidden>{stage.label}</VisuallyHidden>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled
          data-step=""
          aria-label={`Show the stages of ${schematic.label}`}
          className={styles.step}
        />
      </div>
      <p aria-live="polite" data-stage-caption="" className={styles.caption} />
      <h3 id={headingId} data-project-name="" className={styles.name}>
        {project.name}
      </h3>
      <Tag tone="accent" data-project-status="" className={styles.status}>
        {project.status}
      </Tag>
      <p className={styles.value}>{project.value}</p>
      <DetailTrigger panel={projectPanel(project)} className={styles.open}>
        <Plus aria-hidden="true" className="size-5" />
        <VisuallyHidden>Open project {project.name}</VisuallyHidden>
      </DetailTrigger>
    </Card>
  );
}
