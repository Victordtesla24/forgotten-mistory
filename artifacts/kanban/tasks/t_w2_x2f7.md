# t_w2_x2f7 — G-A3 story x2-f7 (CONDITIONAL — fire only on an x2-f6 stop condition) — create unguarded plane area at 390 (end .fieldViewport above the instrument / move the caption node) so a luminance clause can be raised without touching the ceilings; ABOUT-STORY-v2.md slice 2

**Status:** todo · **Priority:** 85 · **Parents:** t_w2_x2f6 · **Created:** 2026-09-06T04:19:56.978Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Trigger (ABOUT-STORY-v2.md): TC-STORY-ABOUT-02 deficit < 0.15 after x2-f6; or ABOUT coverage @1440 < 15.00% with the mark at minimum depth; or clause 10b red at 390 because the ring annulus there is mostly guarded. Edits per the doc: components/sections/About/About.module.css (≤ 900 px block, :406–450) and About.tsx only if the caption node moves. Same floors, same tests, same stop rules. Do not start unless the PM comment on this task names the trigger.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Wait for the PM trigger comment; then worktree worktree-w2-x2f7 from origin/main (carrying x2-f6).
- S-1 Read ABOUT-STORY-v2.md slice 2, About.module.css ≤900px block, About.tsx, the x2-f6 evidence numbers.
- S-2 TESTS FIRST (the failing clause named in the trigger) → 02-tests-failing.log.
- S-3 Implement the layout change; verify the full About battery + flagship + contrast at both widths; screenshots at 390 GL/reduced-motion/no-GL.
- S-4 Ledger; commit 'feat(about): unguarded plane at 390 (G-A3 story x2-f7)' with the two mandatory trailers; push worktree-w2-x2f7.
- S-5 Return the same structured shape as x2-f6.

## QUALITY GATES
- Only on a named trigger
- All About floors/tests green at both widths; no ceiling moved; ledger; pushed; ≤ 30 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-x2f7
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T04:50:46.279Z)
TRIGGER FIRED 04:52Z (PM): two measured triggers from t_w2_x2f6 — (1) TC-STORY-ABOUT-02 @390 deficit 0.1075 < 0.15 on origin/main; (3) TC-SCENE-ABOUT-10 clause 10b red at 1440 AT REST because guarded covers most of the ring annulus (open-min 0.0972 vs answered-max 0.1737, ratio 0.56; the mark's markWindow is exactly zero there). SCOPE: both widths, not only 390. Method: first MEASURE the guard mask over the ring annulus (rr 0.40–0.96) and the fan (1.12–1.6) at 1440 and 390 in the at-rest state (which guarded rect — reading column, instrument caption, key rows — covers it and by how much); then create unguarded annulus area by RELOCATING the guarded UI (About.module.css ≤900px block and the ≥901px grid: caption/key rows off the annulus; the reading column must not sit over the rose's annulus at rest) — never by weakening READING_CEILING 0.10 / INSTRUMENT_CEILING 0.24 or the (1−guarded) gate; then git apply docs/delivery/evidence/v10-20260905T0515Z/W2-A3/x2-f6/03-shader-E1-E3.patch and run the full About battery (ABOUT-10 both states/widths, STORY-ABOUT-01/02/03, flagship coverage ≥ 15% both widths, TC-CONTRAST-01/02 both paths, scene-about 01–09/11, text-contrast). Stop conditions unchanged. Push only green (tests-only push + numbers if it cannot be met).

## STATUS (2026-09-06T04:50:46.354Z)
running — dispatched 04:52Z fm-wave2-about-unguard
