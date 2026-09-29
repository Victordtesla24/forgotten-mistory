# UI/UX LEDGER — forgotten-mistory

Single source of truth for the hourly UI/UX release cycle. Updated in place every cycle. Every verdict below is tied to a file under `docs/uiux/evidence/<run-id>/`; anything not measured in this run is marked **UNVERIFIED**. Historical claims from prior boards/audits were treated as unverified and re-measured.

---

## A. Run header

### C5 Publisher — fixes shipped — 2026-09-29

Branch `uiux/fixer-refinement` (fix commit `377fb02`) merged to `main` via `gh pr merge` (squash); deploy via `ship.yml`.

- **Status:** **OPEN** — UX-P1-006 (mobile LCP 2865 ms > 2500 ms budget) still pending; not addressed in this cycle.
- **Shipped:** UX-P0-001 — Hero CTA group uses translate-only `heroRiseSolid` entry (no opacity fade), so contrast stays 18.32:1 from t=0; reduced-motion disables animation. UX-P2-002 — Navigation 180 ms scroll-settle timer re-resolves the visible section, updating `aria-current`/hash after scrollbar/programmatic scroll.
- **Adversarial matrix:** Chromium 144/144 cells PASS (312/312 iterations, evidence `evidence/20260929T1115Z-matrix/`); Firefox/WebKit 144 cells PENDING (browsers not installed). Post-merge production re-run of the matrix/RED specs: **UNVERIFIED** in this step.
- **Main SHA / deploy run:** recorded in §E release log after merge.

### C5 TestAuthor — finite adversarial matrix + independent RED — 2026-09-29T11:15Z

Branch `uiux/test-author-matrix`; target production `82ffb9ee`. Evidence: `evidence/20260929T1115Z-matrix/` (`test-author.json`, `matrix-summary.md`).

- **Matrix** (`tests/e2e/adversarial-matrix-full.spec.ts`): 2 Chromium profiles × 6 mechanisms × 12 scenarios; baseline ×1, stress ×3 (varied viewport sequence, hidden 0.5/2/5 s, Fast-3G/Regular-3G/no-cache, CPU 2/4/6× + 1/2/3 s script delay). **144/144 Chromium cells PASS, 312/312 iterations; Firefox/WebKit 144 cells PENDING** (not installed/configured). First run's 12 fallback failures were a harness artifact (fixed, rerun 12/12 PASS).
- **UX-P0-001:** RED-INTERMITTENT, transient only — axe flagged `.Hero_primaryAction` 2/16 runs (both @1440) at t=0 (1.21:1, mid entry-fade); ≥150 ms and rest/hover/focus = 18.32:1. Steady state not reproduced.
- **UX-P1-006:** RED on LCP only — mobile median Perf 0.92, **LCP 2865 ms**, TBT 158 ms, CLS 0 (3 runs). Prior 71/690 ms not reproduced.
- **UX-P1-001:** GREEN — no document overflow at 320/360/390 (3/3 each).
- **UX-P2-002:** RED — after a nav click, scroll-only movement (scrollbar-equivalent) to Listen leaves `aria-current`/hash on `#skills` (3/3). Keyboard/wheel/Back/mobile controls PASS.
- **Preservation:** `adversarial-repairs` + `flagship-six` 16/16 PASS on production.

### C4 authoritative update — 2026-09-29T10:15Z

**Four repairs shipped; adversarial evaluation identified fresh regressions in accessibility and performance.** Earlier status is superseded. Current deployed main: `82ffb9ee4909cf03037fc2c0ef0a4f9c9a3e3f04`; live meta `82ffb9ee`. PR #46 merged. Cycle 4 adversarial evaluation is active.

