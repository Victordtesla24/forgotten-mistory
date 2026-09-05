# t_rectify01 — RECTIFY 12:52Z (host compliance audit PARTIAL) — O3 suite-as-evidence, ≤5-min WIP push, board lag closed, Hermes process check, cadence truth, 2-min re-dispatch

**Status:** running · **Priority:** 100 · **Parents:** — · **Created:** 2026-09-05T12:58:11.438Z

## YOUR ROLE
orchestrator — feedback_refactor_loop (docs/prompt.md §5). Host audit docs/adversarial/ORCH-COMPLIANCE-20260905T1245Z.md + artifacts/kanban/INBOX/RECTIFY-20260905T1252Z.md. Applied: (1) Playwright no longer gates a push — lanes push when tsc+lint+build:static+audit are green and run the battery in parallel (evidence lands in a follow-up commit; the live reviewer is the gate); (2) 12:57Z orchestrator pushed G-H1 WIP 0506e7e and G-S1 WIP 66b0872 (both tsc clean on fresh builds); (3) board lag closed: t_g_v1 done (reviewer PASS 843b679d), t_g_a2 done, t_g_h2 done, t_ci_verify01 done, t_hyg_audit01 done; (4) G-A1 correction d958917 live 37cbb52c, reviewer phase 3 running; (5) MiniVic live 874f1ee9, reviewer phase 2 running; (6) pgrep -af 'hermes gateway' → empty (pid 7050 is a <defunct> zombie, not running; host-owned ttyd wrapper on :4860 left to the host guardian); fm-deploy-cadence.timer active; (7) cadence truth: cycle reports state visible vs docs-only deploys explicitly; (8) spawn discipline: a failed Workflow slot is re-dispatched within 2 minutes (a poll on journal.jsonl 'failed' entries).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 acknowledge on t_g_rev (done 12:55Z)
- S-2 push ready WIP (done 12:57Z: 0506e7e, 66b0872)
- S-3 reviewer on live after the next Deploy for G-H1 / G-S1 (+ G-M1/G-M2 and G-A1c already dispatched)
- S-4 cycle report c10 with the visible-delta table per 10-min window
- S-5 keep the rule in every subsequent lane prompt

## QUALITY GATES
- Every 10-min window from 12:52Z shows a recruiter-visible delta or an explicit 'no P0 WIP ready' note with evidence
- No lane waits on Playwright before pushing a tsc/lint/build-clean change
- All gaps with live reviewer PASS are Done on the board within one cycle

## VERIFICATION
```bash
gh run list -R Victordtesla24/forgotten-mistory --workflow=deploy.yml --limit 6
node scripts/pm/kanban.mjs list | sed -n '/DONE/,$p' | head -20
```

## HIERARCHY
role_matrix: feedback_refactor_loop → level orchestrator → effort **ultracode** (effort_cascade.yaml; depth_cap 4). Model: claude-fable-5-1 (ultracode) · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T13:02:17.158Z)
13:01Z status: WIP pushes done — G-H1 0506e7e + G-S1 66b0872 (LIVE 9b864752 at 12:59:23Z, 7 min after the order), G-H3 5d733ad (consolidating). Reviewers on live: G-A1c (37cbb52c), G-M1/M2 (874f1ee9), G-H1/G-S1 (9b864752), flagship-C (577d45af, evidence pushed 13:01Z). Board lag: t_g_v1, t_g_a2, t_g_h2, t_ci_verify01, t_hyg_audit01 done. Hermes: pgrep 'hermes gateway' empty (7050 defunct zombie only). Timer active.

