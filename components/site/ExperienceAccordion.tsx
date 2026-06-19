'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ExperienceRole } from '@/app/data/siteContent';

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
 * Accessible experience accordion. The first (current) role starts expanded.
 *
 * Wave 6 elevation: a glassmorphic shell, a spring-physics height expansion, bullets
 * that stagger in behind the opening drawer, magnetic headers (CursorGlow writes
 * --mag-x/--mag-y), and a per-role duration bar. The bar length is DERIVED from each
 * role's résumé date span (never a fabricated figure) and shown as a proportion of the
 * longest tenure, so the chronology reads at a glance and stays evidence-led (NN-3).
 *
 * `initial`/`exit` are kept identical regardless of reduced motion: the first role
 * renders open during SSR, so a reduced-motion client whose `initial` differed from the
 * server's would hydrate-mismatch (#418). Motion is suppressed via an instant transition
 * instead, so reduced-motion users get every panel with no perceptible animation.
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
    <div className="accordion-shell">
      <div className="accordion-group">
        {roles.map((role) => {
          const isOpen = openId === role.id;
          const duration = durations.get(role.id);
          return (
            <div key={role.id} className={`accordion-item${isOpen ? ' active' : ''}`}>
              <button
                type="button"
                className="accordion-header"
                aria-expanded={isOpen}
                aria-controls={`experience-${role.id}`}
                data-magnetic=""
                data-cursor-label={isOpen ? 'Collapse' : 'Expand'}
                onClick={() => setOpenId(isOpen ? null : role.id)}
              >
                <div className="accordion-title">
                  <span className="role">{role.role}</span>
                  <span className="company">
                    {role.company} — {role.location}
                  </span>
                  {duration && (
                    <span className="accordion-duration" data-duration-bar aria-hidden="true">
                      <span className="accordion-duration-track">
                        <motion.span
                          className="accordion-duration-fill"
                          data-duration-fill
                          style={{ transformOrigin: 'left center' }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: duration.fraction }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 120, damping: 22, delay: 0.1 }
                          }
                        />
                      </span>
                      <span className="accordion-duration-label">{duration.label}</span>
                    </span>
                  )}
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
                    style={{ overflow: 'hidden' }}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }
                    }
                  >
                    <div className="accordion-body">
                      <motion.ul data-accordion-stagger initial="hidden" animate="shown" variants={listContainer}>
                        {role.bullets.map((bullet) => (
                          <motion.li key={bullet.slice(0, 48)} variants={listItem}>
                            {bullet}
                          </motion.li>
                        ))}
                      </motion.ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
