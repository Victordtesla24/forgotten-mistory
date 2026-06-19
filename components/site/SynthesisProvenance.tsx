'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import Reveal from '@/components/site/Reveal';
import { synthesisSources } from '@/app/data/siteContent';

/**
 * SynthesisProvenance — #synthesis section (FR-SYNTH, prompt §4). Makes the
 * multi-source synthesis visible: every §6 source that was mined is listed with
 * a concrete fact rendered elsewhere on the site that traces back to it, so the
 * profile is evidence-led and never the résumé alone (NN-3 / TC-FR-SYNTH).
 *
 * Studio visual (UI/UX §8): the sources render as a vertical provenance-chain
 * timeline — a connecting rail with a node per entry — and each card enters on a
 * Framer-Motion whileInView stagger. The `initial` state is identical on server
 * and client first paint (it never branches on useReducedMotion, which is false
 * during SSR) so there is no hydration mismatch; reduced motion is expressed as a
 * zero-duration transition that snaps each card to its resting state.
 */
const railVariants = (reduce: boolean): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: reduce ? 0 : 0.05 } },
});

const cardVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0 },
};

export default function SynthesisProvenance() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <section id="synthesis" className="synthesis-section" aria-labelledby="synthesis-title">
      <div className="container">
        <Reveal className="section-header">
          <h2 className="section-title" id="synthesis-title">
            How this profile is sourced
          </h2>
          <p className="section-subhead">
            Every claim traces to a primary source — the résumé, the code, and the record — not
            the résumé alone.
          </p>
        </Reveal>
        <motion.ul
          className="synthesis-grid"
          role="list"
          variants={railVariants(prefersReducedMotion)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        >
          {synthesisSources.map((source) => (
            <motion.li
              key={source.kind}
              className="synthesis-card"
              data-source-kind={source.kind}
              variants={cardVariants}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <span className="synthesis-node" aria-hidden="true" />
              <p className="synthesis-source">{source.label}</p>
              <p className="synthesis-mined">{source.mined}</p>
              <p className="synthesis-fact">{source.tracedFact}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
