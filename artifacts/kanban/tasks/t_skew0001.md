# t_skew0001 — P95 — deploy skew: a page loaded under build N lazy-loads scene chunks that deploy N+1 has replaced (Loading chunk 427/743 failed) — precache the build chunk manifest in the worker, keep the previous cache generation, recover chunk-load failures, scene-local error boundary

**Status:** running · **Priority:** 95 · **Parents:** t_cachefr01 · **Created:** 2026-09-05T10:10:33.089Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Monitor 10:09Z on c5d808c3: pageerrors Loading chunk 427.8222755a6b18eedc.js / 743.9672a1f959c17edf.js failed; canvasesAfterExperience 0 — the HTML was the previous build, the hashed chunks were gone after the next deploy (Firebase serves only the current version). With 10-min deploys every mid-visit scroll can hit this. Fix: (1) scripts/build/stamp_service_worker.mjs also injects PRECACHE_ASSETS = every out/_next/static/**/*.{js,css} + fonts of THIS build; install precaches them (cache-first already), activate keeps the previous generation (delete caches older than the last two) so a page still running build N can lazy-load from cache after N+1 activates; (2) components/gl/Scene.tsx dynamic import: on ChunkLoadError retry once, then one reload per session (sessionStorage guard) — and never the error shell; (3) fold t_e9d4e10f: scene-local error boundary so any scene fault stays in its slot. Tests: tests/sw_strategy.test.mjs (precache list present and stamped, two-generation cleanup), tests/overhaul/scene-error-boundary.spec.ts (inject a failing chunk via route interception → six sections stay, one console error, no error shell), node --test.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 TDD
- S-2 stamp script precache list + sw.js two-generation activate
- S-3 Scene.tsx chunk-failure recovery + error boundary
- S-4 battery; push

## QUALITY GATES
- [ ] route-intercepted chunk failure leaves 6 sections + no error shell
- [ ] out/sw.js lists every chunk of the build
- [ ] battery green

## VERIFICATION
```bash
node --test tests/sw_strategy.test.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/overhaul/scene-error-boundary.spec.ts tests/overhaul/render.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T10:46:49.737Z)
V-skew FAIL on one clause only (0ece403): TC-SKEW-02 line 165 — the forced WebGL context-creation error escapes as an uncaught pageerror (containment itself holds: 6 sections, no error shell); deterministic 3/3. SW half PASS end to end (cutover with 7 re-hashed lazy chunks, KEEP_GENERATIONS=2 observed, manifest 68 assets). Shipped via pipeline (ccb1524, live). Correction → t_skew0002.

## STATUS (2026-09-05T12:09:07Z)
ready — reclaimed by the orchestrator on resume 12:0xZ: no worker process alive (ps), partial edits preserved in the paused worktree (wf_38db9d7d-ce3-1 / wf_d69fe804-9d9-1); re-dispatch in the stability lane after the ADV-FAIL P0 wave.

## COMMENT (2026-09-05T12:19:26.600Z)
bundled into t_stab01 (stability lane, worktree wf_38db9d7d-ce3-1, port 5613) — dispatch when a build slot frees after the ADV-FAIL wave-1 lanes

## STATUS (2026-09-05T13:04:41.406Z)
running — bundled lane t_stab01 dispatched 13:04Z

## COMPLETE (2026-09-05T13:29:44.585Z)
Closed via t_stab01 (87c9667 live): see its COMPLETE record.
