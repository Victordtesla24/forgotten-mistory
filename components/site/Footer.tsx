import { execFileSync } from 'node:child_process';

import { contact } from '@/app/data/siteContent';

import styles from './Footer.module.css';

/**
 * The footer — the last thing a reader sees, and until now the only part of the
 * page that said nothing.
 *
 * Two rules shaped it.
 *
 * **It states the position, not a legal formula.** "All rights reserved" is the
 * kind of sentence a page carries when nobody decided what it should say. The
 * line here is the same claim the rest of the site makes, in one breath: every
 * figure above it has a source, and the reader is invited to go and check one.
 *
 * **The deploy signal is measured, not decorated.** It is read from git at build
 * time — the commit that produced these bytes and the moment it was authored —
 * so a reader can take the short SHA, open the repository, and find the exact
 * source of the page they are looking at. That is the delivery-excellence trait
 * expressed as a fact rather than a claim about pace.
 *
 * If git cannot be reached at build time the stamp is **omitted entirely**. It
 * is never approximated, never stood in for and never zeroed: a site whose argument
 * is that it refuses to publish an unsourced number cannot print a made-up one
 * at the bottom of every page.
 */

interface BuildStamp {
  sha: string;
  authored: string;
}

/**
 * Read at module scope, which for a static export means once at build time. The
 * `git` call is wrapped because the build may legitimately run outside a
 * checkout — in which case the stamp is absent rather than invented.
 */
function readBuildStamp(): BuildStamp | null {
  try {
    const git = (...args: string[]) =>
      execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const sha = git('rev-parse', '--short=8', 'HEAD');
    const authored = git('log', '-1', '--format=%cI');
    if (!sha || !authored) return null;
    return { sha, authored };
  } catch {
    return null;
  }
}

const stamp = readBuildStamp();

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
          {stamp ? (
            <p className={styles.build}>
              <span className={styles.buildLabel}>This page was built from commit</span>{' '}
              <a
                className={styles.sha}
                href={`https://github.com/Victordtesla24/forgotten-mistory/commit/${stamp.sha}`}
              >
                {stamp.sha}
              </a>{' '}
              <span className={styles.buildLabel}>
                , authored {readableDate(stamp.authored)}. The source is open; so is the record of
                what changed.
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
