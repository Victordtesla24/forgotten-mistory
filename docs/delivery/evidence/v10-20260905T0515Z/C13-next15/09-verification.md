# 09-verification.md — independent adversarial verification of C13 (Next 15.5.25)

**Task:** `artifacts/kanban/tasks/t_927a093b.md` — V-C13, reviewer profile
(`docs/prompt.md` §5, role `3rd_party_independent_adversarial_review`, level 1, effort max).
**Verified at:** 2026-09-05T06:05Z → 06:11Z (UTC).
**Subject:** branch `worktree-wf_18f926b0-2a4-1` @ `878adab`
(`18c6beb` the upgrade, `878adab` the evidence), merge-base with `main` `8dc4cf4`.
**Worktree:** `/root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1`.

## VERDICT — PASS

Every command in the spec's S-2 was re-run by this reviewer in this worktree and every one
exited 0. Every ✘ in the partial regression was matched, by this reviewer, against the
failure block of CI run `33936783382` pulled fresh from GitHub — 8 for 8, none new. The
structural claims in the author's report were checked against the tree, not accepted from
the report. The one material qualification is V-3 below: the regression is partial by
orchestrator decision, so "no new failure" is proven over the 243 specs that ran, not the
whole suite.

The author's report is testimony; nothing below is taken from it. Where the author's number
and this reviewer's number agree, both were produced independently.

## Gates — re-run by this reviewer

Raw transcript: `docs/delivery/evidence/v10-20260905T0515Z/C13-next15/09-verification-gates.log`
(one file, appended in order, each block terminated by the literal `EXIT=` of the command).

| # | command | exit | observed summary line |
|---|---------|------|-----------------------|
| G1 | `npx tsc --noEmit` | **0** | no diagnostics emitted |
| G2 | `npm run lint` | **0** | `✔ No ESLint warnings or errors` |
| G3 | `node scripts/validate/overhaul_static_audit.mjs` | **0** | `RESULT: ALL PASS (10/10)` |
| G4 | `npm audit --audit-level=high` | **0** | `found 0 vulnerabilities` |
| G5 | `node --test tests/ci_pipeline.test.mjs` | **0** | `# tests 11 / # suites 2 / # pass 11 / # fail 0` |
| G6 | `npm run build:static` *(added by this reviewer)* | **0** | `▲ Next.js 15.5.25` · `✓ Generating static pages (11/11)` · `/` First Load JS `170 kB` · `[prune] done — 3 artifact(s) removed` · `RESULT: PASS — no credential material in the emitted bundle` (43 files under `out/`) |
| G3b | `node scripts/validate/overhaul_static_audit.mjs` *(re-run after G6)* | **0** | `RESULT: ALL PASS (10/10)` |

G6 and G3b were added because `scripts/validate/overhaul_static_audit.mjs:272` reads
`join(ROOT, 'out')` — the audit grades the emitted bundle, so a 10/10 is only as current as
the `out/` beneath it. G3b re-runs the audit against an `out/` this reviewer built from the
branch tree, which closes that gap. The two build-generated tracked files the build rewrote
(`app/data/generated/build-stamp.ts`, `reports/static-audit.json`) were restored with
`git checkout --` afterwards; `git status --porcelain` and `git diff HEAD --stat` both print
nothing.

## Structural checks

| id | check | result |
|----|-------|--------|
| V-a | `git status --porcelain` in the worktree | empty — no tracked modification, no untracked file outside the ignored `out/` and `*.log` |
| V-b | last committed `app/data/generated/build-stamp.ts` | `sha: "6dcb4f53"`, `authored: "2026-09-04T23:56:41Z"`, `clean: true` — **not** a null stamp (`git show HEAD:app/data/generated/build-stamp.ts`) |
| V-c | conflict markers in `.gitignore` | `grep -n '^\(<\{7\}\|=\{7\}\|>\{7\}\)' .gitignore` → no output, exit 1. The diff removes exactly the three marker lines and keeps both sides (`functions/node_modules` and the pnpm/verification block) |
| V-d | `.github/workflows/deploy.yml` vs `main` | `git diff main -- .github/workflows/deploy.yml` → empty. The deploy path is untouched; only `checks.yml` gained one line (`npm ci --prefix functions`, placed after `npm ci` and before `tsc`) |
| V-e | version agreement | `package.json` `next: "15.5.25"`, `eslint-config-next: "15.5.25"`; `package-lock.json` `packages[""].dependencies.next = 15.5.25`, `packages[""].devDependencies.eslint-config-next = 15.5.25`, `packages["node_modules/next"].version = 15.5.25`, `packages["node_modules/eslint-config-next"].version = 15.5.25`, `lockfileVersion 3`. G6 printed `▲ Next.js 15.5.25`, so the installed tree is the pinned one |
| V-f | diff shape | `git diff main...HEAD --stat` → 23 files, 2059 insertions, 692 deletions: the six patch files of D-1, the three fix files of D-2/D-3, `reports/static-audit.json`, and 13 evidence files. Nothing outside what D-1…D-3 name |
| V-g | branch is on `origin` | `git ls-remote origin refs/heads/worktree-wf_18f926b0-2a4-1` → `878adab099ddf3fc4e202395be53069283ff4a2a`. Not yet merged: `git merge-base --is-ancestor HEAD main` exits 1, `main` is at `f51733a` |

