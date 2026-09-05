# t_g_s1 — ADV-FAIL P0 — G-S1 Skills real GL flagship

**Status:** ready · **Priority:** 96 · **Lane:** G-S1 · **Port:** 5609 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. CONTINUITY (§0): this work is ALREADY IN FLIGHT and uncommitted in the paused worktree `/root/forgotten-mistory/.claude/worktrees/wf_c06ca2f9-9de-1` (branch worktree-wf_c06ca2f9-9de-1, 1 commit behind main): new `components/sections/Skills/BenchField.tsx` (121 lines) + `bench.glsl.ts` (149 lines), Bench.tsx mounts `<Scene sceneId=…><BenchField/></Scene>` with a hover uniform, plus Vitrine/Listen field intensity tweaks (board tasks t_flagvis0b + t_cbff57b0). Do NOT restart from scratch and do NOT create a new worktree — `cd` into that worktree, `git merge origin/main`, assess what is missing against the gates, finish it, ship it. The reviewer's P0: #skills has ZERO WebGL while claiming production calibration; the flagship must be a real R3F/GLSL scene behind the Bench, visible (the flagship-visibility gate measures luminance + motion), reduced-motion static, no-GL readable, gold budget in #skills ≤ SKILLS_GOLD_BUDGET (gold-semantics.spec.ts:325) and only on sourced marks.

## EXECUTION ORDER
- S-1 In the worktree: `git status`, `git diff --stat`, `git merge origin/main` (resolve). Read BenchField.tsx, bench.glsl.ts, Bench.tsx diff, Bench.module.css diff, the Listen/Vitrine diffs, tests/overhaul/flagship-visibility.spec.ts (the skills case — if absent, add it), tests/overhaul/scene-skills.spec.ts (create if absent per t_cbff57b0 S-2: one canvas at ?gl=force after entry; zero canvases under reduced motion with the SVG visible; no-GL readable; gold ≤ budget).
- S-2 TDD: make sure scene-skills.spec.ts + the skills flagship-visibility case exist and run them → capture current state (RED where unmet) to docs/delivery/evidence/v10-20260905T0515Z/G-S1/02-tests-failing.log.
- S-3 Finish the implementation: DPR cap like the other scenes (components/gl/), context-loss handling via Scene.tsx, palette from lib/palette.ts only (no raw hex), one quad, uHover fed from Bench focus; ensure `three` stays in the lazily fetched chunk (dynamic import) and the asset budget is unchanged (< 500 kB per asset). Keep the Vitrine/Listen intensity tweaks only if flagship-visibility passes for them too — otherwise drop them from this commit and record why.
- S-4 Rebuild; serve :5609; run scene-skills + flagship-visibility + gold-semantics + monochrome + text-contrast + tests/perf/performance.spec.ts (+ a `?gl=force` SwiftShader probe: 0 pageerrors, canvases ≥ 1 in #skills) → GREEN. tsc, lint, audit 10/10. Screenshots #skills 1440/390 on / and /?gl=force → 08-screens/.
- S-5 Ledger rows (task t_g_s1; also mention t_flagvis0b/t_cbff57b0 in the commit body), commit `feat(skills): the bench sits on a lit GLSL field — the section's flagship scene (G-S1)`, push branch `worktree-wf_c06ca2f9-9de-1`.

## QUALITY GATES
- [ ] scene-skills + flagship-visibility(skills) red→green; canvas present at ?gl=force; zero under reduced motion; no-GL still readable
- [ ] gold-semantics (SKILLS_GOLD_BUDGET) + monochrome + text-contrast + performance green; 0 pageerrors on /?gl=force
- [ ] No new dependency, no raw hex, asset budget unchanged; tsc, lint, audit 10/10
- [ ] Ledger rows; branch pushed

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/wf_c06ca2f9-9de-1 && npm run build:static && (python3 -m http.server 5609 --directory out --bind 127.0.0.1 &)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5609 npx playwright test tests/overhaul/scene-skills.spec.ts tests/overhaul/flagship-visibility.spec.ts tests/monochrome tests/a11y/text-contrast.spec.ts tests/perf/performance.spec.ts
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-S1/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.984Z)
running — dispatched 12:1xZ — Workflow wf_d606e4cb-b3e phase 2 (after flagship C) in existing worktree wf_c06ca2f9-9de-1, port 5609

## COMMENT (2026-09-05T12:22:59.940Z)
REVIEWER BASELINE (G-S1 FAIL, measured): #skills 0 canvases, 1 svg at 1440 normal AND /?gl=force; 3086 px tall with no WebGL. Council: a depth-sorted lattice whose nodes are the tested capabilities behind the Bench; settle once on enter (~1.2 s) then hold, no loop; reduced-motion = aligned end state; gold ONLY on the measured-in-production mark — production dots/legend swatches lose gold (that is P1 gap 'gold as status chrome', include it if the gold-semantics budget forces it).

## COMMENT (2026-09-05T12:58:11.271Z)
ORCHESTRATOR PUSH under host RECTIFY 12:52Z (O3): 66b0872 on worktree-wf_c06ca2f9-9de-1 at 12:57Z — build fresh (out/ 12:51:47 > last edit 12:49:59), tsc exit 0; BenchField.tsx + bench.glsl.ts + Bench.tsx <Scene sceneId=skills-bench>, scene-skills.spec.ts, flagship-visibility skills case. Lane agent's battery continues → follow-up evidence commit; reviewer probes live after Deploy. Ledger +7.

## COMMENT (2026-09-05T13:00:10.258Z)
LIVE 9b864752 at 12:59:23Z — consolidated cleanly (no forced conflict; flagship-C plate rules and the new .fold/.proof structure both present on main). Reviewer phase-2 dispatched on 9b864752 for G-H1 + G-S1.

## COMPLETE (2026-09-05T13:12:44.689Z)
REVIEWER PHASE-2 PASS on live 9b864752 (G-REV/9b864752/08-adversarial-review.md): #skills mounts 1 webgl2-live canvas at /?gl=force at 1440 AND 390 (six scroll-and-wait cycles 1>1>1>1>1>1 — the reviewer withdrew its own first-pass '0 canvases @390' as a settle-time artefact); field coverage 0.447 / peak 0.753 / motion 0.0148; reduced-motion 0 canvases with the SVG bench visible; no-GL readable; gold: 1 saturated mark within budget 6, 0 unlicensed; AA on gl=force 0 failures (min 4.70); 0 pageerrors across 12 loads. Continues t_flagvis0b + t_cbff57b0.

## COMMENT (2026-09-05T13:37:33.569Z)
LANE FOLLOW-UP pushed 0861658 'fix(skills): hold the bench light inside the plate, thin the graticule' + battery evidence (04/06 logs, 4 screenshots) — consolidating (only reports/static-audit.json conflicts, modify/delete → will be re-tracked by checkout --theirs; orchestrator untracks it again on main after the deploy).
