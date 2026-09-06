# t_w3_m4r — G-M4 strict-cold measurement (reviewer, max, independent, no Chrome) on the live URL — two fresh contexts per route: first-token time on the origin route (direct function URL, warm-prime then cold) and on the Hosting fallback (/api/chat rewrite, buffered), the disclosure text when the answer is capped (CHAT_MAX_TOKENS_FALLBACK=48, 'short answer on the proxy route'), attempts[] / route / max_tokens on the done event; threshold first token < 1.5 s on both routes; verdict PASS/FAIL with numbers

**Status:** ready · **Priority:** 95 · **Parents:** t_w3_rev8 · **Created:** 2026-09-06T06:26:36.159Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Rev8 ran out of cap before measuring G-M4 (F-6). This lane needs no browser: use node fetch / curl with --no-buffer against https://forgotten-mistory.web.app/api/chat (Hosting route) and the origin route named in lib/miniVicRoute.mjs (read it; never print a key; the endpoints are public). Read docs/architecture/MINIVIC-BRAIN-0-4.md and docs/delivery/evidence/v10-20260905T0515Z/W1-M4B/ for the contract and the implementer's claims to falsify. Evidence → docs/delivery/evidence/v10-20260905T0515Z/G-REV/<live-sha>/M4/ (timings.json, transcripts). ≤ 20 min. Edit nothing else.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- M-1 Record the live build-commit; read lib/miniVicRoute.mjs, functions/index.js (resolveChatRoute, chatMaxTokensForRoute, isWarmRequest) and the M4B evidence.
- M-2 Origin route: GET ?warm=1 (expect 204), then POST a fresh question and time the first SSE byte and the first token; repeat in a second fresh context without warm-prime (cold). Hosting route: same two runs; record whether the response is buffered (first byte = completion), the max_tokens on the done event, the disclosure text in the answer or the done payload, attempts[] and route.
- M-3 Write M4/timings.json {origin:[{warm,first_byte_s,first_token_s,route,max_tokens,attempts}], hosting:[…], disclosure_text, verdict} and a short 08-M4.md; verdict PASS only if first token < 1.5 s on both routes in the cold run; otherwise FAIL with the numbers. Return {task_id:'t_w3_m4r', sha, origin:{…}, hosting:{…}, disclosure_present, verdict, evidence_dir, goal_complete:true}.

## QUALITY GATES
- Four timed runs (2 routes × warm/cold) with raw transcripts saved
- No secrets printed; nothing edited outside the evidence dir

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/*/M4/ 2>/dev/null | head
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:27:13.323Z)
running — dispatched 06:27Z fm-wave3-rev9-m4 (reviewer opus/max, node-only)

## COMPLETE (2026-09-06T06:49:19.033Z)
G-M4 FAIL on live 83590944 (G-REV/83590944/M4/08-M4.md, timings.json): cold first token origin 1900 ms / 1172 ms, hosting 1793 ms / 1108 ms (bar 1500 on every cold send); warm-primed origin 818 ms, hosting 1320 ms. Ladder: openrouter/deepseek/zai all cooling_down (0 ms), openai answers in 865-1278 ms; the remaining cold cost is the Cloud Run cold start plus ~0.7 s network. Disclosure present on the capped hosting route (max_tokens 48). -> t_w3_m4c.
