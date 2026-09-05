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

## Run v10 cycle H-2 (t_c3ece39c, cleanup-agent, 2026-09-05T07:4xZ)

Executed from an isolated worktree (`.claude/worktrees/wf_c88c88a3-2ad-1`); the sandbox refuses any
`git -C`/`--git-dir`/`cd` redirect into another checkout, so worktree admin used plain `git worktree
remove <path>` / `git branch -D <name>` (git's own worktree machinery, which the sandbox allows since it
does not "redirect" the whole session — verified by re-running `git worktree list` after each removal),
and the two pre-removal diffs were captured with `git archive <base> | tar -x` into a scratch dir plus
coreutils `diff -ruN` against the live worktree (git `diff <path>` cannot address a foreign worktree
either).

**S-1 Preconditions.**
```
$ git log --oneline --all | grep -iE "cycle 13|cycle 11"
5ec231d Merge cycle 13: next 15.5.25, CI installs functions deps (verified PASS, t_927a093b)
f86b125 Merge cycle 11: vitrine rail on the spine, plates trace on, hero one fold at 390 (V-C11: 19/20 acceptance lines; TC-CONTRAST-01 @390 open → cycle 16)
```
Both commits are reachable from `main` (HEAD `2a871db`, v10 cycle 03). Confirmed.

