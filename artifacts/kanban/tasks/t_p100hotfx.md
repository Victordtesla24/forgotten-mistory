# t_p100hotfx — P100 INCIDENT — WebGL scenes crash into app/error.tsx on every GPU browser since 18c6beb (next 15.5.25 vendors React 19; @react-three/fiber 8 reads removed internals): pin next 14.2.35 now

**Status:** running · **Priority:** 100 · **Parents:** — · **Created:** 2026-09-05T07:05:13.071Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Proof: C16-about-field/09-verification.md (baseline main build at ?gl=force → TypeError ReactCurrentBatchConfig, app/error.tsx shell) and R-c13 adversarial recheck on LIVE 15fb165b with a hardware-GPU spoof, no query string: h1 "Something went wrong", sections 0, errorBoundary true, 4 console errors. Live since 5ec231d3 (06:18Z). Owner reported at 06:57Z that no visible improvement is seen — GPU visitors see the error shell. Hotfix lane wf_7910f160-45a (analyst-programmer opus xhigh → reviewer max): pin next+eslint-config-next 14.2.35, keep checks.yml/.gitignore/root:true, prove ?gl=force canvases + 0 pageerrors at 1440/390, push; orchestrator merges to main immediately. Durable fix: t_r19r3f9.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 reproduce at ?gl=force on main (01-repro-before.json)
- S-2 pin next 14.2.35 + lockfile; single react 18 tree
- S-3 rebuild; probe → 0 pageerrors, ≥1 canvas hero, ≥2 after experience; render/cinematic/hero specs; tsc/lint/audit/build
- S-4 commit + push; orchestrator merges HEAD:main → deploy; live probe on the deployed build

## QUALITY GATES
- [ ] live https://forgotten-mistory.web.app/?gl=force: 0 pageerrors, canvases ≥ 1, #hero h1 present (orchestrator probe)
- [ ] hardware-GPU spoof, no query string: no error boundary
- [ ] tsc/lint/audit/build green
- [ ] known npm audit high on next 14 re-accepted and recorded until t_r19r3f9 lands

## VERIFICATION
```bash
NODE_PATH=/root/forgotten-mistory/node_modules node /root/.claude/jobs/2ca96782/tmp/live_probe.mjs
curl -s https://forgotten-mistory.web.app/ | grep -o "build-commit\" content=\"[^\"]*\""
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T07:11:25.764Z)
07:1xZ: hotfix branch f91843f (feb12ef pin next 14.2.35; evidence 02-repro-after.json: canvases 1 at hero, h1 'Vikram Deshpande', six sections) merged --no-ff as 5c0e01d and pushed to main as a11dfe7; Deploy triggered on push. Live verification pending (background probe).

## COMPLETE (2026-09-05T07:14:16.869Z)
LIVE VERIFIED 07:13Z on build f103462f (contains a11dfe7): ?gl=force SwiftShader probe → 1440: canvases 1 at hero, 2 after #experience, h1 'Vikram Deshpande', 6 sections, 0 pageerrors, 0 console errors, 0 failed requests; 390: canvases 1, h1 present, 0 errors. Outage window for GPU visitors: 06:18Z (5ec231d3) → 07:12Z. Durable fix t_r19r3f9 in flight; npm audit high on next 14 re-accepted until then (recorded).
