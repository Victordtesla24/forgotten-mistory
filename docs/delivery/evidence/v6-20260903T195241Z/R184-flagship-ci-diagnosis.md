# R-184 — `aether-job-career-agent`: the exact truth about public CI on `main`

**Question put:** the flagship's public CI is *claimed* red on `main`. Establish the exact truth.
**Answer:** the claim is **correct**. CI is red on `main`, and has been continuously red since
**2026-08-18T01:36:45Z**. Two independent jobs fail, for two unrelated causes. The failure is
**deterministic, not flaky** — the identical failure set reproduced across two different commits.

**Retrieved:** 2026-09-03T20:00Z via the authenticated `gh` CLI against `api.github.com`.
**Scope note:** this document diagnoses. It changes nothing in `aether-job-career-agent`.

---

## 1. The state, in one table

Repository `Victordtesla24/aether-job-career-agent`, branch `main`, HEAD
`bb5f5f010c202d1b1811ebaba443f30290cb29b2` (2026-09-02T20:59:41Z,
*"ci: add workflow_dispatch trigger (on-demand CI proof runs)"*).

| Workflow | ID | Latest run on `main` | Conclusion |
|---|---|---|---|
| **CI** — `.github/workflows/ci.yml` | `311628383` | **`33682579720`**, 2026-09-02T20:59:50Z | **failure** |
| VPS Delivery — `.github/workflows/vps-delivery.yml` | `336597190` | `33682579662`, same push | success |
| Dependency Graph — `dynamic/dependabot/update-graph` | `305449047` | `32179298108`, 2026-08-18T19:54:56Z | success |

Jobs inside the failing CI run `33682579720`:

| Job | ID | Runner | Conclusion |
|---|---|---|---|
| API — lint, types (+ DB tests when secret set) | `100422393390` | GitHub-hosted `ubuntu-latest` | **failure** |
| API — full pytest suite (self-hosted, isolated schema) | `100422393204` | self-hosted `aether-ci-2` / `hostinger-vps-ci` | **failure** |
| Web — lint, types, unit tests | `100422393625` | GitHub-hosted `ubuntu-latest` | success |

### How long it has been red

`GET /actions/workflows/311628383/runs?branch=main` — 421 runs on `main`: **144 success, 274
failure, 3 cancelled**.

* **Last green CI run on `main`:** `32087090146`, 2026-08-18T01:07:41Z, `c85d03e9`
  (*"fix(ci): guardian escalations must not fail a successful production deploy"*).
* **First red run after it:** `32088841512`, 2026-08-18T01:36:45Z, `4e46d140`
  (*"fix(ops): remediate adversarial review findings"*) — the lint job failed.
* **Every one of the 40 CI runs on `main` since has been red.**

> Note on what "last green" means here. The last green run had only **two** jobs. The self-hosted
> `api-tests` job did not exist yet — it was added the same day at `c3536a98` (2026-08-18T14:29).
> That job's own history: it succeeded exactly **once** (`ea7d0b30`, run `32156067510`,
> 2026-08-18T15:42:23Z), then **every subsequent run from 2026-08-18T16:04 to 2026-08-20T11:52
> was `cancelled`** (26 consecutive cancellations — the self-hosted runner never picked them up),
> and the next two times it actually completed — 2026-09-02T18:41 (`01a7eb91`) and
> 2026-09-02T20:59 (`bb5f5f01`) — it **failed**. **The pytest suite therefore ran and passed in CI
> on exactly one commit in this repository's history, and 46 commits have landed on `main` since
> then without a completed suite.**

---

## 2. Failure A — `ruff check app/ tests/` (deterministic, trivially fixable)

**Job** `100422393390` · **step 5** of 6 · elapsed 11s ·
`##[error]Process completed with exit code 1`. Step 6, `mypy app/ --ignore-missing-imports`, was
**skipped** — so mypy's state on `main` is currently *unknown*, masked by the earlier failure.

Ruff is installed unpinned (`pip install ruff mypy` resolved `ruff-0.16.5`, `mypy-2.3.1`), but the
rules are the repository's own: `apps/api/pyproject.toml` sets `line-length = 100` and
`[tool.ruff.lint] select = ["E", "F", "I"]`, with `per-file-ignores` `"tests/**" = ["E501"]`.

`Found 10 errors. [*] 5 fixable with the --fix option.` — every one verified to still exist in the
file content at `bb5f5f01`:

