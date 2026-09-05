# t_g_s1c — CORRECTION — live text-contrast regression at 1440 (both paths): three .Bench_bandLabel at 3.63–4.10:1 (new with the Skills bench field 66b0872) and 'InfoCentric' role company 1.06:1 on a near-white ground under #experience

**Status:** todo · **Priority:** 98 · **Parents:** — · **Created:** 2026-09-05T13:21:54.983Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: reviewer FAIL-A on live ceca1fa5 (docs/delivery/evidence/v10-20260905T0515Z/G-REV/ceca1fa5/08-adversarial-review.md — palette review; read its FAIL-A section and captures). Repo gate run against PRODUCTION: `PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/a11y/text-contrast.spec.ts --workers=1` → 2 failed (1440 on / and /?gl=force), 2 passed (390). Failing nodes: (1) li#role-infocentric > h3.Experience_roleHeading > button.Experience_roleToggle > span.Experience_roleMeta:nth-of-type(2) > span.Experience_roleCompany 'InfoCentric' fg rgb(205,205,205) on sampled ground rgb(200,199,199) — 1.06:1 — a NEAR-WHITE panel under #experience that did not exist at the 577d45af baseline (0/159): find what paints it (a bloom/keylight from the new Skills bench field canvas or CSS bleeding upward? an Experience light panel? the palette lane's --keylight/--rim change?) — use the reviewer's screenshot + a DOM/pixel probe at that node; (2)(3)(4) p.Bench_bandLabel 'Repositories' 3.63:1, 'Credentials' 4.00:1, 'Programmes' 4.10:1 — fg rgb(125,125,125) (--ink-300) at 11px/400 on rgb(39,39,39)/(31,31,31)/(29,29,29): introduced by 66b0872 (Bench.module.css). Fix: band labels to a token that clears 4.5:1 on the lit field at every phase (e.g. --mist-400 #909090 → ~5.9:1 on #272727; verify on /?gl=force with the bench field mounted and animating, worst-pixel), and remove/ground the near-white panel so the role company clears 4.5:1 on both paths. Extend tests: TC-CONTRAST-02 must include the #skills band labels with the field mounted (scroll the section into view, wait for the canvas, then sample).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Reproduce on a fresh build served locally at 1440 on / and /?gl=force: run tests/a11y/text-contrast.spec.ts → red with the same four nodes → 02-tests-failing.log; probe the InfoCentric ground (element under the point, computed backgrounds, canvas bounds) and name the culprit.
- S-2 Fix Bench.module.css band label token (+ any field-lit ground plate); fix the near-white panel cause in its owner file (Experience.module.css / Bench.module.css / Skills field CSS / globals.css keylight) — smallest change, tokens only.
- S-3 PUSH RULE (RECTIFY): tsc + lint + build:static + audit 10/10 green → ledger → commit → push; then run text-contrast (both paths, 1440 + 390), scene-skills, flagship-visibility (skills + experience), scene-experience → follow-up evidence commit.
- S-4 Screenshots of #skills band labels and the InfoCentric role at 1440 gl=force → 08-screens/ under G-S1/correction/.

## QUALITY GATES
- tests/a11y/text-contrast.spec.ts green at 1440 and 390 on / and /?gl=force (0 nodes below AA) on the local build
- Culprit of the near-white panel named with evidence and removed
- No gold added; tokens only; tsc, lint, audit 10/10; ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5618 npx playwright test tests/a11y/text-contrast.spec.ts tests/overhaul/scene-skills.spec.ts tests/overhaul/scene-experience.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T13:21:55.031Z)
running — dispatched 13:21Z — fresh analyst-programmer, isolated worktree, port 5618, RECTIFY push rule