- **Status:** **OPEN**. Regressions in Performance and Accessibility (contrast) identified on production.
- **Independent Test Author:** Fresh evaluative sweep covered 8 widths, 48 section checks, 7 adversarial matrix cases, and 2 Axe audits. 
- **regressions:**
    - **UX-P0-001: Hero CTA Contrast.** Axe-core serious violation on `.Hero_primaryAction` ("See the evidence"). Observed ratio 1.05:1 (#252525 on #292929). Likely animation-state or background-scrim collision.
    - **UX-P1-006: Performance Regression.** Lighthouse mobile score 71 (threshold 90). TBT 690ms (threshold 200ms), LCP 3.3s (threshold 2.5s).
- **Passes:**
    - Visual consistency: 0 section-level layout findings across all target viewports.
    - Adversarial Matrix: 7/7 passes (Deep Anchors, Warm Reload, Back/Forward Nav, Fast Scroll Lifecycle, Hidden Tab Resume, Resize Stress, Slow Network LCP).
    - Repairs: All 4 repairs from PR46 (SSR bars, Vitrine focus, Stage state, Menu target) remain verified on live.
- **Identiveness:** Main ↔ Live parity 100% (82ffb9ee).
- **Evidence:** `evidence/c4-visual/before.json`, `tests/e2e/adversarial-matrix-20260929.spec.ts`, `lighthouse.json`.

---


### Continuation evidence — 2026-09-29T04:26Z

- **Not shipped. Campaign and Cycle 0 remain incomplete.** Legitimate authorization is now proven: existing gh CLI session has `repo, workflow, read:org, gist` scopes and repository admin/push; this is distinct from the previously denied App credential. No denied credential retry. Default Firebase CLI session/ADC absent; Actions secret name exists but Firebase deploy authority has not yet been exercised.
- Unsafe remote merge-all Deploy workflow **240428014 disabled_manually before any push**; no in-progress legacy run was observed. Do not re-enable it. New workflow path `ship.yml` is independent of disabled `deploy.yml`.
- Draft PR **#39**: https://github.com/Victordtesla24/forgotten-mistory/pull/39. First actual `ship` run **36522599935** at head `6d4061045a8bbca26c43e61736fe2a05111222a5`: install, types, lint, static audit and node tests passed; full browser/preview/production gates not yet established. Follow-up head includes correction commit `608dca0`; inspect latest PR head/run before resuming.
- Functional Playwright suite restored unfiltered to blocking CI; D-005 quarantine is revoked. Mobile Lighthouse budget now enforces Performance .90, Accessibility/Best Practices/SEO .95, LCP2500ms, TBT200ms; existing stricter CLS.05 preserved. Preview smoke, artifact identity and in-run gated rollback implemented. Independent CI review rejected first version, then approved corrected source (34 contract tests; 117 node tests locally), NOT remote deployment.
- UX-P1-001: independently authored RED (CTA right344 at viewport320); final local test PASS after fixing grid minimum and CTA/address containment. Skills control PASS and Skills source unchanged. Still IN-REVIEW, not production-closed.
- UX-P2-002: independent RED confirmed missing aria-current. Source review rejected initial Back lock. Follow-up built successfully at `608dca0`; final focused run **3 passed / 1 failed**: desktop manual scroll to Listen after Back retains URL #skills (expected #listen). **IN-FIX**, not ready for merge. Test unchanged; pending-anchor logic is next diagnostic target, not a confirmed complete root cause. Mobile navigation test passes.
- Fresh independent production QA: seven specified widths have no document overflow; 320px remains344px; one h1 and zero observed console/page errors; axe0 at390/1440; CV200 application/pdf,157615bytes, MD5 `16b856c0f3f4ec0d801fdde6d084452c`. Production hash remains absent; main remains `a6f2ad8c10f30113d3a6ef4ca0211807d309279f`. No J1-J8 full completion or new perf pass claimed; previous mobile86/LCP3.34/TBT262 remains failing baseline.
- No squash merge, Firebase preview/live release, preview smoke, actual branch-preview rollback drill, or main/live parity proof has occurred. Do not resume automatic publication on a schedule until these gates are established. Daemon configuration was not touched.
- Evidence: `evidence/20260929T0426Z/authorization.json`, `production-qa.json`, `test-author.json`, `tdd-before-final.log.gz`, `ci-review-initial.json`, `ci-review-final.json`, `release-final.json`, `ui-review.json`, `fixer-followup.json`, `fixer-grid.json`, `build-final.log.gz`, `tdd-final.log.gz`. UI review citations of pre-fix logs are pre-fix only, not post-fix proof; final runtime log is authoritative.


| Field | Value |
| --- | --- |
| Run ID | `20260929T0258Z` |
| Cycle | 0 (pipeline + baseline) |
| UTC start | 2026-09-29T02:58Z |
| UTC end (this update) | see release log row C0 |
| Production URL | https://forgotten-mistory.web.app |
| Production build hash (pre-Cycle-0) | **UNVERIFIED on the page** — live HTML carries no `build-commit` meta (D-003); last successful Deploy run `34089202228` shipped `3f9865a5`; `last-modified: Mon, 14 Sep 2026 06:14:21 GMT` |
| `main` HEAD at start | `a6f2ad8c10f30113d3a6ef4ca0211807d309279f` |
| Work branch | `uiux/c0-ci-ship-pipeline` |
| Roles (isolation, no model identities — D-010) | Repo Cartographer (repo read), UX Scout (`scripts/uiux/scout_production.mjs`, 7 viewports), Persona Auditor (`scripts/uiux/persona_journeys.mjs`, J1–J8), A11y (`scripts/uiux/axe_production.mjs` + `tests/a11y`), Perf (Lighthouse CLI ×3 mobile + ×3 desktop, medians), Release Engineer (workflow + tests), Reviewer and Production QA run as separate subagents with their own tool context; the author of a change never verifies it |

## B. Executive critique (PM + designer voice)

**What works and must be protected (measured):** the page is honest and clean at every audited viewport — 0 console errors, 0 horizontal overflow at the seven §3.2 viewports, 0 fixed-element overlaps, 0 axe violations (mobile + desktop, `/` and 404), a single h1, exactly one italic, the three sanctioned typefaces only, every nav anchor resolving to a real section, the CV downloading with an MD5 that matches the fingerprint printed in Skills, `/api/chat` and `/api/tts` answering with honest JSON/audio, and the hero complete with JavaScript disabled. Desktop Lighthouse is 100/100/100/100 with LCP 0.64 s and CLS 0.

**Top 5 opportunities (ranked by P-level then RICE):**
1. **UX-C0-001 — the delivery pipeline itself.** Production has not moved since 14 Sep because every deploy died at `npm ci`; the old workflow auto-merged branches with "branch wins conflicts" and deployed every 10 minutes ungated. Nothing else in this ledger can ship until this is fixed.
2. **UX-P1-001 — reflow at 320 px / 400 % zoom.** Listen's filled email plate and channel links, and the Skills table, push the document 24 px wider than the viewport (WCAG 1.4.10). P4 readers zoomed to 400 % get a horizontal scroll on the two sections that carry the contact route and the calibration card.
3. **UX-P1-006 — mobile field performance.** Lighthouse mobile median Performance 86, LCP 3.34 s, TBT 262 ms against §9 thresholds of ≥ 90 / ≤ 2.5 s / ≤ 200 ms. Measured from a loaded 2-vCPU VM, so treat the absolute numbers as pessimistic — but three runs agree and the CI runner will re-measure.
4. **UX-P2-002 — navigation has no active state.** No `aria-current`, no active class, on any nav link at any viewport, and the URL hash does not follow scroll — P1 executives skimming on mobile lose "where am I" (Nielsen #1).
5. **UX-P2-003 — small targets.** Footer legal links are 15 px tall, Vitrine "Source" links 22 px, the Menu button 20 px (WCAG 2.5.8 minimum 24 × 24).

**Scorecard (measured values only):**

| Lens | Signal | Value (production, this run) | §9 threshold | Verdict |
| --- | --- | --- | --- | --- |
| PM | J1 time to identify role/seniority/3 sourced figures + contact visible (390×844) | 6.5 s, 1 scroll, 3/3 figures sourced | ≤ 30 s, ≤ 2 scrolls | PASS |
| PM | J2 interactions to CV | 1 (hero link), PDF 200 `application/pdf`, MD5 match | ≤ 2 | PASS |
| Design | Horizontal overflow at 7 viewports | 0 | 0 | PASS |
| Design | Fixed-element overlaps | 0 | 0 | PASS |
| Design | Nav active state | none (0/6 links, 1280 and 390) | — | FAIL (UX-P2-002) |
| A11y | axe serious/critical | 0 (30/20/31/21 rules passing across 4 checks) | 0 | PASS |
| A11y | Reflow at 320 px | scrollWidth 344 vs 320 | 0 overflow | FAIL (UX-P1-001) |
| A11y | Targets < 24 px | 5 element groups | 0 | FAIL (UX-P2-003) |
| A11y | Keyboard: skip link, dialog focus, Escape | PASS on manual recheck (J4) | 0 traps | PASS |
| Perf | Lighthouse mobile Perf / A11y / BP / SEO (median of 3) | 86 / 100 / 100 / 100 | ≥ 90 / ≥ 95 ×3 | FAIL Perf (UX-P1-006) |
| Perf | Mobile LCP / CLS / TBT (median) | 3.34 s / 0 / 262 ms | ≤ 2.5 s / ≤ 0.1 / ≤ 200 ms | FAIL LCP, TBT |
| Perf | Lighthouse desktop (median of 3) | 100 / 100 / 100 / 100; LCP 0.64 s, CLS 0, TBT 25 ms | — | PASS |
| Perf | Console errors, all viewports | 0 (1 warning: unused preloaded CSS chunk on 768/1440/1920) | 0 errors | PASS (UX-P3-004 for the warning) |
| Tech | Failed requests on critical journeys | `/privacy`, `/terms` prefetch `ERR_ABORTED` only (direct GET 200) | 0 | PASS with note |
| Content | Italic count / fonts / single h1 | 1 / Inter, Source Serif 4, IBM Plex Mono / 1 | invariant §2.3.5 | PASS |
| Release | main ↔ live parity | unprovable (no meta on live) | 100 % | FAIL (UX-C0-001, D-003) |

## C. Prioritized findings backlog

#### UX-C0-001 — Production frozen: deploy dies at `npm ci`, pipeline auto-merges branches ungated
- Lens / framework:      Release engineering · §6.1 · §9 parity
- Persona(s) affected:   P1 | P2 | P3 | P4 (no fix can reach any of them)
- Section / viewport:    Global · pipeline
- Observed (production): every `Deploy` run since 2026-09-07 fails at `npm ci` (ERESOLVE); live `last-modified` 14 Sep 2026; live HTML has no `build-commit` meta; `checks.yml` 0 green in last 60 runs (44 cancelled, 16 failed). Evidence: `evidence/20260929T0258Z/scout__all__sweep__pre__20260929T030312Z.json` (`meta` block, no build-commit), GitHub run lists cited in REPO-MAP.md.
- Expected:              §6.2 trunk-based single path: PR → gates → preview → squash → deploy → parity → smoke → auto-revert; no auto-merge; no cron < hourly.
- Root cause:            `.github/workflows/deploy.yml` (old, lines 18–23 cron `*/10`, 40–85 merge-all `-X theirs`, 92–99 `npm ci || npm install`) plus Dependabot bumps merged unchecked leaving `package.json`/`package-lock.json` unresolvable.
- Recommendation:        Replace with the gated `ship` workflow; restore the last-green dependency set so the gate can run at all (D-001).
- Fix specification:     `.github/workflows/deploy.yml` (rewritten, name `ship`), `.github/workflows/nightly.yml` (new), `.github/workflows/checks.yml` (deleted, D-006), `lighthouserc.json` (D-009), `tests/ci_pipeline.test.mjs` (new contract), `@smoke` tags on 8 specs + `tests/e2e/smoke-cv.spec.ts`, `package.json`/`package-lock.json` reverted to `3f9865a` versions. Invariants §2.3 untouched (no UI change).
- Test added:            `tests/ci_pipeline.test.mjs` — 30 contract assertions (fail on the old workflow: two-workflow set, no `-X theirs`, no cron more frequent than hourly, `needs: gates`, parity/rollback steps, hidden-file artifact uploads); `tests/e2e/smoke-cv.spec.ts` TC-SMOKE-CV-01.
- Verification recipe:   (1) `gh run list --workflow=deploy.yml --branch main --limit 1` → conclusion `success`; (2) `curl -s https://forgotten-mistory.web.app/ | grep -o 'name="build-commit" content="[0-9a-f]*"'` → prefix of `git rev-parse origin/main`; (3) `PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test --grep @smoke` → all pass; (4) rollback dry-run logged in E.
- RICE:                  10 × 3 × 1.0 ÷ 3 = 10.0
- Status:                IN-REVIEW — workflow-write route proven and draft PR #39 published; Cycle 0 NOT complete. See continuation evidence in A.
- Shipped in:            pending
- Evidence (post-fix):   pending

#### UX-P1-001 — Horizontal overflow at 320 px (400 % zoom): Listen email plate, channel links and Skills table exceed the viewport
- Lens / framework:      WCAG 2.2 1.4.10 Reflow · Nielsen #8 aesthetic/minimalist
- Persona(s) affected:   P4 (also P1 on 320-px-class phones)
- Section / viewport:    06 Listen + 04 Skills · 320×800 (400 % zoom emulation)
- Observed (production): `document.documentElement.scrollWidth` 344 vs `clientWidth` 320. Culprits by bounding box: `Listen .engage` (filled email plate, `inline-flex`, mono `--fs-lede`, no wrap) right edge 327; `Listen .channel` links right 327; `#skills table tr` right 327 inside `.tableWrap` with `overflow-x: visible`. 640 px (200 %) is clean. Evidence: `evidence/20260929T0258Z/J5__320x800__zoom400__pre__20260929T030642Z.webp`, `journeys__all__J1-J8__pre__20260929T030837Z.json` (J5 step "400% zoom").
- Expected:              Content reflows to a 320-px-wide viewport without two-dimensional scrolling (1.4.10); tables may scroll within their own container.
- Root cause:            `components/sections/Listen/Listen.module.css:331–345` `.engage` is `inline-flex` with a single-line mono label whose padding + glyphs exceed 320 px; `:362–375` `.channel` mono addresses (`linkedin.com/in/…`) cannot break; `components/sections/Skills/Skills.module.css:195–197` `.tableWrap { display: block }` has no `overflow-x: auto`, so the fixed-column table widens the page.
- Recommendation:        Let the plate and the channel labels wrap/break at narrow widths and let the calibration table scroll inside its own wrapper — the contact route and the calibration card must stay reachable at 400 % zoom (P4's whole journey).
- Fix specification:     `Listen.module.css` `.engage`: `max-width: 100%; flex-wrap: wrap; text-align: center; overflow-wrap: anywhere;` `.channel`: `max-width: 100%; overflow-wrap: anywhere;` (tokens only, no new values); `Skills.module.css` `.tableWrap`: `overflow-x: auto; -webkit-overflow-scrolling: touch;` — invariants respected: §2.3.5 typography unchanged, §2.3.4 caliper untouched, §2.3.9 no content change.
- Test added:            planned `tests/a11y/reflow-320.spec.ts` — viewport 320×800, assert `scrollWidth <= clientWidth` for the document and for `#listen`, `#skills` bounding boxes (fails before on `out/`, passes after).
- Verification recipe:   `node scripts/uiux/persona_journeys.mjs --only J5 --label post` on production → J5 `zoom400.scrollWidth == 320`; plus screenshot `UX-P1-001__320x800__zoom400__post__<stamp>.webp`.
- RICE:                  4 × 3 × 0.9 ÷ 1 = 10.8
- Status:                IN-REVIEW — narrow reflow passes locally; final source review and production verification pending
- Shipped in:            —
- Evidence (post-fix):   —

#### UX-P1-006 — Mobile Lighthouse Performance 86, LCP 3.34 s, TBT 262 ms (below §9)
- Lens / framework:      CWV-LCP · CWV-INP (TBT proxy) · §9 thresholds
- Persona(s) affected:   P1 (mobile, between meetings)
- Section / viewport:    01 Hero · Lighthouse mobile emulation (Moto G Power / 4G)
- Observed (production): medians of 3 runs — Performance 0.86, FCP 1.23 s, LCP 3.34 s, TBT 262 ms, SI 3.07 s, CLS 0. Evidence: `evidence/20260929T0258Z/lighthouse__all__medians__pre__20260929T032905Z.json`, per-run `lighthouse__mobile__run{1,2,3}__pre__*.json.gz`. Caveat: measured on a 2-vCPU VM at load average 7–11; the CI runner's `lhci` run will re-measure on a quiet machine.
- Expected:              Performance ≥ 90, LCP ≤ 2.5 s, TBT ≤ 200 ms.
- Root cause:            UNVERIFIED — not yet traced (LCP element and long tasks to be read from the run JSON `audits.largest-contentful-paint-element` / `long-tasks` in Cycle 1).
- Recommendation:        Identify the LCP element and the main-thread work behind TBT before proposing changes; do not touch the hero's no-JS-first contract.
- Fix specification:     TBD after root cause.
- Test added:            `lighthouserc.json` budget (LCP 3500 / TBT 400 currently) — to be tightened only after the fix, never before.
- Verification recipe:   3× `lighthouse https://forgotten-mistory.web.app/ --output=json` (mobile default) on a quiet runner; medians ≥ 90 / ≤ 2.5 s / ≤ 200 ms.
- RICE:                  6 × 2 × 0.6 ÷ 3 = 2.4
- Status:                OPEN
- Shipped in:            —
- Evidence (post-fix):   —

#### UX-P2-002 — Navigation links carry no active state and the URL hash does not follow the section
- Lens / framework:      Nielsen #1 visibility of system status · WAI-ARIA `aria-current` · J8
- Persona(s) affected:   P1 | P4
- Section / viewport:    Global navigation · 1280×800 and 390×844
- Observed (production): after activating each nav link the target scrolls into view (top ≈ 96 px) but `activeLinks: []` for all 6 links at both viewports; no `aria-current`, no active class; `hashUpdated: false` for the first link and inconsistent thereafter. Evidence: `evidence/20260929T0258Z/journeys__all__J1-J8__pre__20260929T030837Z.json` (J8 steps), `J8__1280x800__after-nav__pre__20260929T030810Z.webp`, `J8__390x844__after-nav__pre__20260929T030837Z.webp`.
- Expected:              J8: "updates URL hash, correct active state"; the current section's link exposes `aria-current="location"` (or `page`) and a visible state.
- Root cause:            `components/site/Navigation.tsx` has no `aria-current`, no IntersectionObserver/scroll-spy and no active class logic (grep: 0 matches for `aria-current`, `IntersectionObserver`).
- Recommendation:        A scroll-spy that sets `aria-current` on the link of the section occupying the viewport, styled with an existing token (underline/opacity), so readers always know where they are.
- Fix specification:     `Navigation.tsx` (observer over the six section ids, `aria-current` on the matching link), `app/globals.css` or nav module for `[aria-current]` style using existing tokens; invariants: no new colour, §2.3.5 fonts unchanged.
- Test added:            planned `tests/e2e/navigation.spec.ts` TC-NAV-09: after clicking `#about`, `a.nav-link[href="#about"]` has `aria-current`; exactly one link is current.
- Verification recipe:   `node scripts/uiux/persona_journeys.mjs --only J8 --label post` on production → `activeLinks.length == 1` per step at 1280 and 390.
- RICE:                  7 × 2 × 0.9 ÷ 2 = 6.3
- Status:                IN-FIX — final desktop manual-scroll/hash test fails; see continuation evidence
- Shipped in:            —
- Evidence (post-fix):   —

#### UX-P2-003 — Targets under 24 px: footer legal links (15 px), Vitrine "Source" (22 px), Menu button (20 px)
- Lens / framework:      WCAG 2.2 2.5.8 Target Size (Minimum)
- Persona(s) affected:   P1 (mobile) | P4
- Section / viewport:    Footer, 05 Vitrine, Navigation · all 7 viewports (heights measured at 360×740 … 1920×1080)
- Observed (production): `smallTargets` in the scout sweep: `Menu` button 75×20, Vitrine `Source` links 44×22, footer `Privacy Policy` 86×15, `Terms` 38×15, `Contact support` 100×15. Evidence: `evidence/20260929T0258Z/scout__all__sweep__pre__20260929T030312Z.json` (`global.smallTargets` per viewport), `listen__390x844__view__pre__20260929T030006Z.webp`.
- Expected:              ≥ 24×24 CSS px, or 24-px spacing exception, for every pointer target.
- Root cause:            `components/site/Footer.tsx` legal line renders inline anchors at the caption size with no padding; Vitrine `Source` link and `.menu-toggle` have no min block size (UNVERIFIED for the exact CSS lines — to be confirmed by the fixer).
- Recommendation:        Give the inline links a `min-height: 24px` / `padding-block` using spacing tokens, keeping the text size — tap accuracy for executives on phones and for tremor/pointer-impaired readers.
- Fix specification:     `components/site/Footer.module.css`, Vitrine module, nav toggle style: `display: inline-flex; align-items: center; min-height: 24px; padding-block: var(--space-1)` (tokens only). Invariants: no type-scale change.
- Test added:            planned `tests/a11y/target-size.spec.ts`: every `a, button` in `footer`, `#vitrine`, `nav` has bounding-box height ≥ 24 at 390×844 and 1440×900.
- Verification recipe:   `node scripts/uiux/scout_production.mjs --label post` → `smallTargets` empty at every viewport.
- RICE:                  6 × 1 × 0.9 ÷ 1 = 5.4
- Status:                OPEN
- Shipped in:            —
- Evidence (post-fix):   —

#### UX-P2-005 — 31 pre-existing failing Playwright specs on `main`
- Lens / framework:      §8.4/§8.5 test integrity · §6.1 critical path
- Persona(s) affected:   — (engineering)
- Section / viewport:    various
- Observed (production): local full suite against `out/` built from `main` + D-001: 468 passed / 31 failed (27.9 min). Files: `tests/a11y/reduced-motion-choreography.spec.ts` (2), `tests/e2e/interaction-states.spec.ts` (3), `tests/e2e/listen.spec.ts` TC-LISTEN-05/06, `tests/monochrome/gold-semantics.spec.ts` CC-A2, `tests/monochrome/minivic-launcher.spec.ts` MONO-MV-02, `tests/overhaul/cinematic.spec.ts` TC-CINE-01, `tests/overhaul/design-scale.spec.ts` (8: font-step + measure at 375/768/1280/1920), `tests/overhaul/durability.spec.ts` TC-DURABLE-04, `tests/overhaul/interim-frame.spec.ts` (1), `tests/overhaul/listen-flagship.spec.ts` (3), `tests/overhaul/render.spec.ts` (1), `tests/overhaul/scene-error-boundary.spec.ts` (2), `tests/visual/screenshots.spec.ts` (5). The same reduced-motion, interaction-states and listen specs failed in Checks run `34019931083` (2026-09-06) → pre-existing. Evidence: `evidence/20260929T0258Z/e2e__local__full__pre__20260929T032638Z.log.gz`.
- Expected:              A green full functional suite on every PR/main gate. D-005 quarantine is revoked; failures block merge and shipment.
- Root cause:            UNVERIFIED per spec; some (visual screenshots, scene-error-boundary) may be environment-sensitive on a software renderer — to be triaged one spec at a time in later cycles, each as its own finding.
- Recommendation:        Triage into (a) real UX regressions → findings, (b) stale assertions → fix the test with a documented reason, never by loosening thresholds silently.
- Fix specification:     per spec, later cycles.
- Test added:            n/a (these are the tests).
- Verification recipe:   `nightly.yml` run green, or per-spec `npx playwright test <file>` against `out/`.
- RICE:                  3 × 2 × 0.8 ÷ 4 = 1.2
- Status:                OPEN
- Shipped in:            —
- Evidence (post-fix):   —

#### UX-P3-004 — Preloaded CSS chunk not used within the load window (console warning, ≥ 768 px)
- Lens / framework:      Perf lens · console hygiene
- Persona(s) affected:   P2 | P3 (desktop)
- Section / viewport:    Global · 768×1024, 1440×900, 1920×1080
- Observed (production): console warning "The resource `/_next/static/chunks/1bfq368l43644.css` was preloaded using link preload but not used within a few seconds". Evidence: `evidence/20260929T0258Z/scout__all__sweep__pre__20260929T030312Z.json` (`console` per viewport).
- Expected:              0 console warnings on load (§9 counts errors; warnings are hygiene).
- Root cause:            UNVERIFIED — Next.js emits the preload for a CSS chunk belonging to a lazily-mounted component (likely a GL/section chunk that does not mount in headless).
- Recommendation:        Low priority; confirm on a GPU browser before acting.
- Fix specification:     TBD.
- Test added:            none yet.
- Verification recipe:   scout sweep `console` empty at 1440×900.
- RICE:                  3 × 0.5 × 0.5 ÷ 1 = 0.75
- Status:                OPEN
- Shipped in:            —
- Evidence (post-fix):   —

### C4 shipped findings (current evidence supersedes historical status)

#### C4-SSR-BARS — Experience duration bars invisible with blocked scripts
- Lens / framework: WCAG accessibility · Nielsen visibility/control.
- Persona(s) affected: P1, P4.
- Section / viewport: Experience; desktop, blocked JavaScript.
- Observed (production): failing-before evidence `evidence/c4-repairs/before.json`.
- Expected: accessible meaningful static content and usable named controls.
- Root cause / recommendation / fix specification: Static CSS scaleX(0) required client data-entered. Default scaleX(1), entry-only keyframe preserves motion. Minimal source changes; facts and privacy unchanged.
- Test added: `tests/e2e/adversarial-repairs.spec.ts`.
- Verification recipe: Block JavaScript requests; scroll #experience; each trackBar painted scale >=0.95.
- RICE: ordinal triage estimate 4 × 2 × 1 ÷ 1 = 8 (not an observed usage metric).
- Status: VERIFIED-CLOSED by independent Production QA for this recipe only.
- Shipped in: C4, PR46, main `82ffb9ee`, live run36537718878, 2026-09-29.
- Evidence (post-fix): `evidence/c4-repairs/production-qa.json`, `production-tests.log`, `review-final.json`.

#### C4-NESTED-FOCUS — Vitrine nested arrow keys stole focus
- Lens / framework: WCAG accessibility · Nielsen visibility/control.
- Persona(s) affected: P1, P4.
- Section / viewport: Vitrine; keyboard.
- Observed (production): failing-before evidence `evidence/c4-repairs/before.json`.
- Expected: accessible meaningful static content and usable named controls.
- Root cause / recommendation / fix specification: Parent plate handler accepted bubbled descendant keydown. Guard target=currentTarget. Minimal source changes; facts and privacy unchanged.
- Test added: `tests/e2e/adversarial-repairs.spec.ts`.
- Verification recipe: Focus first nested stage button; ArrowRight keeps focus; direct plate arrows still navigate.
- RICE: ordinal triage estimate 4 × 2 × 1 ÷ 1 = 8 (not an observed usage metric).
- Status: VERIFIED-CLOSED by independent Production QA for this recipe only.
- Shipped in: C4, PR46, main `82ffb9ee`, live run36537718878, 2026-09-29.
- Evidence (post-fix): `evidence/c4-repairs/production-qa.json`, `production-tests.log`, `review-final.json`.

#### C4-STAGE-STATE — Vitrine stage selection not announced
- Lens / framework: WCAG accessibility · Nielsen visibility/control.
- Persona(s) affected: P1, P4.
- Section / viewport: Vitrine; assistive technology.
- Observed (production): failing-before evidence `evidence/c4-repairs/before.json`.
- Expected: accessible meaningful static content and usable named controls.
- Root cause / recommendation / fix specification: Selected state existed only as data-active; added aria-pressed. Minimal source changes; facts and privacy unchanged.
- Test added: `tests/e2e/adversarial-repairs.spec.ts`.
- Verification recipe: Stage one aria-pressed=true; select stage two; first=false, second=true.
- RICE: ordinal triage estimate 4 × 2 × 1 ÷ 1 = 8 (not an observed usage metric).
- Status: VERIFIED-CLOSED by independent Production QA for this recipe only.
- Shipped in: C4, PR46, main `82ffb9ee`, live run36537718878, 2026-09-29.
- Evidence (post-fix): `evidence/c4-repairs/production-qa.json`, `production-tests.log`, `review-final.json`.

#### C4-MENU-TARGET — Menu target below 24px
- Lens / framework: WCAG accessibility · Nielsen visibility/control.
- Persona(s) affected: P1, P4.
- Section / viewport: Global; 320/390.
- Observed (production): failing-before evidence `evidence/c4-repairs/before.json`.
- Expected: accessible meaningful static content and usable named controls.
- Root cause / recommendation / fix specification: Measured height19.5px; min-height now existing --space-6 token. Minimal source changes; facts and privacy unchanged.
- Test added: `tests/e2e/adversarial-repairs.spec.ts`.
- Verification recipe: At320 and390 Menu bounding height >=24 and width>=24.
- RICE: ordinal triage estimate 4 × 2 × 1 ÷ 1 = 8 (not an observed usage metric).
- Status: VERIFIED-CLOSED by independent Production QA for this recipe only.
- Shipped in: C4, PR46, main `82ffb9ee`, live run36537718878, 2026-09-29.
- Evidence (post-fix): `evidence/c4-repairs/production-qa.json`, `production-tests.log`, `review-final.json`.


## D. Persona journey maps (production, run 20260929T0258Z, pre-fix)

| Journey | Persona · viewport | Steps (timing) | Result | Screenshots |
| --- | --- | --- | --- | --- |
| J1 | P1 · 390×844 | cold load 0.69 s → hero read 1.7 s (h1, role, seniority, 3/3 figures with sources) → 1 scroll → contact visible; total 6.5 s | PASS | `J1__390x844__fold__pre__20260929T030504Z.webp`, `J1__390x844__contact-visible-after-1-scrolls__pre__20260929T030507Z.webp` |
| J2 | P2 · 1440×900 | load 1.16 s → CV link visible in fold (1 interaction) → GET PDF 200 `application/pdf` 157 615 B → MD5 `16b856c0f3f4ec0d801fdde6d084452c` == Skills fingerprint | PASS | `J2__1440x900__fold__pre__20260929T030512Z.webp`, `J2__1440x900__skills-fingerprint__pre__20260929T030519Z.webp` |
| J3 | P3 · 1280×800 | load 0.5 s → Vitrine: 9 repo/source links all HTTP 200, `target=_blank rel=noreferrer noopener` → return keeps scroll (new tab, page untouched) → Listen closing CTA single filled plate | PASS (script flag was a false negative: popup return, not a same-tab back) | `J3__1280x800__vitrine__pre__20260929T030527Z.webp`, `J3__1280x800__returned__pre__20260929T030538Z.webp`, `J3__1280x800__listen__pre__20260929T030540Z.webp` |
| J4 | P4 keyboard · 1280×800 | first Tab = "Skip to the evidence" (visible outline) → Tab through sections → MiniVic launcher → Enter opens dialog, focus moves into `MiniVic assistant panel` (recheck with 1.5 s settle) → Escape closes, focus returns to launcher | PASS on manual recheck (first scripted pass read focus too early — timing, not a defect) | `J4__1280x800__skip-link-focus__pre__20260929T030550Z.webp`, `J4__1280x800__minivic-open__pre__20260929T030613Z.webp`, `J4__1280x800__after-escape__pre__20260929T030618Z.webp` |
| J5 | P4 SR/zoom/RM · 1280 / 640 / 320 | single h1, logical outline, landmarks present, canvases 0 under reduced motion → 200 % (640) no overflow → 400 % (320) scrollWidth 344 | **FAIL at 400 %** → UX-P1-001 | `J5__1280x800__reduced-motion__pre__20260929T030631Z.webp`, `J5__640x800__zoom200__pre__20260929T030638Z.webp`, `J5__320x800__zoom400__pre__20260929T030642Z.webp` |
| J6 | JS disabled · 1280×800 | hero present, h1, 792 chars, 3 figures, 5 CTAs; all anchors resolve | PASS | `J6__1280x800__nojs-fold__pre__20260929T030649Z.webp`, `J6__1280x800__nojs-full__pre__20260929T030654Z.webp` |
| J7 | MiniVicBot degraded paths | POST `/api/chat` 200 JSON (`text`, `provider`, `attempts`); POST without messages → 400 `{"error":"messages_required"}`; `/api/tts` 200 `audio/mpeg`; UI sends `/api/chat?warm=1` → 204 | PASS (honest states) | `J7__1280x800__after-send__pre__20260929T030729Z.webp` |
| J8 | Navigation integrity · 1280 / 390 | Menu button named, `aria-controls=site-nav-overlay`; each link scrolls to its section (target top ≈ 96) incl. mobile menu; **no active state on any link; hash not consistently updated** | **FAIL** → UX-P2-002 | `J8__1280x800__after-nav__pre__20260929T030810Z.webp`, `J8__390x844__after-nav__pre__20260929T030837Z.webp` |

Raw data: `journeys__all__J1-J8__pre__20260929T030837Z.json`.

## E. Release log

C4: 2026-09-29 ~07:15–07:41Z; four repairs above; PR46; source ec3d135; main82ffb9ee; preview36537399630/live36537718878 success; parity82ffb9ee; local/preview/live16 each; perf delta UNMEASURED; rollback drill NOT RUN.


| Cycle | UTC start | UTC end | Findings shipped | Commit SHA | Deploy ID | Parity | Lighthouse (mobile Perf/LCP/CLS/TBT) | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C0 | 2026-09-29T02:58Z | not merged | UX-C0-001 (pipeline) — BLOCKED: branch push rejected (token lacks `workflows` scope); no PR/run | none | UNVERIFIED (live HTML has no build-commit meta) | not run | baseline 86 / 3.34 s / 0 / 262 ms | not run (blocked upstream) |
| C1 | — | not started | UX-P1-001 (320 px reflow) — NOT STARTED: cannot ship before Cycle 0 lands; plan in HOURLY-EXECUTION-PLAN.md | none | — | — | — | — |

## F. Verified no-issue register

C4 current protection: independent live16-case regression including all six flagships; eight tested widths without document overflow; one h1; no captured console/page errors. Broad visual/a11y/performance completeness not certified.
 (production, run 20260929T0258Z)

| Check | Result | Evidence |
| --- | --- | --- |
| Console errors, 7 viewports, load + section views | 0 | `scout__all__sweep__pre__20260929T030312Z.json` |
| Horizontal overflow at 360/390/768/1024/1280/1440/1920 | 0 (all `overflowX: false`) | same |
| Fixed-element overlaps (MiniVic dock vs CTAs) | 0 | same (`fixed.overlaps`) |
| Nav anchors resolve; 6 sections present; single h1; `lang` set | all true | same (`global.anchors`, `sectionsPresent`, `h1s`) |
| Italic count (§2.3.5) | exactly 1 (Listen closing sentence) | same (`global.italic`) |
| Typefaces (§2.3.5) | Inter, Source Serif 4, IBM Plex Mono only | same (`global.fonts`) |
| Unnamed controls | 0 | same (`global.unnamed`) |
| WebGL under headless/software renderer and reduced motion (§2.3.7) | 0 canvases mounted | same (`canvases`), J5 |
| axe WCAG 2.0/2.1 A+AA, mobile 360×740 + desktop 1440×900, `/` + 404 | 0 violations | `axe__all__live__pre__20260929T030658Z.json` |
| CV download and fingerprint parity | 200 `application/pdf`, MD5 `16b856c0f3f4ec0d801fdde6d084452c` == Skills | J2 in journeys JSON |
| `/api/chat` honesty | 200 JSON with `text`; 400 `messages_required` without messages | J7 |
| `/api/tts` | 200 `audio/mpeg` | J7 |
| No-JS hero completeness | PASS | J6 |
| Routes | `/` 200, `/privacy` 200, `/terms` 200, `/nope` 404, `/privacy/` and `/terms/` 404 (cleanUrls) | curl log in run notes |
| Lighthouse desktop (median of 3) | 100/100/100/100, LCP 0.64 s, CLS 0, TBT 25 ms | `lighthouse__all__medians__pre__20260929T032905Z.json` |
| Lighthouse mobile A11y / BP / SEO | 100 / 100 / 100 | same |
| JSON-LD / meta present | present per scout `meta`/`jsonld` blocks (validity UNVERIFIED — not run through a validator) | scout JSON |
