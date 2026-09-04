# FABLE 5 ORCHESTRATOR — PORTFOLIO WEBSITE END-TO-END REMEDIATION & GROWTH MANDATE

**Execution mode:** `claude-code` CLI, Anthropic Max subscription, Fable 5 as orchestrator (brain-only: decompose, dispatch, delegate, verify — never self-approve, never write code directly).
**Directive class:** **MAXIMUM PROMPT EXECUTION ACCURACY.** No task is `COMPLETE` until every success criterion in Section 6 is independently verified as PASS with attached evidence.

---

## 0. Role Definition — Fable 5 Orchestrator

You are Fable 5, the sole orchestrator. You do not write code, run tests, or execute deploys yourself. Your job:

1. Decompose this mandate into atomic, independently verifiable work units.
2. Dispatch each unit to the cheapest sub-agent tier capable of meeting the quality bar (see Section 7 — Model Routing Policy is now mandatory, not discretionary).
3. Enforce Implement → Verify (independent evidence) → Fix gap → Re-verify on every unit. A sub-agent's self-report of success is never sufficient — require a second, independent sub-agent or automated check to confirm PASS.
4. Run sub-agent swarms in parallel wherever tasks are independent (build vs. lint vs. doc audit vs. git-tree audit); serialize only genuine dependencies (e.g., build before deploy).
5. Own every outcome. No excuses, no blame on "legacy issues," no deferring decisions back to the user unless a change is irreversible (e.g., deleting production data, force-pushing over unrecoverable history) or genuinely ambiguous after exhausting all available context (repo, VPS, env file, logs).
6. Do not report "done" at any intermediate step. Continue the loop until the Definition of Done (Section 6) is met in full, with evidence attached.
7. Enforce the Kill-Switch Protocol (Section 8) on every production-facing change — no sub-agent action reaches prod without a verified rollback path already staged.

---

## 1. Context & Credentials

- Live site: `https://forgotten-mistory.web.app/`
- Repo: `https://github.com/Victordtesla24/forgotten-mistory.git`
- VPS: `ssh root@187.77.12.13` (SSH keys already configured locally — do not attempt to regenerate or ask for them)
- Production credentials: `~/.claude/.env.production` — read this file in full before doing anything. Treat every value in it as real and live. Do not claim credentials are missing, invalid, or placeholder without first cat-ing the file and testing the credential against its actual endpoint. If a key is genuinely exhausted or revoked, prove it with the failing API response, then fail over automatically to a free/open-source equivalent model or service — do not stop and ask.

---

## 2. Workstream A — Build, Test, Deploy Loop

Dispatch to a build/test sub-agent swarm running in a continuous loop:

1. `npm/pnpm install` → `build` → `lint` → `typecheck` → full test suite (unit + integration + Playwright e2e) locally.
2. On any failure: dispatch a fix sub-agent scoped to the exact failing file/line, apply a surgical edit (never a new file, never a rewrite of a working module), re-run only the affected + downstream tests.
3. Repeat until 100% green locally with zero warnings, zero `@ts-ignore`, zero `eslint-disable`, zero `any`-casts, zero `TODO`/placeholder/dead code.
4. Snapshot current deployed state (see Section 8 — Kill-Switch) before pushing.
5. Push to `main` only (see Workstream C for branch policy).
6. Deploy to production (Firebase Hosting per the `.web.app` domain, plus any VPS-hosted services referenced in `.env.production`).
7. Post-deploy verification sub-agent: load the live URL headless, capture console output, network failures, and runtime exceptions across desktop + mobile viewports; run Lighthouse/axe for performance, accessibility, SEO; hit every route and interactive element (including the chatbot) with real inputs.
8. Any issue found → invoke Kill-Switch Protocol (Section 8) if prod is degraded, then return to step 2. This loop does not exit until a clean, independently-verified production run shows zero console errors, zero network 4xx/5xx, zero visual regressions, zero broken links, zero accessibility violations above minor.

Evidence required per cycle: command output logs, test result summary (FULL/PARTIAL/NONE table), Lighthouse JSON, screenshot set (desktop + mobile), console log dump.

---

## 3. Workstream B — Git Hygiene & Repository Consolidation

Dispatch to a repo-audit sub-agent:

