'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

interface RepoSummary {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
}

const FEED_URL =
  'https://api.github.com/users/Victordtesla24/repos?sort=pushed&per_page=4&type=owner';

// Apple "emphasized decelerate" — the house entrance curve shared across the waves.
const APPLE_EASE = [0.16, 1, 0.3, 1] as const;

type FeedState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; repos: RepoSummary[] };

const railVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: APPLE_EASE } },
};

const dateFmt = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

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

function RepoCardInner({ repo, animate }: { repo: RepoSummary; animate: boolean }) {
  return (
    <>
      <div className="repo-card-top">
        <h3>{repo.name}</h3>
        <StarBadge value={repo.stargazers_count} animate={animate} />
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
        <span className="repo-updated">updated {dateFmt.format(new Date(repo.pushed_at))}</span>
      </div>
    </>
  );
}

/**
 * Client-side GitHub activity feed. While loading it shows a quiet shimmering
 * skeleton; on data arrival the repository cards stagger into view with a
 * count-up star badge, a monochrome language dot, and a live "fresh data" pulse.
 * A failed or rate-limited request degrades to an inline retry button that
 * re-fetches in place. Under reduced motion every surface is readable at once —
 * no shimmer, no stagger, no count-up.
 */
export default function GithubFeed() {
  const prefersReducedMotion = useReducedMotionSafe();
  const [state, setState] = useState<FeedState>({ status: 'loading' });
  const startedRef = useRef(false);

  const load = useCallback(() => {
    setState({ status: 'loading' });
    fetch(FEED_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
        const repos = (await res.json()) as RepoSummary[];
        setState({ status: 'ready', repos });
      })
      .catch(() => setState({ status: 'error' }));
  }, []);

  // Fire exactly once on mount. The unauthenticated GitHub API is rate-limited to
  // 60 requests/hour/IP, so the feed must not double-fetch — this guard also makes
  // the component immune to React StrictMode's intentional dev double-invoke.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    load();
  }, [load]);

  return (
    <div id="github-projects" className="repo-list" aria-live="polite" aria-busy={state.status === 'loading'}>
      {state.status === 'loading' && (
        <div className="repo-skeletons" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="repo-skeleton" data-skeleton>
              <div className="repo-skel-line w-60" />
              <div className="repo-skel-line w-90" />
              <div className="repo-skel-line w-40" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="repo-error" role="alert">
          <p className="repo-status">Live feed unavailable — the GitHub API is rate-limited or offline.</p>
          <button type="button" className="repo-retry" data-feed-retry onClick={load}>
            Retry
          </button>
          <a href="https://github.com/Victordtesla24" target="_blank" rel="noreferrer" className="repo-error-link">
            or browse on GitHub
          </a>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <div className="repo-feed-head">
            <span className="repo-fresh" data-fresh-pulse aria-hidden="true" />
            <span className="repo-feed-label">Live · most recently pushed</span>
          </div>
          {prefersReducedMotion ? (
            <div className="repo-feed" data-feed-stagger>
              {state.repos.map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
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
              {state.repos.map((repo) => (
                <motion.a
                  key={repo.id}
                  href={repo.html_url}
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
