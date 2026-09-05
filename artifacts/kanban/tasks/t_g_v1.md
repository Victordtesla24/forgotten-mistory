# t_g_v1 — ADV-FAIL P0 — G-V1 Vitrine plates always visible

**Status:** ready · **Priority:** 99 · **Lane:** G-V1 · **Port:** 5608 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. Reviewer P0 on #vitrine: the unlit neighbour plates read EMPTY — every stroke sits at `stroke-dashoffset: 1` until the plate is lit (components/sections/Vitrine/Drawings.module.css:52-60), so a recruiter scrolling past sees five blank frames and one drawing. Directive (G-V1): a drawing is always present. Keep the trace-on as an emphasis on the lit plate, but resting plates show the full drawing at a resting weight (e.g. stroke-opacity 0.45–0.6 in currentColor, labels at a lower alpha), and `data-lit` raises it to full — never from nothing. Also G-V2 (same lane, same commit series): add the client engagement CTA after the curated work — one `Start a project` action (mailto from app/data/siteContent.ts `contact.email`, same subject pattern listen.ts uses) inside #vitrine after the rail, achromatic chrome (gold is for sourced claims only — the live repository URLs already carry gold, keep that). R4: client reaches an engagement CTA from the work.

## EXECUTION ORDER
- S-1 Read Drawings.module.css, Drawings.tsx, Vitrine.tsx, Vitrine.module.css, app/data/portfolio/vitrine.ts, tests/overhaul/scene-vitrine.spec.ts, tests/overhaul/cta-duplication.spec.ts (CTA count rules!), tests/monochrome/gold-semantics.spec.ts (Vitrine gold budget), tests/e2e/*vitrine*.
- S-2 TDD: extend scene-vitrine.spec.ts — `TC-VIT-V1: a resting (unlit, undrawn) plate renders visible strokes` — for a plate with neither data-lit nor data-drawn, computed stroke-dashoffset of `.stroke` is 0 and stroke-opacity/opacity ≥ 0.4, and the lit plate is strictly brighter; screenshot-diff not required. `TC-VIT-V2: an engagement CTA follows the curated work` — one link in #vitrine with text 'Start a project' and href starting mailto:, achromatic colour, reachable by keyboard; cta-duplication.spec still green (raise its allowance deliberately if it counts site-wide 'Start a project' links — record the decision). RED first.
- S-3 Implement CSS (resting weight → lit weight; reduced-motion unchanged: fully present) and the CTA (data in vitrine.ts, markup in Vitrine.tsx, styles in Vitrine.module.css, tokens only).
- S-4 Rebuild; serve :5608; run scene-vitrine, cta-duplication, gold-semantics, monochrome, text-contrast, tests/e2e (vitrine) → GREEN; tsc, lint, audit 10/10. Screenshots #vitrine 1440/390 with the rail at rest → 08-screens/.
- S-5 Ledger, commit `feat(vitrine): every plate shows its drawing at rest; engagement CTA after the work (G-V1, G-V2)`, push branch.

## QUALITY GATES
- [ ] TC-VIT-V1/V2 red→green
- [ ] Resting plates visibly drawn at 1440 and 390 (screenshot evidence); lit plate still emphasised
- [ ] CTA present, achromatic, keyboard-reachable; cta-duplication + gold-semantics green
- [ ] tsc, lint, audit 10/10; ledger rows; branch pushed

## VERIFICATION
```bash
npm run build:static && (python3 -m http.server 5608 --directory out --bind 127.0.0.1 &)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5608 npx playwright test tests/overhaul/scene-vitrine.spec.ts tests/overhaul/cta-duplication.spec.ts tests/monochrome tests/a11y/text-contrast.spec.ts
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-V1/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.839Z)
running — dispatched 12:1xZ — Workflow wf_b908a7a9-f5d lane:vitrine-plates+cta, port 5608

## COMMENT (2026-09-05T12:22:59.803Z)
REVIEWER BASELINE (G-V1/G-V2 FAIL, measured): neighbour plates at element opacity 0.3–0.5 with stroke-dasharray 1px / dashoffset 1px read as loading states; council target: every plate fully drawn at opacity ≥0.55, lit plate gains weight not existence. #vitrine has 9 links, 0 engagement CTAs (mailto/'start a project' = []); council: the CTA styled as a plate so it reads as the seventh drawing. Evidence: G-REV/9ba97a5c/captures/probe-a.json → vitrine.plates / vitrine.ctas
