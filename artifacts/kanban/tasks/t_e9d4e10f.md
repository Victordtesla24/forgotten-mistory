# t_e9d4e10f — R-c13 MOT-C13-01d — scene-local error boundary: a fault inside one GL scene never replaces the whole document

**Status:** todo · **Priority:** 90 · **Parents:** t_4adf34f7 · **Created:** 2026-09-05T07:30:51.764Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). components/gl · major · Verified. A fault inside a scene replaces the whole document: GLCanvas mounts with no scene-local error boundary, so a component-level throw reaches app/error.tsx — 'the scene is never the content' is not enforced in code

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 TDD: A spec that forces a throw inside the GL subtree (stub GLCanvas's default export to throw, or dispatch a webglcontextlost the renderer cannot recover) asserts: document.querySelectorAll('section[id]').length === 6, #hero h1 text 'Vikram Deshpande', zero elements matching /SYSTEM INTERRUPT|Something went wrong/, and #hero canvas count 0 (the slot fell back). Add as tests/e2e/scene-failure-contained.spec.ts.
- S-2 Wrap the GLCanvas mount at Scene.tsx:94-98 in a scene-local error boundary whose componentDidCatch sets capability = 'unsupported' and renders the slot empty, so any scene failure degrades to the no-GL path already built and tested. Log once to the console with the scene's name; do not re-throw. Keep app/error.tsx for genuine page-level faults.
- S-3 battery; commit; push

## QUALITY GATES
- [ ] a thrown scene leaves the six sections rendered and logs one console error
- [ ] battery green

## VERIFICATION
```bash
# files: components/gl/Scene.tsx:91,94-98, components/gl/GLCanvas.tsx:3,22-44, app/error.tsx:28-46, tests/e2e/
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T08:48:53.863Z)
running — resilience lane dispatched (GLCanvas error boundary + footer CLS), port 5603

## COMMENT (2026-09-05T09:09:06.142Z)
09:0xZ: resilience lane killed by the restart before any code change (only build-stamp touched); relaunched fresh after the two heavier lanes, to keep the host at ≤2 batteries.

## STATUS (2026-09-05T10:10:33.309Z)
running — folded into t_skew0001 (deploy-skew lane)
