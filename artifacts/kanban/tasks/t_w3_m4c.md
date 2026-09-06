# t_w3_m4c — G-M4 cold first token (analyst-programmer, xhigh) — live measurement FAIL: cold first token 1900 ms (origin) / 1793 ms (hosting) vs the 1500 ms bar, warm 818 / 1320 ms; the paid rungs are all cooling_down (0 ms) and OpenAI answers in 865–1278 ms, so the cold cost is the Cloud Run cold start + network. Free fixes only: (1) verify the VPS warm-prime timer actually fires against BOTH the origin URL and /api/chat?warm=1 every ≤ 3 min (systemd timer state, journal, last 204s) and repair/tighten it; (2) skip dead rungs without a network round-trip when their cooldown is active (already 0 ms — confirm) and put openai first while the others are 402; (3) trim the system prompt / first-chunk work so the first token leaves the function ≤ 700 ms after request start when warm; (4) if a cold start still exceeds the bar, write the min-instances=1 option into docs/delivery/OWNER-BLOCKED.md as a COST decision for the Owner (never enable it yourself); re-measure with the reviewer's probe (G-REV/83590944/M4/probe-first-token.mjs) 4× cold spaced ≥ 10 min apart

**Status:** ready · **Priority:** 90 · **Parents:** t_w3_m4r · **Created:** 2026-09-06T06:49:19.937Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). No browser, no site build: functions/index.js, lib/miniVicRoute.mjs, the warm timer unit on this VPS, and the reviewer's probe. Cost gate: never set Cloud Run min instances, never add a paid provider call; ElevenLabs/D-ID untouched. Read key NAMES only from /root/.claude/.env.production with grep -E '^[A-Z][A-Z0-9_]*=' — never print values. Deploy the function with the existing filter (functions:tts:minivicChat) from a fresh worktree .claude/worktrees/w3-m4c on branch worktree-w3-m4c; ledger row before commit; push the branch (never main). Timer detail: read the unit files under /etc/systemd/system/ that mention warm or minivic and report their state with systemctl list-timers --all and journalctl -u <unit> -n 20; edits to units are recorded in the commit body and in docs/architecture/MINIVIC-BRAIN-0-4.md.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- W-1 Read G-REV/83590944/M4/08-M4.md + timings.json + probe-first-token.mjs; docs/architecture/MINIVIC-BRAIN-0-4.md; functions/index.js (resolveChatRoute, provider ladder, cooldowns, isWarmRequest); lib/miniVicRoute.mjs; the warm timer units.
- W-2 Measure the timer: is it firing, at what interval, against which URLs, what status; measure a cold start yourself with the probe after ≥ 10 min idle (spend the wait reading/implementing).
- W-3 Implement the free fixes (timer interval ≤ 3 min hitting both URLs; provider order openai-first while paid rungs are 402 — keep the ladder data-driven; trim first-chunk work; keep attempts[]/route/max_tokens on the done event and the capped-route disclosure).
- W-4 Deploy functions (filter functions:tts:minivicChat), then run the probe 4× cold spaced ≥ 10 min (warm_primed:false) and 2× warm; save to docs/delivery/evidence/v10-20260905T0515Z/W3-M4C/. If any cold sample is still > 1500 ms, write the min-instances cost option to docs/delivery/OWNER-BLOCKED.md (what it costs per month, what it buys) and return goal_complete:false with the numbers.
- W-5 Ledger row; commit; push worktree-w3-m4c. ≤ 30 min of work (waiting on cold gaps excluded — use the gaps for the other steps). Return {task_id:'t_w3_m4c', timer:{unit,interval_s,urls,firing}, cold_ms:[…], warm_ms:[…], provider_order, functions_deployed, owner_blocked_written, gates:{…}, evidence:[…], goal_complete}.

## QUALITY GATES
- Timer verified firing ≤ 3 min against both URLs
- 4 cold + 2 warm samples with raw transcripts; verdict stated against 1500 ms
- No paid setting enabled; no secrets printed; ledger row; branch pushed

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-M4C/ | wc -l
systemctl list-timers --all 2>/dev/null | grep -i -E 'warm|minivic' | head -3
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:50:45.512Z)
running — dispatched 06:51Z fm-wave3-m4c (AP opus/xhigh, no browser)