## Regression triage — every ✘ proven pre-existing

`05-regression-full.log` reports 243 of 288 specs (`Running 288 tests using 2 workers`;
highest index reached 243, `tests/overhaul/design-scale.spec.ts:146:9 @ 1280px`), of which
8 are ✘ — counted by this reviewer with
`sed 's/\x1b\[[0-9;]*m//g' … | grep -cE '^\s+(✓|✘)\s+[0-9]+ \['`.

The baseline the manifest names (`00-run-manifest.json` → `baseline.ci_checks_33936783382`)
records only a summary — *"e2e: 15 failed / 272 passed (16 distinct specs)"* — and names no
spec, so it cannot on its own establish that a given ✘ is pre-existing. This reviewer pulled
the failure block directly:
`gh run view 33936783382 --repo Victordtesla24/forgotten-mistory --log-failed`, job
*"playwright against the static export"*, trailing lines `15 failed` / `272 passed (15.6m)`.
`gh run view 33936783382 --json headSha,headBranch` returns
`headSha debd25b910d530c4f48c3f4a588ba9636aa48a17`, `headBranch main` — that run is `main`
before this branch existed, so nothing in it can be caused by the upgrade.

| # | local ✘ (`05-regression-full.log`) | in CI 33936783382 |
|---|------------------------------------|-------------------|
| 1 | `tests/a11y/gold-contrast.spec.ts:293:7` GC-01 | yes (✘ 14, +2 retries) |
| 2 | `tests/a11y/text-contrast.spec.ts:275:9` TC-CONTRAST-01 @ 390 | yes (✘ 39, +2 retries) |
| 3 | `tests/a11y/text-contrast.spec.ts:275:9` TC-CONTRAST-01 @ 1440 | yes (✘ 36, +2 retries) |
| 4 | `tests/e2e/chatbot.spec.ts:257:7` TC-BOT-12 | yes (✘ 126, +2 retries) |
| 5 | `tests/e2e/experience.spec.ts:172:7` TC-EXP-11 | yes (✘ 149, +2 retries) |
| 6 | `tests/e2e/hero.spec.ts:140:7` TC-HERO-12 | yes (✘ 164, +2 retries) |
| 7 | `tests/e2e/interaction-states.spec.ts:204:7` TC-STATE-HOVER | yes (✘ 177, +2 retries) |
| 8 | `tests/e2e/interaction-states.spec.ts:248:7` TC-STATE-ACTIVE | yes (✘ 180, +2 retries) |

Eight for eight. The full CI block carries 16 distinct specs (15 hard failures ×3 attempts,
plus `tests/e2e/listen.spec.ts:65:7` TC-LISTEN-05 with a single ✘ and no retry ✘ — the
"1 flaky"), which reconciles with the manifest's "16 distinct specs". The eight above are a
strict subset. The secondary reference the spec names,
`docs/delivery/evidence/v9-20260904T2312Z/F-security-upgrade/04-tests-passing.log`
(134 specs, `5 failed` / `129 passed`), covers a different subset — hero/perf CLS and three
`overhaul/render` WebGL specs — and was not needed: every ✘ cleared on the CI baseline alone.

## Findings and qualifications

- **V-1 — the five spec gates are real, not reported.** G1–G5 were executed by this reviewer
  on the committed tree at `878adab`; the exit codes in the table are the literal `EXIT=`
  values in `09-verification-gates.log`, not values copied from the author's `05a`–`06` logs.
  G5 was run exactly as the spec writes it (`node --test tests/ci_pipeline.test.mjs` alone →
  11/11); the author's four-file run (59/59, `04b-node-tests.log`) is a superset and both hold.
- **V-2 — the CI-fix test is a real assertion.** `tests/ci_pipeline.test.mjs` gains one `it`
  with six assertions that parse `checks.jobs.static.steps`, require `npm ci --prefix
  functions` to exist, and require `rootInstall < functionsInstall < nodeTests` both in the
  parsed YAML and in the file text. No placeholder, no `assert.ok(true)`, no skipped test.
