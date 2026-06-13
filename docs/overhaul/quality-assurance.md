# Quality Assurance — Living Register (forgotten-mistory overhaul)

> **Sole-maintainer living document.** Owned and updated by the QA agent (Claude) ONLY. No other
> agent, contributor, or process may edit it. It is the single, continuously maintained record of
> every implementation gap, incomplete feature, bug, unfinished success criterion, requirement
> drift, and UI/VFX/architecture/test/CI inconsistency in the project, plus the overarching
> governance view.
>
> **Source of truth:** requirements = `docs/prompt.md`; specification = `docs/overhaul/SPEC.md`
> (+ companions); content = `app/data/{siteContent,resumeContent,miniVicKnowledge}.ts` ⇄
> `docs/Vik_Resume_Final.pdf`. This register reports the **delta** between that source of truth
> and the **actual current code**, and reconciles all 9 overhaul docs to zero drift.

---

## 0. Governance & QA policy (binding)

1. **Single owner.** Only the QA agent edits this file. Any edit by another party is a policy
  breach to be reverted and logged in §10.
2. **Update on every task.** At the **start** of every task: re-read this register, re-verify the
  findings the task touches, update `Status`, append a §10 changelog row. At the **end**:
   re-verify what changed, update again.
3. **Evidence rule — no unverified assertions.** Every finding cites a `file:line`, a command +
  output, or a source-of-truth line. Anything needing runtime/visual is marked `**UNVERIFIED`**.
   A passing automated audit is NOT closure if its scope is narrower than the requirement.
4. **Spotless bar.** `RESOLVED` only on fresh re-verified evidence; `VERIFIED` only when the
  bound SPEC §10 test passes. No finding closes on assertion.
5. **Severity.** `BLOCKER` > `HIGH` > `MEDIUM` > `LOW`. `MONO`/`TONE`/`A11Y` ≥ `HIGH`.
6. **Status legend.** `OPEN` · `IN-PROGRESS` · `RESOLVED` (fixed+re-verified) · `VERIFIED` (SC
  test green) · `WAIVED` (owner-approved DEV-* deviation) · `UNVERIFIED` (needs probe/visual).
7. **No scope silence.** Skipped/sampled/capped checks are stated, never implied as covered.
8. **HMR discipline.** Browser suites are NOT run while the implementation agent edits a shared
  dev server — concurrent runs cause false failures. QA holds runs until the edit-hold is released.

