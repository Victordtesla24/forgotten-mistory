'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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
  const [ready, setReady] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => setReady(true), []);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  /** Lights the first stage, then the others a step apart, and stops on the last. */
  const run = useCallback(() => {
    stop();
    setStage(1);
    if (reducedMotion()) return;
    let lit = 1;
    timer.current = window.setInterval(() => {
      lit += 1;
      setStage(lit);
      if (lit >= stages.length) stop();
    }, STAGE_STEP);
  }, [stages.length, stop]);

  const clear = useCallback(() => {
    stop();
    setStage(0);
  }, [stop]);

  return (
    <>
      <div role="group" aria-label={schematic.label} data-schematic="" className={`${styles.scene} ${styles.visual}`}>
        {children}
        <Schematic schematic={schematic} place="card" lit={stage} />
        <button
          type="button"
          disabled={!ready}
          aria-label={`Light the stages of ${schematic.label}`}
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
            else if (timer.current === null) run();
          }}
        />
      </div>
      <p aria-live="polite" data-stage-caption="" className={styles.caption}>
        {stage > 0 ? `${stage} · ${stages[stage - 1]?.label}` : null}
      </p>
    </>
  );
}
