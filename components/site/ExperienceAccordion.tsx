'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ExperienceRole } from '@/app/data/siteContent';
import CardFlipCanvas from '@/components/fx/CardFlipCanvas';

interface ExperienceAccordionProps {
  roles: ExperienceRole[];
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parse a "Mon YYYY" / "Present" endpoint into the first of its month. */
function parsePoint(raw: string, now: Date): Date | null {
  const t = raw.trim().toLowerCase();
  if (t === 'present' || t === 'current' || t === 'now') return now;
  const m = t.match(/([a-z]+)\s+(\d{4})/);
  if (m) return new Date(Number(m[2]), MONTHS[m[1].slice(0, 3)] ?? 0, 1);
  const y = t.match(/(\d{4})/);
  return y ? new Date(Number(y[1]), 0, 1) : null;
}

/** Whole months spanned by a "start - end" résumé date string (floored at 1). */
function spanMonths(dates: string, now: Date): number {
  const [a, b] = dates.split(/\s*[-–—]\s*/);
  const start = parsePoint(a ?? '', now);
  const end = b ? parsePoint(b, now) : now;
  if (!start || !end) return 1;
  return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}

/** Compact tenure, e.g. "7y 9m" / "8m". */
function tenureLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `${y}y ${m}m`;
  if (y) return `${y}y`;
  return `${m}m`;
}

/**
 * Accessible experience accordion with 3D card-flip page-turn reveal.
 * The first (current) role starts expanded.
 *
 * Each content panel is wrapped with a self-contained R3F CardFlipCanvas
 * overlay that renders a monochrome plane swinging into view from a left-edge
 * hinge (page-turn). The accessible DOM (button, aria-expanded, aria-controls,
 * keyboard) sits on top and stays fully functional.
 *
 * prefers-reduced-motion: static render — instant expand, no flip animation.
 * The CardFlipCanvas is not mounted when reduced-motion is active.
 */
export default function ExperienceAccordion({ roles }: ExperienceAccordionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(roles[0]?.id ?? null);

  const durations = useMemo(() => {
    const now = new Date();
    const months = roles.map((r) => spanMonths(r.dates, now));
    const max = Math.max(1, ...months);
    return new Map(
      roles.map((r, i) => [
        r.id,
        { fraction: Math.max(0.08, months[i] / max), label: tenureLabel(months[i]) },
      ]),
    );
  }, [roles]);

  // Bullets ride in just behind the height spring so the text settles rather than pops.
  const listContainer: Variants = {
    hidden: {},
    shown: {
      transition: prefersReducedMotion
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.06, delayChildren: 0.08 },
    },
  };
  const listItem: Variants = {
    hidden: { opacity: 0, y: 8 },
    shown: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="accordion-group">
      {roles.map((role) => {
        const isOpen = openId === role.id;
        return (
          <AccordionItem
            key={role.id}
            role={role}
            isOpen={isOpen}
            prefersReducedMotion={prefersReducedMotion ?? false}
            onToggle={() => setOpenId(isOpen ? null : role.id)}
          />
        );
      })}
    </div>
  );
}

function AccordionItem({
  role,
  isOpen,
  prefersReducedMotion,
  onToggle,
}: {
  role: ExperienceRole;
  isOpen: boolean;
  prefersReducedMotion: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`accordion-item${isOpen ? ' active' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        aria-expanded={isOpen}
        aria-controls={`experience-${role.id}`}
        onClick={onToggle}
      >
        <div className="accordion-title">
          <span className="role">{role.role}</span>
          <span className="company">
            {role.company} — {role.location}
          </span>
        </div>
        <div className="accordion-meta">
          <span className="date">{role.dates}</span>
          <span className="icon" aria-hidden="true">
            +
          </span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`experience-${role.id}`}
            className="accordion-content"
            role="region"
            aria-labelledby={`experience-${role.id}-label`}
            style={{ overflow: 'hidden', maxHeight: 'none', position: 'relative' }}
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div ref={contentRef} className="accordion-body" style={{ position: 'relative' }}>
              {/* 3D card-flip overlay — visual layer behind the DOM content.
                  Not rendered when prefers-reduced-motion is active. */}
              {!prefersReducedMotion && (
                <CardFlipCanvas
                  active={isOpen}
                  containerEl={contentRef.current}
                />
              )}
              <ul style={{ position: 'relative', zIndex: 2 }}>
                {role.bullets.map((bullet) => (
                  <li key={bullet.slice(0, 48)}>{bullet}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
