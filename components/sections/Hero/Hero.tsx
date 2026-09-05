'use client';

import dynamic from 'next/dynamic';

import Caliper from '@/components/marks/Caliper';
import Scene from '@/components/gl/Scene';
import HeroPortrait, { HeroPortraitControl, PortraitIntentProvider } from './HeroPortrait';
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
      <Scene className={styles.stage} sceneId="hero-atmosphere">
        <HeroAtmosphere />
      </Scene>

      {/* Both bands, and only both bands, sit inside the portrait's intent
          provider: the figure stands in the fold and its named play/pause
          control stands in the proof band, and one state has to serve the two.
          `<Scene>` is outside it on purpose — a pointer crossing the
          photograph must not re-render the shader's tree. */}
      <PortraitIntentProvider>
        {/* The fold. One name, one sentence, ONE action group — `hero-actions`,
            and nothing else pressable — and the photograph. An independent
            reviewer measured two competing CTA groups in this screen on live
            `9b864752`; the second was the button stamped on the face, and it
            is now in the proof band below. The evidence is not deleted; it is
            one scroll away, in `.proof`. */}
        <div className={styles.inner} data-testid="hero-fold">
        {/* The reading column, as one box. It is a grid item at 720 px and up
            and `display: contents` below, so the photograph beside it can
            never stretch the rhythm of the type: a figure spanning five grid
            rows distributes its own height across all five, which is how the
            name ended up 390 px below the location line. */}
        <div className={styles.copy}>
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

          <div
            className={styles.actions}
            data-testid="hero-actions"
            style={{ '--step': 4 } as React.CSSProperties}
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
        </div>

        {/* The photograph. At 720 px and above the CSS gives it the whole
            right column of the fold, floor to ceiling — it is the composition,
            not an inset. Below 720 px it follows the actions in the flow,
            full-bleed, so the fold still ends on "See the evidence"
            (TC-HERO-12/TC-PHOTO-08) and the face is met on the way down. It is
            a <figure> with a <figcaption>, never a <p>: the statement is still
            the fold's only paragraph over twelve words. */}
        <HeroPortrait />
        </div>

      {/* The proof band. Everything the fold used to carry and could not
          justify carrying: the three figures with their provenance, the line
          that grades them, and the availability signal with its three
          channels. Not one word was deleted — the band starts below 100vh,
          inside #hero and before #about, so `#hero ul` still resolves and
          CT-10 still finds 92 / $5M+ / 10k+ printed with their sources. */}
        <div className={styles.proof} data-testid="hero-proof">
        {/* The three figures, each carrying its own provenance, and the line
            that grades them: sourced would be a lie, so the mark says
            self-reported and says why. */}
        <div className={styles.ledgerRow} style={{ '--step': 5 } as React.CSSProperties}>
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
                {/* One cell on a phone, two rows beside the figure elsewhere:
                    the wrapper has no box of its own above 600 px. */}
                <span className={styles.ledgerText}>
                  <span className={styles.ledgerLabel}>{entry.label}</span>
                  {/* Provenance sits with the figure. A number a reader cannot
                      trace is a claim, not evidence. */}
                  <span className={styles.ledgerSource}>{entry.source}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* The mark is learned here, with its grade stated once. */}
          <p className={styles.grading}>
            <span className={styles.gradingMark} aria-hidden="true" />
            self-reported, from my CV. Repository figures below are harvested and dated.
          </p>
        </div>

        <p
          className={styles.availability}
          data-testid="hero-availability"
          style={{ '--step': 6 } as React.CSSProperties}
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

          {/* The photograph's own control, where a control belongs: named, in
              text, below the fold, beside the evidence — not a glyph stamped on
              a face in the first screen. The loop still follows the pointer
              over the figure; this is the keyboard and touch path to it, and it
              works under reduced motion because a reader's own press is allowed
              (WCAG 2.2.2). */}
          <HeroPortraitControl />
        </div>
      </PortraitIntentProvider>
    </section>
  );
}
