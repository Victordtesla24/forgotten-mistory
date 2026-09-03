# Corpus — full repository inventory via the real GitHub API

**Contract:** R-8 (content sourcing), R-108 (canonical dataset layer), R-182 (make the data
current), R-184 (flagship CI truth).
**Owner:** `Victordtesla24` ("Vikram.", account created 2023-10-14T07:21:02Z, `public_repos` = 38).
**Retrieved:** 2026-09-03T19:54Z — 2026-09-03T20:05Z, via the authenticated `gh` CLI 2.93.0
against `https://api.github.com`.
**Machine-readable twin:** [`corpus-repositories.json`](./corpus-repositories.json) — every field
there carries its own `_provenance` block naming the exact endpoint and retrieval time.

> **Zero-fabrication statement.** Every number and date below was returned by a live API call
> listed in [Reproduction](#reproduction-r-182). Nothing is estimated. Where the API publishes
> nothing, the row reads **not observable** and names the command that proved it.

---

## 1. Totals

| Measure | Value |
|---|---|
| Repositories owned (public + private) | **41** |
| Public | 38 |
| Private (metadata only — content **not for publication**) | 3 (`cursor-tutor`, `general-work`, `hostinger-vps-backup`) |
| Forks | 1 (`adblocker`) |
| Archived | 0 |
| With at least one registered GitHub Actions workflow | 26 |

`/user` reports `public_repos: 38`; this inventory lists 41 because
`/user/repos?affiliation=owner` also returns the three private repositories.

---

## 2. Every repository

Language column shows the top three of the byte-level breakdown from
`/repos/{owner}/{repo}/languages`. "Workflows" is the count of workflows registered with the
Actions API — **not** a claim that any of them has ever run.

| Repository | Visibility | Primary | Language breakdown (top 3, by bytes) | Branch | Created | Last push | ★ | Size (KB) | Licence | Workflows |
|---|---|---|---|---|---|---|---|---|---|---|
| `3-tier-multi-agent-architecture` | public | Python | Python 94.78%, Shell 4.53%, Makefile 0.54% | main | 2026-03-01 | 2026-03-09 | 1 | 1343 | MIT | 2 |
| `abentertainment` | public | HTML | HTML 89.11%, TypeScript 9.66%, JavaScript 0.86% | main | 2026-03-13 | 2026-08-06 | 1 | 111068 | — | 2 |
| `adblocker` | public/fork | — | TypeScript 82.66%, Jupyter Notebook 14.49%, JavaScript 2.6% | master | 2024-11-07 | 2024-11-06 | 0 | 102885 | MPL-2.0 | none |
| `Advanced-Prompt-Creator` | public | TypeScript | TypeScript 95.36%, Python 2.51%, CSS 2.01% | main | 2025-10-23 | 2025-11-25 | 0 | 156 | — | none |
| `aether-job-career-agent` | public | Python | Python 63.29%, TypeScript 30.52%, HTML 3.0% | main | 2026-07-01 | 2026-09-02 | 1 | 157527 | MIT | 3 |
| `agsva-security-clearance-webapp` | public | HTML | HTML 62.4%, JavaScript 30.95%, Shell 6.65% | main | 2026-03-12 | 2026-06-11 | 0 | 627 | MIT | 4 |
| `AI-Gmail-Mailbox-Manager` | public | TypeScript | TypeScript 94.14%, HTML 2.32%, JavaScript 2.1% | main | 2025-08-02 | 2025-08-02 | 1 | 314 | — | none |
| `Birth-Time-Rectifier` | public | Python | Python 89.55%, HTML 4.02%, C 3.42% | main | 2025-02-10 | 2026-06-18 | 1 | 582485 | MIT | 7 |
| `btr-demo` | public | Python | Python 33.3%, TypeScript 31.82%, HTML 16.68% | main | 2025-11-16 | 2025-12-02 | 1 | 9776 | LGPL-2.1 | 8 |
| `chris-cole-website` | public | TypeScript | TypeScript 32.85%, Python 32.8%, HTML 16.43% | main | 2025-11-13 | 2025-12-02 | 1 | 9509 | LGPL-2.1 | 8 |
| `claude-designs` | public | — | — | main | 2026-05-07 | 2026-05-07 | 0 | 0 | — | none |
| `Codex` | public | HTML | HTML 64.84%, Python 26.48%, Shell 6.66% | main | 2026-02-12 | 2026-02-13 | 1 | 612 | Apache-2.0 | none |
| `containerised-birth-time-rectifier` | public | Python | Python 97.32%, Cython 0.68%, C 0.62% | main | 2025-03-03 | 2026-03-30 | 1 | 548858 | GPL-3.0 | 5 |
| `cursor-tutor` | private | Python | Python 90.62%, Cython 5.2%, C 2.69% | main | 2024-11-11 | 2024-11-12 | 0 | 139601 | — | none |
| `cursor-uninstaller` | public | Shell | Shell 100.0% | main | 2025-05-06 | 2025-06-21 | 0 | 1003 | — | none |
| `cursor-vscode-anti-fake-coding-system` | public | Shell | Shell 98.23%, JavaScript 1.77% | main | 2025-06-12 | 2025-06-17 | 0 | 273 | — | none |
| `EFDDH-Jira-Analytics-Dashboard` | public | Python | Python 93.01%, C++ 4.54%, Cython 1.67% | main | 2024-12-03 | 2024-12-04 | 1 | 265697 | — | none |
| `EFDDH-Jira-Dashboard` | public | Python | Python 79.74%, PowerShell 9.39%, Shell 5.47% | main | 2024-11-18 | 2024-11-21 | 0 | 76992 | — | none |
| `Error-Management-System` | public | Python | Python 86.01%, TypeScript 13.01%, Shell 0.86% | main | 2024-12-12 | 2025-04-29 | 1 | 5644 | — | 1 |
| `forgotten-mistory` | public | TypeScript | TypeScript 56.23%, JavaScript 23.07%, CSS 9.4% | main | 2025-11-25 | 2026-09-03 | 1 | 291111 | MIT | 3 |
| `frontend` | public | JavaScript | JavaScript 99.25%, Shell 0.53%, CSS 0.22% | main | 2025-05-05 | 2025-06-03 | 0 | 772 | — | 1 |
| `general-work` | private | Python | Python 50.32%, HTML 47.48%, Shell 2.2% | main | 2026-04-26 | 2026-05-04 | 0 | 162 | GPL-3.0 | 1 |
| `global-ticketing-initiative` | public | TypeScript | TypeScript 98.32%, CSS 1.05%, Shell 0.32% | main | 2026-08-23 | 2026-08-25 | 0 | 1501 | MIT | 1 |
| `hostinger-vps-backup` | private | Python | Python 41.78%, TypeScript 24.05%, HTML 15.71% | main | 2026-05-08 | 2026-09-03 | 0 | 176697 | — | 1 |
| `Image-Enhancer` | public | Python | Python 92.96%, Shell 7.03%, Procfile 0.01% | main | 2024-12-05 | 2026-04-26 | 1 | 3379 | — | 1 |
| `indian-event-manager` | public | TypeScript | TypeScript 38.05%, HTML 32.38%, JavaScript 16.47% | main | 2025-01-22 | 2025-04-21 | 0 | 8668 | — | 4 |
| `jarvis` | public | HTML | HTML 32.61%, Swift 26.77%, Go 17.08% | main | 2026-04-09 | 2026-06-04 | 0 | 47255 | MIT | 1 |
| `jyotish-shastra` | public | JavaScript | JavaScript 94.81%, CSS 1.81%, Shell 1.54% | main | 2025-06-24 | 2025-11-10 | 1 | 77318 | MIT | 2 |
| `openclaw-agents-ecosystem` | public | Shell | Shell 100.0% | main | 2026-02-17 | 2026-02-17 | 0 | 56 | MIT | none |
| `project_management_dashboard` | public | Python | Python 96.72%, Shell 1.41%, HTML 1.01% | main | 2024-12-29 | 2025-03-22 | 1 | 10659 | — | 2 |
| `prompt-reconstruct` | public | Shell | Shell 100.0% | main | 2026-05-20 | 2026-05-20 | 0 | 4 | MIT | none |
| `prompt-reconstruction-engine` | public | HTML | HTML 60.12%, JavaScript 39.88% | main | 2026-06-16 | 2026-06-26 | 0 | 2062 | MIT | 2 |
| `public-key-server` | public | TypeScript | TypeScript 51.32%, Shell 26.37%, HTML 20.11% | main | 2025-04-16 | 2025-05-02 | 0 | 15326 | — | none |
| `ralph-loop-infinite` | public | Shell | Shell 50.8%, Python 45.26%, HTML 3.94% | main | 2026-05-19 | 2026-05-20 | 0 | 656 | MIT | none |
| `relationship-timeline-feature` | public | TypeScript | TypeScript 89.05%, JavaScript 8.92%, CSS 2.03% | main | 2025-04-12 | 2025-04-13 | 1 | 1060 | — | 1 |
| `ride-with-vic-app` | public | JavaScript | JavaScript 95.64%, CSS 1.76%, Shell 1.69% | main | 2025-04-05 | 2025-04-09 | 1 | 10151 | — | 2 |
| `rishi-prajnya` | public | TypeScript | TypeScript 95.64%, CSS 4.17%, JavaScript 0.19% | main | 2025-10-29 | 2025-10-29 | 1 | 354 | — | none |
| `tailor-resume-with-ai` | public | Python | Python 94.77%, HTML 3.03%, CSS 1.95% | main | 2025-01-15 | 2025-04-07 | 1 | 19138 | MIT | 1 |
| `telemetry-server` | public | TypeScript | TypeScript 94.71%, Shell 2.99%, Dockerfile 2.3% | main | 2025-04-16 | 2025-07-22 | 0 | 12380 | — | 1 |
| `tesla-api` | public | JavaScript | JavaScript 67.47%, Shell 31.22%, TypeScript 0.79% | main | 2025-05-05 | 2025-07-22 | 1 | 373 | — | 2 |
| `vik-legal-defence` | public | HTML | HTML 100.0% | main | 2026-03-23 | 2026-06-26 | 0 | 100 | — | 1 |
Descriptions are omitted from this table for width; every repository's `description` field is
carried verbatim in `corpus-repositories.json`.

---

## 3. The seven repositories named on the live site — in depth

### 3.1 Commit history and size

| Repository | Commits on default branch | First commit | Last commit |
|---|---|---|---|
| `aether-job-career-agent` | **1,664** | `5c0d0524` 2026-07-01T13:36:07Z — *Initial commit* | `bb5f5f01` 2026-09-02T20:59:41Z — *ci: add workflow_dispatch trigger (on-demand CI proof runs)* |
| `abentertainment` | **243** | `2b939fd8` 2026-03-28T03:15:29Z — *feat: complete AB Entertainment platform — eventsunleashed.com visual clone* | `8cd06902` 2026-08-06T06:57:40Z — *build(export): regenerate static export with title-fit fix* |
| `forgotten-mistory` | **238** | `d41ac9d6` 2025-11-25T02:06:14Z — *Initial commit* | `d1fce27f` 2026-09-03T17:53:38Z — *chore(ledger): refresh the corrections log and note that it trails by one* |
| `public-key-server` | **16** | `cfcf3b57` 2025-04-16T14:54:22Z — *first commit* | `c2cab77b` 2025-05-02T00:23:12Z — *Update index.ts* |
| `containerised-birth-time-rectifier` | **43** | `644b95ab` 2025-03-03T01:32:18Z — *Initial commit* | `deea4229` 2025-04-02T13:41:19Z — *COMMIT BEFORE CURSOR REINSTALL* |
| `relationship-timeline-feature` | **19** | `2e693e83` 2025-04-12T07:03:12Z — *first commit* | `fa2ef17d` 2025-04-13T20:42:04Z — *Update project documentation for production deployment* |
| `EFDDH-Jira-Analytics-Dashboard` | **25** | `a401c888` 2024-11-11T12:09:28Z — *commit* | `79f15a8f` 2024-12-04T02:01:03Z — *Fix: Remove src prefix from all imports for proper package resolution* |

**Counting method (reproducible, not estimated):** `GET /commits?sha=<branch>&per_page=1` returns
one commit per page, so the `Link` header's `rel="last"` page number *is* the commit count.

### 3.2 Test counts determinable from the tree

Counted by filename convention from the repository's own git tree at HEAD, with vendored
directories (`node_modules/`, `.venv/`, `venv/`, `site-packages/`, `vendor/`) excluded. This
counts **test files**, not test cases, except where a CI run publishes an executed count.

| Repository | Python test files | JS/TS `.test`/`.spec` files | Files under a `test(s)/` dir | Executed count |
|---|---|---|---|---|
| `aether-job-career-agent` | **392** (390 in `apps/api/tests`, 2 in `ops/guardian`) | **286** (`apps/web` unit + 26 e2e) | 455 | **5,332 passed / 20 failed / 15 skipped** — read from the three pytest slices of CI run `33682579720` |
| `abentertainment` | 0 | **3** Playwright specs (`e2e/*.spec.ts`) | 0 | not observable — no workflow runs them |
| `forgotten-mistory` | 3 | **25** | 37 | see §3.4 |
| `public-key-server` | 0 | **1** (`src/services/keyService.test.ts`) | 0 | not observable — no workflows exist |
| `containerised-birth-time-rectifier` | **20** | 1 | 82 | not observable — no workflow has ever run on `main` |
| `relationship-timeline-feature` | 0 | **11** | 20 | not observable — no project CI |
| `EFDDH-Jira-Analytics-Dashboard` | **26** (all under `src/tests/`) | 0 | 26 | not observable — no workflows exist |

> **Truncation caveat, recorded rather than papered over.** `EFDDH-Jira-Analytics-Dashboard`'s
> recursive tree comes back with `truncated: true` — 48,515 entries, 44,233 of them a committed
> `.venv/`. Its test files were counted from the un-truncated sub-tree
> `GET /git/trees/main:src?recursive=1` (81 blobs, 74 of them `.py`). `public-key-server`
> (9,465 of 9,481 blobs are a committed `node_modules/`) and
> `containerised-birth-time-rectifier` (7,393 of 10,375 vendored) were not truncated, but their
> vendored trees were excluded before counting.

### 3.3 What each README says it does — and what it says it does not

| Repository | Its own claim | Its own disclaimer |
|---|---|---|
| `aether-job-career-agent` | "Aether discovers jobs, scores fit, tailors résumés and cover letters from your own evidence, and routes every outbound action through your approval — as a subscription web app." (L15) | "**No outcome promises anywhere.** Aether does not predict interviews or offers… a signal with no data reads 'not measured' rather than counting as a zero." (L39). Catalog agents not wired to orchestration carry an explicit "Planned — roadmap" marker (L51). |
| `abentertainment` | A versioned changelog README (v4.2.0, 2026-08-06) documenting the pages, hero, event ordering and asset pipeline. | "All content is sourced from the authentic AB Entertainment brand. There is no placeholder or generated filler text anywhere on the platform." (L798) — though L80 still lists a "Video highlights placeholder component". |
| `forgotten-mistory` | "A portfolio that asks to be checked." Facts live in typed modules and nowhere else; a section renders them and never restates them. (L13–15, L174) | A dedicated **"Known limitations"** section: `/api/tts` returns 502 because `ELEVENLABS_API_KEY` holds a key *ID*, not a key; `DI_D_API_KEY` returns 403; repository metrics are "harvested and dated, not live"; WebGL scenes deliberately do not mount on software renderers. |
| `public-key-server` | "This server has one primary function: serve the PEM-formatted public key at `/.well-known/appspecific/com.tesla.3p.public-key.pem`." (L3–8) | "The server does not log the full key content to prevent accidental leakage." (L123) It claims no capability beyond serving the key. |
| `containerised-birth-time-rectifier` | "A sophisticated application for astrological birth time rectification using AI analysis of life events" — AI Service, API Gateway, frontend. (L5–25) | Heads its component list "**Current Implementation Status** — three main components **in active development**" (L11–13). It claims development status, not completion. |
| `relationship-timeline-feature` | "Create, organize, and share relationship timelines with events, media attachments… Next.js 14, Tailwind, **LocalStorage (no database required)**, TypeScript." (L5–25) | "No Login Required" and "**Private**: Your data never leaves your device" (L16, L31) — i.e. no server persistence, no accounts, no multi-device sync. |
| `EFDDH-Jira-Analytics-Dashboard` | "A powerful analytics dashboard for visualizing and analyzing JIRA project data, with a focus on sprint metrics, team velocity, and issue tracking." (L3) | **not observable** — grep for `does not / not implemented / limitation / known issue / out of scope` over `README.md` returns zero matches. The README publishes no disclaimer. |

### 3.4 Current GitHub Actions state on `main`

| Repository | Workflow | Latest run on `main` | Conclusion |
|---|---|---|---|
| `aether-job-career-agent` | **CI** (`.github/workflows/ci.yml`) | `33682579720` — 2026-09-02T20:59:50Z, `bb5f5f01` | **failure** |
| | VPS Delivery (`vps-delivery.yml`) | `33682579662` — same push | success |
| | Dependency Graph (dynamic) | `32179298108` — 2026-08-18T19:54:56Z | success |
| `abentertainment` | Deploy to VPS (`deploy-vps.yml`) | `31079105075` — 2026-08-06T06:57:46Z, `8cd06902` | success |
| | opencode (`opencode.yml`) | `27183000822` — 2026-06-09T04:01:35Z | skipped |
| `forgotten-mistory` | **CI & Deploy** (`deploy.yml`) | `33787251221` — 2026-09-03T17:53:42Z, `d1fce27f` | **failure** |
| | **Security** (`security.yml`) | `33787251365` — same push | **failure** |
| | Dependabot Updates (dynamic) | `33784926906` — 2026-09-03T17:30:07Z | success |
| `public-key-server` | — | — | **no workflows registered** (`total_count` 0) |
| `containerised-birth-time-rectifier` | `ci-cd.yml`, `ci.yml`, `deploy.yml`, `vercel-deploy.yml` | **never run on `main`** | all 5 historical runs of each are on `dependabot/*` branches and **all concluded `failure`** (latest 2026-03-30, e.g. run `23747485150`) |
| | Dependabot Updates (dynamic) | `26071661242` — 2026-05-19T02:02:20Z | success |
| `relationship-timeline-feature` | Dependabot Updates (dynamic) — the only workflow; there is no project CI | `33799826738` — 2026-09-03T20:01:30Z | success |
| `EFDDH-Jira-Analytics-Dashboard` | — | — | **no workflows registered** (`total_count` 0), despite the repo carrying `run_tests.sh` and `pytest.ini` |

#### Failing runs, with the job, the step and the log excerpt

**`aether-job-career-agent` — CI run `33682579720`** — full diagnosis in
[`R184-flagship-ci-diagnosis.md`](./R184-flagship-ci-diagnosis.md).

| Job | Conclusion | Failing step | Error excerpt |
|---|---|---|---|
| API — lint, types (job `100422393390`) | failure | step 5 `ruff check app/ tests/` | `Found 10 errors. [*] 5 fixable with the --fix option. ##[error]Process completed with exit code 1.` (step 6 `mypy` was **skipped**, never evaluated) |
| API — full pytest suite, self-hosted (job `100422393204`) | failure | step 3 "Full backend suite against `aether_test_ci`" | `16 failed, 1769 passed, 13 skipped` · `1652 passed, 1 skipped` · `4 failed, 1911 passed, 1 skipped` → `##[error]Process completed with exit code 1` |
| Web — lint, types, unit tests | success | — | — |

**`forgotten-mistory` — CI & Deploy run `33787251221` and Security run `33787251365`**

| Job | Failing step | Error excerpt |
|---|---|---|
| `test` (`100756780979`) | step 10 — `xvfb-run -a … npx playwright test --reporter=json,html,list` | `Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8080/ … at gotoHome (tests/a11y/accessibility.spec.ts:28:14)` — the Playwright harness runs with **no `webServer`**, so the a11y specs navigate to a port nothing is serving. |
| `deploy` (`100758135555`) | step 4 — "Deploy to Firebase live channel (main)" | `Error: hosting predeploy error: Command terminated with non-zero exit code 127` and `[iam] error while checking permissions … HTTP Error: 403, Caller does not have required permission to use project forgotten-mistory … Grant the caller the roles/serviceusage.serviceUsageConsumer role`. `The process '/usr/local/bin/npx' failed with exit code 1`. |
| `npm audit (high/critical)` (`100754898596`) | step 5 — "Audit (gating — fails on high/critical)" | `brace-expansion <=1.1.17 \|\| 2.0.0-2.1.3` **high** (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895); `browserslist <=4.28.6` **high** (GHSA-c83g-rgw3-j3cx, GHSA-73wf-gq98-2v4g); `glob 10.2.0-10.4.5` **high** (GHSA-5j98-mcp5-4vw2, transitively via `@next/eslint-plugin-next` → `eslint-config-next`); `fflate` moderate. `##[error]Process completed with exit code 1.` **CodeQL analyze in the same workflow passed.** |

Jobs `lint`, `lighthouse`, `secrets-check`, `axe`, `quality` and `build` all passed in that same
`forgotten-mistory` run; `test-gpu`, `visual-diff`, `preview` and `verify` were skipped.

---

## 4. Not observable

Recorded here rather than filled in with a guess. Each row names the command whose output proved
the absence.

| Field | Why it is not observable | Proved by |
|---|---|---|
| `abentertainment` executed test count | No workflow runs its 3 Playwright specs | `gh api /repos/Victordtesla24/abentertainment/actions/workflows` → only `deploy-vps.yml`, `opencode.yml` |
| `EFDDH-Jira-Analytics-Dashboard` executed test count and CI state | Repository has zero registered workflows | `…/actions/workflows` → `total_count: 0` |
| `EFDDH-Jira-Analytics-Dashboard` full file tree | GitHub returned `truncated: true` (48,515 entries) | `gh api '/repos/…/git/trees/79f15a8f?recursive=1'` → `.truncated == true` |
| `EFDDH-Jira-Analytics-Dashboard` README "does not" statement | The README publishes no limitation section | `grep -inE "does not\|not implemented\|limitation\|known issue\|out of scope" README.md` → 0 matches |
| `public-key-server` CI state | Zero registered workflows | `…/actions/workflows` → `total_count: 0` |
| `containerised-birth-time-rectifier` CI state **on main** | Four of five workflows have never executed on `main` | `…/actions/workflows/147304042/runs?branch=main&per_page=1` → `workflow_runs: []`; the same workflow's 5 runs on any branch are all `dependabot/*` and all `failure` |
| `relationship-timeline-feature` project CI | Only the dynamic Dependabot workflow is registered | `…/actions/workflows` → `total_count: 1`, path `dynamic/dependabot/dependabot-updates` |
| Contents of the 3 private repositories | Metadata recorded; content is not for publication per the brief | `visibility` field from `/user/repos` |

---

## Reproduction (R-182)

The dataset must be rebuilt at each deploy. Every value in this document and in
`corpus-repositories.json` comes from one of the calls below; the JSON's
`reproductionCommands` block carries the same list in machine-readable form.

**Prerequisite:** `gh` authenticated as `Victordtesla24` (scopes `repo`, `workflow`, `read:org`,
`gist`). Read the credential *variable name* from `~/.claude/.env.production` at run time — never
print, copy or commit the value.

```bash
OWNER=Victordtesla24

# R1  identity
gh api /user

# R2  every owned repository, public and private
gh api --paginate "/user/repos?per_page=100&affiliation=owner&sort=full_name" | jq -s add

# R3  language byte breakdown              R4  registered workflows
gh api "/repos/$OWNER/$REPO/languages"
gh api "/repos/$OWNER/$REPO/actions/workflows"

# R5  commit count — the Link header's rel="last" page number IS the count
gh api -i "/repos/$OWNER/$REPO/commits?sha=$BRANCH&per_page=1" | grep -i '^link:'

# R6  last commit (page=1) and first commit (page=$LAST)
gh api "/repos/$OWNER/$REPO/commits?sha=$BRANCH&per_page=1&page=1"
gh api "/repos/$OWNER/$REPO/commits?sha=$BRANCH&per_page=1&page=$LAST"

# R7  file tree for test-file counting — ALWAYS check .truncated
gh api "/repos/$OWNER/$REPO/git/trees/$HEAD_SHA?recursive=1"
# R7b fallback when truncated
gh api "/repos/$OWNER/$REPO/git/trees/main:src?recursive=1"

# R8  the README in its own words
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/readme"

# R9  latest run of each workflow on main
gh api "/repos/$OWNER/$REPO/actions/workflows/$WORKFLOW_ID/runs?branch=main&per_page=1"

# R10 jobs and per-step conclusions        R11 raw log of a failing job
gh api "/repos/$OWNER/$REPO/actions/runs/$RUN_ID/jobs?per_page=100"
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/actions/jobs/$JOB_ID/logs"

# R12 R-184 — the whole CI history on main, to establish when it was last green
gh api --paginate "/repos/$OWNER/aether-job-career-agent/actions/workflows/311628383/runs?branch=main&per_page=100" \
  --jq '.workflow_runs[]|[.created_at,.id,.conclusion,.head_sha[0:8],.display_title]|@tsv' | sort
```
