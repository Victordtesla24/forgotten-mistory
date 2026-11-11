'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import type { Schematic as SchematicData } from '@/content/work';

import { Schematic } from './Schematic';
import styles from './Work.module.css';

interface PanelLeadProps {
  schematic: SchematicData;
  /** The stage's placeholder, over the enlarged drawing. */
  children: ReactNode;
}

/**
 * What leads a project's panel: its schematic enlarged, the three stages as controls and the
 * note of the one that is lit. A stage control, or ArrowLeft and ArrowRight anywhere in the panel
 * while this project is showing, selects a stage; the drawing lights it and its note shows beside
 * it. Without script nothing is selected and every stage reads with its note, one after another.
 */
export function PanelLead({ schematic, children }: PanelLeadProps) {
  const { stages } = schematic;
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  /** The same as `selected`, for the key handler that is set up once. */
  const current = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const picks = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setReady(true), []);

  const choose = (index: number) => {
    current.current = index;
    setSelected(index);
  };

  // The panel's own arrow keys step to the previous and next project; here they step the stages, so
  // they are taken before the panel hears them, wherever focus is inside it while this project shows.
  useEffect(() => {
    const item = root.current?.closest<HTMLElement>('[data-detail-item]');
    const dialog = item?.closest('dialog');
    if (!item || !dialog) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (item.dataset.active !== 'true' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const by = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (by === 0 || !(event.target instanceof Node) || !dialog.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      const next = (current.current + by + stages.length) % stages.length;
      const onPick = picks.current.some((pick) => pick === document.activeElement);
      current.current = next;
      setSelected(next);
      if (onPick) picks.current[next]?.focus();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [stages.length]);

  return (
    <div ref={root} className={styles.lead}>
      <div role="group" aria-label={schematic.label} data-schematic="" className={`${styles.scene} ${styles.plate}`}>
        {children}
        <Schematic schematic={schematic} place="panel" lit={ready ? selected + 1 : 0} />
      </div>
      <ol className={styles.stages}>
        {stages.map((stage, index) => (
          <li key={stage.id} className={styles.stage}>
            <button
              type="button"
              disabled={!ready}
              data-stage-control={stage.id}
              aria-pressed={ready ? selected === index : undefined}
              ref={(element) => {
                picks.current[index] = element;
              }}
              className={styles.pick}
              onClick={() => choose(index)}
            >
              <span className={styles.number}>{index + 1}</span>
              {stage.label}
            </button>
            <p hidden={ready && selected !== index} data-stage-note={stage.id} className={styles.note}>
              {stage.note}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
