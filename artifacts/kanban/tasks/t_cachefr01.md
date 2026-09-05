# t_cachefr01 — P100 — every deploy visible on the next load: HTML Cache-Control revalidate (was Firebase default max-age=3600), service worker navigation network-first with build-stamped cache version, controllerchange reload

**Status:** running · **Priority:** 100 · **Parents:** — · **Created:** 2026-09-05T09:14:38.798Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Owner reported no visible change twice (06:57Z, 09:08Z). Measured 09:09Z: curl -sI / → cache-control: max-age=3600 (firebase.json sets Cache-Control only for /_next/static, /assets, /docs, /sw.js); public/sw.js precaches / cache-first with a static CACHE_VERSION v1 → returning visitors keep the old shell for up to an hour or until the worker updates. Lane wf_b12ab287-6ab.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 contract test on firebase.json headers
- S-2 firebase.json HTML rules + sw.js network-first + build-stamped cache name + controllerchange reload
- S-3 node tests, battery, push; verifier polls live headers

## QUALITY GATES
- [ ] live curl -sI / shows max-age=0 must-revalidate (or no-cache)
- [ ] out/sw.js carries the build sha
- [ ] second load controlled by the worker shows the current build

## VERIFICATION
```bash
curl -sI https://forgotten-mistory.web.app/ | grep -i cache-control
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
