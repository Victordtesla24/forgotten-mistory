# t_g_m1 — ADV-FAIL P0 — G-M1 MiniVic drop dead API ladder

**Status:** ready · **Priority:** 99 · **Lane:** G-M · **Port:** 5606 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. The independent reviewer found MiniVic's send path still carries a dead realtime ladder: `sendRealtimeMessage` POSTs `/api/realtime/session` then opens a WebSocket (components/MiniVicBot.tsx:1019-1060), falls back to `/api/chat-with-vic` (…:1172), polls `/api/chat-with-vic?taskId=` (…:541), and only then reaches the client brain which calls `/api/chat` (lib/miniVicBrain.ts:230). On the static export `NEXT_PUBLIC_STATIC_EXPORT === '1'` throws OFFLINE_MESSAGE first (…:1154), so this is dead code shipped to every visitor and a fragile path on any non-static host. Directive: the send path goes straight to `/api/chat` via `askMiniVicBrain`; delete the realtime/chat-with-vic/pollo code paths, their types, their WebSocket teardown set if unused, and the `provider`/`model` fields in any client payload (G-M3 prep). Paired with t_g_m2 in ONE worktree/branch.

## EXECUTION ORDER
- S-1 Read components/MiniVicBot.tsx fully (it is ~1300 lines) and lib/miniVicBrain.ts; read functions/index.js `/api/chat` handler to confirm the request shape the client must send; read tests/e2e/*minivic*/ *bot* specs and tests/content/minivic-knowledge.spec.ts to see what is asserted today.
- S-2 TDD: add tests/e2e/minivic-send-path.spec.ts — open the panel, send "What did Vikram do at the ATO?", capture every request URL; assert exactly ONE request whose path starts with `/api/` and it is `/api/chat`; assert no request to `/api/realtime*` or `/api/chat-with-vic*`; assert the reply renders and no console error / pageerror. On the static server `/api/chat` 404s → the brain's deterministic tier answers — that is acceptable for the spec's routing assertion; also add a `tests/minivic_send_path.test.mjs` node:test that greps the built `out/_next/static/chunks/*.js` for the strings `api/realtime` and `chat-with-vic` and expects zero hits (it must be RED today — verify: the current out/ build shows 0 because NEXT_PUBLIC_STATIC_EXPORT tree-shook nothing; if it is already 0, assert instead on the SOURCE: `grep -c 'api/realtime\|chat-with-vic' components/MiniVicBot.tsx` must be 0). Capture RED.
- S-3 Implement: remove sendRealtimeMessage, the chat-with-vic fetch + polling, related state/refs/types/helpers that become unused (tsc + lint must confirm nothing dangling); `handleSend` → `askMiniVicBrain(...)` directly, keep latency measurement, audio via /api/tts path (`speakReply`) unchanged, error UX unchanged. Do not touch the greeting/avatar code (t_g_m2 owns that).
- S-4 Rebuild; serve :5606; run new spec + tests/content/minivic-knowledge.spec.ts + tests/monochrome/minivic-launcher.spec.ts + tests/overhaul/voiceover.spec.ts + tests/overhaul/avatar.spec.ts → GREEN. tsc, lint, static audit 10/10. Record bundle-size delta of the MiniVic chunk (before/after bytes) in 05-regression.log.
- S-5 Ledger, commit `refactor(minivic): send path goes straight to /api/chat — dead realtime ladder removed (G-M1)`, push branch.

## QUALITY GATES
- [ ] Spec red→green; zero references to api/realtime or chat-with-vic in components/ and lib/
- [ ] One /api request per send and it is /api/chat; no console errors
- [ ] tsc clean (no unused symbols), lint clean, audit 10/10, listed specs green
- [ ] Ledger rows; branch pushed

## VERIFICATION
```bash
grep -rn -E 'api/realtime|chat-with-vic|polloTaskId' components lib app | wc -l   # → 0
npm run build:static && (python3 -m http.server 5606 --directory out --bind 127.0.0.1 &)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5606 npx playwright test tests/e2e/minivic-send-path.spec.ts tests/content/minivic-knowledge.spec.ts tests/monochrome/minivic-launcher.spec.ts tests/overhaul/voiceover.spec.ts tests/overhaul/avatar.spec.ts
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-M/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.873Z)
running — dispatched 12:1xZ (queued behind the first two lanes; host cap) — Workflow wf_b908a7a9-f5d lane:minivic-ladder+greeting, port 5606

## COMMENT (2026-09-05T12:23:00.045Z)
REVIEWER BASELINE (G-M1/G-M2/G-M3 FAIL, measured): /api/chat-with-vic poller IS in the served bundle (setInterval … fetch('/api/chat-with-vic?taskId=')); /api/realtime 0 in the 14 eager chunks (lazy chunks not enumerated); greeting MP3 sha 369e1eb2… byte-identical to the stale asset while the intro text changed in 45eb252/3720832; text/event-stream 0. NOTE: the launcher (button.minivic-launcher) clicked in headless Chrome but no input became visible and zero /api/* requests fired — your e2e must open the panel the way tests/monochrome/minivic-launcher.spec.ts does (scroll past the hero first if the launcher gates on pastHero) and prove the send path on the wire.

## COMMENT (2026-09-05T12:33:58.654Z)
PROTOCOL EVENT 12:33Z: the wave-1 Workflow (wf_b908a7a9-f5d) recorded 'failed' for this lane at spawn — no agent id, no worktree (-3 never created), so no code was touched; §10 requeue applied: re-dispatched as its own Workflow wf_0a064191-152 (lane:minivic-ladder+greeting, fresh isolated worktree, port 5606, opus xhigh, 30-min cap). Reviewer baseline facts + the headless-panel caveat were included in the prompt.

## COMMENT (2026-09-05T12:49:33.759Z)
PUSHED 91f46e9 on worktree-wf_0a064191-152-1 (12:48Z): handleSend → askMiniVicBrain directly; sendRealtimeMessage, chat-with-vic POST, poller, liveSocketsRef, wsBaseUrl, playGeneratedVideo and 2 unreachable UI branches removed (net −319 lines; 0 references left in components/lib/app). MV-WIRE-01/02 e2e prove on the wire: one send → exactly ['/api/chat'], no poller in a 7 s window, panel opened like minivic-launcher.spec; node:test scans source + all 33 emitted chunks. 57/57 Playwright, node:test 5/5, tsc, lint, audit 10/10. Orchestrator reviewed. Awaiting consolidation + reviewer phase 2.

## COMMENT (2026-09-05T12:51:04.218Z)
LIVE 874f1ee9 at 12:50:05Z (Deploy 33967099706 success) — fourth ship of the run; served greeting sha now dd65f259… (verified by curl). Reviewer phase-2 dispatched on 874f1ee9 (G-M1/G-M2 verdicts + G-M3 TTFB and /api/tts baseline).
