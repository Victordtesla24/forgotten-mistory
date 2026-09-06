# t_w3_m4d — G-M4 last free lever (analyst-programmer, xhigh, no browser) — the cold first token is now the funded OpenAI rung's own TTFT (1231–2219 ms with gpt-4.1-mini). Measure gpt-4.1-nano (and, if the account lists it, the cheapest streaming model with lower TTFT) on the SAME funded key: 6 cold samples per model spaced ≥ 5 min on the origin route with the reviewer's probe; if a model clears < 1500 ms on ≥ 5/6 cold samples AND the MiniVic answer-honesty tests (tests/minivic_chat_function.test.mjs, tests/e2e/minivic-send-path contract fixtures — grounding to the CV/LinkedIn/repos, no fabricated facts, disclosure on the capped route) stay green on its answers, switch the openai rung's model (env/config, documented in MINIVIC-BRAIN-0-4.md §6) and deploy; otherwise leave OB-1 standing and report the numbers

**Status:** ready · **Priority:** 85 · **Parents:** t_w3_m4c · **Created:** 2026-09-06T07:33:48.012Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Cost gate: same funded OpenAI account, no new provider, no paid setting, no min-instances change; a model swap within the funded rung is a quality/latency trade you decide under docs/prompt.md §0.1 with the honesty tests as the gate — never trade R7 for latency. Read key NAMES only from /root/.claude/.env.production with grep -E '^[A-Z][A-Z0-9_]*=' — never print values. Fresh worktree .claude/worktrees/w3-m4d on branch worktree-w3-m4d from origin/main (carries 59c986b/547b6cc); no site build; functions deploy with the existing filter; evidence → docs/delivery/evidence/v10-20260905T0515Z/W3-M4D/. Ledger row; push the branch, never main. ≤ 30 min of active work (idle cold gaps excluded).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- E-1 Read W3-M4C/04-M4C.md + 02-summary.json, OWNER-BLOCKED.md OB-1, functions/index.js (openai rung: model name, streaming, system prompt size), docs/architecture/MINIVIC-BRAIN-0-4.md, and the honesty tests.
- E-2 Add a per-request model override for measurement only (a header or query param honoured ONLY when a MINIVIC_MODEL_PROBE env is set, or measure via a local copy of the rung's fetch call against the OpenAI streaming API directly from the VPS with the same prompt — state which); sample 6 cold (≥ 5 min apart) per candidate model on the origin route with G-REV/83590944/M4/probe-first-token.mjs; record TTFT, total, answer.
- E-3 Run the honesty checks on each candidate's answers to the fixture questions (the function contract tests with the model swapped in test config; the send-path fixtures compared for fabricated facts).
- E-4 Decide: switch only if ≥ 5/6 cold < 1500 ms AND honesty green; deploy; re-sample 4 cold on the deployed function; update MINIVIC-BRAIN-0-4.md §6 and OB-1 (close or keep with the new numbers). Return {task_id:'t_w3_m4d', candidates:[{model, cold_ms:[…], honesty:'green|red'}], switched:boolean, deployed, post_deploy_cold_ms:[…], gates:{…}, evidence:[…], goal_complete}.

## QUALITY GATES
- ≥ 6 cold samples per candidate with raw transcripts; honesty tests run on candidate answers
- Switch only under both conditions; OB-1 updated either way; no secrets; ledger row; branch pushed

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-M4D/ | wc -l
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T07:33:49.220Z)
running — dispatched 07:34Z fm-wave3-m4d (AP opus/xhigh, no browser)
