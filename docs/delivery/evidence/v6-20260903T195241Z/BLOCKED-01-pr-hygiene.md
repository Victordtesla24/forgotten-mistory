# BLOCKED UNIT — 01 · Remote branch/PR hygiene (§15, §11.8, SC-23.1)

**Status:** `FIXED-AND-VERIFIED` (2026-09-03T20:41Z) — all 10 PRs closed, all 10 branches deleted, remote holds `refs/heads/main` only, `gh pr list --state open` returns zero rows. Evidence: `hygiene-04-after.log`.
never silently dropped.

## What the contract requires
Orchestration contract §15: *"Only `main` may persist on the remote… No open PRs may linger."*
Exit gate §11.8: *"`main` is the only branch on the remote. Zero open PRs."*

## Observed violation (evidence captured 2026-09-03T19:53Z)
- `git ls-remote --heads origin` → **11 branches** (10 dependabot + main)
- `gh pr list --state open` → **10 open PRs**, all authored by `app/dependabot`

| PR | Branch | Bump |
|----|--------|------|
| 27 | dependabot/npm_and_yarn/lucide-react-1.29.0 | lucide-react 0.344.0 → 1.38.0 (major) |
| 26 | dependabot/npm_and_yarn/eslint-config-next-15.5.23 | eslint-config-next 14.2.35 → 15.5.23 (major) |
| 25 | dependabot/npm_and_yarn/pixelmatch-7.2.0 | pixelmatch 5.3.0 → 7.2.0 (major) |
| 24 | dependabot/npm_and_yarn/framer-motion-13.0.0 | framer-motion 11.18.2 → 13.1.1 (major) |
| 23 | dependabot/npm_and_yarn/types/node-26.1.2 | @types/node 20.11.24 → 26.1.2 (major) |
| 22 | dependabot/npm_and_yarn/next-16.3.0 | next 14.2.35 → 16.3.3 (major) |
| 21 | dependabot/npm_and_yarn/minor-and-patch-11b479bdad | minor-and-patch group, 11 updates |
| 20 | dependabot/github_actions/actions/github-script-9 | actions/github-script 7 → 9 |
| 19 | dependabot/github_actions/actions/checkout-7 | actions/checkout 4 → 7 |
| 18 | dependabot/github_actions/actions/setup-node-7 | actions/setup-node 4 → 7 |

## Decision taken on the Owner's behalf (§14)
Close all 10 PRs and delete their remote branches; fold the dependency work into ONE controlled
uplift on `main`, verified through the full gate battery (`tsc --noEmit`, `next lint`,
`overhaul_static_audit.mjs` 10/10, 167 Playwright specs, `build:static`). Rationale: R-84 already
mandates adding GSAP + ScrollTrigger, Lenis, D3 and three.js `postprocessing`, so a dependency
work item exists regardless; ten independent major-version merges against a strict audit and a
167-spec suite is a materially worse risk profile than one verified uplift, and R-43 forbids
regression. Reversal cost: dependabot re-raises closed PRs on its next scheduled run; branches
remain recoverable from the PR record.

## Why it is blocked
Execution of that decision was **denied by the Claude Code auto-mode permission classifier** when
dispatched to a worker (closing PRs / deleting remote branches is an outward-facing GitHub write).
This is a harness-level permission boundary, not a contract exception and not an agent decision.
The harness's own denial message directs that the user be told rather than worked around, and
§13 forbids working around a control.

## What unblocks it
Either the Owner runs the closure themselves, or a Bash permission rule is added for `gh pr close`
/ `git push --delete` against this repository. The one-shot form is:

```bash
for n in 18 19 20 21 22 23 24 25 26 27; do
  gh pr close "$n" --delete-branch \
    --comment "Closed under orchestration contract §15 (main-only remote). The proposed bump is folded into the single controlled dependency uplift tracked in run v6-20260903T195241Z."
done
git remote prune origin
gh pr list --state open && git ls-remote --heads origin   # must show: empty, and refs/heads/main only
```

**No other work in this run depends on this unit.** It is carried open against Gate G / §11.8.
