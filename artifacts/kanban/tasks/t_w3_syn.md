# t_w3_syn — WAVE-3 SYNTHESIS (solutions-architect, max) — from the judge's verdict, write the binding spec docs/architecture/CINEMATIC-VFX-v1.md (winner + grafts + must-fix applied; removal register; per-section spec at four viewports; CQ gate set; AQ rubric; TDD cases; risk) and docs/architecture/CINEMATIC-VFX-TASKS.json (10–16 hero-first ≤30-min analyst-programmer slices with exact files, tests, visible result); mark HERO-SETPIECE-v3 / SIGNATURE-SCENES-v2 / ABOUT-STORY-v2 / LISTEN-FLAGSHIP superseded with the carried instruments listed

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_jdg · **Created:** 2026-09-06T05:41:45.761Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). Synthesis, not a third design: the judge chose; apply the grafts and the must-fix list, keep every immovable from t_w3_dA/t_w3_dB's IMMOVABLE list, and produce the one document the analyst-programmers build from. Read-only for app code, tests and content.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- Y-1 Read W3-JUDGE/verdict.md + verdicts.json, both direction docs and TASKS json, both prototype §9s, the directive note, docs/prompt.md §0.3/R1/R2/R7/§14, HERO-SETPIECE-v3 §8 (SPD instrument), ABOUT-STORY-v2 §metric.
- Y-2 Write docs/architecture/CINEMATIC-VFX-v1.md: 0 Owner's words · 1 Verdict summary (what won, what was grafted, what was rejected and why) · 2 Removal register (final) · 3 Direction · 4 Per-section spec (six sections + MiniVic chrome; storyboard, geometry at 1440/1280/834/390, technique + pass list, data contract to the content files, assets ≤ 500 kB, perf budget, degradation ladder, a11y, recruiter sentence) · 5 CQ gate set (id, method, threshold ×2 viewports) + AQ rubric · 6 TDD cases (file · assertion · threshold) incl. carried instruments · 7 Slices · 8 Risk register + bundle ceiling · 9 Prototype lineage (which proto file seeds slice 1).
- Y-3 Write docs/architecture/CINEMATIC-VFX-TASKS.json: {slices:[{id:'w3-s01'…, title, replaces:[old element ids], files:[exact paths], tests:[file:case], gates:[…], visible_result, minutes ≤ 30, depends_on:[…], heavy:true|false}]} — hero first (w3-s01 must be visible on the live URL within 30 min of dispatch), then the sections in page order, then MiniVic chrome; every old element's removal sits inside the slice that replaces it.
- Y-4 Add a one-line 'Superseded by CINEMATIC-VFX-v1 (2026-09-06) — carried instruments: …' header to HERO-SETPIECE-v3.md, SIGNATURE-SCENES-v2.md, ABOUT-STORY-v2.md, LISTEN-FLAGSHIP.md (no other edits). ≤ 30 min. Return {task_id:'t_w3_syn', doc, tasks_json, slices:[{id,title,minutes,files,heavy}], first_ship_slice, bundle_ceiling_kb, carried_instruments:[…], goal_complete:true}.

## QUALITY GATES
- Spec applies the verdict (winner, grafts, must-fix) explicitly
- Every immovable addressed per section
- CQ ≥ 10 gates instrumented; TDD cases named; slices 10–16, ≤ 30 min, hero first, removal-inside-replacement
- Supersede headers added; no app/test/content edits

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/CINEMATIC-VFX-v1.md && node -e "const j=require('/root/forgotten-mistory/docs/architecture/CINEMATIC-VFX-TASKS.json');console.log(j.slices.length, j.slices.map(s=>s.id+':'+s.minutes).join(' '))"
head -3 /root/forgotten-mistory/docs/architecture/HERO-SETPIECE-v3.md | grep -c Superseded
git -C /root/forgotten-mistory status --porcelain -- app components lib tests | wc -l
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.
