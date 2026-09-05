# t_g_a1c — CORRECTION — G-A1: gold only on About evidence lines that name a checkable record; reconcile `sourced` with `side`; data-derived test counts

**Status:** todo · **Priority:** 99 · **Parents:** — · **Created:** 2026-09-05T12:37:56.168Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: G-A1 reviewer FAIL (semantics). Original output: 03aa1ed set sourced:true on 9/10 About dimensions using the criterion 'an employer, a program, a named repository, a figure off the CV'. Failing criteria: CLAUDE.md prime directive 3 — gold = `sourced` = measured WITH a source a reader can go and check; a CV figure with no published methodology is `self-reported`, never gold. Reviewer evidence (docs/delivery/evidence/v10-20260905T0515Z/G-REV/e47221ed/08-adversarial-review.md): #4 Culture Fit and #8 Company Stability are bare self-reported numbers; #7 Career Growth carries gold over a figure its own text calls 'simulated'; #6 Location Match is a side==='role' dimension that renders the OPEN caliper 'measured from the role' (About.tsx:220) while also painted gold — the same claim graded both 'sourced' and 'honestly not measurable'. Required fix (data + test, no styling change): in app/data/portfolio/about.ts set sourced:false on Culture Fit, Company Stability and Location Match; for Career Growth either rewrite the evidence line so it names ONLY a checkable record (a named repository or the evaluation stack without the simulated figure — the −38% may move into the answer prose as a plainly self-reported statement) and keep sourced:true, or set sourced:false — decide by whether a reader can open something and check it, and record the decision on the task. Invariant: every dimension with side==='role' has sourced:false. Tests derive expected counts from the data (import aboutContent), never hardcode 9.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read app/data/portfolio/about.ts (all ten dimensions: side, evidence, sourced), components/sections/About/About.tsx:200-245 (the open caliper for side==='role'), tests/monochrome/gold-semantics.spec.ts (CC-A1 — how it counts), tests/content/content-check.spec.ts, the reviewer report above, and CLAUDE.md prime directive 3.
- S-2 TDD: add `tests/about_sourced_semantics.test.mjs` (node:test, imports the data via tsx or a small ts→js loader already used by other tests/*.test.mjs — check how they import TS data; if none does, use `npx tsx --test`) asserting (a) side==='role' ⇒ sourced===false for every dimension, (b) every sourced:true evidence line contains at least one checkable-record token from an explicit allow-list you define in the test from the CV (employer names: Australian Taxation Office/ATO, ANZ, NAB, Microsoft, Telstra, InfoCentric, MYOB; program: Payday Super; repository names from app/data/portfolio/vitrine.ts; GitHub) and contains none of 'simulated', 'hours of evidence', 'practitioners' as the whole claim. RED now. Make CC-A1 in gold-semantics.spec.ts derive its expected gold/grey counts from aboutContent (import it) so the spec stays true after the data change; it must currently pass with 9 and after with the new count.
- S-3 Implement the data change (+ the Career Growth line decision). No CSS or component change unless the Career Growth split needs markup — prefer data only.
- S-4 npm run build:static; serve :5614; run tests/monochrome (3 specs) + tests/overhaul/scene-about.spec.ts + tests/content/content-check.spec.ts + the node:test → GREEN; tsc; lint; audit 10/10 (do not stage reports/static-audit.json). Screenshot #about at 1440 → 08-screens/ under G-A/correction/.
- S-5 Ledger (task t_g_a1c); commit `fix(about): gold only where the evidence names a checkable record (G-A1 correction)`; push branch.

## QUALITY GATES
- node:test red → green; side==='role' ⇒ sourced===false holds for all ten
- CC-A1 counts derived from data and green; monochrome, scene-about, content-check green; tsc, lint, audit 10/10
- Career Growth decision recorded (record named, or sourced:false)
- Ledger rows; branch pushed

## VERIFICATION
```bash
npx tsx --test tests/about_sourced_semantics.test.mjs 2>/dev/null || node --test tests/about_sourced_semantics.test.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5614 npx playwright test tests/monochrome tests/overhaul/scene-about.spec.ts tests/content/content-check.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:37:56.219Z)
running — dispatched 12:38Z — fresh analyst-programmer (correction identity), isolated worktree, port 5614

## COMMENT (2026-09-05T12:52:08.026Z)
PUSHED d958917 on worktree-wf_d917eafb-f9f-1 (12:51Z): sourced:false on Culture Fit, Location Match, Company Stability, Career Growth (4 flips, data only); gold-semantics CC-A1 now derives EXPECTED_SOURCED/UNSOURCED from aboutContent; tests/about_sourced_semantics.test.mjs 6/6 (role-side ⇒ unsourced, open-caliper binding asserted in About.tsx source, allow-list of checkable records for every gold line); about.spec adjusted. Orchestrator reviewed the diff. Awaiting consolidation + reviewer phase 3 on live.

## COMPLETE (2026-09-05T13:03:55.534Z)
REVIEWER PHASE-3 PASS on live 7d467770 (= 37cbb52c for every rendered file; G-REV/37cbb52c/08-adversarial-review.md, 8b351a7): 5 gold / 5 grey exactly as claimed at 1440 and 390; the four over-graded lines now grey; each gold line names a checkable record — two verified externally (GitHub API public_repos=38; aether-job-career-agent HTTP 200); all three side==='role' dimensions grey under their open caliper; grey lines still print evidence (41–74 chars, byte-identical); AA worst-case gold 7.84:1 / grey 5.22:1; page-wide gold census exactly 7 (5 About + Skills measured mark + Vitrine live URL); 0 pageerrors, 0 failed requests.
