'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ExperienceRole } from '@/app/data/siteContent';
import ErrorBoundary from '@/components/ErrorBoundary';

const CardFlipCanvas = dynamic(() => import('@/components/fx/CardFlipCanvas'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});

interface ExperienceAccordionProps {
  roles: ExperienceRole[];
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
                <ErrorBoundary>
                  <CardFlipCanvas
                    active={isOpen}
                    containerEl={contentRef.current}
                  />
                </ErrorBoundary>
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
