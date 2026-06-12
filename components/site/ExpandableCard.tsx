'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';

interface ExpandableCardProps {
  /** Base class for the card shell, e.g. "snap-card" or "skill-card". */
  baseClass: string;
  /** Class for the toggle button, e.g. "snap-header" or "skill-header". */
  headerClass: string;
  /** Class for the collapsible body, e.g. "snap-body" or "skill-body". */
  bodyClass: string;
  header: ReactNode;
  children: ReactNode;
  role?: string;
}

/**
 * Generic expandable card used by the About snap-cards and Skills cards.
 * Toggles the existing `.open` CSS state (max-height transitions live in
 * globals.css) and keeps aria-expanded in sync.
 */
export default function ExpandableCard({
  baseClass,
  headerClass,
  bodyClass,
  header,
  children,
  role,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div className={`${baseClass}${open ? ' open' : ''}`} role={role}>
      <button
        type="button"
        className={headerClass}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        {header}
      </button>
      <div id={bodyId} className={bodyClass}>
        {children}
      </div>
    </div>
  );
}
