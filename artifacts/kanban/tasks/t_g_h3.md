# t_g_h3 — ADV-FAIL P0 — G-H3 Purge non-B/W/gold chrome from the served CSS (Tailwind hue utilities, blue-steel body washes, off-token literals)

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T12:19:26.316Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Orchestrator live scan 12:1xZ of build 9ba97a5c (curl of the three served CSS bundles): 959f3ad2cd114a93.css carries Tailwind hue utilities `.bg-red-500 .border-red-500 .text-red-500 .border-orange-400 .bg-blue-600 .text-blue-500 .bg-green-400 .bg-green-500` with their literals (#fb2c36, #ff7350, #71717b, #9f9fa9, #1e2939) — none is referenced by any file under app/ components/ lib/ (grep = 0): Tailwind v4 (`@import "tailwindcss"` in app/globals.css:1) auto-scans the whole repo and picked the class names up from reports/post-prod/lighthouse-production.json (the v3-style `content` array in tailwind.config.js is ignored by v4). The `body` rule paints blue-steel washes `radial-gradient(… #282a32 …)` = rgba(40,42,50) ×2 and rgba(36,36,42) (app/globals.css:554-557). The same bundle carries cool-steel literals #e8ebf0 #aeb6c2 #c9cdd6 #080b11 whose source is NOT in app/components/lib source greps — trace them through the build (a stale generated token block, a vendored stylesheet, or an inline style) and remove/neutralise. bff4d398763861e9.css carries rgb(138 143 154) — that is the About hatch, owned by lane G-A (t_g_a2); do not touch About. §0.3-2 / C-8 / QA gate 'Palette': black, white, gold only; gold = sourced-claim mark.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Reproduce from live: `curl -fsS https://forgotten-mistory.web.app/ | grep -o '/_next/static/css/[^"]*'` → download each bundle → run the chroma scan (any hex/rgb literal with max(r,g,b)-min(r,g,b) > 6 that is not a --gold* token; any `.(text|bg|border|ring|from|to)-<hue>-<n>` utility). Save to docs/delivery/evidence/v10-20260905T0515Z/G-H3/01-live-baseline.log.
- S-2 TDD: add `tests/palette_bundle.test.mjs` (node:test) that runs the same scan over out/_next/static/css/*.css after `npm run build:static` and fails on ANY chromatic non-gold literal or hue utility; add a static-audit gate in scripts/validate/overhaul_static_audit.mjs only if a gate for served-CSS chroma does not already exist (read the 10 gates first — do not duplicate; if TC-NFR-DEADCSS or a palette gate already covers source-level hex, this new check is bundle-level and complementary). Build once, run → RED (02-tests-failing.log).
- S-3 Fix the Tailwind source scanning: in app/globals.css replace `@import "tailwindcss";` with `@import "tailwindcss" source(none);` followed by `@source "../app"; @source "../components";` (Tailwind v4 syntax — confirm against node_modules/tailwindcss/package.json version 4.1.x docs via context7 if unsure); delete the dead v3 `content` block from tailwind.config.js or the file if nothing else reads it. Replace the body washes with neutral tokens of identical luminance (e.g. `rgb(38 38 38 / 0.26)` expressed via an existing --ink token + alpha, or drop the washes if the section grounds already carry the depth — record the decision). Trace and remove the cool-steel literals.
- S-4 Rebuild; rerun the node:test → GREEN; run tests/monochrome (all three specs), tests/a11y/text-contrast.spec.ts, tests/overhaul/render.spec.ts on your port; tsc; lint; static audit 10/10; TC-NFR-DEADCSS must stay green (removing utilities must not orphan a class). Screenshot the page top at 1440 to prove the ground is neutral (08-screens/).
- S-5 Ledger; commit `fix(palette): served CSS is black, white and gold only — Tailwind scans app+components, neutral body ground (G-H3)`; push branch.

## QUALITY GATES
- palette_bundle node:test red → green; zero chromatic non-gold literals and zero hue utilities in out/_next/static/css/*.css
- monochrome ×3, text-contrast, render specs green; tsc, lint, audit 10/10
- About untouched (lane G-A owns it); no visual regression of section grounds (screenshots)
- Ledger rows; branch pushed

## VERIFICATION
```bash
node --test tests/palette_bundle.test.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5611 npx playwright test tests/monochrome tests/a11y/text-contrast.spec.ts tests/overhaul/render.spec.ts
node scripts/validate/overhaul_static_audit.mjs
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T13:02:16.762Z)
ORCHESTRATOR PUSH under RECTIFY (O3): 5d733ad on worktree-wf_2c7160af-27e-1 at 13:01Z — build fresh (12:53:45 > last edit 12:51:42), tsc exit 0. Tailwind v4 source(none) + @source app/components; body washes → equal-luminance neutrals (42/36); rim/key tints → --accent/--steel neutrals; MiniVic zinc/slate → neutral; tailwind.config.js removed; css_chroma_scan.mjs + palette_bundle.test.mjs (red→green logs). Lane battery continues in parallel. Ledger +6.
