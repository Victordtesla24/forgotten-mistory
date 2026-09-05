'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import Scene from '@/components/gl/Scene';
import { listenContent } from '@/app/data/portfolio/listen';

import type { BeatState } from './ListenField';
import styles from './Listen.module.css';

// The bench light under the instrument. Dynamic so `three` lands in the chunk
// `Scene` fetches when a scene actually mounts, not in this section's bundle.
const ListenField = dynamic(() => import('./ListenField'), { ssr: false });

/** The caliper's drawn width, in viewBox units — one to one with CSS px unless the viewport is narrower than the instrument. */
const CALIPER_WIDTH = 320;
/** The centre line the two jaws close on. */
const CALIPER_CENTRE = CALIPER_WIDTH / 2;
/** Each jaw's inward return, in viewBox units: one hairline step at caption size, as on the mark itself. */
const JAW_RETURN = 3;
/** Air between a return and the reading, so the instrument never closes onto its own '—'. */
const READING_AIR = 3;
/** The closed half-width before anything has been measured (a 2.5rem gap at a 16px root). */
const FALLBACK_HALF = 20;

/**
 * The four routes arrive as four marks along the beam (LISTEN-FLAGSHIP.md §2 C2).
 * The marks are laid at strictly increasing x inside this margin from each edge,
 * so they read as a timeline across the instrument rather than a cluster at its
 * centre where the reading and the closing jaws already are.
 */
const ARRIVAL_MARGIN = 40;
/** How far each half of an arrival mark stands open before it closes, in viewBox units. */
const ARRIVAL_OPEN = 9;
/** Half the closed gap of an arrival mark — the small bracket its two jaws close to. */
const ARRIVAL_GAP = 2;
/** The arrival jaw's vertical reach on the beam, hairline-scale (the beam sits at y=20). */
const ARRIVAL_TOP = 13;
const ARRIVAL_BOTTOM = 27;
/** Each arrival jaw's inward return, the mark's own hairline step. */
const ARRIVAL_RETURN = 3;

/** The x of the i-th arrival mark of `count`, strictly increasing across the beam. */
const arrivalX = (index: number, count: number) =>
  count <= 1
    ? CALIPER_CENTRE
    : ARRIVAL_MARGIN + (index * (CALIPER_WIDTH - 2 * ARRIVAL_MARGIN)) / (count - 1);

/**
 * Always willing to listen — feedback & coffee?
 *
 * The instrument is set down. After five screens of rules, readouts, brackets
 * and charts, this one is nearly empty on purpose: the thing a reader is meant
 * to remember is the silence after the density, and a single sentence standing
 * in it.
 *
 * The section has one beat, and it is silent (design council R-c1). The caliper
 * — the one mark the site asks a reader to learn — is drawn here at instrument
 * scale, jaws open at full width when the section arrives. Over the long
 * cinematic beat the jaws close to the width of the sentence's first word, and
 * the reading between them stays '—': the section makes no claim, so there is
 * no figure and no gold. Then the hairline draws beneath it as the last stroke.
 * The instrument that measured everything above is set down, still honest,
 * with nothing to measure.
 *
 * The closed width is measured, not guessed: a DOM Range over the sentence's
 * first word gives its rendered width in place, without adding an element to
 * the one italic line on the site. The reading's own width sets a floor, so the
 * jaws never close onto the '—'. With no script at all the instrument renders
 * closed and the rule drawn — the final state is the default state — and under
 * reduced motion the same final state is drawn at once while the copy arrives
 * as a short, sequenced fade instead.
 *
 * There is deliberately no contact form. On a static export a form either lies
 * about where the message goes or hands the visitor to a third party, and
 * neither is a good last impression. The four channels are real anchors — a
 * mailto, a tel, and two profiles — so the visitor's own client does the work.
 */
