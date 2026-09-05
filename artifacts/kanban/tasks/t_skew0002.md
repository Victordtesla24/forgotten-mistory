# t_skew0002 — Correction — GLCanvas: a WebGL context-creation failure is caught and reported once via console.error (never an uncaught pageerror); TC-SKEW-02 green 3/3

**Status:** todo · **Priority:** 80 · **Parents:** t_skew0001 · **Created:** 2026-09-05T10:46:49.784Z

## YOUR ROLE
coder — coding / documentation (docs/prompt.md §5). V-skew (0ece403) single red clause: tests/overhaul/scene-error-boundary.spec.ts:165 expects 0 uncaught page errors when getContext throws; GLCanvas.tsx lets the error propagate before the boundary sees it. Fix: try/catch around context creation (and the webglcontextcreationerror event) → boundary fallback + one console.error naming the scene; keep the spec strict. Files: components/gl/GLCanvas.tsx, components/gl/Scene.tsx.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 reproduce TC-SKEW-02 red
- S-2 catch + report; no swallow without a console.error
- S-3 scene-error-boundary + render + cinematic green; battery; push

## QUALITY GATES
- [ ] TC-SKEW-01/02 green 3/3
- [ ] battery green

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/overhaul/scene-error-boundary.spec.ts --repeat-each=3
```

## HIERARCHY
role_matrix: coding / documentation → level 4 → effort **medium (xhigh when coding)** (effort_cascade.yaml; depth_cap 4). Model: deepseek · OpenRouter → Anthropic OAuth (§0.4 failover). max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.
