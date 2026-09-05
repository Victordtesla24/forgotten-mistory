# t_g_rev — ADV-FAIL P0 — G-REV Live adversarial re-probe after each Deploy

**Status:** ready · **Priority:** 99 · **Lane:** G-REV · **Port:** — · **Created:** 2026-09-05T11:12:20Z (host intake) · **Spec written:** 2026-09-05T12:09:07Z

> Source: artifacts/adversarial/ADV-REVIEW-20260905.md → artifacts/adversarial/GAP-BACKLOG.md → artifacts/kanban/INBOX/ADV-FAIL-20260905.md. Live FAIL baseline build bdf4edc4 / 9ba97a5c.

## YOUR ROLE
reviewer — verification / 3rd_party_independent_adversarial_review (max). Read-only; you never implement. You are the O2/O6 gate for this run. Phase 1 (NOW): record the FAIL BASELINE of the live site at its current build-commit against the binary acceptance of every P0 gap in artifacts/adversarial/GAP-BACKLOG.md (G-H1, G-H2, G-H3, G-A1, G-A2, G-S1, G-V1, G-V2, G-M1, G-M2, G-M3) with fresh evidence you capture yourself. Phase 2 (after each Deploy the orchestrator names): re-probe the SAME acceptance on the new build-commit and issue PASS/FAIL per gap, failures first. Also act as the senior creative UI council (O2): for every section give 3 exact aesthetic directions a Marvel-grade art director would give (composition, light, type, motion), each tied to a file. Never soften; a FAIL is a FAIL.

## EXECUTION ORDER
- S-1 Capture: `curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'`, cache-control header, HTTP status. Browser (use the repo's Playwright with system Chrome + --no-sandbox in a node script, or the playwright MCP if reachable): fresh context at 1440×900 and 390×844, normal and `/?gl=force`, plus a persistent-profile second load (SW freshness). Collect console errors, pageerrors, every network request path, screenshots of each section, computed styles for: `#about` evidence colour (gold token?), About key hatch chroma, hero first-fold element inventory (h1 count, paragraphs > 12 words, CTA groups, ledger/availability y vs innerHeight), Vitrine resting-plate stroke-dashoffset/opacity, #skills canvas count at ?gl=force, MiniVic: send one message and record the /api/* requests + TTFB to first visible reply token, greeting MP3 URL + SHA-256 (download and hash) vs the on-screen intro text (transcribe the first 8 words by ear is not possible — instead compare the served MP3 hash against the repo's public/assets/minivic-greeting.mp3 hash at the deployed commit and note whether the text constant changed in that commit), presence of Tailwind red/orange utilities and blue-steel body washes in the served CSS (grep the CSS bundle for `rgb(138 143 154` / `#ef4444`-class hues / any chroma > 0 outside the gold token).
- S-2 Write docs/delivery/evidence/v10-20260905T0515Z/G-REV/<build-commit>/08-adversarial-review.md: verdict table (gap × PASS/FAIL × evidence path), failures first; creative-council directions per section; false-positive register (any prior board "Done"/"PASS" claim you could not reproduce, verbatim + source + contradicting evidence). Screenshots + JSON captures beside it.
- S-3 Return structured output {task_id, build_commit, verdicts:{G-xx: PASS|FAIL}, failures_first:[...], creative_directions:{section:[...]}, evidence:[paths], goal_complete:false} — goal_complete becomes true only when every P0 gap is PASS on live. Commit the evidence on a fresh docs-only branch and push it.

## QUALITY GATES
- [ ] Every P0 gap has a fresh live measurement (not a repo read) and a PASS/FAIL
- [ ] Console/pageerror/network captures exist for 1440 + 390, normal + gl=force, + returning-visitor load
- [ ] Failures listed before successes; false-positive register present (may be empty with the statement of what was tried)
- [ ] No implementation performed; evidence committed and pushed

