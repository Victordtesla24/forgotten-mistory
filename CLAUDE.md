# CLAUDE.md — operating guide for AI agents (and humans)

You are working on **Vikram Deshpande's portfolio** (`forgotten-mistory`). This file gives
you the agency to maintain, improve, support, and scale the site without re-deriving
everything. **User instructions always take precedence over this file.**

**Binding source of truth:** `docs/prompt.md` (the owner's prompt) defines the requirements and
success criteria; `docs/overhaul/SPEC.md` is kept in 1:1 parity with it and records any
reality-forced deviations explicitly (§0.1). Read both before non-trivial work. Mandated stack
beyond the obvious: **GSAP + ScrollTrigger** (scroll orchestration), **custom GLSL shaders +
volumetric stage lighting** on flagship scenes, and a **native D-ID ↔ ElevenLabs WebSocket**
frame-accurate (~40 ms) live lip-sync pipeline on the dynamic deployment.

## Prime directives (do not violate)

1. **Two audiences are first-class:** potential employers and business clients. Every change
   must serve at least one without harming the other. (SPEC §2, non-negotiable NN-1.)
2. **Memorable takeaway:** a visitor must leave with something concrete — the CV dossier, a
   booking path, and a signature visual motif. (NN-2.)
3. **Restrained, evidence-led tone.** No boastful/superlative copy or bragging visualisations.
   Numbers over adjectives, every claim traceable to the resume. (NN-3.) Enforced by
   `node scripts/validate/overhaul_static_audit.mjs` (tone linter).
4. **Monochrome only.** Near-black inks, cool greys, one luminous white accent — no hue.
   Colours come from `:root` tokens in `app/globals.css` and `lib/palette.ts`. Never hardcode
   hex in components (the audit fails the build if you do).
5. **Tests before features.** Add/extend the test case before changing behaviour. The owner's
   hard rule: no feature code lands without a corresponding test (SPEC §10).
6. **No secrets in client code or commits.** Read keys from env; required keys fail loud
   (explicit non-zero crash naming the missing key — never a silent fallback; SPEC NFR-SEC).
   `.env.production` contains an SSH key, GitHub PAT, and a macOS sudo password — treat the
   whole file as radioactive. Never print or commit it.

## Repo orientation (where things live)

- **Content (single source of truth):** `app/data/{siteContent,resumeContent,miniVicKnowledge}.ts`,
  kept in parity with `public/docs/Vik_Resume_Final.pdf`. Change facts only here.
- **Page composition:** `app/page.tsx` (one page, all sections), `app/layout.tsx` (metadata/JSON-LD).
- **Styling/tokens:** `app/globals.css` (`:root` monochrome tokens), `design-tokens.json`.
- **Scene colours:** `lib/palette.ts` (the ONLY place raw hex lives for WebGL/Canvas).
- **Components:** `components/site/*` (DOM/Framer), `app/components/SpaceScene.tsx` (R3F),
  `components/MiniVicBot.tsx` (clone UI), `lib/miniVicBrain.ts` (clone reasoning ladder).
- **Dynamic backend (optional):** `services/api-gateway` (multi-LLM), `services/realtime-orchestrator`,
  viseme bridge. Powers the live clone; the static site works without it.
- **Tests/validation:** `tests/*`, `scripts/validate/*` (21 phases + `overhaul_static_audit.mjs`).
- **Docs:** `docs/overhaul/` (SPEC, ARCHITECTURE, SYSTEM-DESIGN, MOTION-AND-FX-SPEC, TECH-STACK, EDGE-CASES).

## Workflow (every change)

1. **Read** the relevant doc(s) in `docs/overhaul/` first.
2. **Branch:** work on `overhaul/*` or a feature branch — never directly on `main` without
   the owner's OK. Baseline is recoverable at tag `pre-overhaul-baseline`.
3. **Test-first:** add/extend a test (`tests/*` Playwright, or a check in the audit script).
4. **Implement** to green. Keep diffs small and one-concern.
5. **Verify:** `npm run lint` + `npx tsc --noEmit` + `node scripts/validate/overhaul_static_audit.mjs`
   + relevant `npm run validate:*`. For UI, capture a screenshot.
6. **Log:** append the result row to `docs/execution-log.md`.
7. **Deploy/push:** owner-gated. Local-first. Ask before Firebase deploy, `git push`, or any
   paid D-ID/ElevenLabs API call. (This deliberately overrides the prompt's "Total Autonomy /
   publish directly to production" clause — see SPEC §0.1 DEV-5. Build/test/V&V are fully
   autonomous; only the final production publish waits for the owner.)

## How to add a project "signature effect" (common task)

Each GitHub project maps to one monochrome micro-visualisation (SPEC §7, MOTION-AND-FX-SPEC).
1. Pick the project + its effect from the SPEC §7 catalogue.
2. New component under `components/fx/<Effect>.tsx`. Colours from `lib/palette.ts` / CSS vars.
3. Provide a `prefers-reduced-motion` static fallback (mandatory).
4. Add an entry to the project catalogue data; link to the real repo (must resolve 200).
5. Test: mounts, animates, no console errors, FPS budget, reduced-motion fallback.

## Definition of done (any task)

- `tsc` clean, `lint` clean, static audit 7/7, relevant Playwright green.
- Lighthouse mobile: perf ≥90, a11y ≥95; LCP<2.5s; CLS<0.05; no asset >500KB.
- Reduced-motion path works; keyboard-navigable; monochrome; tone clean; parity intact.
- Execution log updated.

## Gotchas

- **Static export ≠ server.** `app/api/*` does not run on Firebase. Don't rely on it for the
  public site; use the 3-tier brain fallback or the `services/` deployment.
- **mix-blend-mode: screen** in SpaceScene blows out bright colours — keep scene values dark.
- **DPR is capped** in scenes for mobile FPS; don't raise it blindly.
- **Env key name drift:** canonicalise D-ID to `DID_API_KEY` (see EDGE-CASES EC-CFG-01).
- **Contact icons (RESOLVED, D-4):** the two 6 MB JPEG contact icons
  (`public/assets/{EMAIL,TELEPHONE}.jpeg`) were deleted and replaced with inline SVG; the
  perf-budget breach is fixed. Don't go hunting for these files — they no longer exist.
