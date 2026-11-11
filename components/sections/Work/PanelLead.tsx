import type { ReactNode } from 'react';

import type { Schematic as SchematicData } from '@/content/work';

import { Schematic } from './Schematic';
import styles from './Work.module.css';

interface PanelLeadProps {
  schematic: SchematicData;
  /** The stage's placeholder, over the enlarged drawing. */
  children: ReactNode;
}

/**
 * What leads a project's panel: its schematic enlarged, the three stages as controls and the note of
 * the one that is lit. Selecting a stage (`behaviour.ts`: a control, or ArrowLeft and ArrowRight while
 * this project is showing) lights it in the drawing and shows its note beside it. Without script the
 * controls are off and every stage reads with its note, one after another.
 */
export function PanelLead({ schematic, children }: PanelLeadProps) {
  return (
    <div className={styles.lead}>
      <div role="group" aria-label={schematic.label} data-schematic="" className={`${styles.scene} ${styles.plate}`}>
        {children}
        <Schematic schematic={schematic} place="panel" />
      </div>
      <ol className={styles.stages}>
        {schematic.stages.map((stage, index) => (
          <li key={stage.id} className={styles.stage}>
            <button type="button" disabled data-stage-control={stage.id} className={styles.pick}>
              <span className={styles.number}>{index + 1}</span>
              {stage.label}
            </button>
            <p data-stage-note={stage.id} className={styles.note}>
              {stage.note}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
