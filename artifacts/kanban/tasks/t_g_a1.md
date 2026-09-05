# t_g_a1 — ADV-FAIL P0 — G-A1 About evidence → gold

**Status:** ready · **Priority:** 99 · **Lane:** G-A · **Port:** 5605 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Independent adversarial review (artifacts/adversarial/ADV-REVIEW-20260905.md, #about) found the sourced evidence line under every answered dimension painted in grey (`.evidence { color: var(--mist-400) }` → rgb(144,144,144); `anyGoldColorInAbout: false`). §0.3-2 / C-8: gold marks a sourced claim. The About evidence strings ARE the sourced claims (CV / LinkedIn / named repository per app/data/portfolio/about.ts) — they must carry `--gold` (or `--gold-light` where contrast on the section ground requires it). This task is paired with t_g_a2 in ONE worktree, ONE branch, ONE commit series — the fastest recruiter-visible win on the page.

## EXECUTION ORDER
- S-1 Read components/sections/About/About.module.css:290-297 (`.evidence`), app/data/portfolio/about.ts (which evidence strings exist and what each cites), tests/monochrome/gold-semantics.spec.ts (gold budget/semantics assertions) and tests/overhaul/scene-about.spec.ts. Confirm each evidence string names a checkable source; any that does not stays grey and you record why on the task.
- S-2 TDD: add to tests/monochrome/gold-semantics.spec.ts a test `CC-A1: every sourced About evidence line is painted in the gold token` — computed color of every `#about .About_evidence*` (use a data attribute or the stable selector used by scene-about.spec) equals the resolved value of `--gold` or `--gold-light`; also assert AA contrast ≥ 4.5:1 for that text on its measured background (reuse the helper in tests/a11y/text-contrast.spec.ts). Build once (`npm run build:static`), serve out/ on :5605, run the spec → capture RED to docs/delivery/evidence/v10-20260905T0515Z/G-A/02-tests-failing.log.
- S-3 Implement: `.evidence { color: var(--gold) }` (or `--gold-light` if the AA measurement demands it — record the measured ratio). No new raw hex anywhere; only tokens from app/globals.css.
- S-4 Rebuild, rerun: gold-semantics.spec.ts, scene-about.spec.ts, tests/a11y/text-contrast.spec.ts, tests/monochrome/monochrome.spec.ts → GREEN (04-tests-passing.log). Then `npx tsc --noEmit`, `npm run lint`, `node scripts/validate/overhaul_static_audit.mjs` (10/10) → 05-regression.log. Screenshot #about at 1440 and 390 → 08-screens/.
- S-5 Ledger rows, commit `fix(about): sourced evidence lines carry the gold claim mark (G-A1)`, push branch. Return structured output.

## QUALITY GATES
- [ ] CC-A1 observed red before, green after
- [ ] Every sourced evidence line computes to the --gold / --gold-light token; AA ≥ 4.5:1 measured at 1440 and 390
- [ ] gold-semantics, monochrome, scene-about, text-contrast specs green; tsc clean; lint clean; static audit 10/10
- [ ] No raw hex added outside app/globals.css / lib/palette.ts
- [ ] Ledger rows appended before commit; branch pushed

## VERIFICATION
```bash
npm run build:static && (python3 -m http.server 5605 --directory out --bind 127.0.0.1 &)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5605 npx playwright test tests/monochrome tests/overhaul/scene-about.spec.ts tests/a11y/text-contrast.spec.ts
npx tsc --noEmit && npm run lint && node scripts/validate/overhaul_static_audit.mjs
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-A/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.766Z)
running — dispatched 12:1xZ — analyst-programmer xhigh opus, Workflow wf_b908a7a9-f5d lane:about-gold+hatch, isolated worktree, port 5605

## COMMENT (2026-09-05T12:22:59.848Z)
REVIEWER BASELINE (G-A1/G-A2 FAIL, measured): all 10 .About_evidence nodes rgb(144,144,144); --gold = rgb(201,168,76). keySwatch hatch rgba(138,143,154,.34) chroma 16. Council: sourced evidence on var(--gold); un-sourced answers stay neutral so sourced vs self-reported sorts at a glance; hatch to a neutral ramp value (e.g. rgba(205,205,205,.28)). Evidence: G-REV/9ba97a5c/captures/probe-a.json → about.evidenceColors / about.offTokenChroma

## COMMENT (2026-09-05T12:26:15.214Z)
PUSHED 03aa1ed on worktree-wf_b908a7a9-f5d-1 (12:25Z): .evidence[data-sourced='true'] → var(--gold); CC-A1 @1440+390 red→green (02/04 logs), 29 specs green incl. scene-about + monochrome, lint clean, audit 10/10, screenshots about-1440/390 + key swatch. Orchestrator reviewed the diff. Deploy dispatched 12:25:21Z by the watcher; awaiting live build-commit + reviewer phase-2 re-probe before Done.

## COMMENT (2026-09-05T12:37:56.120Z)
REVIEWER PHASE-2 FAIL (semantics, prime directive 3) on live 843b679d: colour/contrast PASS (9× rgb(201,168,76), AA 7.99–8.72:1) but 4 of 9 gold lines are not checkable records — #4 Culture Fit '5+ squads, up to 40 practitioners…' (self-reported), #8 Company Stability '75+ hours of evidence against 64 available…' (bare numbers), #7 Career Growth '… −38% simulated error-budget breaches' (its own text says simulated), #6 Location Match 'Currently on site with the ATO' sits on a side==='role' dimension rendering the OPEN caliper 'measured from the role'. Structural cause: the new  flag was never reconciled with the pre-existing  flag (About.tsx:220). False positive named: commit 03aa1ed's 'a figure off the CV' criterion contradicts CLAUDE.md (CV figure = self-reported, not sourced). → CORRECTION t_g_a1c dispatched.