**Last audit:** 2026-06-14 (re-audit **#8** — spec-fidelity guardian **iteration-1 verification of
TC-NFR-PERF**). QA independently re-ran the full chain (no contention: ports 3000/8080 free, no live
next/playwright/lhci procs, `out/` freshly built 08:43): `npx tsc --noEmit` **0**, `npm run lint`
**clean**, `overhaul_static_audit.mjs` **7/7**, `npx playwright test tests/overhaul --workers=1`
**30 passed** (1.7 min, exit 0, no flap), and the perf **negative control** (`PERF_PAYLOAD_BUDGET=100000
PERF_CLS_BUDGET=0`) **2 failed** (gate bites). **Independent perf numbers:** first-view transfer
**596.7 KB**, CLS **0.0011** (orchestrator reported 907.3 KB / 0.0005 — payload is non-deterministic
with Next prefetch timing; both far under the 2.5 MB / 0.05 budgets, 3–4× headroom). **Anti-fake-green
PASS:** measured against the static `out/` export with gzip, to the `load` event; deferred hero/MiniVic
video (`preload="none"`+IO-gated) correctly excluded and separately capped per-asset by the audit;
neg-control proves the gate. **TC-NFR-PERF payload+CLS → RESOLVED/test-green.** Recorded honestly:
the **Lighthouse perf/LCP/TBT sub-dimension** is now wired to the homepage `/` (lhci +
`phase02_lighthouse.sh` repointed off `/performance-benchmark`) but **UNVERIFIED pending an isolated
CI/owner-env run**; **OPEN RISK: the R3F homepage may score <0.90** (QA-PERF-02). Added the missing
`TC-NFR-PERF → tests/overhaul/perf.spec.ts` binding to `tests/requirements_list.md`. Prompt↔SPEC
§3.5/§10 wording re-confirmed to match the implemented gate (0 drift).
**Prior re-audit #7 — spec-fidelity guardian **iteration-0 baseline** for the
MVP-completion orchestration loop: full QA chain re-run from clean; **all gates GREEN** — `lint` 0,
`tsc --noEmit` 0, static audit **7/7**, `tests/overhaul` **28 passed / 0** deterministic
(`--workers=1`, 1.9 min, exit 0). A first default-config run reported **3 fails** (`signature.spec:20`,
`typography.spec:60`, `typography.spec:75`) and was **isolated as cold-dev-server + 2-worker flap**
(headings computed `Times` = Space-Grotesk FOUT; numerals `normal`; WebGL init under GPU contention;
local config is `workers:2, retries:0`) — refuted by (a) the serial 28/0 in which those exact 3
tests pass, (b) the prior #6 28/0 on the same uncommitted tree, and (c) the PASS of static
`checkFonts`/`TC-NFR-TYPE`; recorded as **QA-TEST-05**. Corrected **4 doc-drift items** (TECH-STACK
GSAP "not yet wired"→wired&met + audit 7-checks enumeration; ARCHITECTURE "no imperative DOM script
layer"→GSAP scroll layer + signature-HUD component families). **Prompt↔SPEC parity re-confirmed
materially clean** (every prompt §1–§7 obligation maps to an FR/NFR/TC/NN/DEV-* entry). Prior
re-audit #6 — BASELINE pass: reconciled D-6 320px, `a11y.spec`, `security.spec`.)
**Branch:** `overhaul/marvel-grade-portfolio` · **HEAD:** 667d339 (pre-overhaul) — **all overhaul
work is uncommitted on the working tree**. **Method:** static read of working tree +
`npm run lint` (**clean — no ESLint warnings or errors**) + `npx tsc --noEmit` (**exit 0**) +
`overhaul_static_audit.mjs` (**7/7** — TONE·MONO·PERF·PARITY·**TYPE**·SEC·**ARCH-BENCH**) +
`npx playwright test tests/overhaul`.

- **Environment finding:** the local runtime is **Node v26.3.0** while the repo pins **Node 20.x**
(`package.json` `engines.node: "20"`; CI uses Node 20). All gates ran clean under Node 26 this
pass (only benign `DEP0205 module.register()` deprecation + a `baseline-browser-mapping` staleness
notice — neither fails a check), but the authoritative gate remains Node 20 on CI; treat any
Node-26-only behaviour as non-canonical.
- **`tests/overhaul/` suite re-run this pass: 28 passed / 0 skipped** on system Chrome
(`npx playwright test tests/overhaul`, 1.1 min, exit 0) — grew from 24/1-skipped (#5) to **28/0**:
the 320px `TC-FR-RESP` assertion is now **first-class and GREEN** (no `fixme`/skip — D-6 fixed),
and `a11y.spec.ts` (1) + `security.spec.ts` (5) run green. The system-Chrome path
(`channel:'chrome'`, `CI` unset in `playwright.config.ts`) is the faithful local gate; terminals
were idle (one idle Claude Code session, port 8080 free) so **no HMR-collision risk**.
- **Re-audit #7 (iteration-0 baseline) re-run: 28 passed / 0** — the gate was re-run from clean
(orchestrator idle at a `/clear` prompt, port 8080 free). The default config (`workers:2`) first
reported 3 fails on a cold dev server (font/WebGL flap); the **deterministic `--workers=1` re-run
returned 28/0** with the exact 3 flaky tests green, confirming a test-harness flap not a code
regression (see **QA-TEST-05**). **Faithful local gate recommendation:** run the overhaul browser
suite with `--workers=1` (matches CI's `workers:1`), or pre-warm `npm run dev`, to avoid
cold-server FOUT/WebGL false-fails on `workers:2, retries:0`.
**Not run this pass (still UNVERIFIED):** Lighthouse mobile (perf/LCP/CLS/TBT) + first-view
network payload trace, FPS probe, 3-browser (webkit/firefox) CI-on-push, voice-id/lip-sync
sampling, offline durability, per-browser cinematic render-compliance.

---

## 1. Governance dashboard

**Overall verdict: ~55–60% done · MVP feature/test/CI layer largely VERIFIED · NOT deploy-ready ·
NOT whole-overhaul-complete.** The three stated MVP BLOCKERs (Phase-1 tests + CI, FR-PROOF,
FR-CONTACT) are cleared and test-backed; **typography (P1-4) and the `/performance-benchmark`
export-exclusion are now also cleared & test-backed (re-audit #5)**. What remains is substantial
SPEC scope (AI clone voice/lip-sync, project catalogue, multi-source synthesis, the **entire
cinematic asset/VFX layer**, NN dual-pillar/rememberability) plus all the runtime budgets
(Lighthouse / axe / FPS / payload / durability) which are still UNVERIFIED.


| Dimension                         | Verdict                           | Worst sev   | Headline (evidence)                                                                   |
| --------------------------------- | --------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| Success criteria (SPEC §10)       | Partial                           | HIGH        | **~16/41 VERIFIED** + ~7 RESOLVED/partial (A11Y/SEC now test-backed); clone/perf/synth/catalogue/NN open |
| Website architecture / IA         | Mostly done                       | MEDIUM      | `#proof` ✅; `/performance-benchmark` **excluded from export** (prune+notFound+TC-ARCH-BENCH); `architecture-lab` review |
| System design                     | Partial                           | MEDIUM      | `services/` scaffolded; live clone not wired to UI                                    |
| UI colour (NFR-MONO)              | **RESOLVED (code)** · (V) visual  | was BLOCKER | audit 7/7; `lib/palette.ts`; greys; 1 stale comment                                   |
| UI typography (NFR-TYPE)          | **VERIFIED** ✅                    | was HIGH    | 2 families (Inter+Space Grotesk) self-hosted; Playfair/Roboto/Source-Sans dropped; `typography.spec` 4✓; audit TYPE PASS |
| Text overflow / overlap (FR-RESP) | **VERIFIED** ✅                    | was MEDIUM  | 320/375/768/1280/2560 all ✅ (D-6 fixed; 320 first-class no-skip — `sections.spec`)    |
| VFX & signature effects           | **RESOLVED (runtime)** · (V)      | was BLOCKER | HUD mounted ×2, shader compiles, zero WebGL errors                                    |
| Cinematic asset/VFX layer         | **OPEN**                          | HIGH        | only avatar media; NO AI imagery/SVG/templates/dossier — rememberability gap          |
| Visual aesthetics / recall        | IN-PROGRESS                       | HIGH        | monochrome HUD recurs ×2; full motif/dossier/recall not yet there                     |
| Test architecture                 | **RESOLVED**                      | was BLOCKER | `tests/overhaul/` TC-bound specs; `requirements_list.md` repointed (+TYPE/SEC/A11Y rows, #6); suite **28 passed/0 skipped** green (re-audit #6) |
| GitHub CI management              | **RESOLVED (code)** · (V) on-push | was HIGH    | `deploy.yml`: quality+3-browser+lighthouse+axe+gated build                            |
| Information presentation / tone   | RESOLVED · manual pending         | was BLOCKER | sci-fi removed; audit widened+PASS; TC-NN-3 manual sign-off pending                   |
| Security / secrets (NFR-SEC)      | **RESOLVED (code+test)** · owner  | was HIGH    | `security.spec` 5✓: fail-loud names GEMINI_API_KEY · CSP/HSTS/nosniff/XFO/Referrer/Permissions present · no `out/` leak. Open = owner decision on client-inlined Gemini key (DEV-8 vs proxy) |
| Content correctness / parity      | Good                              | LOW         | catalogue links real; parity reconciled; QA-CON-03 "Twenty years" nit                 |
| Implementation completeness       | Good                              | LOW         | `tsc` clean; no truncation; audit harness                                             |
| Doc consistency (9 docs)          | **RESOLVED**                      | was HIGH    | 11+ drift items reconciled                                                            |


**✅ Cleared & QA-verified across this overhaul (do not regress):**

- **FR-SCROLL** — GSAP ScrollTrigger (`lib/gsap.ts` + `ScrollRail.tsx`, page.tsx:423); `scroll.spec` 2 passed.
- **Signature HUD motif** — `HudFrame`→`TelemetryHud` ×2 (page.tsx:211,:499), zero WebGL errors; `signature.spec` 1 passed.
- **Sci-fi persona removed** + TONE audit widened (meta/OG/JSON-LD/alt/aria) and PASS.
- **NFR-TYPE (typography, P1-4)** — 2 families only: `Inter` (body) + `Space_Grotesk` (grotesque display), self-hosted via `next/font` (`app/layout.tsx:2,11-23`; `globals.css:31-34`); Playfair/Roboto/Source-Sans/Source-Code dropped; tabular numerals; `typography.spec` 4 passed; static-audit `TC-NFR-TYPE` PASS.
- **QA-ARCH-02 (`/performance-benchmark`)** — excluded from the public static export: page `notFound()` under `NEXT_PUBLIC_STATIC_EXPORT=1` + `prune_static_export.mjs` deletes emitted artifacts; `TC-ARCH-BENCH` audit guard; execution-log OV6 (out artifacts = 0).
- **P1-1 tests + CI** — `tests/overhaul/` specs (scroll/signature/sections/proof/contact/audit/typography/security) → **24 passed/1 skipped** (re-audit #5); `deploy.yml` rewritten (quality `tsc`+audit → 3-browser test → Lighthouse → axe → gated build); `requirements_list.md` → SPEC §10; **real nav-open bug fixed** (`.nav-overlay.active`→`.open`), TC-FR-NAV green.
- **FR-PROOF** — `#proof` (`ProofBar.tsx`) count-up, 4 resume metrics, tabular, reduced-motion; `proof.spec` green.
- **FR-CONTACT** — `#contact` Book-a-conversation CTA + in-section CV (200 PDF) + channels; `contact.spec` green.

**MVP BLOCKERs: all cleared.** **Not deploy-ready** because the following remain (none is a
single "blocker," but all gate a credible production launch):

1. **Runtime budgets partially UNVERIFIED** — Lighthouse (perf/LCP/CLS/TBT) + first-view payload
  ≤2.5 MB trace, FPS probe, 3-browser (webkit/firefox) CI-on-push, offline durability, per-browser
  render-compliance. **Cleared this pass:** 320px overflow (D-6, `sections.spec` 320 green) and
  home-page axe (a11y.spec 0 critical+serious) are now test-backed locally.
2. **AI clone incomplete** — real avatar↔audio lip-sync (≤120 ms) and cloned-voice-id authenticity
  (TC-FR-CLONE/VOICE); ambient/triggered voiceover (VOICE-DYN); live D-ID path (CLONE-LIVE).
3. **Cinematic asset/VFX layer absent** — no AI imagery, SVG iconography, templates, finishing
  textures, or the one-page dossier artifact (NN-2 rememberability) — the owner's emphasis.
4. **Remaining SPEC scope** — project catalogue (≥10 + link-200), multi-source synthesis,
  NN-1 dual-pillar audit, NN-2 recall, NN-3 manual tone sign-off, security key resolution.

---

## 2. Success-criteria status — SPEC §10 (re-verified 2026-06-14 #6)

`Status` = evidence-backed read today. `Test?` = a bound `tests/overhaul/` spec exists.


| TC ID            | Status                                       | Test?              | Evidence                                                                                                                                                  |
| ---------------- | -------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-FR-BOOT       | UNVERIFIED                                   | No                 | `.preloader` exists (waited-on in specs); counter→100 not asserted                                                                                        |
| TC-FR-NAV        | **VERIFIED** ✅                               | Yes                | `sections.spec` (menu opens/lists/Esc); real bug fixed (`.open`)                                                                                          |
| TC-FR-HERO       | Partial                                      | Partial            | `site.spec` checks identity/CTA/resume; **dual-pillar NN-1 CTAs not explicitly audited**                                                                  |
| TC-FR-PROOF      | **VERIFIED** ✅                               | Yes                | `ProofBar.tsx` `#proof` + count-up + reduced-motion; `proof.spec` 2 passed                                                                                |
| TC-FR-ABOUT      | **VERIFIED** ✅                               | Yes                | `sections.spec` (#about title + bio)                                                                                                                      |
| TC-FR-EXP        | **VERIFIED** ✅                               | Yes                | `sections.spec` (ATO+ANZ roles, dates)                                                                                                                    |
| TC-FR-SCROLL     | **VERIFIED** ✅                               | Yes                | `scroll.spec` 2 passed; matchMedia reduced-motion; ctx.revert                                                                                             |
| TC-FR-SIGFX      | **VERIFIED** ✅                               | Yes                | `signature.spec` — HUD ×2 sections, zero WebGL errors                                                                                                     |
| TC-FR-SHADER     | **VERIFIED** ✅                               | Yes                | custom GLSL `ShaderMaterial` compiles at runtime (`signature.spec`)                                                                                       |
| TC-FR-LIGHT      | **RESOLVED** · (V) visual                    | Yes                | volumetric pass renders in mounted HUD; cinematic visual review pending                                                                                   |
| TC-FR-CATALOG    | Partial                                      | No                 | siteContent lists 9 real repos; no per-link-200 test; <10                                                                                                 |
| TC-FR-SKILLS     | **VERIFIED** ✅                               | Yes                | `sections.spec` (#skills groups incl. credentials)                                                                                                        |
| TC-FR-SYNTH      | OPEN                                         | No                 | no multi-source synthesis evidenced                                                                                                                       |
| TC-FR-MINDSET    | UNVERIFIED                                   | No                 | dimensions present in KB; not asserted by a test                                                                                                          |
| TC-FR-CHAT       | Partial                                      | Partial(site.spec) | brain+KB answers an employer Q (site.spec); intent battery untested                                                                                       |
| TC-FR-VOICE      | **FAIL/UNVERIFIED**                          | No                 | greeting MP3 plays; voice-id/asset-hash authenticity unverified (D-1)                                                                                     |
| TC-FR-VOICE-DYN  | OPEN                                         | No                 | ambient+triggered-to-view-transition absent                                                                                                               |
| TC-FR-CLONE      | **FAIL**                                     | No                 | avatar `<video muted>`; "lip-sync" is a 2D canvas waveform — no real sync (D-2)                                                                           |
| TC-FR-CLONE-LIVE | OPEN                                         | No                 | `services/` scaffolded; not wired behind a flag                                                                                                           |
| TC-FR-CONTACT    | **VERIFIED** ✅                               | Yes                | `#contact` Book-a-conversation + in-section CV (200 PDF) + channels; `contact.spec` 1 passed (booking is env-URL or mailto fallback — owner action below) |
| TC-FR-PARITY     | RESOLVED (partial)                           | Yes(audit)         | `audit.spec`/audit checks key resume facts present; not a full automated diff                                                                             |
| TC-FR-SEO        | **VERIFIED** ✅                               | Yes                | `sections.spec` (JSON-LD Person+WebSite + OG)                                                                                                             |
| TC-FR-RESP       | **VERIFIED (320–2560)** ✅        | Yes                | `sections.spec` no h-scroll at 320/375/768/1280/2560 (D-6 fixed; 320 first-class, no skip) — 5/5 green                                                                                    |
| TC-NFR-PERF      | **RESOLVED (payload+CLS, test-green)** · Lighthouse sub-dim UNVERIFIED | Yes(`perf.spec`+audit) | **`perf.spec.ts` GREEN** on static `out/` served with gzip, measured to `load`: first-view transfer **596.7–907.3 KB ≤ 2.5 MB** (3–4× headroom), **CLS 0.0005–0.0011 < 0.05**; **neg-control (`PERF_PAYLOAD_BUDGET=100000 PERF_CLS_BUDGET=0`) = 2 failed** (gate bites, QA re-verified). Deferred hero/MiniVic video (`preload="none"`+IO-gated, `HeroAvatar.tsx:40-42,83`; `MiniVicBot.tsx:1188`) correctly excluded from first-view; each media file still capped per-asset by audit PERF (`overhaul_static_audit.mjs:116-136`: img≤0.5/video≤2.5/audio≤1 MB). **UNVERIFIED:** Lighthouse perf≥90/LCP<2.5s/TBT<200ms on `/` — `lighthouserc.json`+`phase02_lighthouse.sh` repointed `/performance-benchmark`→`/` but **not yet run in an isolated CI/owner env**; **OPEN RISK: R3F/three.js homepage may score <0.90** (cf. R1 production perf=0.54 on the real home vs 0.99 on the lightweight benchmark page) |
| TC-NFR-FPS       | UNVERIFIED                                   | No                 | probe exists; not run this pass                                                                                                                           |
| TC-NFR-RENDER    | UNVERIFIED                                   | No                 | per-browser render-compliance not run                                                                                                                     |
| TC-NFR-TS        | **VERIFIED** ✅                               | Yes                | `audit.spec` asserts `tsc --noEmit` 0; CI `quality` job runs it                                                                                           |
| TC-NFR-COMPLETE  | Likely PASS                                  | No                 | no truncation markers                                                                                                                                     |
| TC-NFR-A11Y      | **RESOLVED** · (V) kbd/focus+LH             | Yes                | `a11y.spec` GREEN — axe wcag2a/2aa/21a/21aa, **0 critical + 0 serious** on home (whole single-page site); CI `phase06` too. (V) explicit kbd-path + focus-visible E2E + Lighthouse a11y≥95                                                                                                   |
| TC-NFR-TONE      | **VERIFIED** ✅                               | Yes                | `audit.spec`; banned-list widened + scans data/layout/meta/OG/JSON-LD/alt/aria; PASS                                                                      |
| TC-NFR-MONO      | **VERIFIED (code)** · (V)                    | Yes(audit)         | `audit.spec` MONO PASS; palette greys; visual pass pending |
| TC-NFR-TYPE | **VERIFIED** ✅ | Yes | 2 families (Inter+Space Grotesk) self-hosted via next/font (`layout.tsx:2`); Playfair/Roboto/Source-Sans dropped; tabular; `typography.spec` 4 passed; audit TYPE PASS                                                                                                |
| TC-NFR-SEC       | **RESOLVED (code+test)** · owner-decision    | Yes(security.spec) | `security.spec` 5✓ — fail-loud names GEMINI_API_KEY on prod static-export; CSP/HSTS/nosniff/XFO/Referrer/Permissions present; no `out/` leak. Open = owner decision on client-inlined Gemini key (DEV-8 vs proxy); DID/ELEVENLABS fail-loud lives in `services/`                                                               |
| TC-NFR-COMPAT    | UNVERIFIED on-push                           | CI 3-browser job   | CI installs chromium+webkit+firefox; only chromium run locally                                                                                            |
| TC-NFR-DURABLE   | UNVERIFIED                                   | No                 | offline reload not probed                                                                                                                                 |
| TC-NN-1          | OPEN                                         | No                 | per-section employer+client dual action audit not done                                                                                                    |
| TC-NN-2          | Partial                                      | No                 | HUD motif recurs ×2; dossier artifact + recall heuristic not there                                                                                        |
| TC-NN-3          | Automated PASS · **manual sign-off pending** | Partial            | sci-fi removed + NFR-TONE pass; manual review pending ('story' prose theatrical)                                                                          |
| TC-FR-SECONDARY  | OPEN                                         | No                 | clone+chatbot+voiceover not yet exercised as one non-degraded smoke pass                                                                                  |
| TC-U-STATE       | OPEN                                         | No                 | no unit suite for chat-buffer / voiceover-transition / count-up / avatar-lifecycle reducers                                                               |
| TC-INT-CLONE     | OPEN                                         | No                 | D-ID↔ElevenLabs WebSocket lifecycle integration test not authored                                                                                         |


**~16 / 41 VERIFIED** (NAV, PROOF, ABOUT, EXP, SCROLL, SIGFX, SHADER, SKILLS, CONTACT, SEO,
**RESP[320–2560]**, TS, TONE, MONO[code], **TYPE**, + **RESP now fully closed incl 320**) + ~8
RESOLVED/partial (**A11Y**[home axe], **SEC**[fail-loud+headers+no-leak], **PERF**[payload+CLS
test-green, `perf.spec` + neg-control], LIGHT, PARITY, CHAT, NN-3-auto). **TC-NFR-PERF is NOT yet
fully VERIFIED** — its deterministic payload+CLS dimension is RESOLVED/test-green, but the
Lighthouse perf/LCP/TBT sub-dimension stays UNVERIFIED (isolated lhci run on `/` pending; R3F-home
score-risk flagged). Re-audit #8 (iteration-1) moved **PERF payload+CLS** UNVERIFIED→RESOLVED
(`perf.spec` 596.7–907.3 KB ≤2.5 MB · CLS 0.0005–0.0011 <0.05 · neg-control 2-failed). Re-audit #6
moved **A11Y** UNVERIFIED→RESOLVED (`a11y.spec` 0 crit+serious) and **SEC** At-risk→RESOLVED
(`security.spec` 5✓), and closed **RESP 320** (D-6).
The MVP structural/feature/test layer is test-backed; the clone, catalogue, synthesis,
asset/VFX, NN, and the remaining runtime budgets (Lighthouse/FPS/payload/offline/render/3-browser)
remain. (Denominator 41: `TC-NFR-TYPE` traces to SPEC §3.2; `TC-ARCH-BENCH` is a QA-hygiene audit
check tied to QA-ARCH-02 — not a SPEC §10 requirement TC.)

**Owner action (TC-FR-CONTACT):** set `NEXT_PUBLIC_BOOKING_URL` to a real Calendly/Cal.com link to
satisfy the "live scheduling endpoint" wording — the structured `mailto` is the working default.

---



## 3. Findings (evidence-cited; ▲ = changed this pass)

### Resolved / verified (do not regress)

- **QA-TEST-01..04** `RESOLVED` ✅ — `tests/overhaul/` has TC-bound specs (scroll/signature/
sections/proof/contact/audit/typography/security/a11y); `audit.spec` wires tone/mono/parity/type/secret/strict-TS;
suite **28 passed / 0 skipped** (#6/#7); `requirements_list.md` repointed at SPEC §10.
- **QA-TEST-05** `LOW · INFO` ▲ (#7) — the **local Playwright default config flaps on a cold dev
server**: `playwright.config.ts` runs `workers:2, retries:0` locally, so a first run against a
freshly-spun `npm run dev` (lazy route+font compile under 2 parallel workers) can report false
fails — observed #7: `signature.spec:20` (WebGL init), `typography.spec:60` (heading computed
`Times` = Space-Grotesk FOUT), `typography.spec:75` (numerals `normal`). Refuted by the
deterministic `--workers=1` re-run (28/0, those 3 green), the prior #6 28/0 on the same tree, and
static `checkFonts` PASS — **not a code regression**. Mitigation (recommended to the orchestrator):
run the overhaul browser suite with `--workers=1`, or pre-warm the dev server, for a faithful local
gate. (No SPEC requirement fails; the suite content is correct.)
- **QA-CI-01..04 / QA-DR-03/11** `RESOLVED (code)` · (V) on-push — `deploy.yml` rewritten:
`quality` (`tsc --noEmit`+audit) → `test` (chromium+webkit+firefox) → `lighthouse`
(`validate:phase02`) → `axe` (`validate:phase06`) → `build` `needs:[quality,lint,test,lighthouse,axe]`.
Green-on-push confirmable only after the owner pushes.
- **QA-FONT-01/02/03** `RESOLVED / VERIFIED` ✅ ▲ (re-audit #5) — typography reduced to **2 families**
(`Inter` body + `Space_Grotesk` grotesque display), self-hosted via `next/font` (`app/layout.tsx:2,11-23`;
`globals.css:31-34`); Playfair/Roboto/Source-Sans/Source-Code dropped; tabular numerals;
`typography.spec` 4 passed; static-audit `TC-NFR-TYPE` PASS (execution-log OV4).
- **QA-ARCH-02** `RESOLVED (code)` · (V) build ▲ (re-audit #5) — `/performance-benchmark` excluded
from the public static export: `notFound()` under `NEXT_PUBLIC_STATIC_EXPORT=1` +
`scripts/build/prune_static_export.mjs` (wired into `build:static`) deletes emitted artifacts;
`TC-ARCH-BENCH` audit guards `out/`. Execution-log OV6: out perf-benchmark artifacts = 0; dynamic
route 200. Re-confirm on next `build:static`.
- **QA-NAV-FIX** `RESOLVED` ✅ ▲ — real bug: nav overlay used `.nav-overlay.active` but the
component toggles `.open`; menu never opened. Fixed (`Navigation.tsx:54`); TC-FR-NAV green.
- **QA-PROOF-01** `RESOLVED / VERIFIED` ✅ ▲ — `#proof` (`ProofBar.tsx`) count-up + 4 metrics
(15+ yrs · $5M+ · ≈92% · 10k+ @ P95<200ms) from `siteContent.proof`, tabular, reduced-motion;
`proof.spec` green.
- **QA-CONTACT-01** `RESOLVED / VERIFIED` ✅ ▲ — `#contact` Book-a-conversation (`BOOKING_HREF` =
`NEXT_PUBLIC_BOOKING_URL` || structured `mailto`) + in-section CV (`/docs/Vik_Resume_Final.pdf`,
resolves 200 PDF) + email/phone; `contact.spec` green. Owner action: real booking URL.
- **QA-SCROLL-01 / QA-VFX-01/02/03** `RESOLVED / VERIFIED` ✅ — FR-SCROLL wired & tested; the
TelemetryHud is mounted ×2 (no longer orphaned), shader+volumetric compile at runtime (zero
WebGL errors); SpaceScene demoted. `scroll.spec`+`signature.spec` green.
- **QA-TONE-04/05** `RESOLVED` ✅ — sci-fi persona removed end-to-end; audit TONE widened + PASS.
- **QA-MONO-01..05 / D-4 / QA-IMPL-01/02 / QA-CON-01/02** `RESOLVED` — monochrome conversion,
asset purge, strict tsc, no truncation, parity all confirmed (audit 7/7).

### Open — gating a credible launch

- **QA-ASSET-01** `HIGH OPEN` ▲ — the cinematic asset/VFX layer is essentially empty
(`public/assets/` = avatar media + 2 greeting MP3s only; no `public/assets/svg/`, no AI imagery,
no templates, no finishing textures, no dossier). The owner-emphasised rememberability/Marvel-grade
signal is not yet produced. (Asset/VFX production track to be authored into IMPLEMENTATION-PLAN.)
- **QA-CLONE-01** `HIGH OPEN` — avatar `<video muted>` + 2D-waveform "lip-sync"; no real ≤120 ms sync (D-2).
- **QA-VOICE-01** `HIGH UNVERIFIED` — greeting MP3 plays; cloned-voice-id authenticity unverified (D-1).
- **QA-SEC-01** `MEDIUM OWNER-DECISION` ▲ (#6) — the **fail-loud missing-key build check is DONE
& test-backed** (`security.spec` — missing `GEMINI_API_KEY` crashes the prod static-export naming
the key; dev build no false crash). What remains is the **owner decision** on the client-inlined
restricted-public Gemini key: keep it as the recorded **DEV-8** deviation, or move it behind a
proxy. Not a failing test.
- **QA-SEC-02** `RESOLVED` ✅ ▲ (#6) — CSP/HSTS/X-Content-Type-Options/X-Frame-Options/
Referrer-Policy/Permissions-Policy presence is **test-backed** (`security.spec` "security headers
present"); plus no high-severity secret in `out/`.
- **QA-A11Y-01** `RESOLVED · (V)` ▲ (#6) — `a11y.spec` GREEN: axe wcag2a/2aa/21a/21aa, **0
critical + 0 serious** on the home page (the whole single-page site). (V) explicit keyboard-path +
focus-visible E2E and the Lighthouse a11y≥95 score still to capture.
- **QA-PERF-01** `RESOLVED (payload+CLS) · (V) Lighthouse` ▲ (#8, iteration-1) — the deterministic
  **first-view payload + CLS** dimension of NFR-PERF is now **test-backed & QA re-verified**:
  `tests/overhaul/perf.spec.ts` measures the production static export (`out/`) served with gzip
  (mirrors Firebase Hosting) at the `load` event → first-view transfer **596.7–907.3 KB ≤ 2.5 MB**,
  **CLS 0.0005–0.0011 < 0.05**; the **negative control** (`PERF_PAYLOAD_BUDGET=100000
  PERF_CLS_BUDGET=0`) fails **both** assertions, proving the gate bites. Anti-fake-green confirmed:
  deferred hero/MiniVic video (`preload="none"` + IO-gated src, `HeroAvatar.tsx:40-42,83`;
  `MiniVicBot.tsx:1188`) is correctly out of the first-view window AND each media file is
  independently capped per-asset by the static audit (`overhaul_static_audit.mjs:116-136`). Minor
  freshness caveat: `perf.spec` reuses an existing `out/` if present (self-builds only when absent);
  on clean CI it builds fresh, locally re-run after `npm run build:static`.
- **QA-PERF-02 (Lighthouse perf/LCP/TBT)** `HIGH UNVERIFIED` ▲ (#8) — `lighthouserc.json` +
  `scripts/validate/phase02_lighthouse.sh` are now repointed from `/performance-benchmark` to the
  **real homepage `/`** (correct target), but the gate has **not been run in an isolated env**
  (needs clean `npm run build` + `next start` + lhci, must not contend with the dev server's
  `.next`). **OPEN RISK to track, not hide:** the R3F/three.js-heavy homepage may score **<0.90**
  on Lighthouse mobile perf (prior R1 production run scored perf=**0.54** on the real home vs 0.99
  on the lightweight benchmark page). LCP<2.5s / TBT<200ms likewise unproven on `/`.
- **QA-FPS/COMPAT/DURABLE/RENDER** `HIGH UNVERIFIED` — no green runtime result recorded:
  FPS ≥55/≥30 probe (headed/Xvfb), 3-browser (webkit/firefox) on-push, offline durability,
  per-browser cinematic render-compliance.
- **QA-RESP-320** `RESOLVED / VERIFIED` ✅ ▲ (#6) — D-6 fixed; `sections.spec` asserts 320px as a
first-class breakpoint (no `fixme`/skip) and it is GREEN (320/375/768/1280/2560 all pass).
- **QA-CATALOG-01** `MEDIUM OPEN` — catalogue <10 repos, no per-link-200 test (TC-FR-CATALOG).
- **QA-HERO-NN1** `MEDIUM OPEN` ▲ — hero dual-pillar (employer "Review experience" / client "See
outcomes") CTAs + NN-1 per-section dual action not audited.

### Open — lower / follow-ups

- **QA-SYS-01** `MEDIUM IN-PROGRESS` — `services/`* scaffolded; live clone not wired behind a flag.
- **QA-AES-01** `MEDIUM` ▲ — HUD now recurs ×2 (improved); confirm it's the dominant ownable
identity over the starfield in the final visual pass.
- **QA-TONE-06** `RESOLVED` ✅ ▲ (re-audit #4) — sci-fi `TEST 2` blocks in `deployment_v2.spec.ts`
(skip-gated) and `test_minivic_api.js` (orphaned) rewritten to the current `Story` persona mode;
banned sci-fi vocabulary and the removed `'Explain in sci-fi'` button / stale `bg-gray-800/80`
selector removed; both now double as NN-3 tone-regression guards.
- **QA-CON-03** `RESOLVED` ✅ ▲ (re-audit #4) — `miniVicKnowledge.ts:694` "Twenty years on" →
"Fifteen years on" (matches the 15+/2010-start arc used everywhere else and the resume).
- **QA-MONO-05** `RESOLVED` ✅ ▲ (re-audit #4) — stale `// orange-400` comment corrected at
`MiniVicBot.tsx:362` (cool-grey label); the three mislabeled hue comments in
`FloatingDetailBox.tsx:32-37` relabeled to monochrome token names.

---

## 4. Doc-consistency reconciliation (one source of truth — 0 drift)

11 drift items fixed in earlier passes (DID_API_KEY, GSAP claims, 21 phases, green-screen→mono,
fail-loud, target-pipeline, 143 cases, ~22→2.4 MB, GSAP+HUD caveats). The plan's TC-NN-3 "done"
overclaim was corrected to "automated-PASS / manual-pending". `site.spec.ts` is maintained to the
current UI (asserts `.open`, current labels, the corrected GSAP note) — not stale.

**Re-audit #4 (spec-fidelity guardian, 2026-06-13)** found and corrected **19 more drift items**
(a 6-dimension fan-out audit, each finding adversarially re-verified; 2 candidate findings were
rejected as false positives — the TC-FR-SHADER/TC-FR-LIGHT register rows are already correctly
scoped). Prompt-vs-SPEC parity was confirmed materially clean (every prompt §1–§7 obligation maps
to an FR/NFR/TC/NN/DEV-* entry; no silent drift). The corrections, all applied this pass:
**HIGH** — `miniVicKnowledge.ts:694` "Twenty years"→"Fifteen years" (QA-CON-03);
**MEDIUM** — ARCHITECTURE/README CI descriptions updated to the implemented `deploy.yml` graph;
SPEC status header de-staled (no longer "pre-implementation gate"); SPEC §0.1 DEV-1 reconciled
(GSAP now wired/met); CLAUDE.md "6 MB jpegs exist"→resolved; this register's TC denominator
37→40 + 3 missing rows added (TC-FR-SECONDARY/U-STATE/INT-CLONE); `tests/requirements_list.md`
HERO over-claim removed (+ PROOF/CONTACT bindings added); sci-fi `TEST 2` scaffolding rewritten
(QA-TONE-06);
**LOW** — stale line cites fixed (page.tsx :203→:211, :489→:499, :413→:423; MiniVicBot.tsx
:369→:362); README/CLAUDE "fail safe"→"fail loud"; README/CLAUDE "27 phases"→"21"; orange-comment
hygiene (QA-MONO-05); `site.spec.ts:157` dead `'Service degraded'` guard made live.

**Re-audit #5 (spec-fidelity guardian, 2026-06-13)** reconciled the **post-#4 drift** created when
the implementation agent shipped typography (execution-log OV4) and the `/performance-benchmark`
export-exclusion (OV6) without updating the docs: the static audit grew **5→7 checks** (added
`TC-NFR-TYPE` fonts + `TC-ARCH-BENCH`) and now reports **7/7**, and the overhaul suite grew
**18→25 tests** (now **24 passed / 1 skipped**). Corrected this pass: IMPLEMENTATION-PLAN (audit
5/5→7/7 ×6, Phase-0 audit line 5→7 checks, typography + IA-cleanup tasks → `[x]` done, suite
17→24); CLAUDE.md (audit 5/5→7/7); README.md (audit description → 7 gates); SPEC §9/§10 (added
**NFR-TYPE + TC-NFR-TYPE** so the audit's `TC-NFR-TYPE` id traces to the existing §3.2 ≤2-families
requirement); and this register (header, dashboard rows, §2 table + TYPE row + count 13/40→15/41,
§3 QA-FONT/QA-ARCH-02 → RESOLVED, §4 residual INFO, §7 next-up). The earlier residual `INFO` (SPEC
§3.2 "Inter" not wired via next/font) is now **resolved** — `Inter` + `Space_Grotesk` are both
loaded via `next/font` (`app/layout.tsx:2`). A structural defect in this register's §3 (a botched
prior edit had fused the `## 3. Findings` / `### Resolved` headings with a split `QA-CI` bullet) was
also repaired. Doc set is back to **0 known drift** vs `prompt.md` and the code; remaining items in
§2/§3 are genuine OPEN engineering scope, not inconsistencies.

**Re-audit #7 (spec-fidelity guardian, 2026-06-14 — iteration-0 baseline)** re-confirmed
**prompt↔SPEC parity materially clean** (every prompt §1–§7 mandate maps to an FR/NFR/TC/NN/DEV-*),
then found and corrected **4 doc-drift items** the implementation agent's earlier scroll work had
left stale in two companion docs:
**MEDIUM** — `TECH-STACK.md:14` GSAP row read "(installed, **not yet wired**) … imported nowhere;
scroll currently runs on Framer Motion + IntersectionObserver. To be wired." — a direct contradiction
of SPEC §0.1 **DEV-1** / **FR-SCROLL** / **TC-FR-SCROLL** (GSAP is wired via `lib/gsap.ts` +
`components/site/ScrollRail.tsx`, `scroll.spec` 2 passed). Corrected to "**wired & met**" with the
real wiring cited; `ARCHITECTURE.md` §2 intro "every interaction … (no imperative DOM script layer)"
contradicted the now-wired GSAP `gsap.context()` scroll layer — corrected to name the GSAP+ScrollTrigger
scroll layer (React-managed, `ctx.revert`).
**LOW** — `TECH-STACK.md:33` audit enumeration "Tone, monochrome, asset budget, parity, secrets, infra"
predated the 7-check audit — added **fonts (≤2 families)** + **no `/performance-benchmark` in `out/`**
(7/7); `ARCHITECTURE.md` §2 component families omitted the now-central **signature HUD**
(`HudFrame`→`TelemetryHud`, the NN-2 motif) and `ScrollRail`/`ProofBar` — added. Doc set back to
**0 known drift**.

---

## 5. Requires runtime / visual verification (cannot close statically)

Lighthouse mobile **perf/LCP/TBT on `/`** (the payload ≤2.5 MB + CLS dimension is now CLOSED via
`perf.spec` — see QA-PERF-01), FPS probe, offline-reload durability, 3-browser (webkit/firefox)
CI-on-push, voice-id/lip-sync sampling, cinematic per-browser render-compliance + visual review of
the HUD/scenes, plus the A11Y keyboard-path/focus-visible E2E and Lighthouse a11y≥95 score. Affects
TC-FR-HERO/CHAT, TC-NFR-PERF[Lighthouse sub-dim]/FPS/RENDER/COMPAT/DURABLE, the (V) tail of
TC-NFR-A11Y, TC-FR-VOICE/CLONE, TC-NN-2.
**Closed since #5 (now test-backed):** TC-FR-RESP 320px (D-6), home-page axe (TC-NFR-A11Y core),
and **TC-NFR-PERF first-view payload + CLS** (#8, `perf.spec` + neg-control).

---

## 6. Deviations & owner actions

- DEV-4 (avatar static-default), DEV-5 (owner-gated publish), DEV-7 (SVG/Framer real-time-canvas).
- **Owner actions:** set `NEXT_PUBLIC_BOOKING_URL` (real scheduling link); decide on the client-inlined
Gemini key (proxy vs recorded deviation, QA-SEC-01); TC-NN-3 manual tone sign-off.

## 7. Next-up (priority for the implementation agent)

- **P1 (finish MVP credibility — remaining runtime budgets):** ① **TC-NFR-DURABLE** —
  offline-reload renders core content + CV (highest-value, lowest-risk next unit; author
  `tests/overhaul/durable.spec.ts` against static `out/` with `context.setOffline(true)`).
  ② **TC-NFR-COMPLETE** — grep/AST placeholder/truncation scan over `app/**`,`components/**`,`lib/**`
  (fast, deterministic). ③ **TC-FR-HERO** — dual-pillar (NN-1) CTA + GitHub/YouTube/CV 200-link
  assertions. ④ **TC-NFR-PERF Lighthouse sub-dim** — run mobile Lighthouse perf≥90/LCP<2.5s/TBT<200ms
  on `/` in an **isolated** clean-build env (lhci now points at `/`; **flag the R3F <0.90 risk**).
  ⑤ **TC-NFR-FPS** — FPS ≥55/≥30 probe (needs headed/Xvfb — environment-blocked locally).
  ⑥ **TC-NFR-COMPAT / RENDER** — 3-browser (webkit/firefox) + per-browser render-compliance
  (CI-on-push / local browser install). ⑦ **QA-SEC-01** — owner decision on the client-inlined
  Gemini key (DEV-8 vs proxy).
  _(CLEARED: P1-4 typography + `/performance-benchmark` (#5); 320px overflow + home-page axe +
  fail-loud/headers security (#6); **TC-NFR-PERF first-view payload + CLS** test-green (#8).)_
- **P2 (clone):** real lip-sync ≤120 ms + voice-id check (TC-FR-CLONE/VOICE) · MiniVic monochrome
visual pass · VOICE-DYN.
- **P3 (scale + signature):** the **asset/VFX production track** (cinematic imagery/SVG/templates/
dossier — QA-ASSET-01) · project catalogue ≥10 + link-200 (TC-FR-CATALOG) · multi-source synthesis
(TC-FR-SYNTH/MINDSET) · NN-1 dual-pillar + NN-2 recall audit.

---

## 8. Changelog (append-only)


| Date       | HEAD         | Task                                                   | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-13 | 667d339      | Create QA register; full static baseline audit         | Initial population: 37 TC statuses, 11 drifts, 30+ findings; verdict PRE-IMPLEMENTATION.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-13 | 667d339 (wt) | Re-audit #2 (Phase 0 + plan)                           | Verified MONO/D-4/tsc/audit; surfaced GSAP-dead-dep, orphaned HUD, live sci-fi NN-3 violation, audit scope gap; reconciled 11 cross-doc drifts; verdict ~35–40%, NOT deploy-ready.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-06-13 | 667d339 (wt) | QA sign-offs: P0-1 scroll · P0-2 HUD · P0-3 sci-fi     | FR-SCROLL (scroll.spec 2✓), signature HUD (signature.spec 1✓, zero WebGL), sci-fi persona removed + TONE audit widened. 3 BLOCKERs cleared; cross-doc drift reconciled (incl. TC-NN-3 "done"→manual-pending).                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-06-13 | 667d339 (wt) | Re-audit #3: P1-1 tests+CI · P1-2 proof · P1-3 contact | **Verified** the P1 batch: `tests/overhaul/` suite **16–17 passed/1 skipped**; CI `deploy.yml` rewritten (quality+3-browser+Lighthouse+axe+gated build); `requirements_list.md`→SPEC §10; **real nav-open bug fixed**; FR-PROOF (`proof.spec`✓) + FR-CONTACT (`contact.spec`✓). Retracted a prior 14-fail batch as **HMR-collision noise**. `site.spec.ts` confirmed maintained-not-stale. ~13/37 TCs VERIFIED; verdict → ~55–60%, MVP feature/test/CI layer cleared, **NOT deploy-ready** (runtime budgets unverified; clone/voice, catalogue, fonts, **cinematic asset/VFX layer**, NN scope remain). New: QA-ASSET-01, QA-RESP-320, QA-HERO-NN1, QA-CATALOG-01. |
| 2026-06-13 | 667d339 (wt) | Re-audit #4: spec-fidelity guardian — full QA suite re-run + 19 drift corrections | Re-verified the gates: `tsc --noEmit` **0**, `overhaul_static_audit.mjs` **5/5**, `lint` **clean**, `tests/overhaul/` **17 passed/1 skipped** (system Chrome; pinned-build `chrome-headless-shell` re-installed for the `CI=1` path). 6-dimension fan-out fidelity audit (28 agents) — prompt↔SPEC parity confirmed materially clean; **19 drifts adversarially confirmed and ALL corrected** (1 HIGH "Twenty years"→"Fifteen years"; MEDIUM CI-doc/ SPEC-status/ DEV-1/ CLAUDE-jpegs/ TC-denominator-37→40 + 3 rows/ HERO over-claim/ sci-fi-tests; LOW stale line-cites, fail-safe→fail-loud, 27→21 phases, orange comments, dead site.spec guard); 2 candidates rejected as false positives (TC-FR-SHADER/LIGHT rows already correctly scoped). Doc set now **0 known drift**. Verdict unchanged: **~55–60%, NOT deploy-ready** — remaining scope is real engineering (typography, security key, /performance-benchmark, runtime budgets, clone/voice, catalogue, synthesis, asset/VFX, NN). |
| 2026-06-13 | 667d339 (wt) | Re-audit #5: spec-fidelity guardian — full QA suite re-run + post-#4 drift reconciled | **Start:** re-read prompt/SPEC/plan/register; re-ran gates. **Gates GREEN:** `npm run lint` **clean (0)**, `npx tsc --noEmit` **0**, `overhaul_static_audit.mjs` **7/7** (TONE·MONO·PERF·PARITY·**TYPE**·SEC·**ARCH-BENCH**), `tests/overhaul/` **24 passed / 1 skipped** (320px D-6) system Chrome, exit 0, no HMR risk (terminals idle). **Post-#4 drift found + corrected:** typography (OV4) and `/performance-benchmark` exclusion (OV6) had shipped but docs lagged — audit grew 5→7 checks, suite 18→25 tests. Fixed: IMPLEMENTATION-PLAN (audit 5/5→7/7 ×6, Phase-0 audit 5→7 checks, typography `[ ]`→`[x]`, IA-cleanup `[ ]`→`[x]`, suite 17→24); CLAUDE.md + README.md (audit count/description); **SPEC §9/§10 added NFR-TYPE + TC-NFR-TYPE** (traces audit `TC-NFR-TYPE` to §3.2); this register (header, dashboard rows, §2 TYPE row + 13/40→15/41, §3 QA-FONT/QA-ARCH-02→RESOLVED + repaired a mangled §3 heading/QA-CI bullet, §4 residual-INFO resolved, §7 next-up). **+1 VERIFIED** (TC-NFR-TYPE). **UNVERIFIED (not run):** Lighthouse/axe/FPS/payload, per-breakpoint (320), offline durability, 3-browser CI-on-push, voice-id/lip-sync, render-compliance. Verdict: **~60%, NOT deploy-ready** — clone/voice, catalogue, synthesis, asset/VFX, NN, runtime budgets, security key remain. Doc set back to **0 known drift**. |
| 2026-06-14 | 667d339 (wt) | Re-audit #7 START: spec-fidelity guardian — iteration-0 baseline for MVP-completion loop | **Start of task:** re-read `docs/prompt.md` (apex), `SPEC.md`, `IMPLEMENTATION-PLAN.md`, `MVP-AND-ROLLOUT.md`, all `docs/overhaul/*`, `tests/requirements_list.md`, README, runbooks, execution-log; re-verified the findings this pass touches. HMR check: prior Playwright run (846300) already complete 28/0; orchestrator (terminal 2, Claude Code) idle at a `/clear` prompt — not editing; port 8080 free → safe to run the full gate. Kicked off `lint`/`tsc`/static-audit/`tests/overhaul`. |
| 2026-06-14 | 667d339 (wt) | Re-audit #7 END: spec-fidelity guardian — gates GREEN + 4 doc-drift corrected + QA-TEST-05 (flap isolated) | **Gates re-run from clean, ALL GREEN:** `npm run lint` **clean (0)**, `npx tsc --noEmit` **exit 0**, `overhaul_static_audit.mjs` **7/7** (TONE·MONO·PERF·PARITY·TYPE·SEC·ARCH-BENCH), `tests/overhaul` **28 passed / 0** deterministic (`--workers=1`, 1.9 min, exit 0). **Flap isolated (QA-TEST-05):** a first default-config run (`workers:2, retries:0`) reported 3 fails (`signature:20` WebGL, `typography:60` heading=`Times` FOUT, `typography:75` numerals `normal`) on a cold dev server; refuted by the serial 28/0 (those 3 green), the #6 28/0 on the same uncommitted tree, and static `checkFonts` PASS → recorded as a harness flap, **not** a code regression; recommended faithful local gate = `--workers=1` or pre-warmed server. **Prompt↔SPEC parity re-confirmed materially clean.** **4 doc-drift items corrected:** `TECH-STACK.md:14` GSAP "not yet wired"→"wired & met" (DEV-1/FR-SCROLL/TC-FR-SCROLL), `TECH-STACK.md:33` audit enumeration → 7 checks (+fonts/ARCH-BENCH), `ARCHITECTURE.md` §2 "no imperative DOM script layer"→GSAP scroll layer, `ARCHITECTURE.md` §2 families +`ScrollRail`/`ProofBar`/`HudFrame`→`TelemetryHud` (NN-2 motif). **Verdict unchanged: ~62%, NOT deploy-ready** — remaining: TC-NFR-PERF(payload/Lighthouse)/FPS/DURABLE/COMPAT/RENDER runtime budgets, clone/voice (CLONE/VOICE/VOICE-DYN/CLONE-LIVE), catalogue ≥10+link-200, multi-source synthesis (SYNTH/MINDSET), asset/VFX layer (QA-ASSET-01), NN-1/2 + NN-3 manual sign-off, QA-SEC-01 owner decision. Note: driving prompt said audit "must be 5/5" — **stale; audit is 7/7** (reconciled #5). Doc set back to **0 known drift**. |
| 2026-06-14 | 667d339 (wt) | Re-audit #8 START: spec-fidelity guardian — iteration-1 verification of TC-NFR-PERF | **Start of task:** re-read `docs/prompt.md` (apex §3.5/§6), `SPEC.md` §3.5/§10, this register, `tests/overhaul/perf.spec.ts`, `lighthouserc.json`, `phase02_lighthouse.sh`, `tests/requirements_list.md`, execution-log OV-PERF; re-verified the findings this pass touches (QA-PERF group). HMR/contention check: no live next/playwright/lhci procs, ports 3000+8080 free, `out/index.html` freshly built today 08:43 → safe to run all gates. Kicked off tsc/lint/static-audit + `tests/overhaul --workers=1` + perf negative control. |
| 2026-06-14 | 667d339 (wt) | Re-audit #8 END: spec-fidelity guardian — TC-NFR-PERF payload+CLS VERIFIED (test-green) + Lighthouse-on-`/` UNVERIFIED risk flagged + binding added | **Gates re-run independently, ALL GREEN:** `npx tsc --noEmit` **0**, `npm run lint` **clean**, `overhaul_static_audit.mjs` **7/7**, `npx playwright test tests/overhaul --workers=1` **30 passed** (1.7 min, exit 0, no flap), perf **neg-control** (`PERF_PAYLOAD_BUDGET=100000 PERF_CLS_BUDGET=0`) **2 failed** (gate bites). **Independent perf measure:** first-view transfer **596.7 KB**, CLS **0.0011** (orchestrator 907.3 KB/0.0005 — payload non-deterministic via Next prefetch timing; both ≪ 2.5 MB/0.05, 3–4× headroom). **Anti-fake-green PASS** (evidence-cited): static `out/` export served with gzip (`perf.spec:22,64-96`), measured to `load` (`:117,:144`); deferred hero/MiniVic video `preload="none"`+IO-gated (`HeroAvatar.tsx:40-42,83`, `MiniVicBot.tsx:1188`) correctly excluded; per-asset media still capped by audit (`overhaul_static_audit.mjs:116-136`); neg-control proves bite. **Register updates:** §2 TC-NFR-PERF Partial/UNVERIFIED → **RESOLVED (payload+CLS, test-green)** + Lighthouse sub-dim UNVERIFIED; tally RESOLVED/partial ~7→~8; §3 split QA-PERF-01 (RESOLVED) / QA-PERF-02 (Lighthouse HIGH UNVERIFIED, **R3F <0.90 risk flagged** vs R1 home perf=0.54) / QA-FPS-COMPAT-DURABLE-RENDER; §5/§7 re-scoped (payload+CLS closed; next-up reordered → DURABLE/COMPLETE/HERO); header #8. **Doc-drift fix:** added `TC-NFR-PERF → tests/overhaul/perf.spec.ts` row to `tests/requirements_list.md` (was missing). **Prompt↔SPEC §3.5/§10 wording re-confirmed matching the gate (0 drift);** SPEC §10 last column is a baseline-at-authoring snapshot (RESP/PERF still read "FAIL") — live status is this register by design, not drift. **Verdict: ~63%, NOT deploy-ready** — Lighthouse/FPS/DURABLE/COMPAT/RENDER, clone/voice, catalogue, synthesis, asset/VFX, NN remain. **Owner gates honoured:** no git push / Firebase deploy / `main` edit / paid D-ID/ElevenLabs call. |
| 2026-06-14 | 667d339 (wt) | Re-audit #6: spec-fidelity guardian — BASELINE pass grounding the impl→QA loop + post-#5 drift reconciled | **Gates re-run from scratch, ALL GREEN:** `npm run lint` **clean (0 warnings/errors)**, `npx tsc --noEmit` **exit 0**, `overhaul_static_audit.mjs` **7/7** (TONE·MONO·PERF·PARITY·TYPE·SEC·ARCH-BENCH), `npx playwright test tests/overhaul` **28 passed / 0 skipped** (system Chrome, 1.1 min, exit 0). **Environment finding (recorded, not papered over):** local runtime is **Node v26.3.0** vs repo pin **Node 20.x** (`engines`); gates passed clean under Node 26 (only benign DEP0205 + baseline-browser-mapping notices); canonical gate stays Node 20 on CI. **Orchestration-prompt note:** the driving prompt said audit "must be 5/5" — stale; the audit is **7 checks → 7/7** (reconciled at #5). **Post-#5 drift found + corrected (the implementation agent shipped ahead of the register):** the suite grew 25→28 and three items were green on the tree but the register read them stale — (a) **D-6 320px** overflow fixed (`sections.spec` asserts 320 first-class, no skip; execution-log OV-D6) → **TC-FR-RESP fully VERIFIED (320–2560)**, QA-RESP-320 RESOLVED; (b) **`a11y.spec`** green (axe wcag2a/2aa/21a/21aa, 0 critical+0 serious on home) → **TC-NFR-A11Y RESOLVED·(V)**, new QA-A11Y-01; (c) **`security.spec`** 5✓ (fail-loud names GEMINI_API_KEY, CSP/HSTS/nosniff/XFO/Referrer/Permissions headers, no `out/` leak) → **TC-NFR-SEC RESOLVED**, QA-SEC-02 RESOLVED, QA-SEC-01 downgraded HIGH→owner-decision (DEV-8 vs proxy). Also corrected `tests/requirements_list.md` TC→test binding table (added TYPE→`typography.spec`, SEC→`security.spec`, A11Y→`a11y.spec`; removed A11Y from the "remaining" line). **Updated this register:** header (#6, method incl. Playwright, Node-26 finding), dashboard (success-criteria 15→16 VERIFIED + 7 RESOLVED, FR-RESP→VERIFIED, Security→RESOLVED, suite 24→28, runtime-budget item re-scoped), §2 (RESP/A11Y/SEC rows + count 15/41→16/41), §3 (QA-SEC-01/02, QA-A11Y-01, QA-RESP-320, QA-PERF group re-scoped), §5/§7. **Verdict: ~62%, NOT deploy-ready** — remaining: TC-NFR-PERF(payload/Lighthouse)/FPS/DURABLE/COMPAT/RENDER runtime budgets, clone/voice (CLONE/VOICE/VOICE-DYN), catalogue ≥10+link-200, multi-source synthesis, asset/VFX layer, NN-1/2 + NN-3 manual sign-off, QA-SEC-01 owner decision. Doc set back to **0 known drift**. |


---

*Maintained solely by the QA agent. Next task: re-read → re-verify touched findings → update → append §8.*