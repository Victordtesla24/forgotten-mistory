# t_w1_r2sa — WAVE-1 P0 — G-R2 + G-M4 + G-R3 architecture: §0.4 brain ladder on the live minivicChat function (OpenRouter first; an Anthropic-OAuth rung only where a lawful server-side path exists, measured), honest MiniVic labels, and the smallest change that makes Hosting POST /api/chat first token < 1.5 s on a cold probe

**Status:** ready · **Priority:** 97 · **Parents:** — · **Created:** 2026-09-06T00:07:52.779Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-REVIEW-20260905T2315Z §MiniVic: live JSON answers with provider openai / gpt-4.1-mini on every run because functions/index.js DEFAULT_PROVIDER_ORDER = 'openai,openrouter,deepseek,zai' (OpenAI first); no Anthropic-OAuth rung; Hosting cold TTFB 2.17 s (median 1.45 s) although minivicChat already runs minInstances: 1 (functions/index.js:653); the panel badge says 'MiniVic Live' (components/MiniVicBot.tsx:1112) over a muted looping MP4 + stock TTS. docs/prompt.md §0.4 / C-3: OpenRouter first; on 402 route LLM reasoning to Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session), never ANTHROPIC_API_KEY. The prior SA finding (board t_g2_r2, unstarted) says a Cloud Function cannot lawfully hold a user OAuth session. Decide with measurements, not opinions, then hand exact edits + TDD cases to t_w1_r2ap. Read-only; ≤ 20 min.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: docs/prompt.md §0.4, §2.1 brain, R3, §14 C-3/C-7, §14 decision policy in /root/.sub-agents/orchestrator/orchestration-skill.md §14 (narrow the promise to what is true); docs/adversarial/ADV-REVIEW-20260905T2315Z.md §MiniVic; docs/adversarial/GAP-BACKLOG.md rows G-R2, G-M4, G-R3; functions/index.js in full (ladder, cooldown map, streaming, minInstances, CHAT_PROVIDER_ORDER env); tests/minivic_chat_function.test.mjs; components/MiniVicBot.tsx lines 240-300 and 1040-1180 (badge + synthetic label); firebase.json rewrites + CSP connect-src.
- S-2 Measure from this VPS, read-only, and write every number down: (1) OpenRouter credit state by key NAME only — `curl -s https://openrouter.ai/api/v1/auth/key -H "Authorization: Bearer $(grep -E '^OPENROUTER_API_KEY=' /root/.claude/.env.production | cut -d= -f2-)" | jq '{usage,limit,limit_remaining,is_free_tier}'` (prints account numbers, never the key); (2) live Hosting POST https://forgotten-mistory.web.app/api/chat with a valid {messages:[{role:'user',content:'In one sentence, what did Vikram do at the ATO?'}]} body: 5 samples of `%{time_starttransfer}` AND first-token time (read the SSE/stream with a tiny node script that timestamps the first non-empty content delta) plus the provider field/header each response carries; (3) the same 3 samples direct to the Cloud Run origin named in firebase.json's CSP (https://minivicchat-hjdyjsrzvq-uc.a.run.app) to separate the Hosting hop from the function; (4) a claude-cli relay probe — `time claude -p 'Reply with the single word ready.' --model sonnet --output-format json --max-turns 1` twice (cold then warm) — to measure whether a VPS-resident claude-cli process (Claude Code itself, billed to the owner's Max plan via OAuth — the only lawful OAuth path) could ever meet first-token < 1.5 s; if the harness refuses to run it, record that verbatim.
- S-3 Decide (§0.1 — you decide, log, continue): (a) ladder order: openrouter first, then deepseek, zai, openai LAST as the labelled fallback — and whether an 'anthropic-oauth-relay' rung is lawful and fast enough (only if S-2(4) warm first token < 1.2 s and you can name a concurrency/quota guard; otherwise state plainly that no lawful server-side Anthropic OAuth path exists today and what would unblock it: OpenRouter top-up amount from S-2(1)); (b) honest labels: replace the 'MiniVic Live' badge text and give the panel one truthful line naming voice=synthetic (ElevenLabs stock), face=pre-rendered loop, answers=live text via the provider actually used (read from the response's provider field at runtime, never hard-coded) — exact strings; (c) G-M4: from S-2(2)/(3) name where the 2.17 s cold goes (Hosting hop vs function boot vs upstream TLS vs provider first token) and the SMALLEST change that brings cold first-token < 1.5 s honestly (candidates: flush headers immediately and stream the SSE preamble, persistent undici Agent with long keepAliveTimeout, warm-up completion on instance boot, a VPS systemd timer scripts/ops/fm-chat-warm.{sh,service,timer} every 4 min posting one minimal real completion so the upstream session stays hot, CHAT_MAX_TOKENS) — reject anything that games first-byte without moving first-token; (d) G-R3: the full Higgsfield real-time avatar stays OPEN — say so in one sentence with the credit fact.
- S-4 Write docs/architecture/MINIVIC-BRAIN-0-4.md (new, this is the deliverable): measurements table, decision (a)-(d) with rationale and reversal cost, exact file:line edits for functions/index.js + components/MiniVicBot.tsx (+ scripts/ops if a timer), the functions deploy command (`firebase deploy --only functions:minivicChat --project forgotten-mistory --non-interactive` from a worktree with functions/node_modules installed), and the TDD cases first: node tests in tests/minivic_chat_function.test.mjs (DEFAULT_PROVIDER_ORDER starts with 'openrouter' and ends with 'openai'; the response carries provider; ping/invalid → fast 400), e2e in tests/e2e/chatbot.spec.ts (badge text; the truthful line present; no 'Live' claim), and the live measurement protocol the reviewer will repeat (7 cold samples after ≥ 10 min idle, first-token < 1.5 s each).
- S-5 Return structured output: {task_id:'t_w1_r2sa', measurements:{openrouter:{limit_remaining, usage}, hosting_ttfb_s:[], hosting_first_token_s:[], origin_first_token_s:[], provider_seen:[], claude_p_cold_s, claude_p_warm_s}, decision:{order:'…', oauth_rung:'none'|'relay', oauth_reason, badge_text, truth_line, m4_change:[...], r3:'OPEN'}, edits:[{file,line_hint,change}], tests:[{file,name,assertion}], doc:'docs/architecture/MINIVIC-BRAIN-0-4.md', goal_complete:true}.

## QUALITY GATES
- Every number in the doc comes from a command run in this task (S-2); nothing estimated without the word estimate
- OpenRouter is first in the decided order and OpenAI is last and labelled; the Anthropic-OAuth question is answered with evidence, never with an ANTHROPIC_API_KEY
- Badge/label strings are truthful about voice, face and answers; provider is read at runtime
- G-M4 change targets first TOKEN, not first byte
- TDD cases named with file + assertion before any code; no app code edited by this task; no secret values printed
- ≤ 20 min

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/MINIVIC-BRAIN-0-4.md && grep -c 'openrouter' /root/forgotten-mistory/docs/architecture/MINIVIC-BRAIN-0-4.md
git -C /root/forgotten-mistory status --short -- functions components | wc -l  # 0 from this task
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T00:10:56.882Z)
running — dispatched 00:06Z via claude-cli Workflow (fresh identity)

