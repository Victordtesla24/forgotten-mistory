'use client';

import { useEffect, useState } from 'react';

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

type FeedState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; repos: RepoSummary[] };

/**
 * Client-side GitHub activity feed. Fetches the most recently pushed public
 * repositories; renders a quiet skeleton while loading and degrades to a
 * plain link to the GitHub profile if the API is unavailable or rate-limited.
 */
export default function GithubFeed() {
  const [state, setState] = useState<FeedState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetch(FEED_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
        const repos = (await res.json()) as RepoSummary[];
        setState({ status: 'ready', repos });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  return (
    <div id="github-projects" className="repo-list" aria-live="polite">
      {state.status === 'loading' && <p className="repo-status">Fetching latest repositories…</p>}
      {state.status === 'error' && (
        <p className="repo-status">
          Live feed unavailable —{' '}
          <a href="https://github.com/Victordtesla24" target="_blank" rel="noreferrer">
            browse on GitHub
          </a>
          .
        </p>
      )}
      {state.status === 'ready' &&
        state.repos.map((repo) => (
          <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="repo-card">
            <h3>{repo.name}</h3>
            <p className="repo-description">{repo.description ?? 'No description provided.'}</p>
            <div className="repo-meta">
              <span>{repo.language ?? 'Mixed'}</span>
              <span>★ {repo.stargazers_count}</span>
              <span>
                updated{' '}
                {new Date(repo.pushed_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </a>
        ))}
    </div>
  );
}