export default function Listen() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const sentenceRef = useRef<HTMLParagraphElement | null>(null);
  const caliperRef = useRef<SVGSVGElement | null>(null);
  const readingRef = useRef<SVGTextElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [half, setHalf] = useState<number | null>(null);
  // Where the instrument lies within the section, for the field behind it. A
  // ref, not state: it is layout, it changes only when the section is measured,
  // and the scene reads it inside `useFrame`.
  const beat = useRef<BeatState>({ band: 0.5 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const measure = () => {
      const sentence = sentenceRef.current;
      const caliper = caliperRef.current;
      const reading = readingRef.current;
      if (!sentence || !caliper || !reading) return;

      // CSS px → viewBox units. The SVG only scales when the viewport is
      // narrower than the instrument; everywhere else this is exactly one.
      const rendered = caliper.getBoundingClientRect().width;
      const scale = rendered > 0 ? rendered / CALIPER_WIDTH : 1;

      let firstWord = 0;
      const node = sentence.firstChild;
      if (node && node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        const end = text.search(/\s|$/);
        if (end > 0) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, end);
          firstWord = range.getBoundingClientRect().width / scale;
        }
      }

      const readingWidth = reading.getBoundingClientRect().width / scale;
      const floor = readingWidth + 2 * (JAW_RETURN + READING_AIR);
      const gap = Math.max(firstWord, floor);
      // Half the gap, on a half-pixel grid so the hairlines land crisp when the
      // beat settles.
      setHalf(Math.max(0.5, Math.round(gap) / 2));

      // The same measurement the field needs: where along the section the
      // instrument lies, so the band of light is under the caliper rather than
      // at an arbitrary height of the canvas.
      const sectionBox = section.getBoundingClientRect();
      const caliperBox = caliper.getBoundingClientRect();
      if (sectionBox.height > 0) {
        beat.current.band = Math.min(
          1,
          Math.max(
            0,
            (caliperBox.top + caliperBox.height / 2 - sectionBox.top) / sectionBox.height,
          ),
        );
      }
    };

    setArmed(true);
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fonts && fonts.ready) {
      fonts.ready.then(measure, measure);
    } else {
      measure();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          measure();
          setClosed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const caliperStyle = {
    '--caliper-half': `${half ?? FALLBACK_HALF}px`,
  } as CSSProperties;

  return (
    <section
      id="listen"
      ref={sectionRef}
      className={styles.listen}
      aria-labelledby="listen-title"
      data-armed={armed ? '' : undefined}
      data-closed={closed ? '' : undefined}
    >
      {/* The bench light, which is the caliper's own beat seen as light: it
          brightens as the jaws close and then holds. No second animation — with
          no WebGL, reduced motion, or the section off screen, `Scene` mounts
          nothing and the closing screen is exactly as empty as it was. */}
      <div className={styles.field} data-close={closed ? 'closed' : 'open'}>
        <Scene className={styles.fieldSlot} sceneId="listen-field">
          <ListenField closed={closed} beat={beat} />
        </Scene>
      </div>

      <div className={styles.inner}>
        <p className={styles.kicker}>{listenContent.kicker}</p>
        <h2 id="listen-title" className={styles.title}>
          {listenContent.title}
        </h2>

        {/* The only italic on the site. It makes no factual claim, which is why
            it is also the only line with no source printed under it. */}
        <p ref={sentenceRef} className={styles.sentence}>
          {listenContent.sentence}
        </p>

        {/* The instrument, set down. Two jaws close on a reading that stays
            '—'; decorative to assistive technology because it says nothing the
            sentence above it does not. */}
        <svg
          ref={caliperRef}
          data-caliper
          aria-hidden="true"
          focusable="false"
          className={styles.caliper}
          viewBox={`0 0 ${CALIPER_WIDTH} 40`}
          width={CALIPER_WIDTH}
          height="40"
          style={caliperStyle}
        >
          <line className={styles.beam} x1="0" y1="20" x2={CALIPER_WIDTH} y2="20" vectorEffect="non-scaling-stroke" />
          <g data-jaw="left" className={`${styles.jaw} ${styles.jawLeft}`}>
            <path
              d={`M${CALIPER_CENTRE} 10 V30 M${CALIPER_CENTRE} 10 h${JAW_RETURN} M${CALIPER_CENTRE} 30 h${JAW_RETURN}`}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g data-jaw="right" className={`${styles.jaw} ${styles.jawRight}`}>
            <path
              d={`M${CALIPER_CENTRE} 10 V30 M${CALIPER_CENTRE} 10 h-${JAW_RETURN} M${CALIPER_CENTRE} 30 h-${JAW_RETURN}`}
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* The four routes arrive as four marks on the voice's line: one
              caliper jaw pair per channel, in DOM order, at strictly increasing
              x. Each closes in sequence inside the jaws' single cinematic window
              — animation-delay only, iteration-count 1 — four beats arriving on
              the beam, not a second clock (MOT-F-4, LISTEN-FLAGSHIP.md §2 C2/C4).
              Drawn in the caliper's own ink at hairline weight; the gold on the
              two record channels (LinkedIn, GitHub) is t_l1_04. */}
          {listenContent.channels.map((channel, index) => {
            const count = listenContent.channels.length;
            const cx = arrivalX(index, count);
            const arrivalStyle = {
              '--arrival-progress': count > 1 ? index / (count - 1) : 0,
            } as CSSProperties;
            return (
              <g
                key={channel.href}
                data-arrival={channel.kind}
                className={styles.arrival}
                style={arrivalStyle}
              >
                <path
                  className={styles.arrivalJawLeft}
                  d={`M${cx - ARRIVAL_GAP} ${ARRIVAL_TOP} V${ARRIVAL_BOTTOM} M${cx - ARRIVAL_GAP} ${ARRIVAL_TOP} h${ARRIVAL_RETURN} M${cx - ARRIVAL_GAP} ${ARRIVAL_BOTTOM} h${ARRIVAL_RETURN}`}
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className={styles.arrivalJawRight}
                  d={`M${cx + ARRIVAL_GAP} ${ARRIVAL_TOP} V${ARRIVAL_BOTTOM} M${cx + ARRIVAL_GAP} ${ARRIVAL_TOP} h-${ARRIVAL_RETURN} M${cx + ARRIVAL_GAP} ${ARRIVAL_BOTTOM} h-${ARRIVAL_RETURN}`}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          <text
            ref={readingRef}
            className={styles.reading}
            x={CALIPER_CENTRE}
            y="20"
            textAnchor="middle"
            dominantBaseline="central"
          >
            —
          </text>
        </svg>

        {/* The caliper at one-pixel scale: the last stroke the instrument makes. */}
        <span className={styles.rule} aria-hidden="true" />

        {/* The routes. The engagement plate leads — it is the one action a
            business client can finish on this page, and the one filled ground
            in the section — then the four addresses as plain channels, laid
            across the column rather than stacked in a narrow file with the
            right half of the frame empty (R-c8 C-09, R-c13 CC-02/CC-05). The
            email is a channel like the other three: a second filled pill under
            the plate was the same route wearing different type (ADV-1451Z P1).
            The plate is chrome, not a claim, so it is white and never gold. */}
        <ul className={styles.channels}>
          <li className={styles.engageRow}>
            <a className={styles.engage} data-cta="engage" href={listenContent.engage.href}>
              {listenContent.engage.label}
            </a>
          </li>
          {listenContent.channels.map((channel) => (
            <li key={channel.href}>
              <a
                className={styles.channel}
                href={channel.href}
                {...(channel.kind === 'external'
                  ? { target: '_blank', rel: 'me noreferrer noopener' }
                  : {})}
              >
                {channel.label}
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.coffee}>{listenContent.coffee}</p>

      </div>

    </section>
  );
}
