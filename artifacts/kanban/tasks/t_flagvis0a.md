# t_flagvis0a — OWNER CORRECTION 09:10Z — flagship visibility A: hero atmosphere, About compass field, Experience strata become unmistakable cinematic light scenes (measurable luminance + motion gate), text contrast preserved

**Status:** running · **Priority:** 99 · **Parents:** — · **Created:** 2026-09-05T09:16:20.775Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Owner: I still cannot see flagship UI/UX for each section. Orchestrator confirmed on live captures (c76459d0, 1440, gl=force): hero faint, About field invisible, Experience strata invisible. The quiet/text-primary bar is revoked for these scenes. Gate: tests/overhaul/flagship-visibility.spec.ts — scene-only capture ≥ 15% pixels at L ≥ ground+0.06, max L ≥ 0.35, motion between captures, reduced-motion static fallback visible, TC-CONTRAST-01 green. Lane wf flagship-visibility-a (port 5602/5604).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 visibility spec (red numbers per section)
- S-2 hero → about → experience, commit + push per section
- S-3 verifier judges visibility by eye + numbers

## QUALITY GATES
- [ ] visibility spec green for the three sections
- [ ] TC-CONTRAST-01 green
- [ ] reduced motion static; no-GL still visible
- [ ] verifier PASS

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
