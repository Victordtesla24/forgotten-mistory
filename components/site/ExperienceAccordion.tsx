'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import type { ExperienceRole } from '@/app/data/siteContent';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

const CardFlipCanvas = dynamic(() => import('@/components/fx/CardFlipCanvas'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});

interface ExperienceAccordionProps {
  roles: ExperienceRole[];
}

// Apple-style emphasized decelerate — a long, soft settle shared by the
// experience section so the accordion feels coherent with the rest of the page.
const ACCORDION_EASE = [0.22, 0.61, 0.36, 1] as const;
const BULLET_STAGGER = 0.05;

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
  // SSR-safe: the first (current) role starts expanded, so its content panel —
  // including the conditionally-mounted CardFlipCanvas (next/dynamic ssr:false) —
  // IS present in the server HTML. next/dynamic(ssr:false) emits a real Suspense
  // "bail out to client-side rendering" marker during SSR that the client's FIRST
  // hydration pass must also see; branching whether that dynamic import even mounts
  // on the raw useReducedMotion() (false during SSR, already resolved on a
  // reduced-motion client's first paint) made that marker present on one side and
  // absent on the other — "Expected server HTML to contain a matching <ul> in
  // <div>" (React #418/#423). useReducedMotionSafe() keeps both passes identical.
  const prefersReducedMotion = useReducedMotionSafe();
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
            prefersReducedMotion={prefersReducedMotion}
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
  // Keep the measured DOM node in state so the CardFlipCanvas always receives a
  // real element (deterministic: callback ref fires on mount, no null race).
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);

  const bulletContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : BULLET_STAGGER,
        delayChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const bulletItem = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: ACCORDION_EASE },
    },
  };

  return (
    <div className={`accordion-item${isOpen ? ' active' : ''}`} data-open={isOpen}>
      <button
        type="button"
        className="accordion-header"
        aria-expanded={isOpen}
        aria-controls={`experience-${role.id}`}
        id={`experience-${role.id}-label`}
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
            <span className="icon-bar icon-bar--h" />
            <span className="icon-bar icon-bar--v" />
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
            // `initial` stays constant — the first (current) role starts expanded, so
            // this panel DOES render on the server. Branching `initial` on the raw
            // useReducedMotion() (false during SSR, already resolved on a
            // reduced-motion client's first paint) produced a hard hydration
            // mismatch ("Expected server HTML to contain a matching <ul> in <div>",
            // React #418/#423). Reduced motion collapses via a zero-duration
            // transition instead, matching the Reveal.tsx / HeroAvatar.tsx convention.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: ACCORDION_EASE }}
          >
            <div ref={setContentEl} className="accordion-body">
              {/* 3D card-flip overlay — visual layer behind the DOM content.
                  Not rendered when prefers-reduced-motion is active. */}
              {!prefersReducedMotion && (
                <ErrorBoundary>
                  <CardFlipCanvas active={isOpen} containerEl={contentEl} />
                </ErrorBoundary>
              )}
              <motion.ul
                className="accordion-bullets"
                variants={bulletContainer}
                initial="hidden"
                animate="visible"
              >
                {role.bullets.map((bullet, index) => (
                  <motion.li
                    key={bullet.slice(0, 48)}
                    variants={bulletItem}
                    data-evidence-harness={
                      role.id === 'ato' && index === 1 ? 'true' : undefined
                    }
                  >
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
}
