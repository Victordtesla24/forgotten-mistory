# Requirements & test matrix — see the spec

> **This file is a pointer, not the source of truth.** The authoritative, current
> requirements + acceptance criteria + the **one-test-case-per-requirement** matrix live in:
>
> - **`docs/overhaul/SPEC.md` §8 (functional requirements) / §9 (non-functional) / §10 (test cases)**
> - Binding requirements: **`docs/prompt.md`**
> - Live status / gaps: **`docs/overhaul/quality-assurance.md`** (QA-owned)
> - Task list: **`docs/overhaul/IMPLEMENTATION-PLAN.md`**
>
> The previous contents of this file described the pre-overhaul site (fictional roles,
> a wrong contact email) and are retired to avoid drift. Bound automated tests live under
> `tests/overhaul/*.spec.ts`, each named for the `TC-*` ID it verifies.

## TC → test binding (current)

| TC-* ID | Bound test |
|---|---|
| TC-FR-SCROLL | `tests/overhaul/scroll.spec.ts` |
| TC-FR-SIGFX / SHADER / LIGHT | `tests/overhaul/signature.spec.ts` |
| TC-FR-NAV / ABOUT / EXP / SKILLS / SEO / RESP | `tests/overhaul/sections.spec.ts` |
| TC-FR-HERO (name, position line, ≥1 metric, 2 dual-pillar CTAs — employer "Review experience" + client "See outcomes" — GitHub/YouTube/CV present & resolve 200) | `tests/overhaul/hero.spec.ts` |
| TC-FR-PROOF | `tests/overhaul/proof.spec.ts` |
| TC-FR-CONTACT | `tests/overhaul/contact.spec.ts` |
| TC-NFR-TONE / MONO / PERF / PARITY / TYPE / SEC / COMPLETE | `tests/overhaul/audit.spec.ts` (runs `scripts/validate/overhaul_static_audit.mjs` — 8 checks incl. `TC-NFR-TYPE`, `TC-ARCH-BENCH`, `TC-NFR-COMPLETE`; **PERF here = per-asset media budgets only**) |
| TC-NFR-COMPLETE (0 truncation/placeholder/stub markers in `app\|components\|lib`) | `tests/overhaul/audit.spec.ts` → `overhaul_static_audit.mjs` `checkComplete` |
| TC-NFR-PERF (first-view payload ≤2.5 MB + CLS <0.05, deterministic; static `out/` served with gzip, measured to `load`) | `tests/overhaul/perf.spec.ts` (Lighthouse perf≥90/LCP<2.5s/TBT<200ms companion = `scripts/validate/phase02_lighthouse.sh` on `/`) |
| TC-NFR-TS | `tests/overhaul/audit.spec.ts` (runs `tsc --noEmit`) |
| TC-NFR-TYPE | `tests/overhaul/typography.spec.ts` (+ `audit.spec.ts` `checkFonts`) |
| TC-NFR-SEC (headers + fail-loud + `out/` leak) | `tests/overhaul/security.spec.ts` |
| TC-NFR-A11Y | `tests/overhaul/a11y.spec.ts` (`@axe-core/playwright`, gates critical+serious) |
| TC-NFR-DURABLE (offline-after-visit reload: core content + CV from cache; static `out/` served with gzip via `helpers/staticServer`, `context.setOffline(true)`) | `tests/overhaul/durable.spec.ts` (service worker `public/sw.js` + `components/site/ServiceWorkerRegister.tsx`) |

Remaining `TC-*` (CHAT, VOICE, CLONE/CLONE-LIVE, VOICE-DYN, SYNTH, MINDSET, SECONDARY,
U-STATE, INT-CLONE, FPS, RENDER, COMPAT, NN-2/3) get their bound spec as each
feature lands — tracked in `IMPLEMENTATION-PLAN.md`. (NN-1 dual-pillar is now asserted
in the hero via `hero.spec.ts`; per-section NN-1 audit across all sections remains.)
