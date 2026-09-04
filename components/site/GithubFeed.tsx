'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import {
  FEED_SIZE,
  githubSourceLabel,
  useGithubStats,
  type RepoStat,
} from '@/lib/githubTelemetry';

// Apple "emphasized decelerate" — the house entrance curve shared across the waves.
const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

const railVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: APPLE_EASE } },
};

const dateFmt = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Monochrome luminance for a language dot. Hue is forbidden (NN-4), so each
 * language is mapped to a deterministic grey in [0.50, 0.99] derived from its
 * name — distinct, stable, and entirely neutral.
 */
function langTone(lang: string | null): number {
  if (!lang) return 0.55;
  let h = 0;
  for (let i = 0; i < lang.length; i += 1) h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  return 0.5 + (h % 50) / 100;
}

/** Count-up star badge. Eases 0 → value once on entrance; instant under reduced motion. */
function StarBadge({ value, animate }: { value: number; animate: boolean }) {
  const [shown, setShown] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setShown(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const duration = 900;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return (
    <span className="repo-star" data-star-count>
      <span aria-hidden="true">★</span> {shown}
    </span>
  );
}

function RepoCardInner({ repo, animate }: { repo: RepoStat; animate: boolean }) {
  return (
    <>
      <div className="repo-card-top">
        <h3>{repo.name}</h3>
        <StarBadge value={repo.stars} animate={animate} />
      </div>
      <p className="repo-description">{repo.description ?? 'No description provided.'}</p>
      <div className="repo-meta">
        <span className="repo-lang">
          <span
            className="repo-lang-dot"
            style={{ '--lang-tone': langTone(repo.language) } as React.CSSProperties}
            aria-hidden="true"
          />
          {repo.language ?? 'Mixed'}
        </span>
        <span className="repo-updated">updated {dateFmt.format(new Date(repo.pushedAt))}</span>
      </div>
    </>
  );
}

/**
 * GitHub activity feed — the most recently pushed public repositories.
 *
 * Reads the shared store in lib/githubTelemetry, so the whole page issues one
 * GitHub request rather than one per consumer, and so a rate-limited or offline
 * visitor still gets real repository data (the committed snapshot) instead of an
 * error. The heading states the provenance: it only claims "Live" when the
 * numbers on screen came from a live response this session, otherwise it dates
 * them. Nothing here is generated or estimated.
 *
 * While loading it shows a quiet shimmering skeleton; on data arrival the cards
 * stagger in with a count-up star badge and a monochrome language dot. Under
 * reduced motion every surface is readable at once — no shimmer, no stagger, no
 * count-up.
 */
export default function GithubFeed() {
  const prefersReducedMotion = useReducedMotionSafe();
  const stats = useGithubStats();
  const repos = stats.repos.slice(0, FEED_SIZE);
  const isLive = stats.source === 'live';

  return (
    <div
      id="github-projects"
      className="repo-list"
      aria-live="polite"
      aria-busy={stats.loading}
      data-github-source={stats.loading ? 'loading' : stats.source}
    >
      {stats.loading ? (
        <div className="repo-skeletons" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="repo-skeleton" data-skeleton>
              <div className="repo-skel-line w-60" />
              <div className="repo-skel-line w-90" />
              <div className="repo-skel-line w-40" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="repo-feed-head">
            {isLive && <span className="repo-fresh" data-fresh-pulse aria-hidden="true" />}
            <span className="repo-feed-label" data-feed-label>
              {githubSourceLabel(stats)}
            </span>
            {!isLive && (
              <a
                href="https://github.com/Victordtesla24"
                target="_blank"
                rel="noreferrer"
                className="repo-feed-link"
              >
                Current activity on GitHub
              </a>
            )}
          </div>
          {prefersReducedMotion ? (
            <div className="repo-feed" data-feed-stagger>
              {repos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="repo-card"
                >
                  <RepoCardInner repo={repo} animate={false} />
                </a>
              ))}
            </div>
          ) : (
            <motion.div
              className="repo-feed"
              data-feed-stagger
              variants={railVariants}
              initial="hidden"
              animate="shown"
            >
              {repos.map((repo) => (
                <motion.a
                  key={repo.name}
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="repo-card"
                  variants={cardVariants}
                >
                  <RepoCardInner repo={repo} animate />
                </motion.a>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
