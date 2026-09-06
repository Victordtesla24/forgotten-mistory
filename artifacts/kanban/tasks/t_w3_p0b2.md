# t_w3_p0b2 — P0 FUNCTIONAL 2b (analyst-programmer, xhigh) — finish the MiniVic panel placement from the unpushed local commit 1697bac on worktree-w3-p0b: at 1366x768 (and intermittently 1280x800) the 'above' placement's heightCap is written but the lift (bottom offset) is lost, leaving a 272-px panel over the name; find the lost write (React style prop on [data-testid=minivic-panel] re-rendering over the imperative style, or a CSS transition on bottom/height measured mid-flight), fix at the cause, TC-BOT-14 green with --repeat-each=3 at 1440/1366/1280/834/390, then push worktree-w3-p0b

**Status:** ready · **Priority:** 100 · **Parents:** t_w3_p0b · **Created:** 2026-09-06T07:08:14.038Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Continue the previous agent's work — do not start over: cd /root/forgotten-mistory/.claude/worktrees/w3-p0b (branch worktree-w3-p0b at 1697bac, unpushed; run `ln -s /root/forgotten-mistory/node_modules node_modules` and remove the symlink before committing, or npm ci). Read the p0b COMPLETE note (artifacts/kanban/tasks/t_w3_p0b.md) and its evidence W3-P0B/ (02-placement-probe-after.json, 08-tc-bot-14.log). Functional only; no visual change outside the MiniVic panel; nothing under components/sections/**. Port 5608; one heavy job at a time; wait on PIDs; never pgrep -f your own command text; never git checkout/reset/stash in /root/forgotten-mistory. The reviewer's acceptance instrument is G-REV/20a17dfb/12-placement.mjs run three times.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- D-1 Instrument: at 1366x768 on the export, open the panel and log panel.getAttribute('style') + getBoundingClientRect() on every rAF for 1 s; identify the frame where bottom/height change without the lift; check components/MiniVicBot.tsx:1242 for a style prop or a className toggle that re-renders the panel element after placement, and app/globals.css for transitions on .minivic-panel height/bottom/transform.
- D-2 Fix at the cause: if React re-renders over the imperative style, hold the placement in a ref and re-apply it in a useLayoutEffect after every render of the panel (or express placement as CSS custom properties on a stable ancestor that React never rewrites); if a transition is measured mid-flight, disable the transition while placing (data-placing attribute) and measure after transitionend/two agreeing frames. Keep lib/minivicPlacement.ts pure; add a unit test for the regression shape (heightCap written ⇒ bottom written in the same frame).
- D-3 Verify: tsc · lint · build:static · audit 10/10 · serve :5608 · PLAYWRIGHT_BASE_URL=http://127.0.0.1:5608 npx playwright test tests/e2e/chatbot.spec.ts -g 'TC-BOT-14' --repeat-each=3 · tests/e2e/minivic-panel-placement.spec.ts --repeat-each=2 · tests/e2e/minivic-first-fold-click.spec.ts tests/e2e/minivic-first-fold-cv-tap.spec.ts tests/a11y/minivic-occlusion.spec.ts tests/e2e/minivic-send-path.spec.ts · node --test tests/minivic_placement.test.mjs · the reviewer's 12-placement.mjs ×3 against :5608 (PROBE_BASE_URL) saved as W3-P0B/11-placement-probe-x3.json; full logs → W3-P0B/ (11-…).
- D-4 Ledger row; commit on top of 1697bac; push origin HEAD:refs/heads/worktree-w3-p0b (never main). ≤ 30 min. Return {task_id:'t_w3_p0b2', branch, sha, pushed, cause_fixed, tc_bot_14:{repeats,passed}, probe_x3:{…}, gates:{…}, evidence:[…], remaining:[…], goal_complete}.

## QUALITY GATES
- TC-BOT-14 3/3 at every viewport; TC-MV-PLACE 2/2; the reviewer's probe ×3 shows clearance ≥ 16 and width ≥ 360 at ≥ 1280, composer inside, every run
- tsc/lint/build clean; audit 10/10; nothing under components/sections; ledger row; branch pushed

## VERIFICATION
```bash
git -C /root/forgotten-mistory/.claude/worktrees/w3-p0b log --oneline -3
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-P0B/ | wc -l
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T07:08:14.146Z)
running — dispatched 07:09Z fm-wave3-p0-chain (AP opus/xhigh, port 5608) then t_w3_p0c (port 5610)
