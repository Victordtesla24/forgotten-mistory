'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Reveal from '@/components/site/Reveal';
import { projectionDimensions } from '@/app/data/siteContent';

/**
 * MindsetProjection — #mindset section (FR-MINDSET, prompt §4). Projects the
 * balanced persona across four source-traceable dimensions: technical depth,
 * multi-million-dollar program scale, multi-year/decades sustained execution, and
 * multi-layered tangible value (≥2 of time saved / risk reduced / cost avoided).
 * Every claim is number-led and cites its source (NN-3 / TC-FR-MINDSET).
 *
 * Studio visual (UI/UX §8): the four dimensions enter on a Framer-Motion
 * whileInView stagger. `initial` is identical on server and client first paint
 * (never branches on useReducedMotion) so hydration cannot mismatch; reduced
 * motion collapses the transition to zero duration.
 */
const gridVariants = (reduce: boolean): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: reduce ? 0 : 0.05 } },
});

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function MindsetProjection() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <section id="mindset" className="mindset-section" aria-labelledby="mindset-title">
      <div className="container">
        <Reveal className="section-header">
          <h2 className="section-title" id="mindset-title">
            How I deliver, in numbers
          </h2>
          <p className="section-subhead">
            An outcome-focused, collaborative Agile profile — depth, scale, longevity and value,
            each traceable to the record.
          </p>
        </Reveal>
        <motion.ul
          className="mindset-grid"
          role="list"
          variants={gridVariants(prefersReducedMotion)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        >
          {projectionDimensions.map((dimension) => (
            <motion.li
              key={dimension.key}
              className="mindset-card"
              data-dimension={dimension.key}
              variants={cardVariants}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <p className="mindset-label">{dimension.label}</p>
              <p className="mindset-claim">{dimension.claim}</p>
              {dimension.values && dimension.values.length > 0 && (
                <ul className="mindset-values" role="list">
                  {dimension.values.map((value) => (
                    <li key={value} className="mindset-value" data-value-kind={value}>
                      {value}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mindset-source">{dimension.source}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
