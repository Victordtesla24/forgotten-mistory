'use client';

import Caliper from '@/components/marks/Caliper';
import HeroPortrait, {
  HeroPortraitCaption,
  HeroPortraitControl,
  PortraitIntentProvider,
} from './HeroPortrait';
import { heroContent } from '@/app/data/portfolio/hero';

import styles from './Hero.module.css';

/**
 * Hero — the front door.
 *
 * INTERIM FRAME (docs/architecture/INTERIM-FRAME.md, Owner 2026-09-06T05:51Z).
 * The atmosphere scene, its poster still, the declared plane, the bloom under
 * the photograph and every opaque plate behind a run of copy are removed. What
 * is left is the frame the words stand in: near-black ground from the existing
 * ink tokens, white and grey type, and the greyscale photograph as a plain
 * block in normal flow. Not one word of `app/data/portfolio/hero.ts` changed.
 *
 * Two rules still govern this file:
 *
 * 1. **Nothing here waits on JavaScript.** Every word is server-rendered and
 *    visible; the entrance is a pure CSS animation with staggered delays.
 * 2. **The scene is never the content.** There is no scene at all in this
 *    slice, and the fold reads exactly the same with WebGL unavailable, with
 *    reduced motion asked for, and with JavaScript switched off.
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
      {/* The figure and its named play/pause control are two halves of one
          state — the loop follows the pointer over the photograph in the fold,
          and the button in the proof band is the keyboard and touch path to the
          same intent — so both stand inside the one provider. */}
      <PortraitIntentProvider>
        {/* The fold. One name, one sentence, ONE action group — `hero-actions`,
            and nothing else pressable. An independent reviewer measured two
            competing CTA groups in this screen on live `9b864752`; the second
            was the button stamped on the face, and it is now in the proof band
            below. The evidence is not deleted; it is one scroll away, in
            `.proof`. The role line came back to the fold with the interim frame
            (TC-IF-02); the city and the photograph's provenance stay in the
            proof band — `hero.ts` is unedited and not one word of it left the
            page. */}
        <div className={styles.inner} data-testid="hero-fold">
        {/* The reading column, as one box: the name, the role, the sentence,
            the actions. `display: contents`, so these are the fold's own flex
            children and the photograph below them is the last of them. */}
        <div className={styles.copy}>
          <h1 id="hero-name" className={styles.name} style={{ '--step': 1 } as React.CSSProperties}>
            {nameLead}
            {' '}
            <br className={styles.nameBreak} aria-hidden="true" />
            {nameTail}
          </h1>

          {/* The role line stands in the fold again. It was moved to the proof
              band by the set-piece slice so the plane could hold the screen on
              its own; with the plane gone the fold is the words, and a reader
              who reads the name has to be told what he does in the same screen
              (TC-IF-02). `hero.ts` is unedited — the node moved, not a word. */}
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

        {/* The photograph, in normal flow at the foot of the fold: a still with
            its loop behind the reader's own press, and nothing composited over
            or under it. */}
        <HeroPortrait />
        </div>

      {/* The proof band. Everything the fold used to carry and could not
          justify carrying: the three figures with their provenance, the line
          that grades them, and the availability signal with its three
          channels. Not one word was deleted — the band starts below 100vh,
          inside #hero and before #about, so `#hero ul` still resolves and
          CT-10 still finds 92 / $5M+ / 10k+ printed with their sources. */}
        <div className={styles.proof} data-testid="hero-proof">
        {/* The city, above the evidence it belongs beside. The role line that
            stood here with it is back in the fold (TC-IF-02). Not one word is
            deleted — `hero.ts` is untouched and both strings render. */}
        <p className={styles.eyebrow} style={{ '--step': 5 } as React.CSSProperties}>
          <span className={styles.locationDot} aria-hidden="true" />
          {heroContent.location}
        </p>

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

          {/* The photograph's provenance, beside its control. Same words, same
              source (`avatar.ts`), one scroll down from the figure. */}
          <HeroPortraitCaption />
        </div>
      </PortraitIntentProvider>
    </section>
  );
}
