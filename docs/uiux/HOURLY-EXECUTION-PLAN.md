> Continuation override (2026-09-29): prior credential-blocked precondition below is historical, not current. Existing gh CLI has workflow scope; safe draft PR39 exists on uiux/c1-gated-remediation. Legacy workflow240428014 is disabled; never re-enable it. Use ship.yml. Full functional suite and strict mobile Lighthouse are blocking, not smoke-only. Latest local source608dca0 builds, focused tests3pass/1fail (desktop manual-scroll hash after Back). Resolve that and obtain independent review, green PR full gates + Firebase preview smoke before any merge. Cycle0 parity and branch-preview rollback drill still pending. Daemon remains parent-managed; do not infer publish readiness from auth alone. See ledger A for exact evidence.

# UI/UX Swarm — hands-off hourly execution plan

Repo: `/home/ubuntu/github_repos/forgotten-mistory` · Production: https://forgotten-mistory.web.app/ · Ledger: `docs/uiux/UIUX-LEDGER.md`
Spec: `docs/uiux/SWARM-PROMPT.md` (§11 cycle, §9 thresholds, §10 prohibitions). No secrets in this file; never echo tokens.

## Preconditions (blocking; check first every cycle)
1. **Cycle 0 must be merged before any UI fix ships.** Branch `uiux/c0-ci-ship-pipeline` (4 commits, patches in `docs/uiux/patches/`) could NOT be pushed: the stored GitHub credential lacks the `workflows` scope (push rejected 2026-09-29). Until a credential with `workflows` scope is configured (or the repo owner applies the patches with `git am docs/uiux/patches/*.patch` and opens the PR), record `UX-C0-001` as BLOCKED and do not push to `main` (old merge-all `Deploy` workflow would deploy unverified). Do not retry the same credential.
2. Once pushed: `gh pr create --base main --head uiux/c0-ci-ship-pipeline`, wait for `ship` gates + preview green, `gh pr merge --squash --delete-branch`, watch the `ship` run on main to completion, verify parity (recipe A), run the no-op rollback dry-run (trivial docs commit + `git revert` on a `uiux/c0-rollback-dryrun` branch PR, log run ids in ledger E), then mark Cycle 0 complete.

## Cycle recipe (T+00–60, UTC)
- **T+00–05 SYNC**: `git checkout main && git pull --rebase && npm ci`; `curl -sI https://forgotten-mistory.web.app/ | head -1`; recipe A parity; read ledger B/C/E.
- **T+05–15 DISCOVER** (production, evidence dir `docs/uiux/evidence/<YYYYMMDDTHHMMZ>/`): `node scripts/uiux/scout_production.mjs`, `node scripts/uiux/persona_journeys.mjs`, `node scripts/uiux/axe_production.mjs` (check each script header for `--out`/label flags before use); Lighthouse ×3 mobile + ×3 desktop, medians only.
- **T+15–18 TRIAGE**: merge/dedupe into ledger C, RICE, pick ship set (1–4 file-disjoint findings). Current ordered backlog: UX-P1-001 (320px reflow: `components/sections/Listen/Listen.module.css` `.engage`/`.channel`, `components/sections/Skills/Skills.module.css` `.tableWrap` → `overflow-x:auto`, `max-width:100%`, `flex-wrap:wrap`, `overflow-wrap:anywhere`), UX-P1-006, UX-P2-002 (nav `aria-current`, `components/site/Navigation.tsx`), UX-P2-003, UX-P2-005 (31 pre-existing red specs), UX-P3-004.
- **T+18–35 FIX**: branch `uiux/c<n>-<findingId>`; Test Author writes failing test first (e.g. `tests/a11y/reflow-320.spec.ts`: viewport 320×800, `document.documentElement.scrollWidth <= clientWidth`), prove it fails against current `out/` (`npm run build:static`; `python3 -m http.server 5599 --directory out --bind 127.0.0.1`); Fixer applies the minimal change; rebuild; local gates: `npx tsc --noEmit`, `npm run lint`, `node scripts/validate/overhaul_static_audit.mjs`, `node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5599 npx playwright test --grep "@smoke|A11Y-"`.
- **T+35–42 REVIEW**: independent reviewer subagent (not the fixer) against §8/§2.3; verdict JSON saved in evidence as `<findingId>__all__review__pre__<stamp>.json`. Reject → one more FIX pass, then carry over.
- **T+42–50 SHIP**: PR → `ship` gates + preview channel smoke green → squash merge → `ship` on main deploys → parity step green.
- **T+50–57 VERIFY**: independent Production QA runs recipes A–H below plus J1–J8; pass → `VERIFIED-CLOSED` with post evidence; regression → the pipeline auto-reverts; file P0.
- **T+57–60 REPORT**: ledger A–F, release log row, `git commit -m "docs(uiux): cycle <n> …"`.

## Independent production verification recipes (for verify_fixes)
A. **Parity** — `curl -s https://forgotten-mistory.web.app/ | grep -o 'name="build-commit" content="[0-9a-f]*"'` must equal `git rev-parse origin/main` prefix. (Baseline 2026-09-29: meta ABSENT on live HTML → UNVERIFIED; expected after Cycle 0.)
B. **CV** — `GET /docs/Vik_Resume_Final.pdf` → 200, `content-type: application/pdf`, body > 10 kB, starts `%PDF-`, MD5 `16b856c0f3f4ec0d801fdde6d084452c` (must match Skills-section link target).
C. **Chat** — `POST /api/chat` JSON `{"messages":[{"role":"user","content":"What does Vik do?"}]}` → 200, JSON with non-empty `text`.
D. **TTS** — `POST /api/tts` → 200 `audio/mpeg` (a 502 must surface as a visible non-dead control; see UX-P2-003).
E. **Reflow** — at 320×800, 360×800, 390×844: `scrollWidth === clientWidth` on `/` (baseline FAIL at 320: 344 px; UX-P1-001).
F. **A11y** — axe on `/` at 390 and 1440: 0 serious/critical; exactly one `h1`; exactly one italic element (§2.3 invariant).
G. **Perf** — Lighthouse mobile medians ≥ baseline (perf 86, LCP 3.34 s, CLS 0, TBT 262 ms); desktop 100/100/100/100; no regression beyond §9.
H. **Smoke** — `PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test --grep @smoke` green; 0 console errors on `/`.
