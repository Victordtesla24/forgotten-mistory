/**
 * githubTelemetry.ts — GitHub public-repository telemetry for the portfolio.
 *
 * ONE api.github.com repository request per browser session, gated by GitHub's
 * own `/rate_limit` endpoint. That endpoint is free — it never spends the
 * 60 req/hr unauthenticated core budget and still answers 200 once the budget is
 * exhausted — so it reports whether the repository call would be rejected
 * *without* emitting the rejected call. Blindly calling the repository endpoint
 * from a shared IP whose budget is spent produced a 403 on every page load; the
 * gate removes it.
 *
 * Resolution order (first hit wins, exactly one publish, no flicker):
 *   1. localStorage cache younger than CACHE_TTL_MS — served with zero network.
 *   2. A live response, when the rate-limit gate says there is budget for it.
 *   3. The cache, however old — the last good response beats an error.
 *   4. SNAPSHOT — a verbatim capture of the same endpoint taken on
 *      SNAPSHOT_AS_OF and committed below.
 *
 * ZERO simulation, ZERO Math.random(). Every number in this file is either a
 * live api.github.com response, a stored copy of one, or the dated snapshot.
 * `source` and `asOfIso` tell the UI which, so dated data is never labelled live.
 *
 * No credential is used and none may be added: this module runs in the browser,
 * where any token would be readable by every visitor. Restoring always-live data
 * requires a server-side proxy (see the note in the deployment docs), not a key
 * here.
 */

import { useSyncExternalStore } from 'react';

