# 07-decisions.md — C13-next15 (run v10-20260905T0515Z)

Every judgement call taken while landing cycle 13: Next 15.5.25, the CI functions-deps
fix, and the `.gitignore` conflict markers. Numbers cite the log they come from.

## D-1 — The archived patch is applied as-is, by 3-way merge

`git apply --3way /root/.claude/jobs/2ca96782/tmp/next15.patch` applied cleanly to all
six files (`.eslintrc.json`, `app/not-found.tsx`, `app/performance-benchmark/page.tsx`,
`package-lock.json`, `package.json`, `tsconfig.json`) — see `01-baseline.log`, "patch
apply result". The pre-image lines in the patch (`next ^14.2.35`, `eslint-config-next
^14.2.35`, no `root`, no `target`, `<a href="/">` in both pages) are the pre-patch state;
a clean apply is the proof they matched the tree. Post-checks in the same log: both
packages at `15.5.25`, `"root": true`, `"target": "ES2017"`, both pages import
`next/link`, lockfile carries `15.5.25`. Nothing in the patch was altered.

## D-2 — `.gitignore`: markers removed, both sides kept, no dedupe needed

Lines 198 (`<<<<<<< HEAD`), 200 (`=======`) and 217 (`>>>>>>> 9588cff …`) were deleted
and nothing else. `functions/node_modules` occurred exactly once before the fix
(`grep -c` = 1) and once after (line 198), so there was nothing to dedupe. Verified:
`grep -n '^[<=>]\{7\}' .gitignore` prints nothing (`01-baseline.log` holds the before,
the shell transcript the after).

## D-3 — The CI fix is one line in `checks.yml`, placed right after the root `npm ci`

`tests/minivic_chat_function.test.mjs` imports `functions/index.js`, which requires
`firebase-functions/v2/https` from `functions/node_modules`. The root `npm ci` never
installs that tree. The static job now runs `npm ci --prefix functions` immediately
after `npm ci` and before `tsc`/`lint`/audit/`node --test`. `deploy.yml` is untouched;
no other line of `checks.yml` changed.

TDD: the new contract test in `tests/ci_pipeline.test.mjs` ("installs the Cloud Functions
dependencies before the node contract tests run") failed against the unfixed workflow —
`02-tests-failing.log`: 11 tests, 10 pass, 1 fail, exit 1 (`static job must run "npm ci
--prefix functions"`). After the one-line fix, the four files the static job runs pass —
`04-tests-passing.log`: 59 tests, 59 pass, 0 fail, exit 0.

Proof the command works from a clean checkout: `02b-functions-npm-ci.log` — `npm ci
--prefix functions` added 239 packages in 5 s, exit 0, and
`require.resolve('firebase-functions/v2/https')` from `functions/` resolves to
`functions/node_modules/firebase-functions/lib/v2/providers/https.js`.

## D-4 — `functions/` reports 13 moderate advisories; left alone

The same log shows `13 moderate severity vulnerabilities` inside the `functions/`
dependency tree. The CI audit job runs `npm audit --audit-level=high` at the repo root
only, moderate advisories do not trip `--audit-level=high`, and the item is scoped to the
root Next upgrade. The root audit is clean: `06-audit.log` — `found 0 vulnerabilities`,
exit 0 (the same result the v9 evidence recorded). The functions-tree advisories are
reported here for a later cycle rather than fixed in this one, to keep the change to what
the item names.

## D-5 — npm 12 blocked three postinstall scripts; the battery proves they are not needed

This host's npm (12.0.2) refuses install scripts not covered by `allowScripts`:
`@tailwindcss/oxide@4.1.13` and `unrs-resolver@1.11.1` at the root (`01b-npm-ci.log`),
`protobufjs@7.6.4` under `functions/` (`02b-functions-npm-ci.log`). No `allowScripts`
entry was added: `tsc` (`05a-tsc.log`, exit 0), `lint` (`05b-lint.log`, "No ESLint
warnings or errors", exit 0), the static audit (`05c-static-audit.log`, 10/10) and the
export (`05d-build.log`, exit 0) all pass without them, and CI pins Node 22 via
`.node-version` with whatever npm ships with it. Adding an allow-list would change
install behaviour the item does not ask for.

## D-6 — Next 15's "multiple lockfiles" warning is a worktree artefact, not a config change

`next lint` and `next build` warn that they "detected multiple lockfiles and selected
/root/forgotten-mistory/package-lock.json as the root directory" (`05b-lint.log`,
`05d-build.log`). This worktree lives under `/root/forgotten-mistory/.claude/worktrees/`,
so the parent checkout's lockfile sits above it on the path. A CI checkout has one
lockfile and never sees this. `outputFileTracingRoot` was not set: it only affects
output file tracing, the site is a static export, and setting it would be a config change
made to silence a host-only message. Build output is unaffected — `05d-build.log`: 11
static pages, `/` First Load JS 170 kB, identical to the v9 measurement
(`docs/delivery/evidence/v9-20260904T2312Z/F-security-upgrade/05-bundle-delta.txt`).