**S-2 rev-list check (every target branch, 0 required).**
```
$ git rev-list --count main..worktree-wf_18f926b0-2a4-1   → 0
$ git rev-list --count main..worktree-wf_18f926b0-2a4-2   → 0
$ git rev-list --count main..worktree-wf_697f0e83-f46-1   → 0
$ git rev-list --count main..worktree-wf_55e925e9-074-1   → 0
$ git rev-list --count main..worktree-wf_7910f160-45a-1   → 0
$ git rev-list --count main..worktree-wf_75ffef1b-684-1   → 0
$ git rev-list --count main..worktree-wf_7658aeb2-d07-1   → 0
$ git rev-list --count main..worktree-wf_dc0c232e-59d-1   → 0
```
All eight are fully merged into `main`; none locked (`git worktree list` showed no `locked` marker on
any of them — only `wf_c88c88a3-2ad-1` (this agent), `wf_eefd9de5-b04-1`, `wf_f79c8e1b-a89-1` are
locked, and those three are left untouched as live council lanes, along with the unrelated
`wf_a0a1850a-28a-1`, which is not in this task's list).

**S-2 archive the two superseded diffs before removal.** Both were uncommitted working-tree diffs (no
git-addressable diff across worktrees from this sandbox), captured as:
```
$ git archive 4f1d659 | tar -x -C /tmp/base_7658
$ diff -ruN --exclude=.git --exclude=node_modules --exclude=.next --exclude=out --exclude=.audit-v7 \
    --exclude=.claude /tmp/base_7658 .claude/worktrees/wf_7658aeb2-d07-1 \
    > docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/wf_7658aeb2-d07-1-superseded.patch
  → 2926 lines (build-stamp regen + About.module.css color-token edits)

$ git archive 0c02861 | tar -x -C /tmp/base_dc0c
$ diff -ruN --exclude=.git --exclude=node_modules --exclude=.next --exclude=out --exclude=.audit-v7 \
    --exclude=.claude /tmp/base_dc0c .claude/worktrees/wf_dc0c232e-59d-1 \
    > docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/wf_dc0c232e-59d-1-superseded.patch
  → 2879 lines (.eslintrc.json root flag, build-stamp regen, app/not-found.tsx Link import, Next 15
    upgrade groundwork)
```
Both patches committed to `docs/delivery/evidence/v10-20260905T0515Z/HYG-branches/`.

**S-2/removal — all eight worktrees + branches.**
```
$ git worktree remove /root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1     → removed
$ git worktree remove --force .../wf_18f926b0-2a4-2                                  → removed
$ git worktree remove --force .../wf_697f0e83-f46-1                                  → removed
$ git worktree remove --force .../wf_55e925e9-074-1                                  → removed
$ git worktree remove --force .../wf_7910f160-45a-1                                  → removed
$ git worktree remove --force .../wf_75ffef1b-684-1                                  → removed
$ git worktree remove --force .../wf_7658aeb2-d07-1                                  → removed
$ git worktree remove --force .../wf_dc0c232e-59d-1                                  → removed

$ git branch -D worktree-wf_18f926b0-2a4-1 worktree-wf_18f926b0-2a4-2 \
    worktree-wf_697f0e83-f46-1 worktree-wf_55e925e9-074-1 worktree-wf_7910f160-45a-1 \
    worktree-wf_75ffef1b-684-1 worktree-wf_7658aeb2-d07-1 worktree-wf_dc0c232e-59d-1
  → all eight deleted
```
`git worktree prune` afterward: no output (nothing stale left).

**S-3 /var/tmp/v6-wt.**
```
$ ls -A /var/tmp/v6-wt   → (empty)
$ rmdir /var/tmp/v6-wt   → removed
```

**S-4 post-consolidation verification.**
```
$ git ls-remote --heads origin
2a871dbc216d57f5213370f98028ac2291d54311  refs/heads/main
6203211c1ea0d5b172a8a6f39f0cf14be18f438a  refs/heads/worktree-wf_a0a1850a-28a-1
```
`main` plus the one still-live council lane (`wf_a0a1850a-28a-1`, untouched — not in this task's list,
not locked in this worktree's view but out of scope for H-2). None of the five branches that used to have
`origin/worktree-wf_*` remotes (`wf_18f926b0-2a4-1`, `wf_55e925e9-074-1`, `wf_697f0e83-f46-1`,
`wf_75ffef1b-684-1`, `wf_7910f160-45a-1`) are on origin any more — the consolidate-and-deploy pipeline
had already deleted them after merging; `git remote prune origin` cleared the stale local remote-tracking
refs to match.
```
$ gh pr list --state open   → (empty)
$ git worktree list
/root/forgotten-mistory                                     2a871db [main]
/root/forgotten-mistory/.claude/worktrees/wf_a0a1850a-28a-1  6203211 [worktree-wf_a0a1850a-28a-1]
/root/forgotten-mistory/.claude/worktrees/wf_c88c88a3-2ad-1  2a871db [worktree-wf_c88c88a3-2ad-1] locked
/root/forgotten-mistory/.claude/worktrees/wf_eefd9de5-b04-1  3dae601 [worktree-wf_eefd9de5-b04-1] locked
/root/forgotten-mistory/.claude/worktrees/wf_f79c8e1b-a89-1  88f1385 [worktree-wf_f79c8e1b-a89-1] locked
$ git branch -a
  main
  worktree-wf_a0a1850a-28a-1
* worktree-wf_c88c88a3-2ad-1
  worktree-wf_eefd9de5-b04-1
  worktree-wf_f79c8e1b-a89-1
  remotes/origin/HEAD -> origin/main
  remotes/origin/main
  remotes/origin/worktree-wf_a0a1850a-28a-1
```
No detached-HEAD worktrees. Zero open PRs.

**Doc corrections (same commit).**
- `CLAUDE.md`: "276 Playwright tests" → "308 Playwright tests" (both occurrences), verified live with
  `npx playwright test --list 2>/dev/null | tail -1` → `Total: 308 tests in 36 files` (run from this
  worktree, 2026-09-05). This supersedes the 288 figure cited in the task's V-C13 comment, which is now
  stale relative to the current suite; 308 is the count this run actually measured.
- `README.md:304`: "58 TTS characters spent" → "63 TTS characters spent" (matches
  `docs/delivery/evidence/v10-20260905T0515Z/C14a-tts/07-decisions.md` §6, "Three ElevenLabs TTS calls,
  **63 characters** total").
- `.gitignore`: added `!docs/delivery/evidence/**/*.log` after the blanket `*.log` rule (line 42). All
  61 evidence `.log` files under `docs/delivery/evidence/` were already tracked (force-added by earlier
  agents before this rule existed — `git ls-files docs/delivery/evidence/ | grep '\.log$' | wc -l` → 61,
  `git status --porcelain docs/delivery/evidence/` showed none pending), so the rule is forward-looking:
  it stops the blanket ignore from silently dropping the next red-run proof log rather than needing a
  retroactive `git add`.
- `git mv docs/delivery/evidence/v9-20260904T2312Z/C11-vitrine-integration/apply_edits.py
  docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/apply_edits.py` — moved the misfiled
  script (V-C11 F-4) into the run it actually belongs to.

**Regression gate.**
```
$ node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs
# tests 26
# suites 3
# pass 26
# fail 0
```
