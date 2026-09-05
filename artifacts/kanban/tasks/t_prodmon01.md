# t_prodmon01 — Production runtime monitor — every 10 min probe the live site (1440/390, normal + ?gl=force + reduced-motion + GPU-spoof) for pageerrors, console errors, failed requests, error boundary; plus Cloud Functions logs; findings become P100/P90 tasks

**Status:** todo · **Priority:** 96 · **Parents:** — · **Created:** 2026-09-05T07:05:13.160Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). Owner directive 06:53Z: monitor the production console logs and fix every runtime error at runtime. Deliverable: scripts/monitor/prod_console_probe.mjs (playwright, channel chrome, --no-sandbox, SwiftShader flags for ?gl=force, a hardware-GPU spoof pass like R-c13/adv4-recheck.mjs) writing artifacts/monitor/<UTC>.json + a one-line summary, exit 1 on any error; scripts/monitor/functions_log_probe.sh (firebase functions:log --only minivicChat,elevenLabsTts -n 50, grep error/status ≥ 400); tests/monitor_probe.test.mjs proving the probe fails on a page that throws. The orchestrator schedules it every 10 min (cron) and files each new error as a task within one cycle.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 write the probe + the negative test (a local page that throws must produce exit 1)
- S-2 run it once against the live site; commit artifacts/monitor/first.json under docs/delivery/evidence/v10-20260905T0515Z/MONITOR/
- S-3 push; orchestrator wires the cron

## QUALITY GATES
- [ ] probe exits 1 on a throwing page, 0 on a clean page
- [ ] first live run committed with numbers
- [ ] no secret handling; functions:log read-only

## VERIFICATION
```bash
node scripts/monitor/prod_console_probe.mjs https://forgotten-mistory.web.app
node --test tests/monitor_probe.test.mjs
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
