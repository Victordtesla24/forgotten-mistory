import { buildStamp } from '@/app/data/generated/build-stamp';
import { contact } from '@/app/data/siteContent';

import styles from './Footer.module.css';

/**
 * The footer — the last thing a reader sees, and until now the only part of the
 * page that said nothing.
 *
 * Three rules shaped it.
 *
 * **It states the position, not a legal formula.** "All rights reserved" is the
 * kind of sentence a page carries when nobody decided what it should say. The
 * line here is the same claim the rest of the site makes, in one breath: every
 * figure above it has a source, and the reader is invited to go and check one.
 *
 * **The production credit is authorship, not a disclaimer** — one line, in one
 * place, naming what is synthetic and how it was made.
 *
 * **The deploy signal is measured, not decorated.** `scripts/build/build_stamp.mjs`
 * records the commit at build time and refuses to record one at all unless the
 * tree matched it exactly, so the short SHA below always opens the source of the
 * bytes being read. When there is no honest stamp the block is simply absent: a
 * page whose argument is that it refuses to publish an unsourced number cannot
 * print a made-up one along its own bottom edge.
 */



/** `2026-09-03T21:40:11+00:00` → `3 September 2026`, in the reader's language. */
function readableDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.statement}>
          Every figure on this page carries the source it came from, and the ones that could not be
          measured say so instead. If a number here matters to you, go and check it — that is what
          it is for.
        </p>

        <div className={styles.meta}>
          <p className={styles.name}>
            Vikram Deshpande · Melbourne
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <a className={styles.link} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </p>

          {/* The production credit (R-154, R-157): one line of authorship, in one
              place, in the site's own typography. Not a disclaimer, not a modal,
              not a badge, and never adjacent pre-emptive language — it names who
              made what, the way a film names its cinematographer.

              It has to exist because the assistant's face and greeting are
              synthetic and nothing else on the page says so. Removing the
              apologetic register from the old avatar module did not remove the
              accuracy it carried (R-158); this is where that accuracy now lives. */}
          <p className={styles.credit}>
            The assistant&rsquo;s face is a model-generated likeness built from my own photograph,
            and its greeting is my own voice, cloned. Everything else here — every figure, every
            drawing, every line — is not.
          </p>

          {/* The build signal. Present only when it is real. */}
          {buildStamp.sha && buildStamp.authored ? (
            <p className={styles.build}>
              <span className={styles.buildLabel}>This page was built from commit</span>{' '}
              <a
                className={styles.sha}
                href={`https://github.com/Victordtesla24/forgotten-mistory/commit/${buildStamp.sha}`}
              >
                {buildStamp.sha}
              </a>
              <span className={styles.buildLabel}>
                , authored {readableDate(buildStamp.authored)}. The source is open; so is the record of
                what changed.
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
