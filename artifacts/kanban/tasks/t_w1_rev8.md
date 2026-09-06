# t_w1_rev8 — REVIEW 8 — G-M4 on the Hosting fallback after the answer cap (t_w1_m4b): strict-cold visitor sequence (≥10 min idle → warm ping → send) on BOTH routes, 2 strict + 5 spaced samples each, the trimmed answer's honesty (last finished sentence, disclosure variant visible), origin route unchanged (128 tokens, streaming); plus TC-BOT-14 at 1366x768 (composer inside the panel?) and the launcher-ground OCCLUDE-02 at 390 if t_w1_mv5 has landed; regression table

**Status:** todo · **Priority:** 100 · **Parents:** t_w1_m4b · **Created:** 2026-09-06T05:16:28.295Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Read the live build-commit at start; it must descend from 71f637d (m4b). Baselines: G-REV/97e19d07 (G-M4 FAIL: Hosting strict-cold 1805 ms; Fastly buffers the SSE) and the §14 decision on t_w1_r2c (fallback-only cap + disclosure; origin route untouched). Grade G-M4 per GAP-BACKLOG: Hosting POST /api/chat first token < 1.5 s on a cold probe — now with the cap; PASS only if every strict-cold Hosting sequence is < 1.5 s AND the origin route still streams at 128 tokens with first token < 1.5 s strict-cold; FAIL otherwise with numbers. Also judge honesty: is the capped answer a complete sentence (never a cut-off), is the 'short answer on the proxy route' clause visible only when the fallback answered, does the origin route show the normal line. Then the two carried items: panel at 1366x768 (mv4 reported composer_inside_panel=false at h 245 px — measure the composer/input box vs the panel box; a composer outside its panel is a FAIL), and OCCLUDE-02 at 390 (closed launcher ground luminance ≤ 0.0968) if mv5 landed.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the m4b evidence W1-M4B/ (to attack), MINIVIC-BRAIN-0-4.md §2(c) addendum 2, the r2c decision, the mv4/mv5 task comments.
- S-2 Timing FIRST (no browser): ensure ≥ 10 min of zero chat traffic from this host; sequence A (Hosting): GET ?warm=1 → sleep 1.5 s → POST via https://forgotten-mistory.web.app/api/chat?route=hosting with your own first-token reader; next idle window sequence B (origin https://minivicchat-hjdyjsrzvq-uc.a.run.app, no route flag); then five spaced sequences per route at ≥ 3 min gaps. Record first-token ms, total, provider, route, max_tokens, attempts[], the full answer text (is it a finished sentence?).
- S-3 Browser (one at a time): ask a question in the panel at 1440 and 390 with the network log — which route answered, which truth-line variant rendered, is the text complete; force the Hosting route (block *.a.run.app via route interception) and repeat — the 'short answer on the proxy route' clause must appear and the answer must end on a sentence; panel at 1366x768: open, measure panel box vs composer box; 390 first-fold click; OCCLUDE-02 measurement if mv5 is in the SHA.
- S-4 Regression table (G-H6, G-C1, G-A3 ten sectors, G-MV1, G-OG1, disclosure, ?gl=off, scene-7 band, hero fold SPD spot-check at 1440/390, 0 errors, LCP/CLS).
- S-5 Write G-REV/<sha>/08-adversarial-review.md + verdicts.json {sha, gaps:{'G-M4':…,'honesty_capped_answer':…,'TC-BOT-14_1366':…,'OCCLUDE-02_390':…}, regression:{...}, R3:'OPEN'}; return {task_id:'t_w1_rev8', live_sha, verdicts, failures_first, evidence, goal_complete:true}. Read-only; ≤ 40 min including idle windows.

## QUALITY GATES
- Two strict-cold sequences per route with the reviewer's own reader; verdict only on those numbers
- Capped-answer honesty judged from the rendered text and the truth-line variant
- 1366 composer geometry measured; OCCLUDE-02 measured if in scope; failures first; writes only under G-REV/<sha>/

## VERIFICATION
```bash
ls -t /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ | head -1
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
