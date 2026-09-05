# t_heroph001 — OWNER REQUEST 09:10Z — hero photo full size, in colour, with design-matched decorations; hero video avatar plays on hover/focus only, never by default

**Status:** running · **Priority:** 98 · **Parents:** — · **Created:** 2026-09-05T09:14:38.748Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Owner instruction verbatim: Integrate my Photo with full size, colours and dimension with creative decorations that match the website UI/UX Design. Include a hover effect that plays the hero video avatar and not by default. Supersedes the grayscale rule and the P1 88 px stamp for this element. Lane wf hero-photo (port 5601): colour still (1480×826 avif/webp), full column on desktop, full width after the actions at ≤720 (TC-HERO-12 holds), drafting frame + corner ticks + provenance caption from avatar.ts, light bloom behind the plate, hover/focus plays the loop (src set on intent, preload none), toggle for touch, reduced motion never autoplays.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 TDD tests/e2e/hero-photo.spec.ts (size, colour, rest state, hover, keyboard, reduced motion, decorations, no gold, TC-HERO-12)
- S-2 implement in HeroPortrait/Hero + avatar.ts
- S-3 battery + hero/a11y/perf/monochrome suites; screenshots; commit; push

## QUALITY GATES
- [ ] hero-photo spec green
- [ ] CLS < 0.05, LCP < 2.5 s
- [ ] no gold; tokens only
- [ ] verifier PASS + live check

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/e2e/hero-photo.spec.ts tests/e2e/hero.spec.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T10:46:49.700Z)
SHIPPED 364c0dd feat(hero): full-colour photograph with a loop on intent — consolidated e88ba4c, LIVE on ccb15241 (10:4xZ). Verifier running; orchestrator visual check in progress.

## COMMENT (2026-09-05T10:47:59.242Z)
ORCHESTRATOR VISUAL CHECK on live ccb15241: 1440 — full-colour photograph fills the right column (518×322), drafting frame + four corner ticks + registration cross, caption '— Photograph · Melbourne' below, play affordance bottom-right; at rest no video source; on hover the 1280×720 loop plays (pause glyph shows) and stops on leave; 390 — the photo sits full-width after the actions, TC-HERO-12 fold holds. Verdict by eye: this is the owner's request delivered. Defect seen: the caption sits on the hero's brightest light pool and is nearly unreadable (also the third ledger source) — folded into t_flagvis0c (hero text plates on the shader path must include .portraitCaption).
