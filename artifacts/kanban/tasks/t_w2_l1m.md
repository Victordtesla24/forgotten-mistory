# t_w2_l1m — G-LISTEN-MOTION (from t_w1_red3, product defect) — the #listen field's motion after the 1.16 s beat never clears the flagship floor (mean |ΔL| 0.00050 @1440 / 0.00061 @390 on the export, 0.00142 / 0.00384 live, vs MOTION_MIN 0.004): give the field a continuous, envelope-true motion term so TC-FLAGSHIP-VIS-LISTEN holds at both widths — without brightening over type (G-L1 envelope, 24.98 s reading, gold jaws unchanged)

**Status:** ready · **Priority:** 88 · **Parents:** t_w1_red3 · **Created:** 2026-09-06T03:16:59.708Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Evidence: docs/delivery/evidence/v10-20260905T0515Z/W1-RED3/02-listen-motion-1440.json, 02-listen-motion-probe.mjs, 09-flagship-regression.log (about-vs-listen control on the same spec/host proves the instrument). Cause named by the tester: after CLOSE_SECONDS (1.16 s) in components/sections/Listen/ListenField.tsx, uClose holds and the only continuously varying terms left in listen.glsl.ts sit at the bar (amplitude 0.00087–0.00487 over 1.5–12 s windows). The field must stay alive as the greeting's own envelope (G-L1 contract: the band IS the greeting's loudness; the 24.98 s reading and gold caliper jaws on LinkedIn+GitHub stay exactly as they are) — e.g. keep the envelope scrub travelling after the beat (looping the measured envelope at reduced amplitude), or add a slow breathing term bounded so text contrast ≥ 4.5:1 and no light reaches the type rails; reduced-motion path renders static (no motion required there).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-l1m from origin/main (.claude/worktrees/w2-l1m, node_modules symlink). One build / one browser.
- S-1 Read the W1-RED3 evidence, components/sections/Listen/{ListenField.tsx,listen.glsl.ts,Listen.module.css}, scripts/build/greeting_envelope.mjs + app/data/generated/greeting-envelope (the measured envelope), tests/overhaul/flagship-visibility.spec.ts (LISTEN case, MOTION_MIN 0.004, window 1.5 s), tests/overhaul/scene-listen*.spec.ts / listen-flagship.spec.ts (G-L1 C5 24.98 s reading, envelope-not-sin contract), tests/a11y/text-contrast.spec.ts, docs/architecture/LISTEN-FLAGSHIP.md.
- S-2 TESTS FIRST: the LISTEN flagship-visibility case is the failing test — capture it failing on origin/main at 1440 and 390 → W2-L1M/02-tests-failing.log (do not change MOTION_MIN or the window).
- S-3 Implement the smallest shader/driver change that keeps motion ≥ 0.004 continuously after the beat, envelope-derived (never sin()), bounded under type; reduced-motion unchanged.
- S-4 Verify: flagship-visibility (ALL 24 cases, serially — the tester could not re-run the other scenes), listen-flagship/scene-listen, text-contrast, e2e listen green on :5630; tsc; lint; build:static; audit 10/10; ?gl=force 0 pageerrors; screenshots of #listen at 1440/390 at t=0.5 s, 2 s, 5 s → W2-L1M/.
- S-5 Ledger; commit 'feat(listen): the field keeps breathing with the greeting after the beat (flagship motion floor)' with the two mandatory trailers; push worktree-w2-l1m.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, measurements:{motion_1440, motion_390, reading_s, contrast_min}, gates:{tests_failed_first, flagship_24_green, listen_suites_green, contrast, tsc, lint, build, audit_10_10, envelope_not_sin, reduced_motion_static}, evidence:[], goal_complete}.

## QUALITY GATES
- TC-FLAGSHIP-VIS-LISTEN ≥ 0.004 at 1440 and 390 after failing first; all 24 flagship cases green serially
- G-L1 contracts unchanged (24.98 s reading, envelope-derived, gold jaws only on LinkedIn+GitHub); contrast ≥ 4.5:1; reduced-motion static
- tsc · lint · build · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-l1m
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:53:30.614Z)
running — dispatched 03:54Z fm-wave2-corrections-b (serialized: mv4 → m4b → l1m → a3g)

## STATUS (2026-09-06T05:20:45.120Z)
ready — re-queued 05:21Z after load-shedding corrections-B; dispatch when avail RAM > 3 GB
