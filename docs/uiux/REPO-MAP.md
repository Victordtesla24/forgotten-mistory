# REPO-MAP — forgotten-mistory (Repo Cartographer, run 20260929T0258Z)

Everything below was read from the checkout at `main` = `a6f2ad8c10f30113d3a6ef4ca0211807d309279f` on 2026-09-29. Where a claim was not verified by a command, it says so.

## Stack

| Layer | What | Where |
| --- | --- | --- |
| Framework | Next.js 15.5.25 (App Router), React 19.2.8, TypeScript 5.3.3, Tailwind 4.1.13 + CSS Modules | `app/`, `components/`, `next.config.js`, `tsconfig.json` |
| 3D / motion | three 0.165, @react-three/fiber 9.7, framer-motion 11.18 (WebGL scenes only mount with a GPU; not under reduced motion; not in headless SwiftShader — confirmed `canvases: 0` on production in every scout viewport) | `components/gl/`, `components/MotionProvider.tsx` |
| Design tokens | single source `design-tokens.json`; CSS custom properties in `app/globals.css` | `design-tokens.json`, `app/globals.css` |
| Sections (single-page scroll) | `#hero`, `#about`, `#experience`, `#skills`, `#vitrine`, `#listen` | `components/sections/{Hero,About,Experience,Skills,Vitrine,Listen}/` |
| Site chrome | Navigation (overlay `#site-nav-overlay`, `.menu-toggle`, `.nav-link`, NAV_LINKS at `components/site/Navigation.tsx:15–28`), Footer (legal line: Privacy Policy · Terms · Contact support), MiniVicBot (launcher `button.minivic-launcher`, dock `.minivic-dock`) | `components/site/Navigation.tsx`, `components/site/Footer.tsx`, `components/MiniVicBot.tsx` |
| Build stamp | `<meta name="build-commit">` in `app/layout.tsx:145` from `app/data/generated/build-stamp.ts`, written by `scripts/build/build_stamp.mjs` (sha is `null` when tracked files other than `app/data/generated/` and `reports/` differ from HEAD — so a dirty local tree ships no stamp; a clean CI checkout always does) | `scripts/build/build_stamp.mjs` |
| CV | `public/docs/Vik_Resume_Final.pdf` (157 615 B, MD5 `16b856c0f3f4ec0d801fdde6d084452c`); fingerprint rendered in Skills (`components/sections/Skills/Skills.tsx:216–217`), not in the Footer | `scripts/build/cv_fingerprint.mjs` |
| API | `/api/chat` → Cloud Function `minivicChat`, `/api/tts` → `elevenLabsTts` (Firebase Hosting rewrites, region us-central1) | `firebase.json`, `functions/index.js` (codebase `tts`, Node 20) |
| Static export | `FIREBASE_STATIC_EXPORT=1 next build` → `out/` (index, privacy, terms, 404, `_next/static`, `docs/`, `assets/`, `sw.js`); `/performance-benchmark` route exists in `app/` but is NOT in `out/` (pruned) | `scripts/build/prune_static_export.mjs` |
| Hosting | Firebase Hosting, project `forgotten-mistory`, production `https://forgotten-mistory.web.app`; `firebase.json` hosting `public: out`, `predeploy: npm run build:static`, CSP + HSTS + `X-Frame-Options: DENY` headers, `cleanUrls: true`. `firebase.static.json` is a hosting-only variant WITHOUT the `/api/*` rewrites — never use it for live. | `firebase.json`, `firebase.static.json` |

## Scripts (package.json)

