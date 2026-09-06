# t_w2_a3m — About field mount range at 390 (found by t_w2_x2f5) — with the 4th list item centred, #about has 0 canvases for the full 15 s window: the field is mounted only while the section head is on screen, so a phone reader has no scene for most of the section's scroll; keep the plane with the reader (sticky/travelling field or a taller mount window) without breaking coverage/contrast floors

**Status:** todo · **Priority:** 87 · **Parents:** t_w2_x2f7 · **Created:** 2026-09-06T05:00:38.164Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Evidence: t_w2_x2f5 result notes + W2-X2/t_w2_x2f5/02-tests-failing.log (toHaveCount canvases 0 with the 4th item centred at 390x844, 19 polls). Compare the ≥901 px behaviour (the field is the section's sticky plane, 1248x900) with the ≤900 px block in About.module.css (static 30rem .fieldViewport) and Scene.tsx's mount/unmount rootMargin. Decide with the SA doc (ABOUT-STORY-v2.md slice 2 may already move the caption/instrument) — run AFTER x2-f7 lands so the two layout changes do not collide. Add a test that at 390, with items 1, 4, 7 and 10 centred, #about still has ≥ 1 canvas under ?gl=force (and the still under reduced motion), and that TC-CONTRAST/flagship floors hold.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree from origin/main carrying x2-f7; one build / one browser; port 5636.
- S-1 Read About.module.css (both blocks), AboutField.tsx, About.tsx, components/gl/Scene.tsx (mount window), tests/overhaul/scene-about.spec.ts, flagship-visibility ABOUT, text-contrast; the x2f5 finding.
- S-2 TESTS FIRST: the four-position canvas presence test at 390 (capture failing).
- S-3 Implement the smallest layout/mount change (sticky viewport within the ≤900px block, or a mount window that spans the list) keeping READING/INSTRUMENT ceilings, coverage ≥ 15%, contrast ≥ 4.5:1, gold 0.
- S-4 Verify the full About battery at 390 and 1440 (scene-about, story-contract -g ABOUT, flagship -g about, text-contrast, e2e about) serially; tsc; lint; build; audit 10/10; screenshots at the four positions.
- S-5 Ledger; commit 'feat(about): the field travels with a phone reader' with the two mandatory trailers; push with full logs.
- S-6 Return the standard structured shape with measurements {canvases_at_positions, coverage_390, contrast_min}.

## QUALITY GATES
- ≥ 1 canvas at items 1/4/7/10 centred at 390 (?gl=force) after failing first; reduced-motion still present
- All About floors green at both widths; no ceiling moved
- tsc · lint · build · audit 10/10; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-a3m
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