const GITHUB_USER = 'Victordtesla24';
const REPOS_URL = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`;
const RATE_LIMIT_URL = 'https://api.github.com/rate_limit';

const CACHE_KEY = 'github-telemetry-cache';
/** Records when an observed budget exhaustion lifts, so navigations stop probing. */
const RETRY_AFTER_KEY = 'github-telemetry-retry-after';
/** Serve a stored response without touching the network for this long. */
const CACHE_TTL_MS = 30 * 60 * 1000;
/**
 * Spare requests we insist on leaving in the shared per-IP budget before
 * spending one. A visitor's IP may be shared with other GitHub traffic, so
 * spending the very last request is how a 403 reappears for somebody else.
 */
const RATE_LIMIT_HEADROOM = 2;

/** Number of repositories the activity feed renders. */
export const FEED_SIZE = 4;

/** Instant the committed SNAPSHOT below was captured from the live endpoint. */
export const SNAPSHOT_AS_OF = '2026-08-09T13:00:00Z';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One repository, normalised from the GitHub REST payload. */
export interface RepoStat {
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  openIssues: number;
  forks: number;
  /** ISO-8601 timestamp of the most recent push. */
  pushedAt: string;
}

/** Where the published numbers came from. Meaningless while `loading` is true. */
export type GithubSource = 'live' | 'cache' | 'snapshot';

export interface GithubStats {
  repoCount: number;
  totalStars: number;
  totalOpenIssues: number;
  totalForks: number;
  topLanguage: string;
  lastPushIso: string;
  /** Provenance of every number in this object. */
  source: GithubSource;
  /** When the underlying GitHub response was captured (ISO-8601). */
  asOfIso: string;
  /** True when the numbers are not a freshly fetched live response. */
  fromCache: boolean;
  /** True until the store resolves (cache, live, or snapshot). */
  loading: boolean;
  /** Set only when a refresh failed and no live or cached response exists. */
  error: string | null;
  repos: RepoStat[];
}

/**
 * Public repositories of Victordtesla24, captured verbatim from
 * `GET /users/Victordtesla24/repos?per_page=100&sort=pushed` on SNAPSHOT_AS_OF
 * and sorted most-recently-pushed first. Nothing here is estimated, rounded or
 * generated: it is the response body, trimmed to the fields the UI reads.
 */
const SNAPSHOT: readonly RepoStat[] = [
  {
    name: "aether-job-career-agent",
    htmlUrl: "https://github.com/Victordtesla24/aether-job-career-agent",
    description: "Fully autonomous, high fidelity and comprehensive career management and job application management ai agent",
    language: "Python",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-08-09T11:33:48Z",
  },
  {
    name: "forgotten-mistory",
    htmlUrl: "https://github.com/Victordtesla24/forgotten-mistory",
    description: "My Website",
    language: "TypeScript",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-08-09T11:28:31Z",
  },
  {
    name: "abentertainment",
    htmlUrl: "https://github.com/Victordtesla24/abentertainment",
    description: "event management company website",
    language: "HTML",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-08-06T06:57:44Z",
  },
  {
    name: "vik-legal-defence",
    htmlUrl: "https://github.com/Victordtesla24/vik-legal-defence",
    description: "Vikram Deshpande — Legal Defence Dashboard | When Government Systems Fail Citizens",
    language: "HTML",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-06-26T19:16:15Z",
  },
  {
    name: "prompt-reconstruction-engine",
    htmlUrl: "https://github.com/Victordtesla24/prompt-reconstruction-engine",
    description: "prompt revuilding from raw prompts",
    language: "HTML",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-06-26T19:11:12Z",
  },
  {
    name: "Birth-Time-Rectifier",
    htmlUrl: "https://github.com/Victordtesla24/Birth-Time-Rectifier",
    description: "An AI driven birth time rectification system which uses the most advanced and modern birth time rectification algorithms in combination with the ancient Indian Parashara Hora Shastra decoded wisdom from Sanskrit Texts.",
    language: "Python",
    stars: 1,
    openIssues: 5,
    forks: 0,
    pushedAt: "2026-06-18T09:32:53Z",
  },
  {
    name: "agsva-security-clearance-webapp",
    htmlUrl: "https://github.com/Victordtesla24/agsva-security-clearance-webapp",
    description: "web app to track, manage and track AGSVA Security Clearance (Baseline)",
    language: "HTML",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-06-11T14:42:49Z",
  },
  {
    name: "jarvis",
    htmlUrl: "https://github.com/Victordtesla24/jarvis",
    description: "Realtime macOS Telemetry Dashbaord using Jarvis from Iron Man UI as a wallpaper",
    language: "HTML",
    stars: 0,
    openIssues: 2,
    forks: 0,
    pushedAt: "2026-06-04T06:59:58Z",
  },
  {
    name: "prompt-reconstruct",
    htmlUrl: "https://github.com/Victordtesla24/prompt-reconstruct",
    description: "A Skill to enhance, optimise and precise any ai prompt that has maximum prompt execution accuracy. In simple words, if you ask `X`, you get `X` as the AI Agent LLM output consistently",
    language: "Shell",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-05-20T13:24:47Z",
  },
  {
    name: "ralph-loop-infinite",
    htmlUrl: "https://github.com/Victordtesla24/ralph-loop-infinite",
    description: "Inspired from the original `ralph-loop` for autonomous ai agentic product development process",
    language: "Shell",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-05-20T13:24:03Z",
  },
  {
    name: "hostinger-vps-backup",
    htmlUrl: "https://github.com/Victordtesla24/hostinger-vps-backup",
    description: "a backup of my hosting vps and all its content",
    language: "TypeScript",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-05-16T09:49:45Z",
  },
  {
    name: "claude-designs",
    htmlUrl: "https://github.com/Victordtesla24/claude-designs",
    description: "all my claude designs in one place",
    language: null,
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-05-07T10:47:37Z",
  },
  {
    name: "Image-Enhancer",
    htmlUrl: "https://github.com/Victordtesla24/Image-Enhancer",
    description: "The App enhances the image size ans resolution",
    language: "Python",
    stars: 1,
    openIssues: 1,
    forks: 0,
    pushedAt: "2026-04-26T00:42:09Z",
  },
  {
    name: "containerised-birth-time-rectifier",
    htmlUrl: "https://github.com/Victordtesla24/containerised-birth-time-rectifier",
    description: "AI driven birth time rectifier system",
    language: "Python",
    stars: 1,
    openIssues: 7,
    forks: 0,
    pushedAt: "2026-03-30T13:34:15Z",
  },
  {
    name: "3-tier-multi-agent-architecture",
    htmlUrl: "https://github.com/Victordtesla24/3-tier-multi-agent-architecture",
    description: "The Antigravity 3-Tier Multi-Agent Architecture is a deterministic, highly optimized orchestration system operating natively within the Antigravity IDE. It leverages a rigorous, specialized hierarchy of agents (Prompt Reconstruction, Research, Orchestration, Sub-Agents, and Leaf Workers) bound by strict operational constraints.",
    language: "Python",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-03-09T08:23:33Z",
  },
  {
    name: "openclaw-agents-ecosystem",
    htmlUrl: "https://github.com/Victordtesla24/openclaw-agents-ecosystem",
    description: "A workspace where all the files, scripts and documents to manage, maintain and create OpenClaw AI Agents Ecosystem on Hostinger VPS",
    language: "Shell",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-02-17T04:59:51Z",
  },
  {
    name: "Codex",
    htmlUrl: "https://github.com/Victordtesla24/Codex",
    description: "All the Codex Dev files and folders into one folder on github",
    language: "HTML",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2026-02-13T17:20:08Z",
  },
  {
    name: "chris-cole-website",
    htmlUrl: "https://github.com/Victordtesla24/chris-cole-website",
    description: "a test website from chris coles website template `https://hellochriscole.webflow.io`",
    language: "TypeScript",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-12-02T13:12:05Z",
  },
  {
    name: "btr-demo",
    htmlUrl: "https://github.com/Victordtesla24/btr-demo",
    description: "Birth Time Rectification Demo purely using BPHS-BTR",
    language: "Python",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-12-02T05:58:34Z",
  },
  {
    name: "Advanced-Prompt-Creator",
    htmlUrl: "https://github.com/Victordtesla24/Advanced-Prompt-Creator",
    description: "An AI based Advanced Prompt creator using user input text and transforming it using latest and advanced Prompt Engineering Techniques & reasoning AI Models ensuring prompt output accuracy, adherence to input prompt success criteria’s and requirements, effective prompt structure with all the structural details derived from the input prompt. ",
    language: "TypeScript",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-11-25T18:09:29Z",
  },
  {
    name: "jyotish-shastra",
    htmlUrl: "https://github.com/Victordtesla24/jyotish-shastra",
    description: null,
    language: "JavaScript",
    stars: 1,
    openIssues: 0,
    forks: 1,
    pushedAt: "2025-11-10T12:08:04Z",
  },
  {
    name: "rishi-prajnya",
    htmlUrl: "https://github.com/Victordtesla24/rishi-prajnya",
    description: "Transforming career guidance through AI-powered solutions, combining modern technology with traditional Indian wisdom.",
    language: "TypeScript",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-10-29T12:48:22Z",
  },
  {
    name: "AI-Gmail-Mailbox-Manager",
    htmlUrl: "https://github.com/Victordtesla24/AI-Gmail-Mailbox-Manager",
    description: "Fully automated & Autonomous AI Driven Gmail Mailbox Management System",
    language: "TypeScript",
    stars: 1,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-08-02T05:00:50Z",
  },
  {
    name: "telemetry-server",
    htmlUrl: "https://github.com/Victordtesla24/telemetry-server",
    description: null,
    language: "TypeScript",
    stars: 0,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-07-22T13:17:33Z",
  },
  {
    name: "tesla-api",
    htmlUrl: "https://github.com/Victordtesla24/tesla-api",
    description: null,
    language: "JavaScript",
    stars: 1,
    openIssues: 1,
    forks: 1,
    pushedAt: "2025-07-22T08:01:35Z",
  },
  {
    name: "cursor-uninstaller",
    htmlUrl: "https://github.com/Victordtesla24/cursor-uninstaller",
    description: null,
    language: "Shell",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-06-21T09:33:06Z",
  },
  {
    name: "cursor-vscode-anti-fake-coding-system",
    htmlUrl: "https://github.com/Victordtesla24/cursor-vscode-anti-fake-coding-system",
    description: null,
    language: "Shell",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-06-17T08:03:22Z",
  },
  {
    name: "frontend",
    htmlUrl: "https://github.com/Victordtesla24/frontend",
    description: null,
    language: "JavaScript",
    stars: 0,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-06-03T07:06:58Z",
  },
  {
    name: "public-key-server",
    htmlUrl: "https://github.com/Victordtesla24/public-key-server",
    description: null,
    language: "TypeScript",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2025-05-02T00:23:12Z",
  },
  {
    name: "Error-Management-System",
    htmlUrl: "https://github.com/Victordtesla24/Error-Management-System",
    description: "Fully Autonomous, Project Agnostic, Fully Automated AI Agent Driven Error Handling and Error Fixing System (Incl. of all Errors including runtime errors)",
    language: "Python",
    stars: 1,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-04-29T02:26:03Z",
  },
  {
    name: "indian-event-manager",
    htmlUrl: "https://github.com/Victordtesla24/indian-event-manager",
    description: "An event Management Platform specifically tailored for cultural events in Australia ",
    language: "TypeScript",
    stars: 0,
    openIssues: 6,
    forks: 0,
    pushedAt: "2025-04-21T23:05:16Z",
  },
  {
    name: "relationship-timeline-feature",
    htmlUrl: "https://github.com/Victordtesla24/relationship-timeline-feature",
    description: null,
    language: "TypeScript",
    stars: 1,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-04-13T20:42:05Z",
  },
  {
    name: "ride-with-vic-app",
    htmlUrl: "https://github.com/Victordtesla24/ride-with-vic-app",
    description: null,
    language: "JavaScript",
    stars: 1,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-04-09T11:38:07Z",
  },
  {
    name: "tailor-resume-with-ai",
    htmlUrl: "https://github.com/Victordtesla24/tailor-resume-with-ai",
    description: "An AI assisted app that web app that custom-tailors a resume as per the job description. This app web scraps all the necessary details from the JD, by simply providing the JD link. Additionally, the app provides intuitive options to the users to select specific sections of the resume if they choose not to tailor their whole resume as per the JD.",
    language: "Python",
    stars: 1,
    openIssues: 7,
    forks: 0,
    pushedAt: "2025-04-07T02:58:48Z",
  },
  {
    name: "project_management_dashboard",
    htmlUrl: "https://github.com/Victordtesla24/project_management_dashboard",
    description: null,
    language: "Python",
    stars: 1,
    openIssues: 1,
    forks: 0,
    pushedAt: "2025-03-22T03:31:53Z",
  },
  {
    name: "EFDDH-Jira-Analytics-Dashboard",
    htmlUrl: "https://github.com/Victordtesla24/EFDDH-Jira-Analytics-Dashboard",
    description: "Dashboard for ANZ EFDDH Team Metrics and JIRA Handbook",
    language: "Python",
    stars: 1,
    openIssues: 0,
    forks: 1,
    pushedAt: "2024-12-04T02:01:07Z",
  },
  {
    name: "EFDDH-Jira-Dashboard",
    htmlUrl: "https://github.com/Victordtesla24/EFDDH-Jira-Dashboard",
    description: null,
    language: "Python",
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2024-11-21T13:41:34Z",
  },
  {
    name: "adblocker",
    htmlUrl: "https://github.com/Victordtesla24/adblocker",
    description: "Efficient embeddable adblocker library",
    language: null,
    stars: 0,
    openIssues: 0,
    forks: 0,
    pushedAt: "2024-11-06T05:13:30Z",
  },
];

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