## D-7 — Two build-generated tracked files are not part of the commit

The build rewrote `app/data/generated/build-stamp.ts` to `sha: null, authored: null,
clean: false`. That is `scripts/build/build_stamp.mjs` doing its job: it blanks the
stamp whenever any tracked file outside `app/data/generated/` and `reports/` differs
from HEAD — which they do here, because the upgrade was applied but not yet committed.
The deploy pipeline builds from a clean checkout of `main` and writes a real stamp; the
last committed stamp (`6dcb4f53`) is restored before the commit so no null stamp ever
lands. `reports/static-audit.json` is the audit's own output and is committed with the
change, matching every prior delivery commit that touched it.

## D-8 — Concurrency on the host

Another council agent runs the same battery concurrently. This run uses port 5601 for
its static server (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`), the
default local worker count from `playwright.config.ts` (`workers: 2` outside CI), and
`--last-failed --workers=1` is reserved for reruns of connection-refused / ENOMEM flakes
only, never for a spec that fails deterministically.

## D-9 — Regression completion moved to cycle 14; the partial run stands as evidence

The upgrade commit is `18c6beb` — *chore(deps): next 15.5.25 — audit clean, CI installs
functions deps* — 10 files, 405 insertions, 692 deletions.

Regression completion moved to cycle 14 by orchestrator decision (2026-09-05T06:0xZ):
steps S-5 and S-6 of `artifacts/kanban/tasks/t_62c9ee4d.md` — the full 276-spec run — are
re-assigned to the cycle-14 tester on the merged `main`, so this unit fits the 30-minute
cap and the verified upgrade ships on the ten-minute deploy cadence. `05-regression-full.log`
therefore stands as the partial run: **243 specs reported, 8 ✘, all in the manifest's
CI-red list** (`00-run-manifest.json` → `results.ci_checks_33936783382`, "e2e: 15 failed /
272 passed"). The run stopped at spec 243 (`tests/overhaul/design-scale.spec.ts:146:9 ›
design scale @ 1280px`); nothing after it was executed.

Each ✘ matched line-for-line against the 15-item failure block printed by that CI run
(`gh run view 33936783382 --repo Victordtesla24/forgotten-mistory --log-failed`, job
"playwright against the static export", summary `15 failed / 1 flaky / 272 passed`):

| # | local ✘ (05-regression-full.log) | present in ci_checks_33936783382 |
|---|----------------------------------|----------------------------------|
| 1 | `tests/a11y/gold-contrast.spec.ts:293:7` GC-01 | yes |
| 2 | `tests/a11y/text-contrast.spec.ts:275:9` TC-CONTRAST-01 @ 390 | yes |
| 3 | `tests/a11y/text-contrast.spec.ts:275:9` TC-CONTRAST-01 @ 1440 | yes |
| 4 | `tests/e2e/chatbot.spec.ts:257:7` TC-BOT-12 | yes |
| 5 | `tests/e2e/experience.spec.ts:172:7` TC-EXP-11 | yes |
| 6 | `tests/e2e/hero.spec.ts:140:7` TC-HERO-12 | yes |
| 7 | `tests/e2e/interaction-states.spec.ts:204:7` TC-STATE-HOVER | yes |
| 8 | `tests/e2e/interaction-states.spec.ts:248:7` TC-STATE-ACTIVE | yes |

Eight for eight. That CI run is `main` at `debd25b`, i.e. before this branch existed, so
none of the eight is caused by the Next 15 upgrade. The seven CI failures the partial run
never reached — `a11y/interaction-states.spec.ts:362:7` and `:415:7`,
`overhaul/render.spec.ts:154:7`, and `visual/screenshots.spec.ts` VIS-01/02/04/06 — are
what cycle 14 has to re-observe locally before the suite can be called triaged.

Gates re-run against the committed tree (`18c6beb`), after `git checkout --
app/data/generated/build-stamp.ts reports/static-audit.json` restored the two
build-generated tracked files:

| gate | command | observed |
|------|---------|----------|
| tsc | `npx tsc --noEmit` | exit 0, no diagnostics |
| lint | `npm run lint` | exit 0, `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | exit 0, `RESULT: ALL PASS (10/10)` |
| build | `npm run build:static` | exit 0, prune removed 3 benchmark artifacts, secret scan over 43 files in `out/` → `RESULT: PASS — no credential material in the emitted bundle` |
| npm audit | `npm audit --audit-level=high` | exit 0, `found 0 vulnerabilities` |
| node contracts | `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs` | exit 0, 59 tests / 59 pass / 0 fail (`04b-node-tests.log`) |

## Tools used

`git` (status / diff / checkout / add / commit / show / log), `node --test`,
`npx tsc --noEmit`, `npm run lint`, `npm run build:static`, `npm audit --audit-level=high`,
`node scripts/validate/overhaul_static_audit.mjs`, `gh run view --log-failed`, and the
Claude Code Read / Edit / Bash tools. No paid generation API was called: the spend policy
in `00-run-manifest.json` caps this run at $0 and every generation path is Owner-blocked.
