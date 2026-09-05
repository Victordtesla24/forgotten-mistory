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

## COMMENT (2026-09-05T07:30:50.124Z)
R-c13 #5 B-3 (major, Verified, merge) — Deploy verification is blind to the path that broke: scripts/deploy.mjs:116-126 reads only the build-commit meta on the plain URL, so a total GPU-path outage shipped and sat unseen
DIRECTION: Extend the post-deploy verification in scripts/deploy.mjs beyond the meta tag: after the build-commit assertion, drive one headless load of /, one of /?gl=force, and one of / with UNMASKED_RENDERER_WEBGL spoofed to a hardware string, at 1440x900 and 390x844, asserting six section[id], #hero h1 === 'Vikram Deshpande', zero pageerrors, zero console errors and no /SYSTEM INTERRUPT/ in body.innerText. Fail the deploy script (not the deploy workflow's merge step) on any of those, and print the failing probe. Then stand up t_prodmon01 on the same probe on its ten-minute cadence so a regression is caught without a reviewer in the loop.
FILES: scripts/deploy.mjs:116-126, .github/workflows/deploy.yml, scripts/validate/overhaul_static_audit.mjs, tests/e2e/
ACCEPTANCE: node scripts/deploy.mjs exits non-zero against a build that renders the error boundary on any of the three paths, and zero against the current build; the probe writes its results to docs/delivery/evidence/<run>/deploy-verify.json with the build-commit it measured.

## COMMENT (2026-09-05T09:28:12.772Z)
Monitor upgraded 09:2xZ: adds a returning-visitor pass (persistent profile, second load pageMeta === live meta, deliveryType not cache-storage) alongside the fresh-context gl=force probe and functions:log scan.
