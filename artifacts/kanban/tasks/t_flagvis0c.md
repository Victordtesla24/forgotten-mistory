# t_flagvis0c — CORRECTION P97 — flagship A live defects: hero scene extinguished on phones (flat mobile scrim), AA contrast regressions on the WebGL path (Experience company labels over strata, hero ledger source), single-viewport gate; About @390 peak

**Status:** running · **Priority:** 97 · **Parents:** t_flagvis0a · **Created:** 2026-09-05T10:15:48.659Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: V-flagship-A F1/F2 (09-verification.md c3bc139). Original output: 9fd78ef/c6bf7ff/b200958/a78d9f0 live on 8f81ae86. Failing criteria: (F1) at 390 ?gl=force hero coverage 0.00%/peak 0.0212 with canvas mounted — Hero.module.css @media (max-width:700px) .stage::after flat rgb(10 10 10 / 0.86); (F2) text-contrast algorithm on /?gl=force: 9 nodes <AA @1440, 12 @390 (.trackCompany Telstra 1.10:1, InfoCentric 1.11:1, Microsoft 1.85:1, ANZ 2.16:1, NAB 2.73:1, ATO 3.84:1; .trackYears 3.3 yr 3.84:1; hero .ledgerSource 1.34:1 @1440; 5 compass numerals 2.66–3.45:1 @390); (gap) flagship-visibility.spec.ts test.use 1440 only; About @390 peak 0.2965 < 0.35. Required fix: graded mobile scrim (same shape as desktop: transparent past the reading column) so the hero scene stays visible on phones while the copy sits on a ≥4.5:1 ground; a ?gl=force variant of TC-CONTRAST-01 (tests/a11y/text-contrast.spec.ts gains a second describe that loads /?gl=force with the SwiftShader launch args and waits for the canvases) — then fix every node it reports with local text plates (token rgb(10 10 10 / α) behind .trackCompany/.trackYears columns and the ledger sources) or by dimming the shader under the text rects (uTextRect uniform), never by dimming the scene overall below the visibility floors; flagship-visibility.spec.ts iterates viewports [1440×900, 390×844]; About field peak ≥ 0.35 at 390. Files: components/sections/Hero/Hero.module.css, Experience/Experience.module.css + strata.glsl.ts + CareerStrata.tsx, About/field.glsl.ts + AboutField.tsx, tests/a11y/text-contrast.spec.ts, tests/overhaul/flagship-visibility.spec.ts. Verification: both specs green at 1440 and 390 on ?gl=force and on the still; section suites; battery.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 extend the two specs (viewports; gl=force contrast) → red with the exact nodes
- S-2 mobile scrim graded; text plates / uTextRect; About @390 peak
- S-3 battery + section suites + monochrome; screenshots 1440/390 gl=force; commit; push

## QUALITY GATES
- [ ] flagship-visibility green at 1440 AND 390 for hero/about/experience
- [ ] text-contrast green on / and on /?gl=force at 1440 and 390
- [ ] battery green; no gold

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T10:17:15.689Z)
ADD to the correction: About numeral '01' at 1440 measures 4.42:1 (needs 4.5) on the lit sector — text.Compass_numeral fg rgb(224,224,224); V-c20 reproduced it twice. Every compass numeral must clear 4.5:1 at 1440 and 390 on both paths.

## COMMENT (2026-09-05T10:47:59.287Z)
ADD: the new hero photo caption ('Photograph · Melbourne', mono, --mist-400) sits on the brightest part of the pool at 1440 — include it in the hero text-plate / uTextRect fix; measure it on /?gl=force.

## STATUS (2026-09-05T12:09:07Z)
running — continued 12:0xZ by a fresh analyst-programmer in the paused worktree wf_09ff65b8-0fb-1 (8 dirty files, 493 insertions, uncommitted): finish gates, merge origin/main, push (lane G-FLAGC, port 5610)

## COMMENT (2026-09-05T12:13:28.099Z)
dispatched 12:1xZ — Workflow wf_d606e4cb-b3e phase 1 lane:flagship-c-finish in worktree wf_09ff65b8-0fb-1, port 5610; owns .stage/scrim/atmosphere + About/Experience styling; H1 lane owns hero layout