- **V-3 — the regression is partial, and the report says so.** 243 of 288 specs ran; **45
  were never executed on this branch.** The unreached set includes the seven CI-red specs
  D-9 names (`a11y/interaction-states.spec.ts:362:7` and `:415:7`,
  `overhaul/render.spec.ts:154:7`, `visual/screenshots.spec.ts` VIS-01/02/04/06). So "the
  upgrade introduces no new failure" is established over the 243 that ran and is **open** over
  the remaining 45. This is a disclosed scope cut (orchestrator re-assignment of S-5/S-6 to
  cycle 14), not a concealed gap, and it is not one of this task's three quality gates — but
  it is the reason this PASS is a PASS on C13 as scoped and not a clean bill on the suite.
- **V-4 — doc drift, pre-existing.** `CLAUDE.md` states "276 Playwright tests"; the suite
  reports 288 (`Running 288 tests using 2 workers`, and CI's 15 + 272 + 1 flaky = 288).
  Not introduced by this change; worth a line in a later cycle.
- **V-5 — D-6's bundle numbers reproduce.** This reviewer's own G6 build printed
  `✓ Generating static pages (11/11)` and `/` First Load JS `170 kB`, the same figures D-6
  cites from `05d-build.log` and the same 170 kB recorded in
  `v9-20260904T2312Z/F-security-upgrade/05-bundle-delta.txt`. The author withdrew the
  "11 static pages" line from D-9 as unobserved; it is in fact observable and correct.
- **V-6 — the multiple-lockfile warning is a worktree artefact, confirmed.** G6 printed it and
  named both lockfiles: `/root/forgotten-mistory/package-lock.json` (parent checkout) and the
  worktree's own. A CI checkout has one. D-6's decision not to set `outputFileTracingRoot`
  stands.
- **V-7 — no softening language, no approval substitution, no fabricated artefact.** A scan of
  every committed C13 evidence file for `should be working` / `appears to pass|work` /
  `good enough` / `broadly ok` / `minor issues remain` / `probably` / `seems to` / `I believe` /
  `looks fine` returned no match. No file cites user approval as evidence. Every path cited in
  the author's report exists at the cited location and contains the cited content — sampled on
  `01b-npm-ci.log`, `02b-functions-npm-ci.log`, `04b-node-tests.log`, `05-regression-full.log`,
  `05d-build.log`, `06-audit.log`, `07-decisions.md`.
- **V-8 — no secrets.** `git diff main...HEAD | grep -cE 'sk-…|AIza…|ghp_…|xox[bp]-|BEGIN … PRIVATE KEY'`
  → 0. `/root/.claude/.env.production` was never read, sourced or printed by this
  verification. The built-output scan in G6 reports `PASS — no credential material in the
  emitted bundle` over 43 files.
- **V-9 — commit-subject honesty.** `878adab`'s subject is *"docs(evidence): record the C13
  next 15 battery and D-1 to D-9"*, not the spec's *"C13 regression complete"*. Given V-3 the
  spec's subject would have been a false claim; the substitution is the correct call and is
  disclosed in the author's decisions rather than left for a reader to notice.
- **V-10 — README not updated.** The global instruction to update `README.md` on every commit
  was not followed on `18c6beb`/`878adab`, and the author flagged it rather than hiding it.
  Recorded here so the omission is on the record; the last several commits on `main` touch no
  README either, so this is a standing repo-wide divergence, not a C13 regression.

## Ports and containment

Nothing was bound on `:5601` by this verification — no Playwright run was needed, since the
regression evidence under review is a committed log and the CI baseline came from `gh`.
`:5599` and `:8080` were never contacted. All work stayed inside
`/root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-1`; no file in
`/root/forgotten-mistory` itself was written.

## Evidence

| path | what it holds |
|------|---------------|
| `docs/delivery/evidence/v10-20260905T0515Z/C13-next15/09-verification-gates.log` | this reviewer's G1–G6 + G3b transcript with literal exit codes |
| `docs/delivery/evidence/v10-20260905T0515Z/C13-next15/09-verification.md` | this file |
| `docs/delivery/evidence/v10-20260905T0515Z/C13-next15/05-regression-full.log` | the 243-spec partial run under review |
| `docs/delivery/evidence/v10-20260905T0515Z/C13-next15/07-decisions.md` | D-1…D-9, the author's testimony |
| `docs/delivery/evidence/v10-20260905T0515Z/00-run-manifest.json` | `baseline.ci_checks_33936783382`, summary only |
| `docs/delivery/evidence/v9-20260904T2312Z/F-security-upgrade/04-tests-passing.log` | secondary baseline, different subset, not required |
| GitHub Actions run `33936783382` (`main` @ `debd25b`) | the 16-spec failure block matched line-for-line |
