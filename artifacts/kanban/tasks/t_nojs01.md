# t_nojs01 — P0 — with JavaScript disabled the site renders only the loading fallback: the route sits behind app/loading.tsx's Suspense boundary, so the static export's server-rendered hero never paints without JS

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T13:57:17.217Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Found by lane G-H2a (docs/delivery/evidence/v10-20260905T0515Z/G-H2a/09-js-blocked-1440.png / -390.png): a JS-disabled load of the static export shows only 'Loading portfolio'; #hero measures 0×0. CLAUDE.md and Hero.tsx promise 'nothing here waits on JavaScript — every word is server-rendered and visible'. Root cause to confirm: Next.js App Router streams the page inside a Suspense boundary provided by app/loading.tsx; in a static export the shell HTML carries the fallback plus the RSC payload, and without JS the fallback is never replaced (the stability lane's fix made the fallback 100vh, so the footer no longer paints inside the fold, but the content still needs JS). Fix options to evaluate with evidence: (a) remove app/loading.tsx (a fully static page has nothing to suspend on — verify no async server component actually suspends; the preloader UX, if wanted, becomes a CSS-only overlay that hides via a JS-added class so no-JS users see content immediately), or (b) keep a preloader but render it as a non-Suspense overlay. Acceptance: with javaScriptEnabled:false at 1440 and 390 the served index.html paints #hero with h1, statement, actions and photograph (poster) and all six sections' text; CLS < 0.05 and LCP < 2.5 s unchanged with JS on; the preloader/Skip behaviour tested in tests/ (grep 'Preloader' / 'Skip') stays coherent or is rewritten deliberately; reduced-motion path unchanged.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Reproduce: build:static, serve, Playwright context javaScriptEnabled:false at 1440/390 → screenshot + #hero box; read app/loading.tsx, app/layout.tsx, app/page.tsx, components/Preloader* and tests referencing the preloader/Skip; confirm the Suspense mechanism in out/index.html (fallback markup vs content).
- S-2 TDD: tests/e2e/no-js.spec.ts — JS disabled: #hero h1 visible, statement, hero-actions, six section headings present, no 'Loading portfolio' as the only content. RED.
- S-3 Implement the smallest honest fix; keep CLS 0.0000 (re-run PERF-03/08 on unskipped boots) and the first-paint poster.
- S-4 PUSH RULE (RECTIFY): tsc + lint + build:static + audit 10/10 → ledger → commit → push (merge origin/main first). Then no-js + hero-fold + hero + hero-first-paint + performance + cinematic + render specs → follow-up evidence commit.

## QUALITY GATES
- no-js.spec red → green at 1440 and 390
- CLS < 0.05 (3/3 unskipped cold loads at 1280/1440/390) and LCP < 2.5 s with JS on
- hero-first-paint, hero-fold, hero, cinematic, performance, render green; tsc, lint, audit 10/10; ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5621 npx playwright test tests/e2e/no-js.spec.ts tests/perf/performance.spec.ts tests/overhaul/hero-first-paint.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T13:57:29.279Z)
running — dispatched 13:58Z — analyst-programmer xhigh, isolated worktree, port 5621, RECTIFY push rule
