'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { proof } from '@/app/data/siteContent';

/**
 * ProofBar — #proof section (FR-PROOF). Quantified, resume-sourced metrics that
 * count up once on scroll-in. Tabular numerals; under prefers-reduced-motion the
 * final values render immediately (no animation).
 */
function ProofValue({
  value,
  prefix = '',
  suffix = '',
  start,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  start: boolean;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    if (!start) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [start, reduced, value]);

  return (
    <span className="proof-value">
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

export default function ProofBar() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px' });

  return (
    <section id="proof" className="proof-section" aria-label="Career proof points" ref={ref}>
      <div className="container">
        <ul className="proof-grid">
          {proof.map((m) => (
            <li key={m.label} className="proof-item">
              <ProofValue value={m.value} prefix={m.prefix} suffix={m.suffix} start={inView} />
              <span className="proof-label">{m.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
