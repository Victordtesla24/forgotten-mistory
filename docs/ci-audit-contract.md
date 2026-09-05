# CI Static Audit Contract

**Script:** `scripts/validate/overhaul_static_audit.mjs`
**Trigger:** Runs in the `static` job of `.github/workflows/checks.yml` on every push to every branch.
**Gate:** None. Checks report; nothing in `deploy.yml` waits on them (`tests/ci_pipeline.test.mjs`). A red audit is a defect to fix in the next ten-minute cycle.
**Report artifact:** `reports/static-audit.json` — written locally by every audit run (the script creates `reports/` first) and **not tracked by git**: it changes on every run, so committing it made every consolidation a forced merge. CI uploads no copy of it; read it where the audit ran.

---

## Audit Axes

### 1. TC-NFR-TONE — Tone / Copy
- **Checks:** No boastful, superlative, sci-fi, or military-persona language in user-facing copy.
- **Scanned files:** `app/data/*.ts/.tsx`, `app/layout.tsx` (string literals), `app/**/*.tsx`, `components/**/*.tsx` (alt/aria/title attributes).
- **Violation:** Any string literal or accessible attribute contains a banned word from the curated list (e.g., "world-class", "ninja", "revolutionary", "commander", "jedi").
- **Assertions:** ≥0 (PASS = zero hits).

### 2. TC-NFR-MONO — Monochrome Color
- **Checks:** No chromatic (saturated hue) color in app or component source. Only near-neutral cool-grey tokens (saturation ≤ 0.28) and pure white/black are allowed.
- **Scanned files:** `app/**/*.{ts,tsx,css}`, `components/**/*.{ts,tsx,css}` (excluding `design-tokens.json`, `components.json`).
- **Detection methods:**
  - Hex colors (`#rrggbb` / `#rgb`) with saturation exceeding threshold.
  - `rgb()`/`rgba()` functions with chromatic channels.
  - `hsl()`/`hsla()` with saturation > 15%.
  - Chromatic Tailwind utility classes (e.g., `text-red-500`, `bg-blue-600`).
  - Runtime GPU RGB-shift elements (`<ChromaticAberration>`).
- **Violation:** Any of the above matches outside of comments.
- **Assertions:** ≥0.

### 3. TC-NFR-PERF — Asset Budget
- **Checks:** All media assets in `public/` are within size budgets.
- **Scanned files:** `public/**/*` (recursive).
- **Budgets:**
  - Images/fonts: ≤ 500 KB (eager, first-view LCP).
  - Video: ≤ 2.5 MB (lazy-loaded below fold).
  - Audio: ≤ 1 MB.
- **Violation:** Any asset exceeds its category budget.
- **Assertions:** ≥0.

### 4. TC-FR-PARITY — Resume Parity
- **Checks:** Key biographical and career facts from the standalone CV are present in site content.
- **Scanned files:** `app/data/siteContent.ts`.
- **Required facts:** Australian Taxation Office, Payday Super, ANZ, National Australia Bank, Microsoft, Telstra, InfoCentric, MYOB, Monash, University of Melbourne, Certified Scrum Master, P95, 200 ms, sarkar.vikram@gmail.com, vicd0ct.
- **Violation:** Any fact not found (case-insensitive substring match) in the content file.
- **Assertions:** 15 required facts.

### 5. TC-NFR-TYPE — Typography
- **Checks:** At most two webfont families (Inter + Space Grotesk) are loaded. Pre-overhaul fonts (Playfair Display, Roboto, Source Sans Pro) and their stale CSS variables are absent.
- **Scanned files:** `app/globals.css`, `app/layout.tsx`, `app/**/*.{css,tsx}`, `components/**/*.{css,tsx}`.
- **Additional check:** Both Inter and Space Grotesk must be wired via `next/font` in `layout.tsx` and referenced in `globals.css`.
- **Violation:** Any banned font-family reference found, or chosen families not properly wired.
- **Assertions:** ≥0.

### 6. TC-NFR-SEC — Secrets
- **Checks:** No hardcoded API keys, tokens, or private keys in client-side source.
- **Scanned files:** `app/**/*.{ts,tsx,js}`, `components/**/*.{ts,tsx,js}`, `lib/**/*.{ts,tsx,js}`.
- **Detection patterns:**
  - OpenAI keys (`sk-...`).
  - AWS access keys (`AKIA...`).
  - GitHub personal access tokens (`ghp_...`).
  - Private key headers (`-----BEGIN ... PRIVATE KEY-----`).
  - XAI keys (`xai-...`).
  - Google AI / Gemini keys (`AIza...`).
- **Violation:** Any pattern match.
- **Assertions:** ≥0.

### 7. TC-ARCH-BENCH — Architecture
- **Checks:** The `/performance-benchmark` route is excluded from the static export (`out/`).
- **Scanned files:** `out/**/*` (only if `out/` exists).
- **Violation:** Any file or directory named `performance-benchmark` in the export.
- **Assertions:** ≥0.

### 8. TC-NFR-COMPLETE — Completeness
- **Checks:** Zero truncation, placeholder, stub, or mock markers in shipped source.
- **Scanned files:** `app/**/*.{ts,tsx,js,jsx,mjs}`, `components/**/*.{ts,tsx,js,jsx,mjs}`, `lib/**/*.{ts,tsx,js,jsx,mjs}`.
- **Detection markers:** TODO, FIXME, XXX, HACK, "not implemented", "unimplemented", "mock"/"mocked"/"mocks", "stub"/"stubbed"/"stubs", agent truncation phrases ("rest of the file", "code omitted"), placeholder implementations.
- **Violation:** Any marker found in source lines.
- **Assertions:** ≥0.

### 9. TC-NFR-TOKEN — Design Token Consistency
- **Checks:** CSS custom properties in the source tree match the canonical `design-tokens.json` color values. Prevents token drift.
- **Scanned files:** `app/globals.css`, `app/**/*.css`, `components/**/*.css` (declarations); `app/**/*.{css,tsx,ts}`, `components/**/*.{css,tsx,ts}`, `app/layout.tsx`, `tailwind.config.js` (references).
- **Checks performed:**
  1. Every `--ink-*`, `--mist-*`, `--accent`, `--steel`, `--white` CSS variable declared with a hex value must match the canonical token value.
  2. Any CSS `var()` reference that looks like a color token but is not in the canonical map and not declared in CSS is flagged as drift.
- **Violation:** Mismatched hex values or undefined color-token references.
- **Assertions:** ≥0.

---

## Exit Contract

- **Exit 0:** ALL checks pass.
- **Exit 1:** ONE OR MORE checks fail.
- All checks run to completion regardless of failures — the full report is always emitted.
- A consolidated JSON report is written to `reports/static-audit.json` with per-category results and a PASS/FAIL verdict.

## Runtime Constraints

- Must complete in under 2 minutes (enforced by quality job `timeout-minutes: 10`, but target is < 2 min for the audit alone).
- Zero npm dependencies (uses only Node.js built-ins: `fs`, `path`).
- Runs on any Node.js ≥ 18 (CI uses Node 20).