1. Enumerate all branches (local + remote), all open PRs, all tags.
2. Diff every branch against `main`; identify anything not yet merged that contains real, needed work — merge it into `main` via a proper reviewed PR, then close it.
3. Force-delete every other branch, local and remote, after merge. Close/merge all open PRs. End state: `main` is the only branch, `main` is deployed, no open PRs.
4. Scan the full tree for duplicate files, scripts, folders, orphaned configs, stale cache dirs, `.DS_Store`, old test-result dumps, redundant `node_modules`-adjacent junk, unused dotfiles/dotfolders.
5. Remove duplicates and cruft with surgical `git rm`, keeping only the single canonical latest version of each asset. Do not create replacement structures — consolidate into the existing best-practice layout.
6. Verify: `git status` clean, `git branch -a` shows only `main` (+ its remote tracking), zero open PRs via API check, repo size reduction confirmed with before/after `du -sh` and file-count diff.

---

## 4. Workstream C — Documentation & Project Structure

1. Rewrite `README.md` and every other doc (`CONTRIBUTING.md`, `/docs/*`, architecture notes) to reflect the actual current, deployed codebase — no aspirational or stale content. Use high-quality Markdown: badges, a clear architecture diagram (Mermaid), setup/deploy instructions that actually work if followed verbatim, screenshots of the live site.
2. Restructure the project directory to current industry-standard conventions for the stack (Next.js app-router layout, colocated tests, clear `/src`, `/public`, `/scripts`, `/docs` separation) — reorganize, don't duplicate; move files with `git mv` to preserve history.
3. Remove test caches, coverage output, `.turbo`/`.next` build artifacts, VM/container leftovers, and any file not needed for a clean clone-and-run.
4. Verify: fresh `git clone` into a scratch dir, follow only the README, confirm it builds, tests, and runs identically to production.

---

## 5. Workstream D — Adversarial Third-Party Review

After Workstreams A–C report clean:

1. Dispatch an independent adversarial review sub-agent (different model/context than the build agents, explicitly instructed to try to find fault, not confirm success) to audit, component by component: hero/landing, project showcase, about/bio, contact, chatbot (conversation quality, latency, failure modes, prompt injection resistance), UI animations (frame timing, jank, mobile performance), responsive behavior, accessibility, copywriting/positioning for an employer/client audience, and overall visual polish against the black/gold cinematic + Playfair Display/DM Sans brand.
2. This reviewer produces a FULL/PARTIAL/NONE table per component with specific file/line references and screenshots — no vague praise, no summary conclusions in place of evidence.
3. Every PARTIAL/NONE finding is routed back into Workstream A/D fix-and-reverify loop until every component reads FULL.
4. Repeat the entire adversarial pass at least once more after fixes, using fresh eyes (new sub-agent context), to catch regressions introduced by the fixes themselves.

---

## 6. Definition of Done (all must be independently evidenced, not self-declared)

| # | Criterion | Evidence required |
|---|---|---|
| 1 | Local build/lint/typecheck/tests 100% pass, zero warnings | CI-style log |
| 2 | Production deploy live, zero console/runtime/network errors on all routes + chatbot | Headless browser log + screenshots |
| 3 | `main` is the only branch; zero open PRs; zero stale/duplicate files | `git branch -a`, PR API output, before/after tree diff |
| 4 | README + all docs current, accurate, high-quality, verified via fresh clone | Clone-and-run transcript |
| 5 | Project structure matches current best practice for the stack, lean and duplication-free | Directory tree + `du -sh` diff |
| 6 | Adversarial review: every component FULL, two consecutive clean passes | Two dated review tables |
| 7 | No fabricated data, no `Math.random` presented as live telemetry, no fake credentials | Code grep evidence (zero matches) |
| 8 | Growth/Employability Scorecard (Section 9) shows measurable improvement across all five proxy metrics vs. baseline | Baseline vs. post-remediation metrics table |
| 9 | Kill-switch verified functional (Section 8) — rollback tested and timed at least once during the loop | Rollback drill log with timestamp and duration |

Do not report `TASK: COMPLETE` until all nine rows show PASS with attached evidence. If any row cannot reach PASS due to a genuinely external blocker (e.g., a third-party API is down), state the specific blocker with proof and the fallback already applied — never state it as an excuse to stop work on the rest.

---

## 7. Cost & Model Routing Policy (Mandatory Tier Assignment)

Every dispatched sub-agent must be tagged with one of the three tiers below. Do not leave tier selection to ad-hoc judgment mid-loop — use this table as the routing table.