| # | Rule | Location (relative to `apps/api/`) | Verified at HEAD |
|---|---|---|---|
| 1 | `E501` line too long (125 > 100) | `app/agents/interview_prep_agent.py:662:101` | line length **125** |
| 2 | `E501` (102 > 100) | `app/services/apply_executor.py:502:101` | length **102** |
| 3 | `E501` (101 > 100) | `app/services/apply_executor.py:565:101` | length **101** |
| 4 | `E501` (116 > 100) | `app/services/interview_pack.py:138:101` | length **116** |
| 5 | `I001` unsorted import block *(fixable)* | `app/services/interview_pack.py:425:5` | function-local `from fastapi import HTTPException` before `from app.routers.resumes import _render_resume` |
| 6 | `I001` *(fixable)* | `app/services/interview_pack.py:485:5` | same pattern |
| 7 | `I001` *(fixable)* | `app/services/interview_pack_pdf.py:10:1` | `from pathlib …` / `from typing …` precede `import logging` |
| 8 | `E501` (106 > 100) | `app/services/interview_prep_briefing.py:198:101` | length **106** |
| 9 | `I001` *(fixable)* | `tests/test_apply_receipt_gate.py:2:1` | import block order |
| 10 | `I001` *(fixable)* | `tests/test_apply_receipt_inbox.py:2:1` | `ReceiptMailboxUnavailable` listed after `poll_application_receipt` inside the `from … import (…)` group |

**Root cause:** five commits landed import blocks and long lines that this repo's own ruff config
rejects, and no completed CI gate stopped them — the job has failed on *every* run since
2026-08-18T01:36. There is no version drift to blame: `E501` and `I001` are selected explicitly in
`pyproject.toml`, and `line-length` is the repo's own 100.

**Proposed repair (do not apply from this document):**

```bash
cd apps/api
ruff check --fix app/ tests/     # clears items 5,6,7,9,10 mechanically
# then hand-wrap the five E501 lines to <= 100 columns:
#   app/agents/interview_prep_agent.py:662
#   app/services/apply_executor.py:502, 565
#   app/services/interview_pack.py:138
#   app/services/interview_prep_briefing.py:198
ruff check app/ tests/ && mypy app/ --ignore-missing-imports
```

The `mypy` step must be run locally in the same commit: because ruff fails first, **mypy's true
state on `main` has not been observed since 2026-08-18** and fixing ruff may simply expose a
second red step. Treat that as an open unknown, not as a passing step.

Two hardening notes for whoever fixes this, both visible in the log:

* `pip install ruff mypy` is unpinned — a new ruff minor can add rules and re-break the job on a
  commit that changed nothing. Pin it (`ruff==0.16.5`, `mypy==2.3.1`) or read it from
  `requirements-dev.txt`.
* The run emits `Node.js 20 is deprecated. The following actions target Node.js 20 but are being
  forced to run on Node.js 24: actions/checkout@v4, actions/setup-python@v5`. Not a failure today;
  it will become one.

---

## 3. Failure B — the self-hosted pytest suite (deterministic, 20 tests)

**Job** `100422393204` · step 3 *"Full backend suite against `aether_test_ci`"* · ran 55 minutes ·
`##[error]Process completed with exit code 1`.

The step runs the suite in three alphabetical slices (a memory workaround for the shared VPS host).
Results, read from the log:

| Slice | Result |
|---|---|
| 1 | `16 failed, 1769 passed, 13 skipped, 2395 warnings in 1178.90s` |
| 2 | `1652 passed, 1 skipped, 2467 warnings in 1140.42s` |
| 3 | `4 failed, 1911 passed, 1 skipped, 2033 warnings in 970.54s` |
| **Total** | **5,332 passed · 20 failed · 15 skipped** |

**Determinism established:** the previous completed run — job `100376965591`, run `33668786861`,
2026-09-02T18:41, a *different* commit (`01a7eb91`) — failed with the **byte-identical set of 20
test ids** (`diff` of the two `FAILED` lists is empty). This is a stable failure, not flake and not
a resource-exhaustion artefact.

### 3.1 The 20 failures, grouped

**Group 1 — `tests/test_cli_sub005_fill_commit.py`, 16 failures.** The file holds 50 tests. All 34
unit-level tests pass. Of its 20 end-to-end `test_live_submitter_*` tests, the **4 happy-path ones
pass** (`…submits_a_wellbehaved_form_with_confirmation`,
`…still_submits_a_well_behaved_form_with_the_guard_installed`, `…refills_a_field_wiped_by_a_file_upload`,
`…records_the_honest_synchronous_submission_ceiling_for_attack_a`) and **all 16 that assert the
pre-submit guard must REFUSE fail.** That split is the diagnosis's most important single fact: the
browser works, the fill path works, the *refusal* path does not.

