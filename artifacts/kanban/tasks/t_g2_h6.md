# t_g2_h6 — ADV-1451Z P1 — G-H6 the colour hero photograph vs the §0.3-2 black/white/gold palette: decide (desaturate treatment vs documented exception) with a decision memo and tests

**Status:** todo · **Priority:** 80 · **Parents:** — · **Created:** 2026-09-05T14:57:53.568Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). §0.3-2 says black, white and gold only; TC-HERO-18 (from the 09:10Z Owner correction) asserts the photograph is in COLOUR. Two binding sources conflict. §0.1: decide, log, continue — the Owner’s 09:10Z instruction is the later, more specific direction (the photo in colour), so the default decision is a DOCUMENTED EXCEPTION: the photograph is the one chromatic element (a person, not chrome), everything else stays B/W/gold; record it on the board and in docs/architecture/PALETTE-EXCEPTIONS.md with the test that pins it (TC-HERO-18 + the palette bundle scan excluding the photo box). Alternative (desaturate with a warm-neutral grade) documented with its reversal cost. No implementation beyond the memo unless the decision flips.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read CLAUDE.md prime directive 4, docs/prompt.md §0.3-2, tests/e2e/hero.spec.ts TC-HERO-18, the 09:10Z owner correction on t_flagvis0a/t_heroph001.
- S-2 Write PALETTE-EXCEPTIONS.md decision memo; push docs branch.

## QUALITY GATES
- Memo cites both sources, states the decision, the reversal cost, and the pinning tests

## VERIFICATION
```bash
test -f docs/architecture/PALETTE-EXCEPTIONS.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:32.765Z)
1556Z P0: you are analyst-programmer xhigh (not SA). Ship docs/architecture/PALETTE-EXCEPTIONS.md + a test pinning the one chromatic hero still (TC-HERO-18 colour). Do NOT desaturate. Worktree from origin/main. ledger before commit. Skip local Playwright. Push unique worktree-* branch.

## STATUS (2026-09-05T16:58:33.673Z)
running — dispatched

## COMMENT (2026-09-05T17:19:17.051Z)
PUSHED aaabee3 worktree-gh6-1556 PALETTE-EXCEPTIONS.md + pin test. NOT live PASS until on production + reviewer.

## COMMENT (2026-09-05T17:27:41.639Z)
Memo on origin/main (live 8d772fb9). Dispatch independent reviewer before complete.

## COMPLETE (2026-09-05T17:40:18.375Z)
Independent live reviewer PASS b65248c / G-REV on 2806edec: PALETTE-EXCEPTIONS.md present; colour photo kept; pin test present. Deploy 33980742004.

## COMMENT (2026-09-06T00:00:31.586Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:32.104Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
