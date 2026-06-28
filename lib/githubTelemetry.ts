/**
 * githubTelemetry.ts — Real GitHub REST API telemetry for portfolio telemetry panels.
 *
 * Fetches public repo data from api.github.com/users/Victordtesla24 and
 * derives live stats (repo count, total stars, open issues, language breakdown).
 * Data is cached in localStorage for 5 minutes to stay well within the 60 req/hr
 * unauthenticated rate limit.
 *
 * ZERO simulation, ZERO Math.random(). Every value comes from the GitHub API or
 * a known-stale cache with an explicit staleness indicator.
 */

const GITHUB_USER = 'Victordtesla24';
const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`;
const CACHE_KEY = 'github-telemetry-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — well within rate limit for portfolio traffic
const STALE_TTL_MS = 30 * 60 * 1000; // 30 minutes before we consider cache too stale

interface GithubRepo {
  name: string;
  stargazers_count: number;
  open_issues_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  description: string | null;
  html_url: string;
}

interface CachedStats {
  timestamp: number;
  repoCount: number;
  totalStars: number;
  totalOpenIssues: number;
  totalForks: number;
  languageMap: Record<string, number>;
  topLanguage: string;
  lastPushIso: string;
  repos: Array<{
    name: string;
    stars: number;
    openIssues: number;
    language: string | null;
    pushedAt: string;
  }>;
}

export interface GithubStats {
  repoCount: number;
  totalStars: number;
  totalOpenIssues: number;
  totalForks: number;
  topLanguage: string;
  lastPushIso: string;
  /** True when data came from cache (stale indicator). */
  fromCache: boolean;
  /** True during initial fetch. */
  loading: boolean;
  /** Error message if fetch failed and no cache available. */
  error: string | null;
  /** Per-repo breakdown for detailed views. */
  repos: CachedStats['repos'];
}

function loadCache(): CachedStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStats;
    if (Date.now() - parsed.timestamp > STALE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(stats: CachedStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage full or unavailable — non-fatal
  }
}

async function fetchGithubStats(): Promise<CachedStats> {
  const res = await fetch(GITHUB_API, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${res.statusText}`);
  }
  const repos: GithubRepo[] = await res.json();

  let totalStars = 0;
  let totalOpenIssues = 0;
  let totalForks = 0;
  const languageMap: Record<string, number> = {};
  let lastPushIso = '';

  const repoEntries: CachedStats['repos'] = [];

  for (const repo of repos) {
    totalStars += repo.stargazers_count;
    totalOpenIssues += repo.open_issues_count;
    totalForks += repo.forks_count;

    if (repo.language) {
      languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    }

    if (repo.pushed_at > lastPushIso) {
      lastPushIso = repo.pushed_at;
    }

    repoEntries.push({
      name: repo.name,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      pushedAt: repo.pushed_at,
    });
  }

  const topLanguage =
    Object.entries(languageMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return {
    timestamp: Date.now(),
    repoCount: repos.length,
    totalStars,
    totalOpenIssues,
    totalForks,
    languageMap,
    topLanguage,
    lastPushIso,
    repos: repoEntries,
  };
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

let _globalStats: GithubStats | null = null;
let _fetchPromise: Promise<void> | null = null;
let _listeners: Array<(stats: GithubStats) => void> = [];

function notifyListeners(stats: GithubStats) {
  _globalStats = stats;
  for (const fn of _listeners) fn(stats);
}

function startFetch() {
  if (_fetchPromise) return;
  _fetchPromise = (async () => {
    // Try cache first
    const cached = loadCache();
    if (cached) {
      notifyListeners({
        repoCount: cached.repoCount,
        totalStars: cached.totalStars,
        totalOpenIssues: cached.totalOpenIssues,
        totalForks: cached.totalForks,
        topLanguage: cached.topLanguage,
        lastPushIso: cached.lastPushIso,
        fromCache: true,
        loading: false,
        error: null,
        repos: cached.repos,
      });

      // If cache is fresh enough, don't re-fetch
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) return;

      // Otherwise re-fetch in background
      try {
        const fresh = await fetchGithubStats();
        saveCache(fresh);
        notifyListeners({
          repoCount: fresh.repoCount,
          totalStars: fresh.totalStars,
          totalOpenIssues: fresh.totalOpenIssues,
          totalForks: fresh.totalForks,
          topLanguage: fresh.topLanguage,
          lastPushIso: fresh.lastPushIso,
          fromCache: false,
          loading: false,
          error: null,
          repos: fresh.repos,
        });
      } catch {
        // Keep using cached data — already notified above
      }
    } else {
      // No cache — fetch fresh
      try {
        const fresh = await fetchGithubStats();
        saveCache(fresh);
        notifyListeners({
          repoCount: fresh.repoCount,
          totalStars: fresh.totalStars,
          totalOpenIssues: fresh.totalOpenIssues,
          totalForks: fresh.totalForks,
          topLanguage: fresh.topLanguage,
          lastPushIso: fresh.lastPushIso,
          fromCache: false,
          loading: false,
          error: null,
          repos: fresh.repos,
        });
      } catch (err) {
        notifyListeners({
          repoCount: 0,
          totalStars: 0,
          totalOpenIssues: 0,
          totalForks: 0,
          topLanguage: '—',
          lastPushIso: '',
          fromCache: false,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown fetch error',
          repos: [],
        });
      }
    }
  })();
}

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter((fn) => fn !== callback);
  };
}

function getSnapshot(): GithubStats {
  if (_globalStats) return _globalStats;
  // Trigger fetch on first access
  if (typeof window !== 'undefined') startFetch();
  return {
    repoCount: 0,
    totalStars: 0,
    totalOpenIssues: 0,
    totalForks: 0,
    topLanguage: '—',
    lastPushIso: '',
    fromCache: false,
    loading: true,
    error: null,
    repos: [],
  };
}

/**
 * useGithubStats — real GitHub profile statistics via REST API.
 *
 * Returns live repo count, total stars, open issues, top language, etc.
 * Cached for 5 min in localStorage; auto-refetches when stale.
 * Source: api.github.com/users/Victordtesla24/repos (unauthenticated, public).
 */
export function useGithubStats(): GithubStats {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Filter GitHub stats to only repos matching a prefix/pattern.
 * Useful for TeslaDashboard to show only Tesla-related repos.
 */
export function filterRepos(
  stats: GithubStats,
  pattern: string[],
): GithubStats {
  if (stats.loading || stats.error) return stats;
  const filtered = stats.repos.filter((r) =>
    pattern.some((p) => r.name.toLowerCase().includes(p.toLowerCase())),
  );
  if (filtered.length === 0) return stats;
  return {
    ...stats,
    repoCount: filtered.length,
    totalStars: filtered.reduce((s, r) => s + r.stars, 0),
    totalOpenIssues: filtered.reduce((s, r) => s + r.openIssues, 0),
    repos: filtered,
  };
}

export const GITHUB_SOURCE_LABEL = 'Live — GitHub REST API (public repos, cached 5 min)';