Observed signatures (from the run log):

| Failure shape | Count | Example |
|---|---|---|
| `Failed: DID NOT RAISE ManualStepRequired` | 6 | `…refuses_when_the_guards_own_installation_throws`; `…refuses_when_the_composed_census_itself_throws`; `…refuses_a_closed_shadow_root_with_zero_external_signal`; `…never_submits_over_a_known_field_that_turns_required_live`; `…never_submits_over_an_unanswerable_iframe_required_field`; `…never_submits_over_a_field_revealed_at_mousedown_on_submit` |
| Wrong refusal reason — the run reached submit and then found no confirmation | 6 | `assert 'no_confirmation' == 'form_fill_failed'`; `assert 'no_confirmation' == 'unplanned_required_field'` (×2); `assert 'form_rejected' == 'unplanned_required_field'`; `assert 'submit_click_failed' == 'unplanned_required_field'`; `assert 'verification_code_email' == 'unplanned_required_field'` (that last one is Group 3) |
| Wrong field set filled | 3 | `assert 'explain' in ['name','sponsor','resume']`; `assert 'explain' in ['name','sponsor']`; `assert 'confirm_email' in ['name']` |
| Raised `ManualStepRequired` where the test expected a successful submit | 2 | `…answers_a_post_snapshot_conditional_field_from_the_answer_bank`; `…resolves_and_submits_an_answerable_shadow_dom_required_field` ("The site REJECTED this application form … Missing entry for required field: consent") |

**Group 2 — `tests/test_sub008_answer_bank_seed_classes.py`, 3 failures.** These need no browser and
are the most legible:

```
test_without_the_bank_both_classes_are_honest_manual_steps
  assert 'How did you hear' in 'I certify that the information provided in this application is true and complete.'
test_the_seeded_bank_removes_the_manual_step_entirely
  assert values["question_88001"] == USER_REFERRAL_ANSWER
  - LinkedIn Jobs — that is where I find most of the roles I apply for.
  + Other
test_every_auto_answer_carries_its_audit_row
  assert set(audit) == {"question_88001", "question_88002"}   #  got {'question_88002'}
```

Read plainly: the referral question (`question_88001`) is **no longer the question that surfaces as
`unknown_required_question`**, its banked free-text answer is **being replaced by the literal choice
`"Other"`**, and consequently it **no longer emits an answer-bank audit row**.

**Group 3 — `tests/test_u5d4_verification_code_loop.py`, 1 failure.**
`test_verification_gate_never_bypasses_the_r7_submission_guard` —
`assert 'verification_code_email' == 'unplanned_required_field'`: the R7 submission guard is not
firing ahead of the verification-code path. Same underlying symptom as Group 1.

### 3.2 Root cause, to the precision the evidence supports

**Established beyond doubt.** Group 2 is a behavioural regression introduced by commit
**`d803629e`** — *"fix(apply): map Yes/No Greenhouse comboboxes through choice matching"*
(2026-08-20T11:51:38Z), the newest commit that touches `apps/api/app/services/apply_executor.py`.
That commit inserted, inside `build_form_fill_plan`, a new **mapping check** that runs whenever the
answer bank returns a match for a field of kind `checkbox | radio | select | combobox`:

```python
mapping_options = list(field.get("options") or [])
if not mapping_options and _is_yes_no_phrased(question_text_for_field(field)):
    mapping_options = ["Yes", "No"]
if mapping_options and _match_choice_option(str(match.answer), mapping_options) is None:
    match = None
```

For SUB-008's synthetic referral `select` — which *does* publish options including `"Other"` —
`_match_choice_option()` now returns `"Other"` for the banked essay instead of `None`. The banked
answer is discarded in favour of the matched option, the field stops being an unanswerable required
question, and its audit row disappears. All three Group-2 assertions fall out of exactly that.
Commit `6c4f0ef2` (*"ignore hidden intl-tel-input country options…"*, 2026-08-19) widened the same
matcher one day earlier and is the secondary suspect.

**Strongly evidenced, not yet proven.** For Groups 1 and 3 the evidence establishes *when* they
broke but not the single line that broke them:

* The repository's own evidence directory `docs/delivery/evidence/RUN-20260818T0223Z/` contains
  **local proof that these exact tests passed on 2026-08-18** — `SUB-005/02-pytest-run.log`
  (`22 passed in 19.77s`, including `test_live_submitter_never_submits_a_form_that_wipes_the_fill`)
  and `SUB-005-R3/adversarial/run_new_tests_direct.log`
  (`[PASS] test_live_submitter_converges_and_submits_when_gate_refill_reveal_is_answerable`, etc.).