| Script | Command (abridged) | Used by |
| --- | --- | --- |
| `lint` | `next lint` | gates |
| `build:static` | rm `.next out` → build_stamp → cv_fingerprint → greeting_envelope → minivic_origin → `next build` (static) → prune_static_export → built_output_secret_scan | gates, nightly |
| `test` | `playwright test` (config: `playwright.config.ts`, `PLAYWRIGHT_BASE_URL` default `http://localhost:8080`, chromium only, retries 2 / workers 1 in CI, timeout 180 s in CI, reporters list/html/json) | gates (`--grep "@smoke|A11Y-"`), nightly (full) |
| `deploy` | `node scripts/deploy.mjs` (local, needs a Firebase credential this VM does not have) | — |
| node contract tests | `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs` (the last one needs `npm ci --prefix functions`) | gates |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` (writes untracked `reports/static-audit.json`) | gates |

No `wait-on` dependency exists — readiness is polled with `curl`. `js-yaml` is available transitively (via eslint) and is what `tests/ci_pipeline.test.mjs` uses.

## Tests

* 53 Playwright spec files under `tests/{e2e,a11y,monochrome,overhaul,perf,content,...}`; 499 tests in the full local run (`docs/uiux/evidence/20260929T0258Z/e2e__local__full__pre__*.log`).
* `tests/a11y/accessibility.spec.ts` — axe-core WCAG 2.0/2.1 A+AA (A11Y-01…13); used as the axe gate.
* `@smoke` set (added in Cycle 0): TC-HERO-01/05/06, TC-NAV-04, TC-LISTEN-04, TC-SKILL-08, TC-BOT-02/04, TC-SMOKE-CV-01 (`tests/e2e/smoke-cv.spec.ts`).
* `tests/perf/scene-framerate.spec.ts` — GPU-only; nightly `scene-fps-gpu` job (self-hosted runner variable `E2E_RUNNER_LABELS`).
* UI/UX audit scripts (Cycle 0): `scripts/uiux/scout_production.mjs` (7 viewports), `scripts/uiux/persona_journeys.mjs` (J1–J8), `scripts/uiux/axe_production.mjs`. They import `playwright` and must run from inside the repo.

## CI/CD (as found, before Cycle 0)

* `.github/workflows/deploy.yml` ("Deploy"): push to main + `*/10 * * * *` cron; ONE job that merged every remote branch into main with `-X theirs` (branch wins conflicts), `npm ci || npm install` fallback, `FirebaseExtended/action-hosting-deploy@v0` (secret `FIREBASE_SERVICE_ACCOUNT`, projectId `forgotten-mistory`, channel `live`, predeploy rebuild), then read `build-commit` back 12×10 s. Every run since 2026-09-07 failed at `npm ci` (ERESOLVE from Dependabot bumps merged unchecked) → production froze on `3f9865a5` (`last-modified: Mon, 14 Sep 2026 06:14:21 GMT`). Last successful run: 34089202228.
* `.github/workflows/checks.yml` ("Checks"): push `**` + weekly cron; static / e2e / audit / scene-fps-gpu; 0 green runs in the last 60 (44 cancelled, 16 failed) — pre-existing red specs listed in the ledger (UX-P2-005).
* GitHub: repo public, token has admin/push, squash merge allowed, `main` unprotected, no other remote branches, secrets/vars listing 403 (name `FIREBASE_SERVICE_ACCOUNT` confirmed from the workflow; `vars.FIREBASE_PROJECT_ID` unknown → literal project id used).

## CI/CD (Cycle 0 target — see DECISIONS.md)

* `.github/workflows/deploy.yml` → workflow `ship`: `gates` → `preview` (PR) / `deploy` (main: skip-if-live, deploy gated `out/`, parity, `@smoke` on production, auto-revert) / `functions` (path-filtered).
* `.github/workflows/nightly.yml`: full Playwright suite, npm audit, `scene-fps-gpu` — non-blocking.
* `checks.yml` deleted (its jobs live on in `gates` and `nightly`).

## Directories to keep out of packaging / evidence

`node_modules/`, `out/`, `.next/`, `.git/`, `artifacts/`, `.audit-v7/`, `playwright-report/`, `test-results/`, `.lighthouseci/`, `functions/node_modules/`.
