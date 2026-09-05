# R-c1 synthesised review — https://forgotten-mistory.web.app @ 6dcb4f53 (run v9-20260904T2312Z, cycle c1)

**Verdict: FAIL.** Seven blockers survive de-duplication across the three reviews (adversarial, composition, motion). Full prioritised backlog with acceptance checks: `backlog.json` (same directory).

Evidence tags: **Verified** = a reviewer (or this synthesis) observed it in-session and cites the artifact; **Inferred** = derived from code read / partial observation; **Assumed** = not measured this cycle.

## Failures first — blockers (priority order)

| # | id | section | finding | source(s) |
|---|----|---------|---------|-----------|
| 1 | B-01 | site-wide text token | 79 text nodes at **4.03:1** (#6E7178 on #0A0B0D, 12–14 px) fail WCAG AA; axe reported 0 violations and hid it (`adv/attack2.json → contrast.failing = 79`). Composition C8 (hero note 3.89:1) and C4(b) (experience readouts ≈3.3:1) are the same token. **Verified.** | adversarial F-2, composition C4/C8 |
| 2 | B-02 | #hero | 0 `<canvas>` on the path every no-GPU reader gets (`adv/attack2.json → canvasGlobal.count = 0`); under `?gl=force` the atmosphere mounts late and washes the paragraph grey-on-grey (`force-hero-left/right.png`, diff 38.0/255); right third of the hero (x 980–1344) is empty. **Verified.** Real-GPU behaviour **Assumed**. | adversarial F-1, motion M-01/M-04, composition C8 |
| 3 | B-03 | #listen | No visualisation in any path (`motion-observe.json listen: canvas false, svg false`; `adv/attack.json` listen 0/0/0). All three reviewers agree. **Verified.** | adversarial F-1, motion M-03 |
| 4 | B-04 | #experience | Strata shader "encodes nothing" by its own header and renders 0 canvas on this host; bars are static, hover only recolours a label (`experience-hover-track3.png`). **Verified.** | adversarial F-1, motion M-02 |
| 5 | B-05 | Caliper mark | The `self-reported` half-disc (U+25D0) renders as a stray apostrophe beside ≈92% / $5M+ / 10k+ at 1440, 390, 1920 (`capture/*-hero.png`). **Verified**; font-subset cause **Inferred**. | composition C1 |
| 6 | B-06 | page-wide | No vertical spine: left edges 72 / 176 / 96 / 96 / 96 / 168 (cards 72) / 352 at 1440. **Verified.** | composition C2 |
| 7 | B-07 | #listen | Gold hairline under the pull-quote marks no figure (`Listen.module.css:73 background: var(--gold)`); the same element is adversarial F-3's single `listen|backgroundColor|` hit. **Verified.** | composition C3, adversarial F-3 |

## Majors

- **M-01 #skills** — 14× gold `backgroundColor` in #skills (`adv/attack2.json → gold.unique`). Split decision: gold on a *measured-in-production* dot is contract-legitimate (motion M-07: 17 gold wires = data's production links, Verified); any dot not on such a fact is a forbidden fill. Audit each, re-express kept dots so a literal `background: var(--gold)` gate can be enforced in `overhaul_static_audit.mjs`. — adversarial F-3 / motion M-07
- **M-02 status dot** — Tailwind `animate-ping` still `running` under `prefers-reduced-motion: reduce` (`adv/attack.json → reducedMotion.runningAnimations = ["ping@SPAN"]`). Verified. — adversarial F-4
- **M-03 #experience** — bar fill 1.89:1 vs 3:1 non-text floor; readouts overrun the heading's right edge (1352–1382 vs 1344). Verified. — composition C4
- **M-04 MiniVic panel** — covers the H1 tail (x 988–1424), right margin 16 px vs launcher 24 px, chips clipped mid-word (`capture/1440x900-minivic-open.png`). Verified. — composition C5
- **M-05 #vitrine** — resting cards at opacity 0.42: title 3.87:1, body 2.9:1; card 03 sliced at x 1440, no mask, scrollbar hidden. Verified. — composition C6
- **M-06 #about** — compass numerals 2.89:1 (rgb(95,100,108) on rgb(26,27,31)). Verified. — composition C7

## Minor / polish (N-01 … N-07)

Vitrine drawings never trace on when lit (motion M-05) · MiniVic launcher is focusable #99 of 100, reached at Tab 92 (adversarial F-5) · ten About `<li>` in tab order, role unverified (adversarial F-6, Inferred) · compass idles at 0°/NO SCORES for scroll-only readers (motion M-06) · Bench capability-hover flat (motion M-07) · composition polish P1–P5 (blue-tinted greys, Skills double measure, 390 caliper rag, 390 no CTA above fold, Listen Email affordance) · mobile uQuality=0 frame budget unverifiable on this host (motion M-08, Inferred).

## Contradictions and how they were resolved

1. **Is `HeroAtmosphere` wired?** Adversarial F-1 said `grep` found no importer; motion M-01 rendered it under `?gl=force`. **Sided with motion.** Verified in this synthesis: `grep -rn "HeroAtmosphere\|CareerStrata" app components -l` → `components/sections/Hero/Hero.tsx`, `components/sections/Experience/Experience.tsx` (plus the two scene files). `components/gl/useGLCapability.ts:34-40` rejects swiftshader/llvmpipe unless `?gl=force`, which is why the adversarial census saw 0 canvas. The *observation* (no visual on the no-GPU path; Listen has none anywhere) stands and stays a blocker; the "dead code" cause does not. The adversarial acceptance test "fail if a scene file is imported by zero source files" is still worth adding as a regression guard.
2. **Contrast: token vs per-component.** Adversarial F-2 (one token, 79 nodes) vs composition C4/C8 (per-component `--mist-200`). **Sided with adversarial** for the fix (one line in `app/globals.css`), keeping composition's per-component targets as the acceptance floor where they exceed the token.
3. **Gold in #skills.** Adversarial F-3 (forbidden fill) vs motion M-07 (gold on production evidence, as designed). **Split**: per CLAUDE.md gold *is* the "measured in production" mark, so dots on production-sourced facts keep it; the rest are demoted; the audit gate is on the CSS property, not the colour. Both reviewers agree on the #listen hairline — removed (B-07).
4. **Hero right third.** Composition C8 (empty band) and motion M-01 (atmosphere washes copy) are complementary — merged into B-02: weight on the right, scrim on the left.

## What passed (re-verified by a reviewer, protect it)

Build-commit meta = 6dcb4f53 on the live origin · zero console/page errors in three independent runs · `/api/chat` 200 JSON 2.39 s (openai / gpt-4.1-mini) · CSP + HSTS + nosniff + frame-ancestors 'none' · every asset inside budget, videos `preload=none` · six sections in DOM order with visible headings at 1440 and 390 · three hero claims match the CV PDF · About compass, Skills bench trace, Vitrine raking light + snap work as designed.

## Not measured this cycle (Assumed)

LCP / CLS (no reviewer re-measured) · real-GPU hero/experience rendering · 834 and 1920 beyond the composition captures · MiniVic answer quality for the two audiences.

## Next ≤10-minute increment

**B-01**: `app/globals.css :root` secondary-text token #6E7178 → #8A8F9A, plus a per-text-node contrast Playwright spec ported from `adv/attack2.mjs` that fails below 4.5:1. Clears 79 AA failures in every section and installs the gate axe was silently missing.