* There is **no evidence directory for 2026-08-19 or 2026-08-20**. The commits `2ff3b041`,
  `97591d0d`, `180229fe`, `6c4f0ef2`, `dfe1b2a3`, `a6542830` and `d803629e` all landed while the
  `api-tests` job was being cancelled, so nothing — neither CI nor a recorded local run — proved
  the suite after them.
* Across the last-green-suite commit `ea7d0b30` and HEAD, `apps/api/app/services/apply_executor.py`
  changed by **+758 / −70 lines** over 46 commits, plus a new `apply_form_grounding.py` (+270).
  `d803629e` alone also rewrote the live combobox matcher inside `_fill_value` (adding
  `live_option_labels` and a Yes/No single-token path), which *is* on the code path the 16 failing
  end-to-end tests exercise.

**Ruled out, with the check that ruled it out** — so the next agent does not spend time there:

| Hypothesis | Ruled out because |
|---|---|
| Flaky / resource-dependent | Identical 20-test failure set on two runs, two commits, two days apart. |
| Browser version drift | Playwright `1.62.0` in the CI venv pins Chromium revision `1234` (`151.0.7922.34`); `/opt/ms-playwright` holds exactly `chromium-1234`, `chromium_headless_shell-1234`, `ffmpeg-1011`. Pin and install agree. |
| "System Chrome instead of bundled Chromium" (commit `8e9ceb19`) | `playwright_form_submitter` computes `live=apply_url.startswith(("http://","https://"))`; every failing test passes a `data:text/html;base64,…` URL, so `live=False` and `channel="chrome"` is never selected. The Chrome switch is not on this path. |
| Missing browser install on the runner | The runner exports `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright` (`/home/aetheragent/actions-runner-2/.env`), and 4 of the 20 browser-driven `test_live_submitter_*` tests pass. |
| The failures are the *new* tests added by the suspect commits | The three tests `d803629e`/`6c4f0ef2` added (`…yesno_popup_commits_the_one_shared_token_yes_option`, the two `…hidden_iti_country_list` cases) all **pass**. The 16 that fail are pre-existing R6/R7 guard tests. |

### 3.3 How the next agent should close the last gap

The decisive experiment could not be run from this session and is left as the first step, not
guessed at: **the backend suite cannot currently be run locally at all.** `apps/api/tests/conftest.py`
fails closed —

```
REFUSING TO RUN: could not verify the test-truncation target is an isolated
'aether_test'/'aether_test_<wave>' schema (OperationalError('connection to server at
"127.0.0.1", port 5433 failed: Connection refused'))
```

— because the dev checkout's root `.env` still points `DATABASE_URL_TEST` at
`127.0.0.1:5433/aether_staging?schema=aether_test`, and 5433 stopped listening when commit
`01a7eb91` retired the persistent dev/test environments. The only Postgres now listening for this
purpose is the CI one on `127.0.0.1:5436`. Repointing the developer `.env` at
`aether-ci-postgres` (with its own isolated `aether_test_<wave>` schema, never `aether_test_ci`) is
the prerequisite for every step below.

Then:

1. `cd apps/api && bash ../../scripts/test-schema.sh provision localdiag` and run only
   `tests/test_sub008_answer_bank_seed_classes.py` at `d803629e^`, then at `d803629e`. That
   converts §3.2's Group-2 attribution from *established by reading the diff* to *established by
   bisection*, in two runs.
2. Bisect Group 1 across the seven apply commits between `ea7d0b30` and `d803629e` using a single
   cheap probe: `pytest tests/test_cli_sub005_fill_commit.py -k refuses_when_the_guards_own_installation_throws`.
   That test needs no DB and takes seconds; `DID NOT RAISE` is an unambiguous red/green signal.
