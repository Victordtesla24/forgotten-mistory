'use client';

/**
 * JarvisTelemetry — JARVIS Error-Management-System telemetry block.
 *
 * Shows real GitHub repository statistics via the GitHub REST API
 * (lib/githubTelemetry.ts), themed as the JARVIS autonomous agent dashboard.
 * All values derive from live public data — ZERO simulation.
 *
 * STABILISED: uses useGithubStats() which caches in localStorage for 5 min
 * and uses useSyncExternalStore for zero-rerender reads.
 */

import React from 'react';
import { useGithubStats, GITHUB_SOURCE_LABEL } from '@/lib/githubTelemetry';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

export default React.memo(function JarvisTelemetry() {
  const prefersReducedMotion = useReducedMotionSafe();
  const stats = useGithubStats();

  const display = stats.loading
    ? null
    : {
        repoCount: stats.repoCount,
        totalStars: stats.totalStars,
        totalOpenIssues: stats.totalOpenIssues,
        topLanguage: stats.topLanguage,
        lastPushIso: stats.lastPushIso,
      };

  // Derive JARVIS-style metrics from real data
  const openIssues = stats.totalOpenIssues;
  const repoCount = stats.repoCount;
  const starCount = stats.totalStars;

  // Error-Management-System repo stats (if available)
  const emsRepo = stats.repos?.find((r) => r.name === 'Error-Management-System');
  const emsIssues = emsRepo?.openIssues ?? null;
  const emsStars = emsRepo?.stars ?? null;

  // Recent repos with open issues (real "error" indicators)
  const reposWithIssues = stats.repos
    ?.filter((r) => r.openIssues > 0)
    .sort((a, b) => b.openIssues - a.openIssues)
    .slice(0, 5) ?? [];

  return (
    <div
      className="telemetry-card jarvis-telemetry"
      data-testid="jarvis-telemetry"
    >
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">JARVIS System</p>
          <h3 style={{ fontSize: '0.95rem', margin: '0.1rem 0 0', color: 'var(--white)' }}>
            Error-Management-System
          </h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill live">Live</span>
          <span className="pill accent">
            {stats.loading ? '…' : `${repoCount} repos`}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginTop: '0.75rem',
        }}
      >
        <div>
          <div className="telemetry-label">Public Repos</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {stats.loading ? '—' : repoCount}
          </div>
        </div>
        <div>
          <div className="telemetry-label">Total Stars</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {stats.loading ? '—' : starCount}
          </div>
        </div>
        <div>
          <div className="telemetry-label">Open Issues</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {stats.loading ? '—' : openIssues}
          </div>
        </div>
        <div>
          <div className="telemetry-label">Top Language</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {stats.loading ? '—' : stats.topLanguage}
          </div>
        </div>
        {emsIssues !== null && (
          <div>
            <div className="telemetry-label">EMS Open Issues</div>
            <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
              {emsIssues}
            </div>
          </div>
        )}
        {emsStars !== null && (
          <div>
            <div className="telemetry-label">EMS Stars</div>
            <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
              {emsStars}
            </div>
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="telemetry-label">Last Push</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {stats.loading
              ? '—'
              : stats.lastPushIso
                ? new Date(stats.lastPushIso).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                  })
                : '—'}
          </div>
        </div>
      </div>

      {/* Live repo activity stream — repos with open issues = active "error" surface */}
      <div style={{ marginTop: '0.75rem' }}>
        <div className="telemetry-label">Active Repo Surface (open issues)</div>
        {/* Keyboard-accessible scroll region (a11y: scrollable-region-focusable,
            WCAG 2.1.1). role="log" reflects the live GitHub feed; tabIndex makes the
            overflowing region reachable + scrollable via keyboard. */}
        <div
          role="log"
          tabIndex={0}
          aria-label="Active repository surface — repositories with open issues"
          style={{
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '0.7rem',
            color: 'var(--secondary-text)',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.6',
            marginTop: '0.25rem',
          }}
        >
          {stats.loading ? (
            <div>Fetching live data…</div>
          ) : reposWithIssues.length === 0 ? (
            <div style={{ opacity: 0.5 }}>All repos clean — zero open issues</div>
          ) : (
            reposWithIssues.map((repo) => (
              <div key={repo.name} style={{ marginBottom: '2px' }}>
                <span style={{ color: 'var(--steel)', marginRight: '0.35rem' }}>
                  ◉
                </span>
                <span
                  style={{
                    color: repo.openIssues > 2 ? 'var(--accent-color)' : 'var(--secondary-text)',
                    fontWeight: repo.openIssues > 2 ? 600 : 400,
                  }}
                >
                  [{repo.openIssues}]
                </span>{' '}
                <span>{repo.name}</span>{' '}
                <span style={{ opacity: 0.5 }}>
                  — {repo.language ?? '—'} · {repo.stars} ★
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Source label — always visible */}
      <p
        className="telemetry-note"
        data-testid="telemetry-source-label"
        style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.5 }}
      >
        {GITHUB_SOURCE_LABEL}
      </p>
    </div>
  );
});