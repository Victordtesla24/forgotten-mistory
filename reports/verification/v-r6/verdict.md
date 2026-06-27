# V-R6: CI-CD Pipeline Verification — VERDICT: FAIL

**Date:** 2026-06-28  
**Reviewer:** reviewer profile  
**Task ID:** t_6aa1fc94

---

## PASS Criteria Assessment

| Criterion | Status | Evidence |
|-----------|--------|----------|
| CI workflow file exists in `.github/workflows/` | PASS | `deploy.yml` (335 lines, 10 jobs) |
| Latest CI run passed | **FAIL** | Run #35 (c392031) — `npm ci` failures in all jobs |
| CD pipeline deploys to Firebase Hosting | PASS | `firebase.json` configured, deploy job exists in workflow |
| Production site serves latest build | PASS | `forgotten-mistory.web.app` returns HTTP 200 with full content |
| Pipeline is robust (not skeleton/template) | PASS | 7+ stages with quality, lint, test, lighthouse, axe, build, preview, deploy, verify |

**Overall: FAIL — 1 of 5 criteria not met**

---

## Root Cause

```
npm ci failed: package.json and package-lock.json are out of sync
```

The committed `package-lock.json` references newer versions of transitive dependencies
than `package.json` specifies:

| Package | Lockfile has | package.json expects |
|---------|-------------|---------------------|
| glob | 13.0.6 | 10.3.10 |
| minimatch | 10.2.5 | 9.0.9 |
| path-scurry | 2.0.2 | 1.11.1 |
| lru-cache | 11.5.1 | 10.4.3 |
| brace-expansion | 5.0.6 | 2.1.1 |

Plus 14+ missing transitive dependencies (`@isaacs/cliui`, `foreground-child`,
`jackspeak`, `signal-exit`, `string-width@5.x`, `strip-ansi@7.x`, `wrap-ansi@8.x`, etc.)

This causes `npm ci` (used in the CI pipeline) to fail immediately on every job
(quality, lint, test, lighthouse, axe). Build/deploy/verify jobs are skipped because
their dependencies fail.

**Both latest main-branch runs (#35 and #34) failed with identical errors.**

---

## Affected Runs

- Run #35 (c392031): "cleanup(R8): remove dead code..." — FAILED, all gates
- Run #34 (9e90197): "merge: reconcile origin/main..." — FAILED, all gates

---

## Fix Required

Run `npm install` locally to regenerate `package-lock.json`, then `git add package-lock.json`, `git commit`, and `git push`. The CI pipeline design is sound — only the data (lockfile) is stale.

---

## Pipeline Health (when working)

The pipeline itself is robust:
- **7 quality gates:** lint (tsc fast-fail), quality (tsc strict + static audit + CI robustness check + contract tests), test (Playwright + Xvfb), lighthouse (performance budgets), axe (accessibility + SEO)
- **Optional GPU test:** Self-hosted GPU runner support via `E2E_RUNNER_LABELS` repo variable
- **PR preview channels:** Deploys to Firebase preview channels for PRs
- **Live deploy:** Automated deploy to Firebase on push to main (gated on [quality, lint, lighthouse, axe, build])
- **Post-deploy verify:** Polls production URL for HTTP 200 after deploy
- **Concurrency control:** PR runs cancel-in-progress; main runs never cancel

---

## Production Site Status

`https://forgotten-mistory.web.app` serves HTTP 200 with full content (from a prior successful deploy). The site includes all sections (hero, about, experience, skills, architecture, work, mindset, synthesis, dossier, contact) with working telemetry, WebGL canvases, JSON-LD, and service worker.
