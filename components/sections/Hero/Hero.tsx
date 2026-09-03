'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';

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
  const sceneRef = useRef<HTMLDivElement>(null);

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-name">
      {/* The scene is scissored onto this element by the shared GL stage. It is
          decorative: the section is complete and legible without it. */}
      <div ref={sceneRef} className={styles.stage} aria-hidden="true" />
      <Scene track={sceneRef} lazy={false}>
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

        <ul
          className={styles.ledger}
          aria-label="Delivery record"
          style={{ '--step': 4 } as React.CSSProperties}
        >
          {heroContent.ledger.map((entry) => (
            <li key={entry.label} className={styles.ledgerItem}>
              <span className={styles.ledgerValue}>{entry.value}</span>
              <span className={styles.ledgerLabel}>{entry.label}</span>
              {/* Provenance sits with the figure. A number a reader cannot
                  trace is a claim, not evidence. */}
              <span className={styles.ledgerSource}>{entry.source}</span>
            </li>
          ))}
        </ul>

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
