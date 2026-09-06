# t_g2_e2 — ADV-1451Z P1 — G-E2 Experience: gold on truly sourced employer/program strings (the section teaches the evidence language today with zero gold) + strata uplift from wallpaper toward signature (parallax depth planes per the council direction)

**Status:** todo · **Priority:** 78 · **Parents:** — · **Created:** 2026-09-05T14:57:53.657Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). 1451Z review §Experience: zero gold in the section; strata is wallpaper. Acceptance: role rows whose employer/program is a checkable record (the same allow-list as tests/about_sourced_semantics.test.mjs) carry the gold mark on the source string only (never dates/durations — self-reported), with a data flag like About’s `sourced`; gold-semantics budget for #experience defined and tested; strata: two or three depth planes moving at different rates on scroll (council direction) within the perf budget (harness not worse than baseline af7355a), floors + AA hold. ≤ 30 min; checkpoint at 25.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read Experience.*, experience.ts, strata.glsl.ts, gold-semantics.spec, about_sourced_semantics.test.mjs.
- S-2 TDD (gold count + semantics; parallax planes measured by two-frame offset at two scroll positions); RED.
- S-3 Implement; PUSH RULE; evidence follow-up.

## QUALITY GATES
- Gold only on checkable records; budget test; strata parallax measurable; floors/AA/harness hold
- ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5633 npx playwright test tests/overhaul/scene-experience.spec.ts tests/monochrome/gold-semantics.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T17:39:33.797Z)
WAVE2: first-wave G-NEW-1+G-C1 live PASS. Queue Experience gold+strata.

## COMMENT (2026-09-05T17:55:22.735Z)
C16 PARK: P1 G-E2 dirty worktree /root/worktree-ge2-1556 exists (experience.ts + checkableRecords.ts) but AP cap is 4 P0 lanes (V3/H1-04/L1-03 + reviewer Chrome). Do not mark done. Resume after first-wave live PASSes with a NEW identity.

## STATUS (2026-09-05T18:07:43.519Z)
running — P1 AP shipped origin/worktree-ge2-1556 a202663 — awaiting cadence + independent live reviewer

## COMMENT (2026-09-05T18:07:43.613Z)
Author 350f697a pushed a202663 worktree-ge2-1556: gold on sourced employers only (not dates), uScroll strata parallax, MiniVic default closed. NOT on main yet. Cadence ~18:07Z will consolidate. Do not complete until independent live PASS vs GAP-BACKLOG G-E2.

## COMMENT (2026-09-05T18:11:01.569Z)
LIVE ancestor: a202663 is on live 0892d092 (Deploy 33983082312). Independent reviewer rev-0892d092-c18 dispatched. Do not complete on author 350f697a self-report.

## COMMENT (2026-09-05T18:34:14.468Z)
C19 left G-E2 OPEN. a202663 on live. Focused reviewer dispatched. Do not complete.

## COMPLETE (2026-09-05T19:32:50.552Z)
PASS live 64404134. Gold in #experience only on 'Australian Taxation Office (ATO)' rgb(201,168,76); 0 gold dates. https://forgotten-mistory.web.app/ build-commit 64404134 · independent rev-64404134-c22 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/64404134/08-adversarial-review.md + verdicts.json
