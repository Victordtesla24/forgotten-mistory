'use client';

import dynamic from 'next/dynamic';

import Caliper from '@/components/marks/Caliper';
import Scene from '@/components/gl/Scene';
import HeroPortrait, {
  HeroPortraitCaption,
  HeroPortraitControl,
  PortraitIntentProvider,
} from './HeroPortrait';
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
  // The name sets as one line across the whole measure above the phone
  // breakpoint, and as an authored two-line lockup ('Vikram' over 'Deshpande')
  // below it. Splitting on the first space lets a single <br> carry the break
  // without hard-coding the mark's text; the space sits before the break, so
  // with it collapsed (see .nameBreak) the accessible name is unchanged.
  const [nameLead, ...nameRest] = heroContent.name.split(' ');
  const nameTail = nameRest.join(' ');

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-name">
      {/* The backdrop slot. Its still is the entire backdrop when there is no
          WebGL; the scene, when it mounts, draws over that still.

          `priority` is the one place on the site that opts out of Scene's idle
          gate, and it is the hero because the hero is the only scene that is
          already on screen when the page opens. Left on the default the
          atmosphere waits for `window.load` and an idle callback — which is how
          the independent review came to measure zero canvases on a normal load
          and the flagship only under `?gl=force`. The still below is what makes
          it safe: the frame is lit from the static HTML, so the canvas is an
          enhancement over a painted picture rather than the thing the first
          paint is waiting on (Scene.tsx `priority`, TC-HERO-FIRSTPAINT-01/02). */}
      {/* Half resolution. The atmosphere is the most expensive frame on the site
          — 366.6 ms on a median frame at 1440x900, measured, against a 16.7 ms
          budget (G-X1-01) — and it is expensive because it fills, not because it
          computes: fog, two Gaussian shafts and two pools, none of which has an
          edge sharp enough for a reader to find the upscale. The grain is the one
          term that resolution touches and it is a 1.8% dither. */}
      {/* Both bands, and only both bands, sit inside the portrait's intent
          provider: the figure stands in the plane and its named play/pause
          control stands in the proof band, and one state has to serve the two.
          `<Scene>` now sits inside the provider because the plane owns both it
          and the figure (HERO-SETPIECE-v3 §4, D-4) — and it still never
          re-renders on a pointer crossing the photograph: the provider holds
          the state, its `children` are the same element objects Hero passed on
          the render before, and React skips reconciling an unchanged child. */}
      <PortraitIntentProvider>
        {/* THE PLANE (HERO-SETPIECE-v3 §1, §4 D-4). The declared ground of the
            fold: the atmosphere's stage slot and the photograph, and nothing
            else, ever. The instrument
            (`scripts/validate/hero_plane_dominance.mjs`) exempts this subtree
            from the ink set by declaration rather than by inference, which is
            what lets the figure be *part of* the backdrop instead of an object
            standing on it. The exemption is fenced by TC-HERO-PLANE-03: no text
            leaf and nothing pressable may live in here, so it can never be
            widened to hide a headline or a CTA from the measure.

            `priority` is the one place on the site that opts out of Scene's idle
            gate, and it is the hero because the hero is the only scene that is
            already on screen when the page opens. The poster still below it is
            what makes that safe: the frame is lit from the static HTML, so the
            canvas is an enhancement over a painted picture rather than the thing
            the first paint waits on (Scene.tsx `priority`,
            TC-HERO-FIRSTPAINT-01/02).

            Half resolution. The atmosphere is the most expensive frame on the
            site — 366.6 ms on a median frame at 1440x900, measured, against a
            16.7 ms budget (G-X1-01) — and it is expensive because it fills, not
            because it computes: fog, two Gaussian shafts and two pools, none of
            which has an edge sharp enough for a reader to find the upscale. */}
        <div className={styles.plane} data-plane="hero">
          <Scene className={styles.stage} sceneId="hero-atmosphere" priority resolutionScale={0.5}>
            <HeroAtmosphere />
          </Scene>

          {/* The photograph, composited inside the plane at the §3 geometry —
              right of centre, its outer margin dissolving into the light, its
              lower band crossed by the name's baseline. It is never scaled above
              1.0× of the 1480×826 still (FIG-CAP, TC-HERO-SET-03). */}
          <HeroPortrait />
        </div>

        {/* The fold. One name, one sentence, ONE action group — `hero-actions`,
            and nothing else pressable. An independent reviewer measured two
            competing CTA groups in this screen on live `9b864752`; the second
            was the button stamped on the face, and it is now in the proof band
            below. The evidence is not deleted; it is one scroll away, in
            `.proof`. The role line, the city and the photograph's provenance
            went the same way in this slice (§6.1) — `hero.ts` is unedited and
            not one word of it left the page. */}
        <div className={styles.inner} data-testid="hero-fold">
        {/* The reading column, as one box: the name, the sentence, the actions.
            It carries no picture column any more — the photograph stands in the
            plane behind it — so the type is free to the full measure. */}
        <div className={styles.copy}>
          <h1 id="hero-name" className={styles.name} style={{ '--step': 1 } as React.CSSProperties}>
            {nameLead}
            {' '}
            <br className={styles.nameBreak} aria-hidden="true" />
            {nameTail}
          </h1>

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
        </div>

      {/* The proof band. Everything the fold used to carry and could not
          justify carrying: the three figures with their provenance, the line
          that grades them, and the availability signal with its three
          channels. Not one word was deleted — the band starts below 100vh,
          inside #hero and before #about, so `#hero ul` still resolves and
          CT-10 still finds 92 / $5M+ / 10k+ printed with their sources. */}
        <div className={styles.proof} data-testid="hero-proof">
        {/* The role and the city, one scroll down (HERO-SETPIECE-v3 §6.1). They
            were the fold's third and fourth text blocks; the fold now carries
            the name, the sentence and the actions and nothing else, because a
            set piece a reader reads in one clause cannot also be a list. Not one
            word is deleted — `hero.ts` is untouched and both strings render
            here, above the evidence they belong beside. */}
        <p className={styles.role} style={{ '--step': 5 } as React.CSSProperties}>
          {heroContent.role}
        </p>

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

          {/* The photograph's provenance, beside its control (§6.1). It used to
              be a <figcaption> inside the fold; a caption in the plane would be
              a text leaf inside the declared ground, which TC-HERO-PLANE-03
              forbids — and it was a real ink rect in the fold besides. Same
              words, same source (`avatar.ts`), one scroll down. */}
          <HeroPortraitCaption />
        </div>
      </PortraitIntentProvider>
    </section>
  );
}
