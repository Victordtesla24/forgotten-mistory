'use client';

import { listenContent } from '@/app/data/portfolio/listen';

import Avatar from './Avatar';
import { feedbackLog } from '@/app/data/generated/feedback-log';

import styles from './Listen.module.css';

/**
 * Always willing to listen — feedback & coffee?
 *
 * The instrument is set down. After five screens of rules, readouts, brackets
 * and charts, this one is nearly empty on purpose: the thing a reader is meant
 * to remember is the silence after the density, and a single sentence standing
 * in it.
 *
 * There is deliberately no contact form. On a static export a form either lies
 * about where the message goes or hands the visitor to a third party, and
 * neither is a good last impression. The four channels are real anchors — a
 * mailto, a tel, and two profiles — so the visitor's own client does the work.
 *
 * The avatar sits here rather than in the hero for the same reason the rest of
 * the section is quiet: a synthetic talking head at the front door is an
 * advertisement, and at the end, after five screens of checkable evidence, it
 * is an offer. It costs the page nothing until someone asks for it.
 */
export default function Listen() {
  return (
    <section id="listen" className={styles.listen} aria-labelledby="listen-title">
      <div className={styles.inner}>
        <p className={styles.kicker}>{listenContent.kicker}</p>
        <h2 id="listen-title" className={styles.title}>
          {listenContent.title}
        </h2>

        {/* The only italic on the site. It makes no factual claim, which is why
            it is also the only line with no source printed under it. */}
        <p className={styles.sentence}>{listenContent.sentence}</p>

        {/* The caliper at one-pixel scale: the last stroke the instrument makes. */}
        <span className={styles.rule} aria-hidden="true" />

        <ul className={styles.channels}>
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

        {/* The receipts. Every portfolio says it wants feedback; this is the
            list of times a review found something wrong with this page and it
            was fixed, read out of the repository's own history at build time.
            The sentence above is a claim; this is the evidence for it, and it
            is the only kind this section could honestly offer. */}
        <section className={styles.ledger} aria-labelledby="listen-ledger-title">
          <h3 id="listen-ledger-title" className={styles.ledgerTitle}>
            {listenContent.ledger.title}
          </h3>
          <p className={styles.ledgerLede}>{listenContent.ledger.lede}</p>
          <ol className={styles.corrections}>
            {feedbackLog.corrections.map((correction) => (
              <li key={correction.hash} className={styles.correction}>
                <a
                  className={styles.correctionHash}
                  href={`${listenContent.ledger.commitBase}${correction.hash}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {correction.hash}
                </a>
                <time className={styles.correctionDate} dateTime={correction.date}>
                  {correction.date}
                </time>
                <span className={styles.correctionSaid}>{correction.said}</span>
              </li>
            ))}
          </ol>
          <p className={styles.ledgerFoot}>
            {feedbackLog.corrections.length} of {feedbackLog.total} corrections in the
            history · harvested {feedbackLog.harvested} from the repository this page is
            built from
          </p>
        </section>

        <Avatar />
      </div>

      <p className={styles.colophon}>{listenContent.colophon}</p>
    </section>
  );
}
