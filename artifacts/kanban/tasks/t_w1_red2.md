# t_w1_red2 — Two Playwright specs red on main before wave-1 (proven on main's own build): TC-PHOTO-11 hero figure moves 165 px on hover (page scrolls), TC-BOT-14 MiniVic panel top sits 11 px under the hero name at 1440x900 — root-cause and fix (not weaken)

**Status:** ready · **Priority:** 88 · **Parents:** — · **Created:** 2026-09-06T00:55:26.816Z

## YOUR ROLE
tester — testing / qa (docs/prompt.md §5). t_w1_h6h5 reproduced both failures on an untouched origin/main build (port 5602): (1) tests/e2e/hero-photo.spec.ts TC-PHOTO-11 'figure y unchanged across the hover fade' → 165 px shift because Playwright's hover scrolls the figure into view; (2) tests/e2e/chatbot.spec.ts TC-BOT-14 '1440x900: panel top must clear the lowest glyph of the hero name by 16 px' → 11 px. Both are real defects or real test-design defects; decide which with evidence, then fix the product where the product is wrong and the test where the test is wrong (state which, with the reason in the test file). Never delete or skip either test.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree: git fetch -q origin && git worktree add -b worktree-w1-red2 /root/forgotten-mistory/.claude/worktrees/w1-red2 origin/main && cd there && ln -s /root/forgotten-mistory/node_modules node_modules.
- S-1 Build once (`npm run build:static`), serve `python3 -m http.server 5605 --directory out &`, reproduce both failures with `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5605 npx playwright test tests/e2e/hero-photo.spec.ts -g 'PHOTO-11' tests/e2e/chatbot.spec.ts -g 'BOT-14'` → docs/delivery/evidence/v10-20260905T0515Z/W1-RED2/01-reproduction.log.
- S-2 Root-cause each: for TC-PHOTO-11 determine whether a real user hovering the figure sees the page move (check scroll-margin/anchor behaviour and the hover fade's layout effect in components/sections/Hero/HeroPortrait.tsx + Hero.module.css) — if the product moves, fix the product; if only Playwright's auto-scroll moves it, make the test hover without scrolling (page.mouse.move on the element's box after an explicit scrollIntoView) and write the reason in the spec. For TC-BOT-14 measure the open panel's top vs the H1's lowest glyph at 1440x900 in components/MiniVicBot.tsx + app/globals.css (panel geometry) — if the panel really overlaps the name by 5 px, fix the geometry (keep the 16 px clearance contract from t_c16b0001); do not lower 16.
- S-3 Verify: the two specs green plus `npx playwright test tests/e2e/hero-photo.spec.ts tests/e2e/chatbot.spec.ts tests/e2e/hero.spec.ts` green on the export; `npx tsc --noEmit`; `npm run lint`; `node scripts/validate/overhaul_static_audit.mjs` 10/10. Screenshots of the hero hover state and the open panel at 1440 → W1-RED2/.
- S-4 Ledger before commit (node /root/forgotten-mistory/scripts/pm/ledger_append.mjs --task t_w1_red2 --role tester --model claude-opus --prompt artifacts/kanban/tasks/t_w1_red2.md --range --cached --cwd /root/forgotten-mistory/.claude/worktrees/w1-red2 -- <files>); commit `test(hero,minivic): fix TC-PHOTO-11 and TC-BOT-14 at the root` with trailers Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> and Claude-Session: https://claude.ai/code/session_01WWt1D5i764agLExdpEWvRC; `git push -u origin worktree-w1-red2`.
- S-5 Return {task_id, branch, sha, pushed, push_denied, files_changed, root_causes:{PHOTO_11:'product|test', BOT_14:'product|test'}, gates:{reproduced, both_green, suites_green, tsc, lint, audit_10_10}, evidence:[], goal_complete}.

## QUALITY GATES
- Both failures reproduced first
- Root cause named with evidence; product fixed where the product is wrong; no threshold lowered; no test deleted or skipped
- Targeted suites green; tsc/lint/audit clean
- Ledger before commit; pushed
- ≤ 30 min

## VERIFICATION
```bash
cd /root/forgotten-mistory/.claude/worktrees/w1-red2 && PLAYWRIGHT_BASE_URL=http://127.0.0.1:5605 npx playwright test tests/e2e/hero-photo.spec.ts -g PHOTO-11 tests/e2e/chatbot.spec.ts -g BOT-14
git ls-remote --heads origin worktree-w1-red2
```

## HIERARCHY
role_matrix: testing / qa → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-06T01:39:05.230Z)
SCOPE EXTENSION 01:41Z (from t_w1_h5b, reproduced on live build 03dfd93c): also tests/e2e/hero.spec.ts TC-HERO-13 (still expects the retired /my-avatar.mp4$/ name — repoint to my-hero-avatar.mp4) and TC-HERO-15 (same hover-scroll 'figure y unchanged = 165' cause as TC-PHOTO-11). Four specs total; same root-cause rule: fix the product where the product is wrong, the test where the test is wrong, never lower a threshold.
