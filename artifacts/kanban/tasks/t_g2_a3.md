# t_g2_a3 — ADV-1451Z P0 — G-A3 About: the GL field (about-field) carries the story — data-driven light per dimension/answer state (SVG compass stays as chrome); recruiter recall ≠ radar widget only

**Status:** todo · **Priority:** 96 · **Parents:** — · **Created:** 2026-09-05T14:57:53.036Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z §About: gold/hatch honesty PASS; flagship reads as an SVG dashboard instrument, not a UHD GLSL signature (P0 vs R1/R2/§0.3). Acceptance: about-field’s shader is driven by the section’s data and interaction — the ten dimensions’ answered/role/unsourced states and the hovered/active sector shape the field (e.g. the lit sector of the annulus, a bloom under the answered dimension, sourced (gold-marked) rows lifting a warm-neutral channel — NO gold in the shader), so the light changes as the visitor moves through the ten; the SVG compass remains the legible chrome; flagship floors hold; text-contrast both paths green; reduced-motion still shows the composed state; ≤ 30-min lane (checkpoint at 25). Evidence: before/after screenshots at 1440/390 + a short pointer-path capture (3 frames) proving the light follows the data.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read About.tsx/AboutField.tsx/field.glsl.ts/Compass.tsx + the hover/active state, scene-about.spec, SIGNATURE-SCENES-v1.md S2 + the council direction in G-REV/9ba97a5c (About).
- S-2 TDD: scene-about.spec — the field’s luminance distribution changes with the active dimension (sample two sectors before/after hover) and with sourced rows (uniform count); RED.
- S-3 Implement uniforms from the existing state (no new state machine), shader terms, palette via lib/palette.ts.
- S-4 PUSH RULE → then scene-about + flagship-visibility(about) + text-contrast → follow-up evidence.

## QUALITY GATES
- Light demonstrably follows the active dimension + sourced rows (measured); floors + AA hold; reduced-motion composed still
- audit 10/10; ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5631 npx playwright test tests/overhaul/scene-about.spec.ts tests/overhaul/flagship-visibility.spec.ts -g ABOUT --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:32.809Z)
1556Z DISPATCH NOW. Live still zero G-A3 since 1451Z. Worktree from origin/main. Skip Playwright window 1.

## STATUS (2026-09-05T16:58:33.818Z)
running — dispatched

## COMMENT (2026-09-05T17:22:09.710Z)
PUSHED 24b036d merge on worktree-ga3-1556 (work c0bd7ae). NOT live PASS until reviewer on deployed commit.

## COMMENT (2026-09-05T17:41:12.108Z)
INDEPENDENT FAIL b0513692: #about has 0 canvas; radar is the content. CORRECTION: about-field canvas must be the recruiter-visible story (size/contrast), compass chrome.

## COMMENT (2026-09-05T17:53:50.229Z)
A3 code is ancestor of live 58d9c111. Fresh matrix reviewer decides vs GAP-BACKLOG (field not radar). Prior dedicated PASS on 2806edec used ?gl=force; do not complete until this live commit is independently judged.

## COMMENT (2026-09-05T17:58:40.760Z)
Independent reviewer PASS on 2806edec (b4b35cbd, ?gl=force). HOLD board until c16 matrix on live 58d9c111 confirms. Do not complete on author self-report.

## COMMENT (2026-09-05T18:34:14.417Z)
C19 left G-A3 OPEN. Prior 2806edec PASS used ?gl=force. Fresh probe on 64404134.

## COMMENT (2026-09-05T19:32:50.648Z)
INDEPENDENT FAIL 64404134: #about 0 canvas on / and ?gl=force; recall is 384x384 SVG radar. CORRECTION ap-ga3-c23 — mount about-field + fix useGLCapability false-negative. Do not complete.

## STATUS (2026-09-05T19:32:50.697Z)
running — ap-ga3-c23 correction — 0 canvas even under gl=force

## COMMENT (2026-09-05T19:33:13.769Z)
C23: ap-ga3-c23 (84f44b32) from origin/main. Isolated About/* + useGLCapability false-negative.

## COMMENT (2026-09-05T19:44:49.907Z)
CORRECTION from rev-b4b4a9a3-c23: live DOES mount a 384x384 about canvas (in-view, ?gl=force) but it is coincident with the compass SVG. Recruiter recall is still the radar. Field must be the dominant plane (Listen-scale presence), compass chrome on top. A 30rem stage with 0.78 rose is still the widget. Do not ship a halo-only slice as G-A3 PASS.

## COMMENT (2026-09-05T19:50:30.735Z)
84f44b32 stopped; steered copy 34b08211 blocked. Respawn ap-ga3-c24 on same WT. Dominant-plane bar, not halo.

## STATUS (2026-09-05T19:50:30.791Z)
running — ap-ga3-c24 salvage WT ga3-c23 — field must dominate #about

## COMMENT (2026-09-05T20:17:02.308Z)
PUSHED 4eb4c8a origin/worktree-ga3-c23 — field as #about body plane, compass chrome. Missed 20:09 cadence; next ~20:19. Do not complete until independent live PASS.

## COMMENT (2026-09-05T20:22:15.370Z)
LIVE d19939ac via Deploy 33989752694 (consolidate 4eb4c8a). Fresh reviewer rev-d19939ac-c24. Do not complete on AP self-report.

## COMPLETE (2026-09-05T20:33:49.147Z)
PASS live d19939ac. GL field is #about body plane 1248x900 (1440) / 342x480 (390), not coincident with Compass 416/224. Shader follows active dimension; gold not in shader. https://forgotten-mistory.web.app/ build-commit d19939ac · independent rev-d19939ac-c24 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/d19939ac/G-A3-REVIEW.md · Deploy 33989752694 · canvas 1248x900 vs compass 416x416 (6.49x); isolated shader goldPixels=0 maxSaturation=0; hover meanChannelDelta=2.244

## COMMENT (2026-09-06T00:00:28.007Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:28.113Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
