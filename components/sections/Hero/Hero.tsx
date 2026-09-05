'use client';

import dynamic from 'next/dynamic';

import Caliper from '@/components/marks/Caliper';
import Scene from '@/components/gl/Scene';
import { heroContent } from '@/app/data/portfolio/hero';

import styles from './Hero.module.css';

// The shader scene is the only part of the hero that costs anything, and it is
// pure enhancement — split it out so it never sits in the critical bundle.
const HeroAtmosphere = dynamic(() => import('./HeroAtmosphere'), { ssr: false });

/**
 * Hero — the front door.
 *
 * Two rules govern this file:
 *
 * 1. **Nothing here waits on JavaScript.** Every word is server-rendered and
 *    visible; the entrance is a pure CSS animation with staggered delays. The
 *    previous hero server-rendered its content at `opacity: 0` and relied on
 *    framer-motion to reveal it, so a cold load showed a blank screen for four
 *    to eight seconds while a 450 kB bundle parsed.
 * 2. **The scene is never the content.** With WebGL unavailable, reduced motion
 *    requested, or the shader chunk still in flight, the hero is unchanged
 *    except that the backdrop stays a flat ink gradient.
 */
export default function Hero() {
  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-name">
      {/* The backdrop slot. Its gradient is the entire backdrop when there is
          no WebGL; the scene, when it mounts, draws over that gradient. */}
      <Scene className={styles.stage}>
        <HeroAtmosphere />
      </Scene>

      <div className={styles.inner}>
        <p className={styles.eyebrow} style={{ '--step': 0 } as React.CSSProperties}>
          <span className={styles.locationDot} aria-hidden="true" />
          {heroContent.location}
        </p>

        <h1 id="hero-name" className={styles.name} style={{ '--step': 1 } as React.CSSProperties}>
          {heroContent.name}
        </h1>

        <p className={styles.role} style={{ '--step': 2 } as React.CSSProperties}>
          {heroContent.role}
        </p>

        <p className={styles.statement} style={{ '--step': 3 } as React.CSSProperties}>
          {heroContent.statement}
        </p>

        {/* The ledger and the note that grades it sit side by side on a wide
            screen: the note explains the marks without costing the fold, and it
            occupies space the hero was otherwise leaving empty. */}
        <div className={styles.ledgerRow} style={{ '--step': 4 } as React.CSSProperties}>
        <ul className={styles.ledger} aria-label="Delivery record">
          {heroContent.ledger.map((entry) => (
            <li key={entry.label} className={styles.ledgerItem}>
              {/* Self-reported, not sourced. These three are his own account of
                  his own programmes: the line beneath each says where the work
                  happened, but no third party published a methodology a reader
                  could go and check. Grading them as measured would be the
                  first dishonest thing on a page arguing for the opposite. */}
              <Caliper state="self-reported" className={styles.ledgerValue}>
                {entry.value}
              </Caliper>
              <span className={styles.ledgerLabel}>{entry.label}</span>
              {/* Provenance sits with the figure. A number a reader cannot
                  trace is a claim, not evidence. */}
              <span className={styles.ledgerSource}>{entry.source}</span>
            </li>
          ))}
        </ul>

        {/* The mark is learned here, with its grade stated once. */}
        <p className={styles.grading}>
          <span className={styles.gradingMark} aria-hidden="true" />
          self-reported, from my CV. Repository figures below are harvested and dated.
        </p>
        </div>

        <div className={styles.actions} style={{ '--step': 5 } as React.CSSProperties}>
          <a className={styles.primaryAction} href={heroContent.actions.primary.href}>
            {heroContent.actions.primary.label}
          </a>
          <a
            className={styles.secondaryAction}
            href={heroContent.actions.secondary.href}
            download
          >
            {heroContent.actions.secondary.label}
          </a>
        </div>

        <p className={styles.availability} style={{ '--step': 6 } as React.CSSProperties}>
          {heroContent.availability}
          <span className={styles.linkRule} aria-hidden="true" />
          {heroContent.links.map((link) => (
            <a
              key={link.label}
              className={styles.link}
              href={link.href}
              {...(link.href.startsWith('http')
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {})}
            >
              {link.label}
            </a>
          ))}
        </p>
      </div>
    </section>
  );
}
