# t_w2_a3sa — ARCHITECTURE — G-A3 story vs flagship coverage vs text contrast in #about: decide how the field says WHICH dimensions are answered without dimming the plane (hatch/texture-coded open wedges at equal luminance, a redefined story assertion, or a 390 layout change that unguards plane area) — with the AP's measured numbers; TDD cases; ≤30-min AP slice

**Status:** ready · **Priority:** 93 · **Parents:** t_w2_x2f5 · **Created:** 2026-09-06T04:07:56.354Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). Facts (all measured by ap-w2-x2f5, docs/delivery/evidence/v10-20260905T0515Z/W2-X2/t_w2_x2f5/ + commit messages 479e2b2 / ef2979a on origin/worktree-w2-x2f5): applying the answered/open state term last and to the whole pixel gives ring answered/open 1.556 @1440 rest, 7.791 @390 rest, 8.137 @1440 indexed, fan 14.996 — but TC-FLAGSHIP-VIS-ABOUT coverage drops 15.52% → 13.66% (floor 15%, counts plane pixels ≥ 0.06 above ground); lifting ring/fan/haze bases to recover area either stays under the floor (14.28%, 14.82%) or breaks TC-CONTRAST-01/02 at 390 (15.31%) because the reading-column/instrument ceilings (READING_CEILING 0.10, INSTRUMENT_CEILING 0.24) keep guarded light below the coverage threshold, so the only unguarded area at 390 is under the heading/instrument. Reviewer rev-12cd9123-w1 F-2 (per-sector means: Culture Fit answered = darkest 0.012, Company Stability open = 0.566) and rev-3657baa1 both hold that brightness tracks position, not the data. SIGNATURE-SCENES-v2 §5 TC-STORY-ABOUT-01/02 define the story as ≥ 8 lobes + role-side maxima ≥ 15% below candidate-side. The three floors are all legitimate; the SA decides the composition, not the AP.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: the two commit bodies, the AP evidence folder (coverage/contrast runs), components/sections/About/{field.glsl.ts,AboutField.tsx,About.tsx,About.module.css,Compass.tsx}, tests/overhaul/scene-about.spec.ts (TC-SCENE-ABOUT-10 both states), tests/overhaul/flagship-visibility.spec.ts (ABOUT coverage 15% / peak / motion floors and how coverage is computed), tests/a11y/text-contrast.spec.ts (TC-CONTRAST-01/02), SIGNATURE-SCENES-v2.md §5 (story contract), app/data/portfolio/about.ts (answered vs open: role-side 6, 7, 9), reviews G-REV/12cd9123 + G-REV/3657baa1 About sections.
- S-2 Decide (§0.1, log rationale + reversal cost): (a) encode 'open' as structure at equal or higher luminance — a legible 45° hatch / broken ring / hollow wedge whose MEAN luminance matches answered wedges (coverage unchanged) while a texture metric separates them (e.g. high-frequency energy ratio, or ring continuity: answered = continuous arc, open = dashed) — and REWRITE the story assertion to measure that structure (TC-SCENE-ABOUT-10 ratio clause → structure clause; TC-STORY-ABOUT-02 maxima clause revisited) — this is a legitimate redefinition only if a stranger can still tell answered from open with the dial hidden; OR (b) change the 390 composition so plane area is unguarded (e.g. instrument below the field, heading on a plate outside the plane) so dimming open wedges keeps ≥ 15%; OR (c) both. Reject any option that lowers a floor.
- S-3 TDD cases first (file, assertion, threshold) and one ≤ 30-min AP slice (files, gates, port). Write docs/architecture/ABOUT-STORY-v2.md (new) with the numbers, the decision, the test rewrite and the slice; return {task_id:'t_w2_a3sa', decision:'a|b|c', story_assertion:'…', tests:[…], slices:[…], doc, goal_complete:true}. Read-only for app code; no build; ≤ 25 min.

## QUALITY GATES
- Decision cites the measured numbers and keeps every floor (coverage 15%, contrast 4.5:1, ceilings, gold 0)
- If the assertion is redefined, the doc states why a reader still distinguishes answered from open with the dial hidden
- One AP slice ≤ 30 min with exact files/tests; no app code edited by the SA

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/ABOUT-STORY-v2.md
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T04:07:56.442Z)
running — dispatched 04:08Z SA (max, read-only)

## COMPLETE (2026-09-06T04:19:56.332Z)
SA sa-w2-a3 (max, 11 min): decision (c) recorded in docs/architecture/ABOUT-STORY-v2.md (PM verified file exists) — open sectors DRAWN as structure (broken arc −cos(within·2π·5) + 45° ruling, depth 0.42, gated by (1−guarded)(1−answered), mean 0 so coverage 15.52% is untouched and no ceiling is breached); TC-SCENE-ABOUT-10 ratio clause replaced by per-sector normalised DFT amplitude at the mark frequency (open ≥ 3.0× answered AND ≥ 0.20) + non-inversion floor answered/open ≥ 1.20 (today 1.499–4.181) — strictly stronger and position-invariant (the 1.596-with-sector-5-dark case cannot pass it); TC-STORY-ABOUT-03 added; -01/-02 and every floor unchanged. Slices: x2-f6 (AP, 30 min, bounded tuning window + stop conditions, revert precedent ef2979a) and x2-f7 (conditional: 390 unguarded plane).
