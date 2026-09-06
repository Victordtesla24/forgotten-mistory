# t_g2_r2 — ADV-1451Z P1 — G-R2 §0.4 brain alignment on the live function: OpenRouter is 402 so the answering rung is OpenAI — stop presenting OpenAI as the intended success path; add an Anthropic-via-OAuth rung only if a lawful server-side path exists (it does not — OAuth is a user session, not a server credential) and say so honestly

**Status:** todo · **Priority:** 70 · **Parents:** — · **Created:** 2026-09-05T14:57:53.906Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). §0.4 governs LLM routing: OpenRouter primary; on 402, Anthropic via OAuth — which is the CLI/council path, not a Firebase Function credential (no ANTHROPIC_API_KEY may be used). The live function answers on the OpenAI rung (functions/index.js ladder). Decide and document: the ladder order + what each rung is for, the honest label in the UI/board (never “OpenAI as success” in cycle reports), and what would restore the OpenRouter primary (credits — Owner-held, not asked). Docs-only decision memo + a one-line UI/label check if any copy names a provider.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read functions/index.js ladder + CHAT_PROVIDER_ORDER, §0.4, C-3.
- S-2 Memo docs/architecture/BRAIN-ROUTING.md; grep the UI for provider names; push.

## QUALITY GATES
- Memo is honest about the credential model; no code change that adds an API key

## VERIFICATION
```bash
test -f docs/architecture/BRAIN-ROUTING.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T01:06:41.814Z)
Superseded 01:12Z by t_w1_r2sa (measured decision in docs/architecture/MINIVIC-BRAIN-0-4.md); archived.

## STATUS (2026-09-06T01:06:41.908Z)
archived — superseded by t_w1_r2sa
