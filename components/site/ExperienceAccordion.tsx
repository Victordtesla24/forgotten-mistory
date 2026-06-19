'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ExperienceRole } from '@/app/data/siteContent';

interface ExperienceAccordionProps {
  roles: ExperienceRole[];
}

/**
 * Accessible experience accordion. The first (current) role starts expanded.
 * Expansion is animated with framer-motion height-auto transitions and each
 * header is a real button with aria-expanded state.
 */
export default function ExperienceAccordion({ roles }: ExperienceAccordionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(roles[0]?.id ?? null);

  return (
    <div className="accordion-group">
      {roles.map((role) => {
        const isOpen = openId === role.id;
        return (
          <div key={role.id} className={`accordion-item${isOpen ? ' active' : ''}`}>
            <button
              type="button"
              className="accordion-header"
              aria-expanded={isOpen}
              aria-controls={`experience-${role.id}`}
              onClick={() => setOpenId(isOpen ? null : role.id)}
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
                  style={{ overflow: 'hidden', maxHeight: 'none' }}
                  // `initial`/`exit` are kept IDENTICAL regardless of reduced motion:
                  // the first role renders open during SSR, so a reduced-motion client
                  // whose `initial` differed from the server's would hydrate-mismatch
                  // (#418). Motion is suppressed via an instant transition instead, so
                  // reduced-motion users get the panel with no perceptible animation.
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }
                  }
                >
                  <div className="accordion-body">
                    <ul>
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
      })}
    </div>
  );
}
