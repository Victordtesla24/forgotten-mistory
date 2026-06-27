'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import Reveal from '@/components/site/Reveal';
import { proof } from '@/app/data/siteContent';

/**
 * ProofBar — #proof section (FR-PROOF). Quantified, resume-sourced metrics that
 * count up on scroll-in with a spring (subtle overshoot, then settle on the exact
 * final). Tabular monospace digits keep the figures aligned; under
 * prefers-reduced-motion the final values render immediately (no animation). The
 * grid enters as a clip-wipe staggered Reveal.
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
    // Spring physics (stiffness 100 / damping 15 → ζ≈0.75): a light overshoot that
    // settles on the exact resume figure rather than a linear tick-up.
    const controls = animate(0, value, {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      onUpdate: (v) => setN(Math.max(0, Math.round(v))),
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
        <Reveal stagger={0.12} variant="clip" className="proof-grid">
          {proof.map((m) => (
            <div key={m.label} className="proof-item" data-proof-metric>
              <ProofValue value={m.value} prefix={m.prefix} suffix={m.suffix} start={inView} />
              <span className="proof-label">{m.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