3. Decide, per group, whether the **code** regressed or the **test contract** did. Group 2's tests
   encode a deliberate product rule ("the bank never invents an answer; an unmappable question is
   an honest manual step"); `d803629e`'s mapping check was written to solve a different real problem
   ("unmappable bank essays were stuffing the plan and starving `form_llm`"). Those two rules
   currently contradict each other for a `select` that offers an `"Other"` option. That contradiction
   is a product decision, not a lint fix, and should be resolved deliberately.

### 3.4 Two CI-design faults this exposed, independent of the code

1. **26 consecutive `cancelled` runs of `api-tests` were treated as non-events.** A cancelled
   required job is not a passing job. Nothing on `main` alerts on it, and 46 commits landed through
   that window. The workflow needs the self-hosted job to fail loudly when the runner does not pick
   it up (a `timeout-minutes` expiry that reports failure, or a queue-time alert) rather than
   ending as `cancelled`.
2. **CI reuses the developer venv.** `ci.yml` deliberately puts
   `/root/dev/aether-job-career-agent/apps/api/.venv/bin` on `PATH` (documented tradeoff: fresh pip
   installs of the torch/ML wheels were OOM-killed on this host on 2026-08-18). That dev checkout is
   currently at `d803629e` with an uncommitted modification to `apps/api/app/services/llm_client.py`
   — so CI's dependency set is whatever a human last left on the box. It is honest about the
   tradeoff in the comment; it is still a reproducibility hole worth closing with a pre-built,
   version-stamped venv image.

---

## 4. Verdict

| Claim under test | Verdict |
|---|---|
| "`aether-job-career-agent`'s public CI is red on `main`" | **TRUE.** Run `33682579720`, conclusion `failure`, 2026-09-02T20:59:50Z. |
| Is it one failure or several? | **Two independent ones**: a 10-violation ruff failure on a GitHub-hosted runner, and 20 deterministic pytest failures on the self-hosted runner. |
| Is it flaky? | **No.** Byte-identical failure sets across two runs on two commits. |
| Is the web/frontend side red? | **No.** `Web — lint, types, unit tests` passes, as does the `VPS Delivery` workflow. |
| Is it fixable without a product decision? | **Failure A yes** (mechanical: `ruff --fix` plus five line wraps, then re-check mypy, whose state is currently masked). **Failure B no** — Group 2 is a genuine contradiction between the answer-bank honesty rule and the choice-matching widening in `d803629e`, and resolving it is a product call. |

---

## 5. Exact commands behind every claim above

```bash
OWNER=Victordtesla24 ; REPO=aether-job-career-agent

gh api "/repos/$OWNER/$REPO/actions/workflows"
gh api "/repos/$OWNER/$REPO/actions/runs?branch=main&per_page=20"
gh api "/repos/$OWNER/$REPO/actions/runs/33682579720/jobs?per_page=100"
gh api "/repos/$OWNER/$REPO/actions/jobs/100422393390"     # per-step conclusions (mypy = skipped)
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/actions/jobs/100422393390/logs"
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/actions/jobs/100422393204/logs"
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/actions/jobs/100376965591/logs"   # prior run, for the determinism diff

# whole CI history on main -> last green, first red, and the cancelled window
gh api --paginate "/repos/$OWNER/$REPO/actions/workflows/311628383/runs?branch=main&per_page=100" \
  --jq '.workflow_runs[]|[.created_at,.id,.conclusion,.head_sha[0:8],.display_title]|@tsv' | sort

# per-run state of the self-hosted pytest job (the 26 cancellations)
gh api "/repos/$OWNER/$REPO/actions/runs/$RUN_ID/jobs" \
  --jq '.jobs[]|select(.name|startswith("API — full pytest"))|.conclusion'

# the rules the lint job enforces, and the offending lines, at HEAD
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/contents/apps/api/pyproject.toml?ref=bb5f5f010c202d1b1811ebaba443f30290cb29b2"
gh api -H "Accept: application/vnd.github.raw" "/repos/$OWNER/$REPO/contents/apps/api/app/services/apply_executor.py?ref=bb5f5f010c202d1b1811ebaba443f30290cb29b2" | sed -n '502p;565p' | awk '{print length}'

# commit history of the regressed files
gh api "/repos/$OWNER/$REPO/commits?path=apps/api/app/services/apply_executor.py&sha=main&per_page=5"
gh api "/repos/$OWNER/$REPO/compare/ea7d0b30...bb5f5f010c202d1b1811ebaba443f30290cb29b2" --jq '.files[]|select(.filename|test("apply_executor|answer_bank|apply_form"))|[.filename,.additions,.deletions]|@tsv'
```

Local read-only checks used to rule out environment causes (run on the CI host itself):

```bash
python3 -c "import json;print([ (b['name'],b['revision'],b.get('browserVersion')) for b in json.load(open('/root/dev/aether-job-career-agent/apps/api/.venv/lib/python3.12/site-packages/playwright/driver/package/browsers.json'))['browsers'] if 'chromium' in b['name']])"
ls -d /opt/ms-playwright/*
grep -o '^PLAYWRIGHT_BROWSERS_PATH=.*' /home/aetheragent/actions-runner-2/.env
ss -ltn | grep -E ':(5433|5436)'      # 5433 dead, 5436 (aether-ci-postgres) listening
```
