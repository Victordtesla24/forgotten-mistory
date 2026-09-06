# t_w3_p0c — P0 FUNCTIONAL 3 (analyst-programmer, xhigh) — rev8 F-2 on live 20a17dfb: after a scroll JUMP past the hero at 390 (scrollTo(0, heroHeight+200), the normal arrival via 'See the evidence' / skip link) the MiniVic dock stays at opacity 0 while pointer-events is already auto and a click opens the panel — an invisible, focusable, clickable control (G-MV1 below 834, WCAG 4.1.2/1.4.11); TC-MV-CLICK-01 @390 and MONO-MV-02 @640 red on live. Make paint and pointer ownership derive from ONE signal that also fires on jumps (IntersectionObserver on the hero sentinel, or a scroll listener that evaluates the current position immediately, not only deltas); tests: jump arrival at 390/640 → opacity > 0.9 within 500 ms and hit test true; continuous scroll unchanged; fold contracts unchanged

**Status:** todo · **Priority:** 100 · **Parents:** t_w3_p0b · **Created:** 2026-09-06T06:26:34.813Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Reviewer evidence: docs/delivery/evidence/v10-20260905T0515Z/G-REV/20a17dfb/ (11-f1-390.json#pastHero, 13-placement.json#dockSweep, 16-fail-TC-MV-CLICK-01-390.png, 17-fail-MONO-MV-02-640.png, 14-repo-specs-live.log). The p0a fix (e92808f) scoped pointer-events to [data-past-hero]; the paint (opacity) is driven by a different signal that misses jumps. Functional only; no visual change; do not touch components/sections/**. Fresh worktree .claude/worktrees/w3-p0c on branch worktree-w3-p0c from origin/main (after worktree-w3-p0b is consolidated — check git log origin/main; both touch app/globals.css and components/MiniVicBot.tsx). Port 5610; one heavy job at a time; wait on PIDs; never pgrep -f your own command text; never git checkout/reset/stash in /root/forgotten-mistory.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- C-1 Read the rev8 evidence above, components/MiniVicBot.tsx (the past-hero / paint logic), app/globals.css .minivic-dock rules, tests/e2e/minivic-first-fold-click.spec.ts, tests/monochrome/minivic-launcher.spec.ts (MONO-MV-02), tests/a11y/minivic-occlusion.spec.ts.
- C-2 TDD first — extend tests/e2e/minivic-first-fold-click.spec.ts with TC-MV-JUMP-01: at 390x844 and 640x960, fresh load, window.scrollTo(0, heroHeight + 200) (and via clicking 'See the evidence'), then within 500 ms: dock wrapper opacity > 0.9, pointer-events auto, a real hit-tested click opens the dialog; and TC-MV-JUMP-02: jumping back to 0 hides it again (opacity < 0.05, pointer-events none). Run red first (reproduce the reviewer's failure with their 10-f1-390.mjs shape).
- C-3 Fix at the cause: one source of truth for 'past the hero' that evaluates the current position on mount, on scroll (including a single jump), on resize and on hashchange (IntersectionObserver on a hero sentinel is preferred; a scroll listener that reads scrollY immediately is acceptable); opacity and pointer-events both derive from that attribute; keep the :focus-within / :hover paint-and-arm paths; 834+ unchanged.
- C-4 Verify: tsc · lint · build:static · audit 10/10 · serve :5610 · run tests/e2e/minivic-first-fold-click.spec.ts tests/e2e/minivic-first-fold-cv-tap.spec.ts tests/monochrome/minivic-launcher.spec.ts tests/a11y/minivic-occlusion.spec.ts tests/e2e/minivic-send-path.spec.ts tests/e2e/chatbot.spec.ts -g 'TC-BOT-14' tests/overhaul/interim-frame.spec.ts; run the reviewer's 10-f1-390.mjs and 12-placement.mjs against :5610 and save their JSON; full logs + screenshots → docs/delivery/evidence/v10-20260905T0515Z/W3-P0C/.
- C-5 Ledger row; conventional commit; push origin HEAD:refs/heads/worktree-w3-p0c. ≤ 30 min. Return {task_id:'t_w3_p0c', branch, sha, pushed, files_changed, cause_fixed, gates:{…}, evidence:[…], remaining:[…], goal_complete:true}.

## QUALITY GATES
- TC-MV-JUMP-01/02 red-then-green at 390 and 640; MONO-MV-02 @390/640 green; TC-MV-CLICK-01, CVTAP-01, occlusion, send-path, TC-BOT-14, interim-frame green
- Reviewer's 10-f1-390.mjs and 12-placement.mjs pass on the export
- tsc/lint/build clean; audit 10/10; nothing under components/sections touched; ledger row; branch pushed

## VERIFICATION
```bash
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-P0C/ | wc -l
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## SCOPE WIDENED (06:50Z) — rev9 TC-IF-10 on live 83590944: G-MV1 breach at 390
Reviewer measured (G-REV/83590944/07-fix-sw-regress.json .if10_390, mv1-390-firstfold.png): at 390x844 the launcher 'Ask Mini Vic' is laid out in the fold at (208,776) 158x44 but its parent div.minivic-dock is opacity:0 / pointer-events:none, so it is invisible and un-clickable in the first fold — and rev9 also found effective opacity 0 past the hero (scrollY 1730) while pointer-events was auto (rev8 F-2). The button stays focusable, so keyboard focus lands on an invisible control.
Contracts in tension — resolve them this way (Owner-protected G-MV1 wins, CLAUDE.local.md item 6):
1. G-MV1: 'Ask Mini Vic' is VISIBLE (effective opacity ≥ 0.9, its own pill paint) and hit-testable in the first fold at 390 and 640 and everywhere below 834 — from first paint, not only past the hero.
2. TC-MV-CVTAP-01 stays: the launcher must not overlap the hero action row — move the pill so its rect does not intersect any hero CTA at 390/640 (e.g. bottom-right corner clear of the action group, or the dock sits above the safe-area with the CTA row unaffected); measure with the reviewer's 10-f1-390.mjs.
3. TC-MV-OCCLUDE-02 stays: the closed launcher never brightens the ground under it (no plate, no glow; the pill's own paint only).
4. MONO-MV-02 ('dock opacity < 0.05 over the fold at 390/640', G-E2) is superseded: re-point it to 'the dock paints no ground/plate over the hero and covers ≤ 2 % of the fold' with the reason written in the spec and in docs/architecture/INTERIM-FRAME.md §tests; never a silent weakening.
5. One signal drives paint + pointer ownership (the C-3 fix) and it is true from first paint below 834; the jump tests TC-MV-JUMP-01/02 then assert the past-hero state is unchanged (still visible), not a transition.
Acceptance: rev9's if10 probe and rev8's 10-f1-390.mjs both pass on the export; TC-IF-10 green; G-MV1 green at 390/640/834; CVTAP-01 green.