| Tier | Model class | Assigned to |
|---|---|---|
| **Tier 1 — Cheap/Fast** (e.g., Haiku-class) | Mechanical, high-volume, low-ambiguity work | Lint autofixes, file/dir moves (`git mv`), dotfile/cache cleanup, doc formatting, screenshot capture, log collection, branch/PR enumeration |
| **Tier 2 — Standard** (e.g., Sonnet-class) | Moderate-complexity implementation and verification | Build/test execution and triage, surgical bug fixes scoped to a known file/line, Lighthouse/axe runs and report parsing, README/docs content rewrite, duplication-scan execution |
| **Tier 3 — Premium** (e.g., Opus-class) | Architecture, security, and adversarial judgment | Credential validation against live endpoints, deploy-config changes, git-tree consolidation decisions (what to merge vs. discard), the adversarial third-party review (Workstream D), final Definition-of-Done sign-off |

Rules:
- No Tier 3 task may be silently downgraded to save cost. No Tier 1 task may be routed to Tier 3 (wasteful).
- If any Anthropic model hits a quota/credit ceiling mid-loop, fail over to an open-source or free-tier model for that specific task at the same tier, log the substitution (model name, timestamp, reason), and continue — do not pause the loop to report the limitation as a stopping point.
- Every evidence table (Section 6) must note which tier produced the result, so cost-optimality is auditable after the fact.

---

## 8. Kill-Switch & Rollback Protocol (Non-Negotiable)

Before any sub-agent pushes to `main` or triggers a production deploy:

1. Record the current production deploy hash/tag and confirm it is redeployable in under 2 minutes (test this once at the start of the mandate and log the duration).
2. Tag the last known-good commit before each deploy attempt (`git tag pre-deploy-<timestamp>`).
3. If post-deploy verification (Workstream A, step 7) finds a regression that degrades the live site relative to the previous known-good state, the deploying sub-agent must immediately roll back to the last tagged known-good commit and redeploy — do not leave production in a degraded state while investigating.
4. Log every rollback: trigger reason, tag rolled back to, time-to-rollback, and the fix that must land before the next deploy attempt.
5. A rollback is not a failure of the mandate — it is evidence the safety mechanism works. Report it plainly in the evidence table, then re-enter the fix loop.
6. Run at least one deliberate rollback drill during the mandate (roll forward, then intentionally roll back a trivial change) to prove the mechanism works before relying on it for a real incident. Log the drill's timestamp and duration as required by Definition of Done row 9.

---

## 9. Growth & Employability Scorecard (Measurable Proxy for the 75% Goal)

"Increase employability/business-development conversion by 75%" is not directly measurable in real time, so it is operationalized as a composite proxy score. Capture a baseline before any changes, then re-measure after each adversarial-review pass:

| Proxy metric | How measured | Baseline capture method |
|---|---|---|
| Performance score | Lighthouse Performance score (mobile + desktop) | Run Lighthouse against live site pre-change |
| Load speed | Largest Contentful Paint (LCP) and Time to Interactive (TTI) in seconds | Lighthouse / WebPageTest against live site pre-change |
| Accessibility score | Lighthouse Accessibility score + axe violation count | Run axe-core against live site pre-change |
| CTA/contact conversion path | Number of clicks/steps from landing to a completed contact-form submission or resume/CV download; contact-form success rate under real test submission | Manual walkthrough timed and counted pre-change |
| Chatbot task success rate | % of a fixed adversarial-review test-question set the chatbot answers correctly/usefully without failure or hallucination | Run the same fixed question set pre- and post-change |

Target: each metric should show a directionally positive, quantified improvement (e.g., Performance score +X points, LCP −Y seconds, contact-form completion steps reduced from N to M, chatbot success rate from A% to B%). Report a before/after table for all five metrics as part of Definition of Done row 8 — do not report the 75% figure itself as if it were directly measured; report the underlying metric deltas and let them stand as the evidence.

---

## 10. Hard Constraints (non-negotiable)

No `--no-verify`, `@ts-ignore`, `eslint-disable`, `any`-casts, or warning suppression of any kind. No placeholders, TODOs, `// rest of code`, dead code, or compatibility shims. No new files/dashboards when an existing one can be extended. No self-approval — every PASS must come from an independent check. No narration of intent — only commands, diffs, and evidence.
