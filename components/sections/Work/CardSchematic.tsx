'use client';

import { useEffect, useState, type ReactNode } from 'react';

import type { Schematic as SchematicData } from '@/content/work';
import { reducedMotion } from '@/lib/motion';
import { STAGE_STEP } from '@/lib/schematic';

import { Schematic } from './Schematic';
import styles from './Work.module.css';

interface CardSchematicProps {
  schematic: SchematicData;
  /** The stage's placeholder and the stages' names for the page's HTML. */
  children: ReactNode;
}

/**
 * A card's schematic and the line under it. A fine pointer over it, the keyboard on it or a tap
 * runs the flow once: each stage is lit in turn, in the order of the work, and named in the caption,
 * and the last stays lit until the pointer or the focus leaves; a press once it has run runs it again. Under reduced
 * motion nothing advances by itself: the first stage is lit and each press lights the next. The
 * caption's space is kept whether or not it says anything, so nothing moves. Until the page has
 * hydrated the control is off, for it would do nothing.
 */
export function CardSchematic({ schematic, children }: CardSchematicProps) {
  const { stages } = schematic;
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  // A running flow lights the next stage one step after the last one was drawn, so each stage is
  // seen for its whole step however busy the page is, and it stops on the last.
  useEffect(() => {
    if (!running) return undefined;
    if (stage >= stages.length) {
      setRunning(false);
      return undefined;
    }
    const next = window.setTimeout(() => setStage(stage + 1), STAGE_STEP);
    return () => window.clearTimeout(next);
  }, [running, stage, stages.length]);

  /** Lights the first stage and, where motion is allowed, goes on to light the rest in turn. */
  const run = () => {
    setStage(1);
    setRunning(!reducedMotion());
  };

  const clear = () => {
    setRunning(false);
    setStage(0);
  };

  return (
    <>
      <div role="group" aria-label={schematic.label} data-schematic="" className={`${styles.scene} ${styles.visual}`}>
        {children}
        <Schematic schematic={schematic} place="card" lit={stage} />
        <button
          type="button"
          disabled={!ready}
          aria-label={`Show the stages of ${schematic.label}`}
          className={styles.step}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') run();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') clear();
          }}
          onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible')) run();
          }}
          onBlur={clear}
          onClick={() => {
            if (reducedMotion()) setStage((now) => (now % stages.length) + 1);
            else if (!running) run();
          }}
        />
      </div>
      <p aria-live="polite" data-stage-caption="" className={styles.caption}>
        {stage > 0 ? `${stage} · ${stages[stage - 1]?.label}` : null}
      </p>
    </>
  );
}
