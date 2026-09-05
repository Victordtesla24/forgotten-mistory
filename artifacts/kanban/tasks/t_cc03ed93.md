# t_cc03ed93 — Cycle 16 — C-04 + ADV-F-3 + ADV-F-2: the MiniVic launcher reads as a labelled chat affordance, is achromatic, is reachable in 3 tab stops

**Status:** todo · **Priority:** 84 · **Parents:** t_3bf56e4a, t_6fb8914b · **Created:** 2026-09-05T05:58:06.011Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). R-c8 items 7, 12, 13. Files: components/MiniVicBot.tsx, app/globals.css (MiniVic chrome block), components/site/Navigation.tsx; tests/monochrome + tests/a11y (TDD first).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Tests first: (a) every computed colour inside [data-testid=minivic-toggle] satisfies R==G==B and none is rgb(201,168,76); (b) ancestor-chain eval shows no aria-hidden="true" between the launcher and <html> while axe reports 0 aria-hidden-focus violations at 1440 and 390; (c) Tab from the top: within 3 stops an element with accessible name "Ask Mini Vic" is focused; Enter → activeElement has data-testid=minivic-toggle and the panel is open. Run → red.
- S-2 Launcher: fill the ring with the grayscale portrait already used in the open panel header (filter: grayscale(1) contrast(1.05); border-radius 50%) inset 2px inside 1px solid var(--card-border); label pill "Ask Mini Vic" to its left at ≥834 (font-size var(--fs-caption), letter-spacing var(--ls-caption), color var(--mist-200), background rgb(10 10 10 / 0.72), padding var(--space-1) var(--space-2), radius 999px); icon-only below 834; replace bg-zinc-400/bg-zinc-500 with var(--mist-400)/var(--ink-500). Keep data-testid and 44px hit area. No --gold.
- S-3 Second skip link "Ask Mini Vic" next to "Skip to the evidence" in Navigation.tsx: focuses the toggle and opens the panel.
- S-4 Battery; screenshots closed-state 1440/390; commit `feat(minivic): a labelled launcher, reachable in three tab stops`.

## QUALITY GATES
- [ ] three specs green
- [ ] closed-state 1440 screenshot shows portrait + label
- [ ] monochrome suite green
- [ ] battery green

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/monochrome tests/a11y tests/e2e/chatbot.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T06:32:27.869Z)
## CORRECTION: TC-CONTRAST-01 @390 (from V-C11 F-1, 127b2ab)
Original output: cycle 11 leaves exactly one node red — #role-body-ato > ul.Experience_bullets > li:nth-of-type(1) at 1.79:1, fg rgb(205,205,205) on the sampled ground rgb(153,153,157), which is the MiniVic launcher's light portrait disc painted over the prose (elementsFromPoint at [304,779] → button.group.relative → div.fixed.bottom-6; launcher box {l:302,t:756,r:366,b:820} at 390 px, position fixed, z-index 10030).
Failing criteria: tests/a11y/text-contrast.spec.ts:275 TC-CONTRAST-01 @390 expects 0 nodes below AA (expect(failures.length).toBe(0) at :287 — do not weaken).
Required fix: the closed launcher must never paint an opaque light surface over body prose at ≤ 480 px — put the grayscale portrait on a dark in-palette plate (var(--ink-900)/var(--card)) with the 1px var(--card-border) ring, or dock the launcher clear of the reading column on phones (e.g. bottom-right inset inside the page gutter with the prose column ending before x=302), whichever keeps the 44 px hit area and data-testid=minivic-toggle. Do this together with C-04 (labelled affordance, pill 'Ask Mini Vic' ≥834, achromatic pip: bg-zinc-400/500 → var(--mist-400)/var(--ink-500)), ADV-F-3 (aria-hidden ancestor check) and ADV-F-2 (skip link 'Ask Mini Vic'). Also fix TC-BOT-12 (tests/e2e/chatbot.spec.ts:257 — the open panel stacks above the launcher on its axis and never covers the h1; red on CI run 33936783382).
File: components/MiniVicBot.tsx:1191 (launcher className), the MiniVic chrome block in app/globals.css, components/site/Navigation.tsx (skip link).
Verification: PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/a11y/text-contrast.spec.ts → '2 passed'; tests/e2e/chatbot.spec.ts (TC-BOT-12 green); tests/monochrome; tests/a11y; plus the new occlusion spec: at 390×844 for every scrollY step of the contrast walk, no element with position:fixed inside [data-testid=minivic-toggle]'s ancestry intersects a visible text node's box in main — or equivalently the launcher's box never overlaps a <p>/<li> box in #experience/#about/#skills at 390.

## STATUS (2026-09-05T06:32:27.914Z)
running — cycle 16 dispatched with the V-C11 correction; priority raised to 93; port 5602
