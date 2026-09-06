# t_w2_a3g — PALETTE (rev-3657baa1-w2 observation) — #about paints a whole sourced-claim line in gold body text ('38 public repositories · ATO evidence harness · ANZ platform migrations', app/data/portfolio/about.ts:65 via var(--gold) at About.module.css:410; 1,545 chromatic px): gold is reserved for closed caliper jaws, the measured mark and live repo URLs (CLAUDE.md prime directive 4) — restore the line to ink and keep the gold on the caliper mark only; pin with a test

**Status:** ready · **Priority:** 84 · **Parents:** t_w1_rev5 · **Created:** 2026-09-06T03:51:45.123Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Rule: gold means 'this figure has a source' and appears only on the caliper jaws, the measured-in-production mark and live repository URLs — never as a fill, a theme or running text. The About evidence line is a sourced claim, so its CALIPER carries gold; the sentence itself must be --mist-200/--white ink like every other reading. Do not touch the shader (field.glsl.ts) — the About light correction t_w2_x2f5 just landed there. Keep TC-SCENE-ABOUT-* and the gold-semantics tests green; extend tests/monochrome/gold-semantics.spec.ts (or the palette pin) so gold text runs longer than a caliper label fail.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-0 Worktree worktree-w2-a3g from origin/main. One build / one browser.
- S-1 Read About.module.css:400-420, About.tsx (how the evidence line renders and where the Caliper sits), components/marks/Caliper.tsx, tests/monochrome/gold-semantics.spec.ts, tests/monochrome/*about*, CLAUDE.md prime directive 4.
- S-2 TESTS FIRST: a monochrome assertion that no text node longer than the caliper label paints --gold in #about (and site-wide if cheap); capture failing → W2-A3G/02-tests-failing.log.
- S-3 Change the rule so the sentence is ink and only the caliper mark keeps gold; no dead CSS.
- S-4 Verify: monochrome + scene-about + about e2e green serially on :5633; tsc; lint; build:static; audit 10/10; screenshot of the line at 1440/390 → W2-A3G/.
- S-5 Ledger; commit 'fix(about): gold stays on the caliper mark, the sourced sentence returns to ink (palette rule)' with the two mandatory trailers; push worktree-w2-a3g.
- S-6 Return {task_id, branch, sha, pushed, push_denied, files_changed, gold_px_after, gates:{tests_failed_first, monochrome_green, about_suites_green, tsc, lint, build, audit_10_10, shader_untouched}, evidence:[], goal_complete}.

## QUALITY GATES
- Gold appears in #about only on the caliper mark(s); the evidence sentence is ink; test pins it
- About suites green; shader untouched; tsc · lint · build · audit 10/10; ledger; pushed; ≤ 20 min

## VERIFICATION
```bash
git ls-remote --heads origin worktree-w2-a3g
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T03:53:30.733Z)
running — dispatched 03:54Z fm-wave2-corrections-b (serialized: mv4 → m4b → l1m → a3g)
