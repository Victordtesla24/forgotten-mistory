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
| TC-FR-EXP-ACCORDION | `tests/overhaul/sections.spec.ts` |
| TC-FR-EXP-WEBGL | `tests/overhaul/sections.spec.ts` |
| TC-FR-EXP-REDUCED-MOTION | `tests/overhaul/sections.spec.ts` |
| TC-FR-DETAILFX (FloatingDetailBox FLIP panel, 2-D particle convergence, HUD corners, scanline sweep, reduced-motion flatten) | `tests/overhaul/floating-panels-animation.spec.ts` |
| TC-FR-DETAILFX-R5 (FloatingDetailBox 3-D glass-refraction layer — `components/fx/FloatingGlassPanel.tsx`: WebGL `[data-detail-glass][data-gl=webgl]` canvas mounts on open, pointer-driven tilt physics writes `--tilt-x`/`--tilt-y` + relaxes to ~0 on centre, canvas torn down on Esc-close with no leaked context, zero WebGL console errors across open→hover→close, reduced-motion renders no 3-D layer) | `tests/overhaul/floating-panels-animation.spec.ts` |
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
| TC-FR-CATALOG (curated catalogue lists ≥10 distinct repos — corporate + personal — and every catalogue link resolves <400; dynamic `#github-projects` feed excluded so the count is a deterministic guard. **Per-repo dedicated-effect mapping per §7/§2.1 remains fan-out scope**) | `tests/overhaul/catalog.spec.ts` |
| TC-FR-SYNTH (the `#synthesis` section shows every §6 source consulted — résumé + repo/commits/READMEs, YouTube descriptions, local profile files, operational traces, public accounts — and ≥1 rendered fact traces to a non-résumé source) | `tests/overhaul/synthesis.spec.ts` (data: `synthesisSources` in `app/data/siteContent.ts`; view: `components/site/SynthesisProvenance.tsx`) |
| TC-FR-MINDSET (the `#mindset` section projects the four balanced-persona dimensions — technical depth, multi-million-dollar program scale, multi-year/decades execution, multi-layered tangible value [≥2 of time saved/risk reduced/cost avoided] — each number-led and source-traceable; ≥1 $5M+ scale claim and ≥1 15+ year claim rendered; `miniVicKnowledge` carries the same signatures) | `tests/overhaul/mindset.spec.ts` (data: `projectionDimensions` in `app/data/siteContent.ts`; view: `components/site/MindsetProjection.tsx`) |
| TC-NN-2 (the `#dossier` "leave-behind" gives BOTH first-class personas — employer + client — a downloadable one-page dossier [the CV PDF, resolves 200], carries the recurring monochrome signature motif, and keeps the live clone reachable; recall heuristic = identity + position line + ≥3 number-led signatures that trace to the canonical `proof` data) | `tests/overhaul/dossier.spec.ts` (data: `dossier` in `app/data/siteContent.ts`; view: `components/site/Dossier.tsx`) |

Remaining `TC-*` (CHAT, VOICE, CLONE/CLONE-LIVE, VOICE-DYN, SECONDARY,
U-STATE, INT-CLONE, FPS, RENDER, COMPAT, NN-3) get their bound spec as each
feature lands — tracked in `IMPLEMENTATION-PLAN.md`. (NN-1 dual-pillar is now asserted
in the hero via `hero.spec.ts`; per-section NN-1 audit across all sections remains.)