function aggregate(
  repos: readonly RepoStat[],
  source: GithubSource,
  asOfIso: string,
  error: string | null,
): GithubStats {
  let totalStars = 0;
  let totalOpenIssues = 0;
  let totalForks = 0;
  let lastPushIso = '';
  const languageCounts: Record<string, number> = {};

  for (const repo of repos) {
    totalStars += repo.stars;
    totalOpenIssues += repo.openIssues;
    totalForks += repo.forks;
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
    }
    if (repo.pushedAt > lastPushIso) lastPushIso = repo.pushedAt;
  }

  let topLanguage = '—';
  let topCount = 0;
  for (const [language, count] of Object.entries(languageCounts)) {
    if (count > topCount) {
      topCount = count;
      topLanguage = language;
    }
  }

  return {
    repoCount: repos.length,
    totalStars,
    totalOpenIssues,
    totalForks,
    topLanguage,
    lastPushIso,
    source,
    asOfIso,
    fromCache: source !== 'live',
    loading: false,
    error,
    repos: [...repos],
  };
}

// ---------------------------------------------------------------------------
// Network — every failure resolves, none rejects
// ---------------------------------------------------------------------------

/**
 * GET a public GitHub endpoint as JSON. Any non-2xx status (403 rate limit, 429,
 * 5xx) and any transport failure resolve to `null` so the caller can fall back;
 * this function never rejects, so a rate-limited feed can never surface as an
 * uncaught rejection.
 */
