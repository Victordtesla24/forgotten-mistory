# Decision memo — branch and worktree hygiene (run v10, 2026-09-05T05:2xZ)

Standing constraint (docs/prompt.md O3, orchestration contract §15): only `main` persists; every other
branch is merged, or explicitly abandoned with a recorded reason, then deleted. Everything below was
observed with the command named; every diff that is discarded was archived in this directory first.

## Abandoned: `wt/data-backend` (worktree `/var/tmp/v6-wt/data-backend`)

- **State observed.** `git rev-list --count main..wt/data-backend` = 3 ahead, 67 behind; merge-base
  `d1fce27` (2026-09-03, run v6). `git diff main --stat` = 808 files changed, 26 186 insertions,
  100 620 deletions — the branch predates the rebuild and would delete the six-section site.
  Working tree dirty: `package.json`, `package-lock.json`, `functions/index.js`, `firebase.json`,
  `app/layout.tsx`, `app/data/portfolio/{listen,vitrine}.ts` and generated files.
- **What the three commits are.** Test-only "failing contract" files from the v6 chatbot-uplift spec
  (`docs/delivery/evidence/v6-20260903T195241Z/SPEC-chatbot-uplift.md`):
  `8050ec6` R-66 retrieval / R-73 enforcement / R-71 streaming (tests/api, tests/grounding);
  `a2feb7e` R-108/R-182 dataset layer (tests/content/dataset_marks.spec.ts);
  `3768fba` R-87/R-88/R-183 telemetry (tests/telemetry, tests/overhaul/telemetry-first-party.spec.ts).
  None of those ids exist in the current specification (`grep -nE 'R-(66|71|73|87|88|108|182|183)\b'
  docs/overhaul/SPEC.md` → nothing) or in docs/prompt.md (R1–R12, O1–O6).
- **Decision.** Abandon the branch. Rationale: unmergeable as a branch (it would revert 67 commits of
  the rebuild); the tests target a superseded specification; the parts of that specification that
  survive in docs/prompt.md are covered elsewhere — grounding-only answers (R-66/R-73) by the live
  Cloud Function ladder and the content-parity gate (tests/content, run v9 cycles 2–3), and
  sub-second perceived streaming (R-71) is carried forward as the R3 latency target on the
  avatar/chat backlog (Kanban t_3bf56e4a).
- **Archived here.** `wt-data-backend-3-commits.patch` (git format-patch of the three commits;
  reapply with `git am`) and `wt-data-backend-dirty-tree.patch` (the uncommitted working tree).
- **Reversal cost.** One `git am` of the archived patch onto a fresh branch; no production impact.

## Removed without loss (detached HEADs left by earlier agents)

| worktree | HEAD | dirty content | archived as |
| --- | --- | --- | --- |
| `/var/tmp/dbg-wt` | 4e8f11c | `components/site/Footer.tsx`: label changed to "PROBE built from commit" (a debugging probe, never intended to ship) + generated `feedback-log.ts` | `vartmp-dbg-wt-dirty.patch` |
| `/var/tmp/v6-clean` | 1672d17 | generated files only (`feedback-log.ts`, `static-audit.json`) | `vartmp-v6-clean-dirty.patch` (empty after excluding generated files) |
| `/var/tmp/fm-c7` | 0cad7ba | generated `build-stamp.ts` only | `vartmp-fm-c7-dirty.patch` (empty) |
| `.claude/worktrees/wf_4452cec1-084-1` | debd25b (= main) | none | — |
| `.claude/worktrees/wf_71e5419d-c2e-1` | 57a3232 (merged into main via 4f1d659) | generated files only | `wf_71e5419d-dirty.patch` (empty) |

Neither long-running static server on this host (`python3 -m http.server` pids 985 → `/root/cobol-testing-ato-work`,
1863204 → `/root/forgotten-mistory`) serves from any of these directories.

## Deleted branches (0 ahead of main — `git rev-list --count main..<b>` = 0)

`integrate/c9`, `worktree-wf_4452cec1-084-1`, `worktree-wf_71e5419d-c2e-1`, and `wt/data-backend` (abandoned above).

## Kept until their content lands and is independently verified (run v10 cycles 13 and 11)

`.claude/worktrees/wf_dc0c232e-59d-1` (Next 15.5.25 upgrade, uncommitted) and
`.claude/worktrees/wf_7658aeb2-d07-1` (Vitrine integration, uncommitted). Both diffs are being landed by
council agents in fresh worktrees from patches taken of these trees; they are removed in the same run
once the landed commits are on `main` and the live page carries them.

## Remote

`git ls-remote --heads origin` → `refs/heads/main` only; `gh pr list --state open` → empty (05:12Z).