## COMMENT (2026-09-06T01:02:26.229Z)
PM note 01:03Z: the SA committed docs/architecture/MINIVIC-BRAIN-0-4.md as a1504fb directly on the main checkout and pushed to origin main (docs-only push → push-triggered Deploy). Accepted (single doc, no code), but protocol for future lanes: commit in a worktree branch and let deploy.yml consolidate (O3/O4), never push main from a worker.

## COMPLETE (2026-09-06T01:06:41.641Z)
SA delivered docs/architecture/MINIVIC-BRAIN-0-4.md (362 lines, on origin/main a1504fb; PM verified). Decision: DEFAULT_PROVIDER_ORDER openrouter,deepseek,zai,openai (OpenAI last, labelled); oauth_rung none (claude -p warm first token 3.130 s vs 1.2 s bar; no lawful server-side OAuth session; no quota guard — each CLI turn ≈ USD 0.22); badge 'MiniVic · synthetic'; truth line 'Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: live text via {provider}' with provider read at runtime (lib/miniVicBrain.ts hard-codes source:'openrouter' while all 11 live samples were openai — defect named). G-M4 root cause: Fastly buffering at the Hosting rewrite (origin first token 0.69–0.82 s; Hosting delivers headers/first token/total within 15–47 ms of each other) + 1.67 s serial dead-rung tax; change c-1 primes cooldowns on a ?warm=1 ping. FACT for the cycle report: OpenRouter balance −5.384 USD; every paid rung 402; DeepSeek/Z.ai also out of balance; §0.4 happy path returns only with a top-up (min 5.39, recommended 25 USD).
