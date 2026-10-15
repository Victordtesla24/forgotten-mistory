'use client';

import dynamic from 'next/dynamic';

import Caliper from '@/components/marks/Caliper';
import HeroPortrait, {
  HeroPortraitCaption,
  HeroPortraitControl,
  PortraitIntentProvider,
} from './HeroPortrait';
import { heroContent } from '@/app/data/portfolio/hero';

import styles from './Hero.module.css';

import HeroObservatory from './HeroObservatory';

/**
 * Hero — the front door.
 *
 * The front door keeps the immutable typed copy and adds a CSS/SVG optical
 * instrument behind it: finite reveal only, no generic particles and no ambient
 * JavaScript motion. The observatory below the CTA samples only browser-local
 * APIs after an explicit button press.
 *
 * Two rules still govern this file:
 *
 * 1. **Nothing here waits on JavaScript.** Every word is server-rendered and
 *    visible; the entrance is a pure CSS animation with staggered delays.
 * 2. **The scene is never the content.** The optical field is decorative CSS/SVG;
 *    the fold copy and observatory label are visible with JavaScript switched off.
 */
export default function Hero() {
  // The name sets as one line across the whole measure above the phone
  // breakpoint, and as an authored two-line lockup ('Vikram' over 'Deshpande')
  // below it. Splitting on the first space lets a single <br> carry the break
  // without hard-coding the mark's text; the space sits before the break, so
  // with it collapsed (see .nameBreak) the accessible name is unchanged.
  const [nameLead, ...nameRest] = heroContent.name.split(' ');
  const nameTail = nameRest.join(' ');

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-name">
      <div className={styles.inner} data-testid="hero-fold">
        <div className={styles.copy}>
          <h1 id="hero-name" className={styles.name} style={{ '--step': 0 } as React.CSSProperties}>
            {nameLead}
            {' '}
            <br className={styles.nameBreak} aria-hidden="true" />
            {nameTail}
          </h1>

          <p className={styles.role} style={{ '--step': 1 } as React.CSSProperties}>
            {heroContent.role}
          </p>

          <p className={styles.statement} style={{ '--step': 2 } as React.CSSProperties}>
            {heroContent.statement}
          </p>

          <div
            className={styles.actions}
            data-testid="hero-actions"
            style={{ '--step': 3 } as React.CSSProperties}
          >
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

          <HeroObservatory />
        </div>

        <PortraitIntentProvider>
          <HeroPortrait />
        </PortraitIntentProvider>

        <div className={styles.opticalField} aria-hidden="true">
          <svg className={styles.opticalSvg} viewBox="0 0 720 420" focusable="false">
            <circle className={styles.opticOuter} cx="486" cy="182" r="132" />
            <circle className={styles.opticInner} cx="486" cy="182" r="68" />
            <ellipse className={styles.opticOrbit} cx="486" cy="182" rx="198" ry="64" />
            <ellipse className={styles.opticOrbitFine} cx="486" cy="182" rx="238" ry="92" />
            <path className={styles.opticRule} d="M54 182H354M618 182H682M486 18V92M486 272V396" />
            <path className={styles.opticGold} d="M558 76 612 34M594 136 684 118M552 286 628 356" />
            <path className={styles.opticCalibrations} d="M108 166v32M150 174v16M192 174v16M234 174v16M276 166v32M318 174v16" />
          </svg>
        </div>
      </div>

      <div className={styles.proof} data-testid="hero-proof">
        <p className={styles.eyebrow} style={{ '--step': 4 } as React.CSSProperties}>
          <span className={styles.locationDot} aria-hidden="true" />
          {heroContent.location}
        </p>

        <div className={styles.ledgerRow} style={{ '--step': 4 } as React.CSSProperties}>
          <ul className={styles.ledger} aria-label="Delivery record">
            {heroContent.ledger.map((entry) => (
              <li key={entry.label} className={styles.ledgerItem}>
                <Caliper state="self-reported" className={styles.ledgerValue}>
                  {entry.value}
                </Caliper>
                <span className={styles.ledgerText}>
                  <span className={styles.ledgerLabel}>{entry.label}</span>
                  <span className={styles.ledgerSource}>{entry.source}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className={styles.grading}>
            <span className={styles.gradingMark} aria-hidden="true" />
            self-reported, from my CV. Repository figures below are harvested and dated.
          </p>
        </div>

        <p
          className={styles.availability}
          data-testid="hero-availability"
          style={{ '--step': 5 } as React.CSSProperties}
        >
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

        <PortraitIntentProvider>
          <HeroPortraitControl />
        </PortraitIntentProvider>

        <HeroPortraitCaption />
      </div>
    </section>
  );

}
