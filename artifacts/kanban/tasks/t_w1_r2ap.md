# t_w1_r2ap — WAVE-1 P0 — G-R2 + G-M4 implementation: ladder order per §0.4, truthful MiniVic badge/line, cold first-token < 1.5 s change, functions deployed, tests first, measured on live

**Status:** todo · **Priority:** 97 · **Parents:** t_w1_r2sa · **Created:** 2026-09-06T00:07:52.834Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Implements docs/architecture/MINIVIC-BRAIN-0-4.md (t_w1_r2sa). Touches functions/index.js (order, G-M4 change), components/MiniVicBot.tsx (badge + truthful line), optionally scripts/ops/fm-chat-warm.* (+ systemd install on this VPS), tests. Deploys the function from the worktree and pushes the branch for the site change. Then measures live cold first-token.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-r2 /root/forgotten-mistory/.claude/worktrees/w1-r2 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules; `cd functions && npm ci` (small). If `df --output=avail -BG / | tail -1` < 6 GB, poll every 30 s up to 8 min first.
- S-1 Read docs/architecture/MINIVIC-BRAIN-0-4.md (the decision — strings and edits verbatim), functions/index.js, components/MiniVicBot.tsx, tests/minivic_chat_function.test.mjs, tests/e2e/chatbot.spec.ts, scripts/ops/fm-deploy-cadence.{sh} + `systemctl cat fm-deploy-cadence.service fm-deploy-cadence.timer` (the unit pattern to copy if a warm timer was decided).
- S-2 TESTS FIRST: write the node + e2e cases the SA named; run on origin/main code; capture FAILING output → docs/delivery/evidence/v10-20260905T0515Z/W1-R2/02-tests-failing.log.
- S-3 Implement exactly the SA edits (smallest change, §6.1). If a warm timer was decided: add scripts/ops/fm-chat-warm.sh + fm-chat-warm.service + fm-chat-warm.timer under scripts/ops/, install with `install -m 644 … /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now fm-chat-warm.timer`, and log to /var/log/fm-deploy/chat-warm.log. Never add ANTHROPIC_API_KEY anywhere. Never print secret values.
- S-4 Deploy the function: `firebase deploy --only functions:minivicChat --project forgotten-mistory --non-interactive` (firebase CLI is /usr/bin/firebase; auth lives in /root/.config/configstore/firebase-tools.json). Capture the deploy log → W1-R2/06-deploy-functions.log. Confirm `curl -s -X POST https://forgotten-mistory.web.app/api/chat …` now reports the new order behaviour (provider field) — record 3 samples.
- S-5 Verify site side: `npx tsc --noEmit` · `npm run lint` · `npm run build:static` · `node scripts/validate/overhaul_static_audit.mjs` (10/10) · `node --test tests/minivic_chat_function.test.mjs tests/minivic_chat_route.test.mjs tests/minivic_send_path.test.mjs` · `python3 -m http.server 5603 --directory out &` then `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/e2e/chatbot.spec.ts tests/e2e/minivic-send-path.spec.ts` (kill after). Logs → W1-R2/04-tests-passing.log, 05-regression.log. Screenshot the open MiniVic panel at 1440 + 390 → W1-R2/.
- S-6 Ledger before commit (`git add -A` then `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_r2ap --role analyst-programmer --model claude-opus --prompt artifacts/kanban/tasks/t_w1_r2ap.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-r2 -- <files>`). Commit `fix(minivic): §0.4 ladder order, truthful badge, cold first-token (G-R2, G-M4)` with trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC`; `git push -u origin worktree-w1-r2` (once; report push_denied if refused).
- S-7 Live measurement (function is already deployed): wait until ≥ 10 min since the last chat request (the warm timer, if any, is the only traffic), then 7 samples of Hosting POST /api/chat first-token time with the SA's node script; record each and the provider seen → W1-R2/07-live-first-token.json. Do not stop the warm timer to make numbers look better or worse.
- S-8 Return {task_id, worktree, branch, sha, pushed, push_denied, files_changed, functions_deployed:bool, provider_order:'…', live_first_token_s:[7], provider_seen:[], warm_timer_installed:bool, gates:{tests_failed_first, tsc, lint, build, audit_10_10, node_tests, e2e_targeted, first_token_lt_1_5_all7}, evidence:[], goal_complete}.

## QUALITY GATES
- Tests captured failing first
- DEFAULT_PROVIDER_ORDER starts with openrouter and ends with openai; no ANTHROPIC_API_KEY
- Badge/line strings exactly as decided; provider read at runtime
- Function deployed and 3 live samples recorded; 7 cold-protocol first-token samples all < 1.5 s (or the shortfall reported, not hidden)
- tsc · lint · build · audit 10/10 · node + e2e targeted green
- Ledger before commit; pushed or push_denied; ≤ 30 min per slice (split S-7 into a follow-up return if the idle wait would breach it)

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w1-r2 && node --test tests/minivic_chat_function.test.mjs
grep -n 'DEFAULT_PROVIDER_ORDER =' /root/forgotten-mistory/.claude/worktrees/w1-r2/functions/index.js
systemctl is-active fm-chat-warm.timer 2>/dev/null || true
git ls-remote --heads origin worktree-w1-r2
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