## VERIFICATION
```bash
ls docs/delivery/evidence/v10-20260905T0515Z/G-REV/*/08-adversarial-review.md
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245, 4 cores / 15 GB — at most 3 concurrent builds or Playwright batteries on the host; your lane has ONE). Live: https://forgotten-mistory.web.app/. Evidence: docs/delivery/evidence/v10-20260905T0515Z/G-REV/. Ports :5599 / :8080 belong to other tenants and :5601 / :5602 / :5604 are held by paused lanes — use ONLY the port assigned to your lane below.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], commit, branch, goal_complete:true|false}; the orchestrator writes it to the board. Never self-approve; never weaken, skip, or delete a test to pass it; every claim cites a command output or a path. TDD: extend/author the failing assertion FIRST, capture it red (02-tests-failing.log), then implement, then capture green (04-tests-passing.log). No secrets in output — read key NAMES only from /root/.claude/.env.production (never `source`, never print values). Ledger before commit: `node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task <id> --role <profile> --model claude-opus-5 --prompt artifacts/kanban/tasks/<id>.md --range --cached --cwd <your worktree> -- <each changed file>` after `git add`, before `git commit`. Commit with Conventional Commits; push your branch to origin (`git push -u origin <branch>`); deploy.yml consolidates every branch into main. Never push to main directly from a worktree, never force-push, never rewrite history, never start Hermes, never ask the Owner, never request ANTHROPIC_API_KEY.

## HIERARCHY
role_matrix: verification / 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20. SOUL/system prompt: /root/.sub-agents/claude-roles/reviewer.SOUL.md + reviewer.system-prompt.md (+ /root/.sub-agents/council/reviewer.md where present).

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). OpenRouter balance is negative (402) → §0.4 failover already applied. Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T12:09:07.786Z)
INTAKE 12:0xZ (orchestrator, Fable 5.1 ultracode): read prompt.md end-to-end, ADV-REVIEW-20260905 (FAIL), GAP-BACKLOG, INBOX/ADV-FAIL-20260905, ORCHESTRATOR-REALIGN. Verified: fm-deploy-cadence.timer active; hermes-gateway/dashboard inactive; Deploy runs 11:12/11:23/11:33/11:43/11:54 all success; live build-commit 9ba97a5c = main HEAD; cache-control public, max-age=0, must-revalidate; all 15 worktrees ahead=0 (nothing merged-ready to push); in-flight uncommitted work in wf_09ff65b8 (flagship C) and wf_c06ca2f9 (flagship B = Skills GL) continues, not restarted (§0). No worker processes alive → 4 stale running tasks reclaimed to ready. Specs written for t_g_a1/a2/m1/m2/h1/v1/s1/h2/rev. First wave dispatching now as parallel worktree lanes; first visible ship target ≤12:15Z.

## STATUS (2026-09-05T12:13:28.057Z)
running — dispatched 12:1xZ — reviewer max opus, Workflow wf_2cd21f31-055 reviewer:live-baseline (phase 1 baseline on live 9ba97a5c); phase 2 re-probe after each Deploy

## COMMENT (2026-09-05T12:19:26.770Z)
WAVE-2 PLAN 12:2xZ: t_g_h3 (palette purge, port 5611) + t_stab01 (stability, port 5613) dispatch as wave-1 build slots free; t_g_m3 (TTFB, port 5612) after t_g_m1 lands; t_ci_verify01 (O3 deploy-verify EPIPE false failure — run 33965475659 reported failure while live served 9ba97a5c) already dispatched to coder.

## COMMENT (2026-09-05T12:22:18.207Z)
PHASE 1 BASELINE landed (branch worktree-wf_2cd21f31-055-1, commit 77cd9a3): 11/11 P0 gaps FAIL on live 9ba97a5c with fresh captures under docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/. Watcher dispatched deploy.yml 12:21:42Z to consolidate it with the O3 verify fix (6f59312).

## COMMENT (2026-09-05T12:55:40.850Z)
RECTIFY 12:52Z applied — Playwright unblocked; WIP push; board closes on PASS.

## COMMENT (2026-09-05T14:24:22.234Z)
RECTIFY 14:12Z (INBOX/RECTIFY-20260905.md + dir-mgmt/ORCHESTRATOR-ADHERENCE-20260905.md) INTAKE 14:24Z — applied: (1) t_g_h2 reopened → running (docs ≠ PASS; closes only on live poster/first-paint/JS-off PASS via t_x1_02c/t_x1_03); (2) board hygiene: 93 tasks had column≠status → synced; scripts/pm/kanban.mjs now keeps column in step with status on every verb; (3) concurrency: ≤2 Chrome-heavy workflows while load>8 — three stale http.servers (5601/5602/5604) killed, no new heavy dispatch until the poster + scenes lanes end; (4) O5-MISS filed for 14:11:36–14:20:49Z (docs/evidence-only deploys 8beeda9d, 5108c3ce) — next tick ships the hero poster (G-H2a); (5) overruns: H2b lane at 27 min checkpointed by its own push at 14:23; no lane restarted; (6) t_g_rev is completed as the standing probe and replaced by one task per Deploy (t_rev_<gap>_<build>) closed on verdict. VERIFICATION: systemctl is-active fm-deploy-cadence.timer → active systemctl is-active hermes-gateway → inactive gh run list deploy.yml --limit 6:   2026-09-05T14:22:49Z workflow_dispatch success 5108c3ce   2026-09-05T14:19:15Z workflow_dispatch success 8beeda9d   2026-09-05T14:15:43Z push success 53548a1a   2026-09-05T14:15:41Z workflow_dispatch success 4424d5c2   2026-09-05T14:10:06Z workflow_dispatch success 1d25b7ab   2026-09-05T14:07:31Z workflow_dispatch success 2f694fd9 live: build-commit" content="66199cba" t_g_h2 status: running 

## COMPLETE (2026-09-05T14:24:22.353Z)
Standing reviewer task closed per RECTIFY 14:12Z ('no zombie running'): phase 1 baseline 11/11 FAIL (9ba97a5c); phase-2/3 probes issued per Deploy — G-A2 PASS, G-A1 FAIL→PASS, G-V1/V2 PASS, G-M1/M2 PASS, G-S1 PASS, G-H1 FAIL→PASS, G-H3 PASS, G-M3 latency PASS, flagship-C F1 PASS, sweep 13/13 PASS, G-H2a FAIL (poster/JS-off). From here every Deploy that changes a gap gets its own reviewer task t_rev_<gap>_<build>, completed on verdict.
