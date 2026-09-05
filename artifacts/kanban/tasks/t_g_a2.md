# t_g_a2 — ADV-FAIL P0 — G-A2 About hatch on-token

**Status:** ready · **Priority:** 99 · **Lane:** G-A · **Port:** 5605 · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
analyst-programmer — coding. Same worktree/branch as t_g_a1. The About key's role swatch hatch is painted with an off-token cool-steel `rgb(138 143 154 / 0.34)` (components/sections/About/About.module.css:426-432, `.keySwatch[data-state='role']`). §0.3-2 / C-8: monochrome greys and white only — no blue-steel hue. Replace with a token grey/white (e.g. `var(--mist-400)` / `--steel` / `--white` at an alpha via `color-mix` or the existing rgb-token pattern used elsewhere in the file) with identical visual weight.

## EXECUTION ORDER
- S-1 Read About.module.css around line 400-440 and every other `rgb(` literal in components/sections/About/*.css; list any other off-token hue (chroma > 0) you find and fix it in the same commit — record each on the task.
- S-2 TDD: extend tests/monochrome/monochrome.spec.ts (or gold-semantics) with `CC-A2: the About key hatch has zero chroma` — computed background-image of `.keySwatch[data-state='role']` contains no rgb triple whose channels differ by more than 2 unless it is the --gold token. Capture RED.
- S-3 Implement the token swap. Rebuild, rerun monochrome + scene-about → GREEN. Screenshot the key at 1440.
- S-4 Ledger, commit `fix(about): role-swatch hatch uses a neutral token, not cool steel (G-A2)`, same branch as G-A1, push.

## QUALITY GATES
- [ ] CC-A2 red→green; no off-token chroma left in components/sections/About/*.css
- [ ] monochrome + scene-about green; static audit 10/10
- [ ] Ledger rows; pushed on the G-A branch

## VERIFICATION
```bash
grep -n -E 'rgb\(|#[0-9a-fA-F]{3,8}' components/sections/About/*.css   # every literal must be a neutral (equal channels) or a documented token
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5605 npx playwright test tests/monochrome tests/overhaul/scene-about.spec.ts
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-A/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/analyst-programmer.SOUL.md + analyst-programmer.system-prompt.md (+ /root/.sub-agents/council/analyst-programmer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T12:13:27.803Z)
running — dispatched 12:1xZ — analyst-programmer xhigh opus, Workflow wf_b908a7a9-f5d lane:about-gold+hatch, isolated worktree, port 5605

## COMMENT (2026-09-05T12:26:15.282Z)
PUSHED with G-A1 (03aa1ed): hatch rgb(138 143 154/.34) → rgb(144 144 144/.34) (the --mist-400 triple, zero chroma, same alpha); CC-A2 red→green. Awaiting live verify.
