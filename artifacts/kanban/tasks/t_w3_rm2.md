# t_w3_rm2 — REMOVAL SLICE 0b (analyst-programmer, xhigh) — Experience, Skills, Vitrine, Listen: unmount and delete CareerStrata.tsx + strata.glsl.ts, CareerDescent.tsx + descent.glsl.ts (the sticky descent stage), BenchField.tsx + bench.glsl.ts, Drawings.tsx + VitrineField.tsx + vitrine.glsl.ts, ListenField.tsx + listen.glsl.ts with their CSS and the smoky plates; keep the to-scale role bars, the calibration card, the six repository cards and the four contact routes as plain readable DOM; extend interim-frame.spec.ts (TC-IF-11…); supersede the scene specs; audit 10/10; push worktree-w3-rm2 within 30 min

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_rm1 · **Created:** 2026-09-06T05:55:21.010Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Owner 05:51Z (verbatim in artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md §Escalation): 'remove all your shabby work immediately and replace it with credible work'. This slice is the REMOVAL: every current effect and decoration goes now; nothing new is invented here (the credible replacement is specified under CINEMATIC-VFX-v1 and lands in later slices). The interim frame is disciplined: pure black ground (the existing near-black tokens; if the darkest token is not ≤ 0.03 luma add one token in app/globals.css :root, never raw hex elsewhere), white/grey type from the existing tokens, the monochrome photograph as a plain image with no blur/glow/plate, every word of app/data/portfolio/*.ts unchanged, section ids and order unchanged, every caliper mark unchanged, MiniVic unchanged, nav unchanged. Zero functional regression: tests that asserted a removed element are SUPERSEDED — each is listed in docs/architecture/INTERIM-FRAME.md with its replacement in tests/overhaul/interim-frame.spec.ts and removed from the suite in the same commit (git history keeps it); the static audit stays 10/10 — if a gate counts scene mounts or canvases, re-point that gate to the interim contract with the reason written in INTERIM-FRAME.md (never a silent weakening). Work in a fresh worktree from origin/main (git -C /root/forgotten-mistory worktree add .claude/worktrees/<slug> -b worktree-<slug> origin/main; npm ci if node_modules is missing); one heavy job at a time; never run git checkout/reset/stash in /root/forgotten-mistory; wait on PIDs, never on a process-name search containing your own command text; stop your static server with kill <PID>. Slug: w3-rm2. Port 5607. Branch from origin/main AFTER worktree-w3-rm1 has been consolidated (check git log origin/main for its merge; if it is not there yet, branch from origin/main and cherry-pick nothing — keep your edits away from the files rm1 touched, and extend interim-frame.spec.ts by appending a second describe block in a new file tests/overhaul/interim-frame-2.spec.ts instead).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- R-1 Read: the directive note and the Owner's Experience/Vitrine screenshots; components/sections/Experience/{Experience.tsx,CareerStrata.tsx,CareerDescent.tsx,strata.glsl.ts,descent.glsl.ts,*.module.css}, Skills/{Skills.tsx,Bench.tsx,BenchField.tsx,bench.glsl.ts,*.module.css}, Vitrine/{Vitrine.tsx,Drawings.tsx,VitrineField.tsx,vitrine.glsl.ts,*.module.css}, Listen/{Listen.tsx,ListenField.tsx,listen.glsl.ts,*.module.css}, app/globals.css; grep -rln 'CareerStrata|CareerDescent|career-descent|BenchField|Drawings|VitrineField|ListenField|data-scene' tests scripts app components lib.
- R-2 TDD first — TC-IF-11…: (11) #experience, #skills, #vitrine, #listen contain no canvas and no [data-scene]; (12) Experience: the heading, the date range, the intro, eight role rows with their duration labels drawn to scale as DOM (widths proportional to months within 2 %), the three sourced figures with gold caliper marks and the five open brackets — readable at 1440/834/390; (13) Skills: the calibration card's tested/untested split readable with no bars and no canvas; (14) Vitrine: six cards with title, description, commits/active/stack, limits and source — no drawing panel, horizontal scroll still keyboard-reachable; (15) Listen: four routes + the synthetic-introduction label, the 'Email a 20-minute-call agenda' action unchanged; (16) ground luma ≤ 0.03 at nine points per section; (17) contrast ≥ 4.5:1 for every text node in the four sections; (18) ?gl=force 0 pageerrors, 0 canvases page-wide except MiniVic's own; (19) reduced-motion identical; (20) chroma 0 except gold marks; (21) TC-MV-CLICK-01 and G-MV1 unchanged. Run red first.
- R-3 Remove in one commit with the replacements: delete the files in the title and their CSS (plates, striped fields, sticky descent stage), unmount from the section components, keep the DOM data (bars, card, cards, routes); dead CSS gone; remove the superseded specs (scene-experience, scene-descent, story-contract descent rows, scene-skills, scene-vitrine, scene-listen, flagship-visibility rows for these sections, monochrome specs that target the fields) and extend docs/architecture/INTERIM-FRAME.md with their replacements and any audit gate change.
- R-4 Verify exactly as t_w3_rm1 R-4 on port 5607; evidence → docs/delivery/evidence/v10-20260905T0515Z/W3-RM2/ with screenshots of the four sections at 1440/834/390.
- R-5 Ledger row, conventional commit listing every deleted file and superseded spec, push origin HEAD:refs/heads/worktree-w3-rm2. ≤ 30 min: if you would overrun, ship Experience + Skills green and pushed and report the rest. Return the same shape as t_w3_rm1 with task_id:'t_w3_rm2'.

## QUALITY GATES
- TC-IF-11…21 green; every other suite green or superseded with a written reason
- No canvas/plate/field in the four sections; data DOM intact and to scale; words unchanged
- tsc/lint/build clean; audit 10/10 with documented gate changes; dead CSS gone
- Ledger row; commit body lists deletions; branch pushed

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/w3-rm2 diff --stat origin/main..HEAD | tail -1
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-RM2/ | wc -l
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T06:11:13.064Z)
running — chained after rm1 in fm-wave3-removal (port 5607)

## COMMENT (2026-09-06T07:13:39.621Z)
07:12Z pushed 316a520 (worktree-w3-rm2): 86 files, 9422 deletions — CareerStrata/descent, BenchField, Drawings/VitrineField, ListenField and their shaders/CSS gone; five scene specs + story-contract + flagship-visibility + scene-framerate superseded by TC-IF-11..21 (INTERIM-FRAME.md §6); only the minivic-viseme scene remains mounted. Consolidation pending; reviewer rev10 grades all six sections on live.

## COMMENT (2026-09-06T07:36:26.507Z)
07:35Z second push 5883bcf: TC-IF-11..21 green log (W3-RM2/05-interim-frame.log) + section screenshots at 1440/834/390 + INTERIM-FRAME.md §6 extended. Awaiting the agent's structured return; rev10 grading live 6d3310b7.