async function fetchJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) return null;
    const payload: unknown = await res.json();
    return payload;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/** The unauthenticated core budget for this IP, or null if the probe was unreadable. */
function readBudget(payload: unknown): { remaining: number; resetAt: number } | null {
  const core = asRecord(asRecord(asRecord(payload)?.resources)?.core);
  const remaining = core?.remaining;
  const reset = core?.reset;
  if (typeof remaining !== 'number') return null;
  // GitHub reports `reset` in epoch seconds.
  return { remaining, resetAt: typeof reset === 'number' ? reset * 1000 : 0 };
}

/** Validate one repository already in RepoStat shape (cache and snapshot wire format). */
function toRepoStat(value: unknown): RepoStat | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const { name, htmlUrl, description, language, stars, openIssues, forks, pushedAt } = raw;
  if (
    typeof name !== 'string' ||
    typeof htmlUrl !== 'string' ||
    typeof stars !== 'number' ||
    typeof openIssues !== 'number' ||
    typeof forks !== 'number' ||
    typeof pushedAt !== 'string'
  ) {
    return null;
  }
  return {
    name,
    htmlUrl,
    description: typeof description === 'string' ? description : null,
    language: typeof language === 'string' ? language : null,
    stars,
    openIssues,
    forks,
    pushedAt,
  };
}

