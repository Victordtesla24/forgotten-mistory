# fmctl — server & deploy console

A zero-dependency Node CLI that manages the local dev server and the build →
push → CI → deploy → verify loop for `forgotten-mistory`, with live terminal
graphics (spinners, status bars, gauges, sparklines, an interactive menu).

> Zero npm dependencies on purpose — raw ANSI + Unicode only, so it runs the
> instant you clone the repo (no install step, nothing to keep in sync).

## Run it

```bash
node scripts/fmctl              # interactive menu
npm run fmctl -- status         # or via npm
./scripts/fmctl start           # if executable bit is preserved
```

## Commands

| Command | What it does |
|---|---|
| `start` (`dev`, `up`) | Free the dev port of strays, clean `.next`, boot `next dev`, health-check, register a pidfile. |
| `stop` (`down`) | Kill the managed server's whole process group and free its port. |
| `restart` (`reload`) | `stop` then `start`. |
| `status` (`st`, `ps`) | Dashboard: managed servers (uptime/health/mem), **stray** Next processes, git state, production health. `--json` for machines. |
| `doctor` (`fix`) | Diagnose node/tools/auth/env/ports; offer to clean stray servers (needs `--yes` non-interactively). |
| `logs` (`-f`) | Show / follow the managed dev server log. |
| `metrics` (`m`, `perf`) | Lighthouse scores (gauges), Core Web Vitals (verdicts), historical trend (sparklines), bundle sizes, live response times. `--run` collects fresh LHCI. |
| `push` (`commit`) | Stage, commit (with co-author trailer) & push. `--main` pushes to `main`; `-m` sets the message; `-y` skips prompts. |
| `ci` | GitHub Actions via `gh`: `ci status` \| `ci run` (dispatch) \| `ci watch`. |
| `deploy` (`ship`) | `firebase deploy --only hosting` with a phased progress view, then verifies the live URL. Needs `-y` to run non-interactively. |
| `agents` (`a`) | Connect sub-agents: quality gates, Playwright suite, validation phases, **ralphy** task, **cinematic UI/UX** agent. |
| `gates` (`qa`) | Run `tsc --noEmit` + `next lint` + the static audit as a single multi-step view. |

## The dev-server fix

The recurring "dev server is broken" failure was **orchestration**, not code:
stale `next dev` / `next-server` zombies (from other jobs, git worktrees, or
crashed runs) squatting on port 8080, plus a `.next` cache corrupted by two
servers running `rm -rf .next` against the same directory.

`npm run dev` now runs `scripts/fm/dev.mjs`, which **frees the port first**,
cleans `.next`, then execs `next dev` in the foreground (HMR + Ctrl-C behave
exactly as before). The original recipe is preserved as `npm run dev:raw`.

## Architecture (no deps)

```
scripts/fmctl          CommonJS launcher → dynamic-imports the ESM CLI
scripts/fm/cli.mjs     arg parsing · help · interactive menu · dispatch
scripts/fm/commands.mjs start/stop/status/doctor/metrics/push/ci/deploy/agents/gates
scripts/fm/ui.mjs      ANSI engine: Spinner, Steps, bar, gauge, sparkline, barChart, box, table, menu
scripts/fm/core.mjs    repo/env/port/process/state(.fmctl)/http/git helpers
scripts/fm/dev.mjs     foreground dev launcher used by `npm run dev`
```

Runtime state (pidfiles + server logs) lives in `.fmctl/` (gitignored). Tests:
`npm run test:fmctl` (`node --test tests/fmctl.test.mjs`).

## Safety

- Non-interactive shells never hang and never run destructive/outward actions
  (`doctor` cleanup, `push`, `deploy`) without an explicit `--yes`.
- A managed server's own `next-server` child is grouped under its launcher by
  process-group id, so it is never mis-flagged as a stray.
- `NO_COLOR` and non-TTY output are respected (ANSI stripped; menus print a list).
