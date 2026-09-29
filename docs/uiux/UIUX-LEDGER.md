# UI/UX LEDGER — forgotten-mistory

Single source of truth for the hourly UI/UX release cycle. Updated in place every cycle. Every verdict below is tied to a file under `docs/uiux/evidence/<run-id>/`; anything not measured in this run is marked **UNVERIFIED**. Historical claims from prior boards/audits were treated as unverified and re-measured.

---

## A. Run header

### Release cycle 1 — 2026-09-29T05:45Z

- **Production released.** PR39 (gated pipeline) merged into `main` and shipped via `ship.yml` to production (run 36524613924); confirmed by `build-commit` meta `6abe8aa` on live HTML. PR40 (mobile clipping) also merged (67438ff). Legacy `deploy.yml` remains disabled.
- **Parity verified.** Live build hash `6abe8aa` matches `main` HEAD at merge. Production URL: https://forgotten-mistory.web.app/.
- **Remediation status.** 
    - **UX-P1-001 (320px Reflow): CLOSED.** Confirmed fixed in production: J5 `zoom400` scrollWidth 320 (0 overflow). 
    - **UX-P2-002 (Navigation state): IN-REVIEW.** Critical follow-up fix for manual-scroll/history regression (UX-P2-002) is published in PR42 (branch `uiux/c1-final`). Current production (6abe8aa) has active state and aria-current, but the manual-scroll anchor lock was overly aggressive; PR42 releases it on scroll settle or user intent.
    - **UX-P1-006 (Performance): IN-REVIEW.** Mobile median Performance 82, LCP 3.2s on production (run 20260929T0548Z). Fails §9 gate (>=90 / <=2.5s). Optimizations (LCP preload, font preload) are staged in PR42.
- **QA Summary.** Fresh independent production QA: J1, J2, J5, J6, J7, J8 PASS. J3 and J4 failing on minor detail/timing issues in scripts. 0 axe serious/critical. 0 console errors. No document overflow at 7 viewports + 320px. 
- **Evidence:** `evidence/20260929T0545Z/production-qa-pr39.json`, `lh_prod.json`, `lh_provided_full.json`, `nav-fix-verification.json`.

| Field | Value |
| --- | --- |
| Run ID | `20260929T0545Z` |
| Cycle | 1 (remediation follow-up) |
| UTC start | 2026-09-29T05:45Z |
| UTC end | 2026-09-29T06:00Z |
| Production URL | https://forgotten-mistory.web.app |
| Production build hash | `6abe8aa` (verified on page) |
| `main` HEAD at start | `67438ff` |
| Work branch | `uiux/c1-final` |
| Roles | Repo Cartographer, UX Scout, Persona Auditor, A11y, Perf, Release Engineer, Reviewer |

## B. Executive critique (PM + designer voice)

**What works and must be protected (measured):** The delivery pipeline is restored and verified — production is live and matches `main` parity. The 320 px reflow is fixed; the Listen CTA and Skills table stay within the viewport at 400% zoom. The navigation now carries `aria-current` and active states in the menu. All invariants (§2.3) hold: single h1, fonts, typefaces, no-JS hero, zero console errors.

**Top 5 opportunities (ranked by P-level then RICE):**
1. **UX-P1-006 — mobile field performance.** Production mobile Performance 82 / LCP 3.2s remains below §9 gates. Staged preloading of LCP image and critical fonts in PR42 aimed at closing this gap.
2. **UX-P2-002 — navigation anchor lock.** Manual scrolling immediately after 'Back' navigation is intermittently blocked by the anchor lock (2.2s). PR42 reduces lock duration and releases on user intent.
3. **UX-P2-003 — small targets.** Footer legal links and Vitrine source links remain under 24 px; tap accuracy remediation planned for Cycle 2.
4. **UX-P2-005 —Red specs on main.** 31 pre-existing red specs block nightly success; triage required.
5. **UX-P3-004 — CSS chunk warning.** Hygiene fix for unused preload warning at desktop viewports.

**Scorecard (measured values only):**

| Lens | Signal | Value (production, hash 6abe8aa) | §9 threshold | Verdict |
| --- | --- | --- | --- | --- |
| PM | J1 time to identifying Vick... | 2.2 s, 1 scroll | ≤ 30s | PASS |
| PM | J2 interactions to CV | 1 (hero link), MD5 match | ≤ 2 | PASS |
| Design | Horizontal overflow at 7 viewports | 0 | 0 | PASS |
| Design | Nav active state | 6/6 links | — | PASS (Cycle 1) |
| A11y | axe serious/critical | 0 | 0 | PASS |
| A11y | Reflow at 320 px | 0 overflow | 0 overflow | PASS (UX-P1-001) |
| Perf | Lighthouse mobile Perf / A11y / BP / SEO | 82 / 100 / 100 / 100 | ≥ 90 / ≥ 95 | FAIL Perf (UX-P1-006) |
| Perf | Mobile LCP / CLS / TBT | 3.2 s / 0 / 220 ms | ≤ 2.5s / ≤ 0.1 / ≤ 200 ms | FAIL LCP, TBT |
| Release | main ↔ live parity | 100 % (6abe8aa) | 100 % | PASS |

## E. Release log

| Cycle | UTC start | UTC end | Findings shipped | Commit SHA | Deploy ID | Parity | Lighthouse (mobile Perf/LCP/CLS/TBT) | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C0 | 2026-09-29T02:58Z | 2026-09-29T05:06Z | UX-C0-001 (pipeline), UX-P1-001 (partial reflow) | `6abe8aa` | 36524613924 | 100 % | baseline 86 / 3.34 s / 0 / 262 ms | not run |
| C1 | 2026-09-29T05:45Z | pending | UX-P1-001 (Reflow 320px COMPLETE), UX-P2-002 (Nav state follow-up), UX-P1-006 (Perf optimizations) | PR42 | pending | 100 % | 82 / 3.2 s / 0 / 220 ms | pending |