/**
 * Validate a repository array in RepoStat shape, newest push first. Rejects the
 * whole payload if any entry is malformed, so a half-read response can never be
 * rendered as if it were complete.
 */
function toRepoStats(payload: unknown): RepoStat[] | null {
  if (!Array.isArray(payload)) return null;
  const repos: RepoStat[] = [];
  for (const entry of payload) {
    const repo = toRepoStat(entry);
    if (!repo) return null;
    repos.push(repo);
  }
  return repos.sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
}

/** Re-key one GitHub REST repository onto RepoStat field names. */
function fromApiShape(value: unknown): unknown {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    name: raw.name,
    htmlUrl: raw.html_url,
    description: raw.description,
    language: raw.language,
    stars: raw.stargazers_count,
    openIssues: raw.open_issues_count,
    forks: raw.forks_count,
    pushedAt: raw.pushed_at,
  };
}

/** Parse a GitHub REST repository-list response into validated RepoStats. */
function parseApiRepos(payload: unknown): RepoStat[] | null {
  return Array.isArray(payload) ? toRepoStats(payload.map(fromApiShape)) : null;
}

/**
 * One live read of the repository list, or null when the network cannot supply
 * one. Costs zero GitHub requests while a previously observed budget exhaustion
 * is still in force, and one free probe otherwise.
 */
async function fetchLive(): Promise<RepoStat[] | null> {
  if (Date.now() < readRetryAfter()) return null;

  const budget = readBudget(await fetchJson(RATE_LIMIT_URL));
  if (!budget) return null;
  if (budget.remaining < RATE_LIMIT_HEADROOM) {
    // Remember when the budget refills so later navigations skip even the probe.
    if (budget.resetAt > Date.now()) writeRetryAfter(budget.resetAt);
    return null;
  }

  return parseApiRepos(await fetchJson(REPOS_URL));
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEnvelope {
  fetchedAt: number;
  asOfIso: string;
  repos: RepoStat[];
}

function loadCache(): CacheEnvelope | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = asRecord(JSON.parse(raw) as unknown);
    const fetchedAt = parsed?.fetchedAt;
    const asOfIso = parsed?.asOfIso;
    const repos = toRepoStats(parsed?.repos);
    if (typeof fetchedAt !== 'number' || typeof asOfIso !== 'string' || !repos?.length) {
      return null;
    }
    return { fetchedAt, asOfIso, repos };
  } catch {
    return null;
  }
}

function saveCache(envelope: CacheEnvelope): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // Quota exceeded or storage disabled (private mode) — the feed still works.
  }
}

