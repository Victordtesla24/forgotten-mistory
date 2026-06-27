'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * ClearanceStepper — Framer monochrome credential stepper for the Credentials &
 * Governance skill group (SPEC §7). Shows certification progression in a
 * vertical stepper timeline: Certified Scrum Master → AWS/GCP cloud certs
 * (in progress) → governance milestones. Each step pulses on entry.
 *
 * Data is static, resume-sourced from siteContent skillGroups (CSM, cloud/data
 * certifications in progress). Colours: CSS tokens only. Reduced-motion
 * fallback shows all steps static.
 */

interface StepData {
  id: string;
  label: string;
  status: 'achieved' | 'in-progress' | 'target';
  detail: string;
  year: string;
}

const STEPS: StepData[] = [
  {
    id: 'cs',
    label: 'Bachelor of Engineering',
    status: 'achieved',
    detail: 'Computer Science — University of Melbourne',
    year: '2010',
  },
  {
    id: 'ms',
    label: 'Master of Computer Science',
    status: 'achieved',
    detail: 'Honours — Monash University',
    year: '2011',
  },
  {
    id: 'csm',
    label: 'Certified Scrum Master',
    status: 'achieved',
    detail: 'CSM — Scrum Alliance',
    year: '2024',
  },
  {
    id: 'aws',
    label: 'AWS Cloud Certification',
    status: 'in-progress',
    detail: 'Solutions Architect track',
    year: '2025–26',
  },
  {
    id: 'gcp',
    label: 'GCP Data Certification',
    status: 'in-progress',
    detail: 'Professional Data Engineer track',
    year: '2025–26',
  },
  {
    id: 'delivery',
    label: 'SAFe Program Consultant',
    status: 'target',
    detail: 'Scaled Agile Framework — target certification',
    year: '2026+',
  },
];

export default React.memo(function ClearanceStepper({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pausedRef = useRef(false);

  // Visibility change: pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;
    let idx = 0;
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      if (idx < STEPS.length) {
        setVisibleSteps((prev) => prev + 1);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [inView, prefersReducedMotion]);

  const showAll = prefersReducedMotion;
  const visible = showAll ? STEPS.length : visibleSteps;

  return (
    <div
      ref={containerRef}
      data-testid="clearance-stepper" data-project={project}
      className={`clearance-stepper ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <div className="stepper-header">
        <span className="stepper-kicker">Credentials & Governance</span>
        <span className="stepper-title">Certification Progression</span>
      </div>

      <div className="stepper-track" role="list">
        {STEPS.map((step, idx) => {
          const isVisible = visible > idx;
          const isExpanded = expandedId === step.id;
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.id} className="stepper-step" role="listitem">
              {/* Connector line */}
              {!isLast && (
                <motion.div
                  className={`stepper-connector stepper-connector--${step.status}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isVisible ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={{ transformOrigin: 'top' }}
                />
              )}

              {/* Step node */}
              <motion.button
                type="button"
                className={`stepper-node stepper-node--${step.status}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                whileHover={isVisible ? { scale: 1.15 } : undefined}
                transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                onClick={() => setExpandedId(isExpanded ? null : step.id)}
                aria-expanded={isExpanded}
                aria-label={`${step.label}: ${step.status === 'achieved' ? 'Achieved' : step.status === 'in-progress' ? 'In progress' : 'Target'}`}
              >
                {/* Pulse ring for achieved */}
                {step.status === 'achieved' && isVisible && (
                  <motion.span
                    className="stepper-pulse"
                    initial={{ opacity: 0.6, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                )}
                {/* Inner indicator */}
                <span className={`stepper-indicator stepper-indicator--${step.status}`} />
              </motion.button>

              {/* Step label */}
              <motion.div
                className="stepper-content"
                initial={{ opacity: 0, x: -6 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <span className="stepper-label">{step.label}</span>
                <span className="stepper-year">{step.year}</span>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="stepper-detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <p>{step.detail}</p>
                      <span className={`stepper-badge stepper-badge--${step.status}`}>
                        {step.status === 'achieved'
                          ? 'Achieved'
                          : step.status === 'in-progress'
                            ? 'In Progress'
                            : 'Target'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .clearance-stepper {
          width: 100%;
          max-width: 320px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .stepper-header {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .stepper-kicker {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--mist-400);
        }
        .stepper-title {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--white);
        }
        .stepper-track {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .stepper-step {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          position: relative;
          min-height: 52px;
        }
        .stepper-connector {
          position: absolute;
          left: 10px;
          top: 22px;
          width: 2px;
          height: calc(100% - 22px);
          background: var(--ink-700);
          transform-origin: top;
        }
        .stepper-connector--achieved {
          background: var(--steel);
          opacity: 0.4;
        }
        .stepper-connector--in-progress {
          background: var(--steel);
          opacity: 0.25;
        }
        .stepper-connector--target {
          background: var(--ink-700);
          opacity: 0.6;
        }
        .stepper-node {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: var(--ink-800);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .stepper-node--achieved {
          border: 1.5px solid var(--steel);
        }
        .stepper-node--in-progress {
          border: 1.5px dashed var(--steel);
          opacity: 0.8;
        }
        .stepper-node--target {
          border: 1.5px solid var(--ink-700);
          opacity: 0.5;
        }
        .stepper-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .stepper-indicator--achieved {
          background: var(--white);
        }
        .stepper-indicator--in-progress {
          background: var(--steel);
        }
        .stepper-indicator--target {
          background: var(--ink-700);
        }
        .stepper-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--white);
          opacity: 0;
        }
        .stepper-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          padding-top: 0.1rem;
        }
        .stepper-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--mist-200);
        }
        .stepper-year {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--mist-400);
          opacity: 0.8;
        }
        .stepper-detail {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-top: 0.2rem;
        }
        .stepper-detail p {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--steel);
          margin: 0;
        }
        .stepper-badge {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          align-self: flex-start;
        }
        .stepper-badge--achieved {
          color: var(--white);
          border: 1px solid var(--white);
        }
        .stepper-badge--in-progress {
          color: var(--steel);
          border: 1px solid var(--steel);
        }
        .stepper-badge--target {
          color: var(--ink-700);
          border: 1px solid var(--ink-700);
          opacity: 0.7;
        }
        @media (prefers-reduced-motion: reduce) {
          .stepper-node,
          .stepper-pulse,
          .stepper-connector {
            animation: none !important;
            transition: none !important;
          }
          .stepper-pulse {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
