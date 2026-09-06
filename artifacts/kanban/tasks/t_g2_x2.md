# t_g2_x2 — ADV-1451Z P0 — G-X2 R2 status + plan refresh: 7 named scenes now mounted (S7 live c1df3565); reconcile SIGNATURE-SCENES-v1.md with what shipped, name the zero-credit HyperFrames path (t_x1_10/11) as the next slices, and correct §4.1(b) (scrim geometry/alpha) to the measured WCAG reality

**Status:** todo · **Priority:** 90 · **Parents:** — · **Created:** 2026-09-05T14:57:53.444Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z: “only ~4 named data-scene mounts; vitrine/listen lack sceneId” — probed ff67273b before S5/S6 (192d743, live ff67273b at 14:41) and S7 (c1df356, live c1df3565 at 14:54) landed; now 7 named scenes exist. Refresh docs/architecture/SIGNATURE-SCENES-v1.md: per-scene status table with live build + reviewer evidence path, fps reality (software-rasteriser numbers, resolutionScale 0.5 from af7355a, GPU job label-gated), the HyperFrames zero-credit render pipeline + in-page overture as the next two tasks (t_x1_10/11 — re-validate their specs against the current tree), §4.1(b) corrected per t_x1_03’s measurements (DOM-measured column, 0.72 alpha rejected at 2.82:1). No PASS claims on R2 60 fps or on the Marvel bar — state the honest distance.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the doc, the reviewer reports under G-REV/*, t_x1_01/01b/03 evidence.
- S-2 Rewrite the status + next-slices sections; commit docs branch; push.

## QUALITY GATES
- Doc matches live; no renegotiated bar; next two slices specified with verify commands

## VERIFICATION
```bash
grep -c "listen-field\|vitrine-field\|minivic-viseme" docs/architecture/SIGNATURE-SCENES-v1.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T14:58:24.600Z)
running — dispatched 14:59Z — solutions-architect max, docs-only worktree (no Chrome)

## COMPLETE (2026-09-05T15:20:06.028Z)
15:17Z SIGNATURE-SCENES-v1.md refreshed against live b0d41a20 (+ SIGNATURE-SCENES-NEXT.json, 4 re-validated tasks) on branch docs/t-g2-x2-signature-scenes-refresh (59197f1) — consolidates at the next Deploy. §0.5 per-scene status table (7 mounted), §0.5.1 fps reality (no 60 fps claim anywhere; SwiftShader 66.7–366.6 ms/frame), §4.1(b) corrected (0.88 → 4.79:1). D12: HyperFrames (t_x1_10→t_x1_11) is the next lane after t_g2_v3.

## STATUS (2026-09-05T16:57:52.694Z)
ready — 1556Z reopen — viseme-as-scene-7 is census not R2; SIGNATURE-SCENES must forbid it

## COMMENT (2026-09-05T16:57:52.741Z)
1556Z: SA must rewrite SIGNATURE-SCENES so minivic-viseme is NOT cinematic scene 7; name next real scene (t_x1_10 HyperFrames or UHD GLSL that is the story).

## COMMENT (2026-09-05T16:58:33.194Z)
1556Z DISPATCH SA NOW.

## STATUS (2026-09-05T16:58:33.868Z)
running — dispatched

## COMMENT (2026-09-05T17:19:17.115Z)
SA PUSHED 5c76cca: viseme is NOT cinematic scene 7; next real scene t_x1_10. Docs are not R2 PASS. AP t_x1_10 queued.

## COMMENT (2026-09-05T17:27:41.695Z)
SA rewrite on main 8d772fb. R2 remains FAIL. Next AP t_x1_10. Completing SA slice only.

## COMPLETE (2026-09-05T17:27:41.748Z)
SA delivered: viseme forbidden as cinematic scene 7; live census 6; next real scene t_x1_10 HyperFrames. R2 NOT PASS. Docs on live 8d772fb9 via Deploy 33980742004.

## COMMENT (2026-09-05T19:32:50.742Z)
INDEPENDENT FAIL 64404134 G-X2: 0 canvases default; 3 sections under ?gl=force. SA rewrite stands; R2 not PASS. t_x1_10 remains ready.

## COMMENT (2026-09-05T20:33:49.311Z)
R2 remains FAIL on live d19939ac (6 GL scenes < 7). SA rewrite stands. t_x1_10 ready for HyperFrames when a later wave picks it up.

## COMMENT (2026-09-06T00:00:34.674Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:34.751Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