/** Epoch ms before which GitHub must not be called again, or 0 if unconstrained. */
function readRetryAfter(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(RETRY_AFTER_KEY);
    if (raw === null) return 0;
    const at = Number(raw);
    return Number.isFinite(at) ? at : 0;
  } catch {
    return 0;
  }
}

function writeRetryAfter(epochMs: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RETRY_AFTER_KEY, String(epochMs));
  } catch {
    // Storage disabled — we simply re-probe next navigation.
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const UNAVAILABLE = 'Live GitHub data unavailable; showing the committed snapshot.';

/**
 * Stable, frozen snapshot returned while GitHub data is resolving — and as the
 * server snapshot. `useSyncExternalStore` compares snapshots with `Object.is`;
 * returning a *new* object on every call makes React believe the store changed
 * on every render, which is an infinite re-render (React #185) that trips the
 * root error boundary and blanks the page. One shared reference breaks that loop
 * and keeps the prerendered markup identical to the client's first paint.
 */
const LOADING_SNAPSHOT: GithubStats = Object.freeze<GithubStats>({
  repoCount: 0,
  totalStars: 0,
  totalOpenIssues: 0,
  totalForks: 0,
  topLanguage: '—',
  lastPushIso: '',
  source: 'snapshot',
  asOfIso: SNAPSHOT_AS_OF,
  fromCache: false,
  loading: true,
  error: null,
  repos: [],
});

let _stats: GithubStats | null = null;
let _listeners: Array<() => void> = [];
let _started = false;

function publish(stats: GithubStats): void {
  _stats = stats;
  for (const listener of _listeners) listener();
}

function resolveStats(): void {
  if (_started) return;
  _started = true;
  void (async () => {
    const cached = loadCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      publish(aggregate(cached.repos, 'cache', cached.asOfIso, null));
      return;
    }

    const live = await fetchLive();
    if (live?.length) {
      const asOfIso = new Date().toISOString();
      saveCache({ fetchedAt: Date.now(), asOfIso, repos: live });
      publish(aggregate(live, 'live', asOfIso, null));
      return;
    }

    if (cached) {
      publish(aggregate(cached.repos, 'cache', cached.asOfIso, null));
      return;
    }

    publish(aggregate(SNAPSHOT, 'snapshot', SNAPSHOT_AS_OF, UNAVAILABLE));
  })();
}

function subscribe(callback: () => void): () => void {
  _listeners.push(callback);
  // Side effects belong in subscribe, never in getSnapshot: kick off the
  // (client-only) resolve when the first consumer subscribes.
  if (typeof window !== 'undefined') resolveStats();
  return () => {
    _listeners = _listeners.filter((fn) => fn !== callback);
  };
}

/** Client snapshot — the resolved stats, otherwise the stable loading reference. */
function getSnapshot(): GithubStats {
  return _stats ?? LOADING_SNAPSHOT;
}

/** Server snapshot — always the frozen loading constant, so the prerendered HTML
 *  matches the client's first render (no hydration mismatch). */
function getServerSnapshot(): GithubStats {
  return LOADING_SNAPSHOT;
}

/**
 * useGithubStats — public GitHub repository statistics for Victordtesla24.
 *
 * Every consumer on the page shares one store and therefore one request. Read
 * `source` / `asOfIso` before calling the numbers live.
 */
export function useGithubStats(): GithubStats {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const AS_OF_FMT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Human-readable capture date of a stats object, e.g. "9 Aug 2026". */
export function formatAsOf(isoTimestamp: string): string {
  const at = new Date(isoTimestamp);
  return Number.isNaN(at.getTime()) ? 'an earlier date' : AS_OF_FMT.format(at);
}

/**
 * Provenance label for a stats object. Says "live" only when the numbers came
 * from a live response this session; otherwise it dates them.
 */
export function githubSourceLabel(stats: GithubStats): string {
  if (stats.loading) return 'Reading GitHub public repos…';
  if (stats.source === 'live') return 'Live · GitHub REST API, most recently pushed';
  return `Snapshot · GitHub public repos, as of ${formatAsOf(stats.asOfIso)}`;
}

/** Static provenance line. True of live, cached and snapshot data alike. */
export const GITHUB_SOURCE_LABEL = 'Source: GitHub REST API, public repos (Victordtesla24)';
