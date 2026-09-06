# t_w2_h1sa — WAVE-2 architecture — G-H1 hero set-piece design brief (R1 bar): pick and specify ONE composition from t_w2_h1r so the first fold is a single dominant plane ≥75% with the monochrome photograph inside it, one headline, one sentence, one CTA group, ledger below the fold; TDD cases first; sliced into ≤30-min analyst-programmer tasks

**Status:** todo · **Priority:** 95 · **Parents:** t_w2_h1r · **Created:** 2026-09-06T00:59:04.056Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-REVIEW-20260905T2315Z §Hero FAIL: stacked hire landing over smoky GL wallpaper; recruiter cannot name the set-piece. Prior brief docs/architecture/HERO-FOLD-v2.md produced the current fold; it is superseded for the R1 bar by this task. Research input: docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md (three compositions, ranked). Constraints that cannot move: LCP < 2.5 s, CLS < 0.05, nothing plays by default, critical-path video ≤ 2.5 MB, palette B/W/gold (gold = sourced claim only), reduced-motion + no-GL paths fully readable, keyboard-navigable, monochrome portrait assets as shipped in 56ffed3e (1480x826 stills, 1280x720@24 loop; 4K master available for on-demand rungs), copy budget from app/data/portfolio/hero.ts (≤ 1 headline, ≤ 1 non-CV sentence, 1 CTA group; the three ledger figures move BELOW the fold).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: the research doc; docs/prompt.md §2.1, R1, R2, §0.3-1/-3/-6, §14; ADV-2315Z §Hero; GAP-BACKLOG G-H1/G-H2/G-NEW-1; docs/architecture/HERO-FOLD-v2.md + HERO-TASKS.json (what exists, what to supersede); components/sections/Hero/{Hero.tsx,Hero.module.css,HeroPortrait.tsx,HeroAtmosphere.tsx,atmosphere.glsl.ts}; components/gl/Scene.tsx; app/data/portfolio/{hero.ts,avatar.ts}; tests/e2e/hero-fold.spec.ts, tests/e2e/hero.spec.ts, tests/e2e/hero-photo.spec.ts, tests/overhaul/*hero* (the contracts that must keep holding or be consciously superseded — name each).
- S-2 Choose one composition (state why the others lose) and specify it precisely: fold geometry at 1440x900, 1280x800, 834x1194, 390x844 (ASCII + numbers: plane bounds, figure bounds, headline/sentence/CTA boxes, ledger top ≥ fold height); how the GLSL plane and the photograph merge (masking/compositing approach in the shader or CSS, light interaction); the on-demand 4K/loop behaviour (hover/focus/scroll trigger, budget); typography scale for the headline (brand must not be dwarfed — ADV: H1 60–131 px vs brand 16–18 px); the reduced-motion still; the no-GL still (poster AVIF 3840x2160 already exists — say how it is used); a11y (contrast ≥ 4.5:1 for every glyph over the plane, focus order, alt text); the recruiter sentence the fold is designed to produce.
- S-3 TDD cases FIRST (name file + assertion + threshold): dominant-plane ≥ 0.75 by luminance-weighted area at all four viewports (extend the SPD instrument idea from board t_h2_01 — define the measurement), text-leaf count in the fold ≤ 3 blocks (brand, headline, sentence) + 1 CTA group, ledger top ≥ innerHeight, photograph bounding box inside the plane bounds, LCP < 2.5 s and CLS < 0.05 on the export (tests/perf), contrast, reduced-motion path renders the still, ?gl=force 0 pageerrors, palette (no chroma outside gold on the fold), mobile 390 keyboard path.
- S-4 Slice the build into ≤ 30-min analyst-programmer tasks (2–4 slices, each independently shippable and visible: e.g. slice 1 = plane + figure compositing + ledger below fold; slice 2 = typography + CTA bar; slice 3 = on-demand 4K/loop + hover light; slice 4 = reduced-motion/no-GL polish), each with exact files, gates and the tests from S-3 it must turn green. Write everything to docs/architecture/HERO-SETPIECE-v3.md (new; HERO-FOLD-v2.md gets a one-line 'superseded by v3' header) and the slices to docs/architecture/HERO-TASKS.json (extend in place, mark old rows superseded).
- S-5 Return {task_id:'t_w2_h1sa', composition:'A|B|C', recruiter_sentence, geometry:{…}, tests:[…], slices:[{id,title,files,gates,minutes}], doc:'docs/architecture/HERO-SETPIECE-v3.md', goal_complete:true}. Read-only for app code; ≤ 30 min.

## QUALITY GATES
- One composition chosen with reasons; geometry numeric at four viewports
- Every immovable constraint addressed explicitly (LCP, CLS, autoplay, budget, palette, reduced-motion, no-GL, a11y)
- TDD cases named before code with thresholds
- Slices ≤ 30 min each, each visibly shippable
- Doc written; old brief marked superseded; no app code edited

## VERIFICATION
```bash
test -f /root/forgotten-mistory/docs/architecture/HERO-SETPIECE-v3.md && grep -c 'slice' /root/forgotten-mistory/docs/architecture/HERO-TASKS.json
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:05:36.047Z)
running — dispatched 01:07Z fm-wave2-sa (sequential, opus max)

## COMPLETE (2026-09-06T01:23:59.821Z)
SA delivered docs/architecture/HERO-SETPIECE-v3.md (35 kB; PM verified): composition A on mechanical grounds (SPD ink rule eliminates C, taints B; 1480x826 ceiling forbids full-bleed at 834), numeric geometry at four viewports, 18 TDD cases with thresholds (§8), four ≤30-min slices (§9) now on the board as t_w2_h1s1..s4.