## COMMENT (2026-09-05T13:29:44.994Z)
INCIDENT (orchestrator-caused, recorded): my 13:01Z WIP push of the palette lane (5d733ad, branched at 7ebf325) was made WITHOUT merging origin/main first; consolidation 735ea66 hit hunk conflicts in components/MiniVicBot.tsx against the MiniVic lane's 91f46e9 and resolved them 'branch wins' → an orphan block with one dead-ladder string and 6 tsc errors sat on main 13:04–13:20Z (builds still shipped: next build does not fail the export on those). The stability lane removed it (87c9667); origin/main and the live bundle now show 0 dead-endpoint references (verified 13:29Z by grepping every served chunk). RULE ADDED: an orchestrator WIP push runs Updating 6227914..71e2811
Fast-forward
 app/globals.css                                    |   76 +
 app/loading.tsx                                    |   97 +-
 components/MiniVicBot.tsx                          |   76 +-
 components/gl/GLCanvas.tsx                         |   96 +-
 components/gl/Scene.tsx                            |    4 +-
 .../sections/Experience/Experience.module.css      |   24 +-
 .../F-stability/00-build-baseline.log              |   73 +
 .../F-stability/01-cls-attribution.json            |  145 +
 .../F-stability/01-cls-attribution.log             |   10 +
 .../F-stability/01-cls-probe.mjs                   |  120 +
 .../F-stability/02-tests-failing.log               |   90 +
 .../F-stability/03-cls-unskipped-after.log         |    9 +
 .../F-stability/03-hero-growth-probe.mjs           |   52 +
 .../F-stability/03-hero-growth.log                 |   19 +
 .../F-stability/04-tests-passing.log               |   72 +
 .../F-stability/05-contrast-02.log                 |    7 +
 .../08-screens/experience-openNote-390-glforce.png |  Bin 0 -> 14718 bytes
 .../F-stability/08-screens/footer-1440.png         |  Bin 0 -> 28904 bytes
 .../F-stability/08-screens/footer-390.png          |  Bin 0 -> 20006 bytes
 .../v10-20260905T0515Z/G-M3/01-live-baseline.log   |   68 +
 .../v10-20260905T0515Z/G-M3/02-tests-failing.log   |  502 ++++
 .../v10-20260905T0515Z/G-M3/04-tests-passing.log   |  344 +++
 .../v10-20260905T0515Z/G-M3/05-regression.log      |   10 +
 .../evidence/v10-20260905T0515Z/G-M3/06-deploy.log |   30 +
 .../G-M3/07-prod-verification/01-curl-after.log    |   37 +
 .../02-hosting-buffers-sse.log                     |   17 +
 .../G-M3/08-decision-first-token.md                |   90 +
 .../G-REV/ceca1fa5/08-adversarial-review.md        |  325 +++
 .../captures/1440-glforce-nolcd-fullpage.png       |  Bin 0 -> 395272 bytes
 .../captures/1440-still-nolcd-fullpage.png         |  Bin 0 -> 382655 bytes
 .../captures/390-glforce-nolcd-fullpage.png        |  Bin 0 -> 453478 bytes
 .../ceca1fa5/captures/390-still-nolcd-fullpage.png |  Bin 0 -> 447193 bytes
 .../ceca1fa5/captures/css-chroma-scan-ceca1fa5.txt |   36 +
 .../captures/css-chroma-scan-lazy-chunk.txt        |    7 +
 .../captures/dom-computed-colour-sweep.json        |  163 ++
 .../ceca1fa5/captures/probe-lcd-off-histogram.json |  202 ++
 .../G-REV/ceca1fa5/captures/probe-lcd-on.json      | 3034 ++++++++++++++++++++
 .../G-REV/ceca1fa5/captures/probe2.mjs             |   73 +
 .../G-REV/ceca1fa5/captures/scan.mjs               |  108 +
 .../captures/subpixel-aa-artefact-1440-about.png   |  Bin 0 -> 12019 bytes
 .../G-REV/ceca1fa5/captures/text-contrast-live.log |   71 +
 functions/index.js                                 |  267 +-
 lib/miniVicBrain.ts                                |  168 +-
 tests/a11y/text-contrast.spec.ts                   |   50 +-
 tests/e2e/minivic-send-path.spec.ts                |   94 +
 tests/minivic_chat_function.test.mjs               |  220 ++
 tests/perf/performance.spec.ts                     |  321 ++-
 47 files changed, 6997 insertions(+), 210 deletions(-)
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/00-build-baseline.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/01-cls-attribution.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/01-cls-attribution.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/01-cls-probe.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/02-tests-failing.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/03-cls-unskipped-after.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/03-hero-growth-probe.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/03-hero-growth.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/04-tests-passing.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/05-contrast-02.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/08-screens/experience-openNote-390-glforce.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/08-screens/footer-1440.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/F-stability/08-screens/footer-390.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/01-live-baseline.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/02-tests-failing.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/04-tests-passing.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/05-regression.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/06-deploy.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/07-prod-verification/01-curl-after.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/07-prod-verification/02-hosting-buffers-sse.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/08-adversarial-review.md
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/1440-glforce-nolcd-fullpage.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/1440-still-nolcd-fullpage.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/390-glforce-nolcd-fullpage.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/390-still-nolcd-fullpage.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/css-chroma-scan-ceca1fa5.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/css-chroma-scan-lazy-chunk.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/dom-computed-colour-sweep.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/probe-lcd-off-histogram.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/probe-lcd-on.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/probe2.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/scan.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/subpixel-aa-artefact-1440-about.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/captures/text-contrast-live.log in the worktree first and 715995a088b2660b99773e96687da8810a860815 must report no conflicts; lanes merge origin/main immediately before every push.
