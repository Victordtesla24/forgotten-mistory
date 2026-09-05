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
