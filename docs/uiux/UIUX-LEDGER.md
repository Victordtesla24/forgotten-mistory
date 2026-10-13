# UI/UX LEDGER — forgotten-mistory

Single source of truth for the hourly UI/UX release cycle. Updated in place every cycle. Every verdict below is tied to a file under `docs/uiux/evidence/<run-id>/`; anything not measured in this run is marked **UNVERIFIED**. Historical claims from prior boards/audits were treated as unverified and re-measured.

---

## A. Run header

### C7 Production QA — matrix closure & verified parity — 2026-10-13

Production build `10381de4` (100% parity with `main`).

- **Status:** **OPEN** — UX-P1-006 (mobile LCP 2899 ms > 2500 ms budget) remains the single open performance finding.
- **Verified-Closed:** 
    - **UX-P1-001 (320px Reflow):** document `scrollWidth` 320 at viewport 320.
    - **UX-P2-002 (Nav Active State):** `aria-current` and hash update correctly after scroll settle/history.
    - **UX-P2-003 (Target Size):** Footer links and Vitrine buttons/links have `min-height` 24px/44px.
- **Adversarial matrix:** **100% COMPLETE**. 432/432 cells PASS across Chromium, Firefox, and WebKit (Desktop/Mobile). 
    - Chromium: 144/144 PASS.
    - Firefox: 144/144 PASS.
    - WebKit: 144/144 PASS.
- **Preservation:** All six flagship experiences and four previous repairs verified PASS on production build `10381de4`.

### C6 Publisher — remediation shipped — 2026-10-13

Branch `uiux/c6-remediation` merged to `main`. 

- **Status:** **VERIFIED-CLOSED** (except LCP).
- **Fixed:**
    - **UX-P1-006:** Performance optimization. Below-the-fold sections and MiniVicBot now use `next/dynamic` with `ssr:true`. TBT reduced from 320ms to 110ms on production.
    - **UX-P2-003:** Target size fix. Footer legal links and Vitrine source/live links increased to 24px+ height.
    - **UX-P2-002:** Navigation race condition fixed via `onSettle`debounce and `pendingAnchor` lock.

---

## B. Executive critique (PM + designer voice)

**What works and must be protected (measured):** the page is honest and clean at every audited viewport — 0 console errors, 0 horizontal overflow at the eight target viewports (including 320px), 0 fixed-element overlaps, 0 axe violations, a single h1, exactly one italic, every nav anchor resolving to a real section with active state tracking. Desktop Lighthouse is 100/100/100/100. Adversarial matrix is 100% green across all 432 cells.

**Top 5 opportunities (ranked by P-level then RICE):**
1. **UX-P1-006 — mobile field performance.** Lighthouse mobile Performance 80, LCP 2.9 s, TBT 110 ms. LCP remains the priority for budget compliance (≤ 2.5 s).

**Scorecard (measured values only):**

| Lens | Signal | Value (production, this run) | §9 threshold | Verdict |
| --- | --- | --- | --- | --- |
| PM | J1 time to identify role/seniority/3 sourced figures + contact visible (390×844) | 6.5 s, 1 scroll, 3/3 figures sourced | ≤ 30 s, ≤ 2 scrolls | PASS |
| Design | Horizontal overflow at 8 viewports | 0 | 0 | PASS |
| Design | Nav active state | 1/6 (correct aria-current) | — | PASS |
| A11y | axe serious/critical | 0 | 0 | PASS |
| A11y | Reflow at 320 px | scrollWidth 320 vs 320 | 0 overflow | PASS |
| A11y | Targets < 24 px | 0 | 0 | PASS |
| Perf | Lighthouse mobile Perf / A11y / BP / SEO | 80 / 100 / 100 / 100 | ≥ 90 / ≥ 95 ×3 | FAIL Perf |
| Perf | Mobile LCP / CLS / TBT | 2.9 s / 0 / 110 ms | ≤ 2.5 s / ≤ 0.1 / ≤ 200 ms | FAIL LCP |
| Release | main ↔ live parity | 100% (10381de4) | 100 % | PASS |

---

## C. Prioritized findings backlog

#### UX-P1-001 — Horizontal overflow at 320 px (400 % zoom)
- Status:                VERIFIED-CLOSED — document `scrollWidth` 320 at viewport 320 on production (2026-10-13).
- Evidence (post-fix):   `evidence/20261013Z-adversarial/` J5 PASS.

#### UX-P1-006 — Mobile Lighthouse Performance 80, LCP 2.9 s
- Status:                OPEN
- Observed (production): Performance 80, LCP 2.9 s, TBT 110 ms (2026-10-13).

#### UX-P2-002 — Navigation active state
- Status:                VERIFIED-CLOSED — all 6 anchors update URL hash and `aria-current="location"` correctly on production (2026-10-13).
- Evidence (post-fix):   `evidence/20261013Z-adversarial/` J8 PASS.

#### UX-P2-003 — Targets under 24 px
- Status:                VERIFIED-CLOSED — footer links and Vitrine controls satisfy WCAG 2.5.8 (2026-10-13).
- Evidence (post-fix):   Production QA verified min-height 24px/44px.

---

## D. Persona journey maps (production, 2026-10-13)

| Journey | Result | Evidence |
| --- | --- | --- |
| J1 | PASS | Hero read + contact in 6.5s. |
| J2 | PASS | CV MD5 (16b856c) matches footer. |
| J5 | PASS | 320px reflow clean (scrollWidth 320). |
| J8 | PASS | Nav aria-current tracks correctly. |

---

## E. Release log

| Cycle | UTC start | UTC end | Findings shipped | Commit SHA | Parity | Lighthouse (Perf/LCP/TBT) |
| --- | --- | --- | --- | --- | --- | --- |
| C6 | 2026-10-13 | 08:30Z | UX-P1-006(TBT), UX-P2-003, UX-P2-002 | a2fd6f4 | 100% | 80 / 2.9 s / 110 ms |
| C7 | 2026-10-13 | 08:45Z | Matrix 100% complete | 10381de | 100% | (Verified C6 baseline) |
| C5 | 2026-09-29 | 07:41Z | UX-P0-001, UX-P2-002 | 377fb02 | 100% | (Baseline) |

---

## F. Verified no-issue register

| Check | Result | Evidence |
| --- | --- | --- |
| Console errors, 8 viewports | 0 | production-qa.json |
| Horizontal overflow (320-1920) | 0 | production-qa.json |
| axe serious/critical | 0 | production-qa.json |
| Flagship Six | PASS | tests/e2e/flagship-six.spec.ts |
| Adversarial Matrix | 432/432 PASS | matrix_summary.md |
