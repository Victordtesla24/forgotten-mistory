# R184 — root cause of both failure groups

Working copy: `/var/tmp/v6-r184/repo` (shallow clone of
`Victordtesla24/aether-job-career-agent` @ `bb5f5f01`, plus the pre-existing
lint/type fix in the working tree, which was left untouched).

## How the suite was reproduced

`.github/workflows/ci.yml`'s `api-tests` job and `apps/api/tests/conftest.py`
give the exact contract:

* `DATABASE_URL_TEST` → the dedicated CI Postgres, `127.0.0.1:5436`, database
  `aether_ci`, template schema `aether_test` (container `agentops-ci-postgres`,
  user `aether`).
* `bash scripts/test-schema.sh provision <wave>` clones the template schema's
  structure into an isolated `aether_test_<wave>`; batteries then run as
  `AETHER_TEST_SCHEMA=aether_test_<wave> flock /tmp/aether-pytest-<wave>.lock
  bash scripts/run-tests.sh ...`.
* CI reuses the host's provisioned API venv rather than building one:
  `export PATH="/root/dev/aether-job-career-agent/apps/api/.venv/bin:$PATH"`.

Reproduced locally with wave `r184` (`aether_test_r184`, 49 tables cloned from
`aether_test`). One environment fact CI carries that a bare shell does not:
`/opt/actions-runner/.env` sets `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright`.
Without it the browser suites fail on
`BrowserType.launch: Executable doesn't exist ...` — an environment miss, not
a defect; the first scout run showed 34 failures for that reason and is not
the number reported anywhere.

## Group 1 — the guard really had stopped firing (CODE was wrong)

`playwright_form_submitter` gates the whole CLI-SUB-005-R2..R7 safety net on
one boolean, `verify_commit`. At `bb5f5f01` it read:

```python
verify_commit = bool(apply_url) and str(apply_url).startswith(
    ("http://", "https://")
)
```

`verify_commit` decides **all** of:

* `_run_fill_plan(..., verify=verify_commit)` — fill read-back + one retry
  (`_fill_and_verify` → `_commit_state`);
* `_converge_presubmit_state(...)` — the live-DOM re-derivation that finds
  post-snapshot conditional fields;
* `_verify_no_unverifiable_form_surface(...)` — the conservative refuse
  backstop;
* `_install_submission_guard(page)` and the same on every reachable frame —
  the R6/R7 capture- and bubble-phase submission guard.

Every one of the 21 failing browser tests drives the submitter through a
`data:text/html;base64,...` fixture (`_data_url(...)`), which is not
`http(s)`. So for the entire adversarial suite the boolean was `False` and
none of the four mechanisms above ran at all.

Proved directly rather than inferred — instrumenting `_fill_value` and
`_commit_state` around the flagship wipe test showed the fill happening once
and **`_commit_state` never being called at all**:

```
  _fill_value name JordanBlake -> True
RAISED: ManualStepRequired no_confirmation ...
```

That is exactly the observed symptom shape: every refusal test reported the
generic terminal `no_confirmation` (or `submit_click_failed`, or
`DID NOT RAISE`) instead of its specific reason
(`form_fill_failed`, `unplanned_required_field`, `guard_install_failed`,
`census_unavailable`, `unverifiable_form_surface`).

Provenance (read from the host checkout's full history, not from the shallow
clone): `git log -S` pins the change to commit `36fc2665`
*"fix(submission): wait for the live apply form and retry SPA misses"*
(2026-08-18), which rewrote `verify_commit = bool(apply_url)` into the
http(s)-only form, with a comment asserting that "a data: URL is a local SPA
fixture ... so the conservative census does not apply".

Why that is a genuine behavioural defect and not merely a test problem: the
URL scheme is not what makes verification necessary. What makes it necessary
is that the page is a **live, script-running document** whose own JS can wipe,
re-render, reveal or fake a field between the fill and the click — which a
navigated `data:` page is in every respect (verified independently: page
`<script>` elements execute and the wipe fires, `marker: script-ran`, and
`fill()` on the wiping fixture leaves `''` behind). The narrowing silently
disarmed the safety net on the only surface the repository has that proves
the net works at all, so a regression in any of the four mechanisms would
have been invisible to CI from that commit onward.

**Fix** — `apps/api/app/services/apply_executor.py:3869` (post-fix line
number; the replaced comment+assignment block spans 3854-3869): restore

```python
verify_commit = bool(apply_url)
```

Replay (no `apply_url`) is unchanged and still unverified, which stays
correct: that path calls `page.route("**/*", ...abort())` and
`page.set_content(...)`, i.e. a JS-dead capture no employer can receive
anything from.

## Group 2 — the prior lead was right about the symptom, wrong about the site

The prior analysis said `build_form_fill_plan` "now matches a banked essay
answer to the literal option `Other`". Reproduced, the mechanism is one step
earlier and has nothing to do with matching: the answer bank is never
consulted for that field at all, because `_answer_for` resolves it first.

The same commit `36fc2665` added `_derived_answer`, whose final branch was:

```python
    if _HEAR_ABOUT_RE.search(label):
        stored = str(profile.get("hearAbout") or "").strip()
        if stored:
            return stored
        for option in field.get("options") or []:
            if str(option).strip().lower() == "other":
                return str(option).strip()
        return "Other"        # <-- unconditional, even with NO options
    return None
```

`SYNTHETIC_FORM_HTML` in `test_sub008_answer_bank_seed_classes.py` carries

```html
<label for="question_88001">How did you hear about us? *</label>
<input id="question_88001" name="question_88001" type="text" aria-required="true">
```

— a **required free-text box with no options at all**. `_HEAR_ABOUT_RE`
matches the label, `profile["hearAbout"]` is absent, the option loop iterates
an empty list, and the function returns the literal string `"Other"`. Three
consequences, all of them the observed failures:

1. `test_without_the_bank_both_classes_are_honest_manual_steps` — the honest
   `unknown_required_question` no longer names "How did you hear", because
   the field is now "answered".
2. `test_the_seeded_bank_removes_the_manual_step_entirely` —
   `values["question_88001"]` is `"Other"`, not the user's own banked words.
3. `test_every_auto_answer_carries_its_audit_row` — `answerBankAudit` holds
   only `question_88002`; there is no audit row for a field the bank was
   never asked about.

The code is wrong, and the file's own stated honesty floor says why: *"the
referral answer is the USER'S OWN words, taken from the seed questionnaire,
never a value Aether derives"*. Typing the literal word `Other` into an
employer's free-text box is an answer the user never gave, and it silently
removes the manual step that would otherwise have asked them for one.

**Fix** — `apps/api/app/services/apply_executor.py:795-801` (post-fix): drop the
unconditional `return "Other"` and fall through to `None`. The preceding
option loop is untouched, so a field that genuinely **offers** an `Other`
choice still selects it — which is what
`test_hear_about_source_uses_other_when_the_user_did_not_record_one`
(`tests/test_apply_profile_contact_from_resume.py:205`) actually pins:

```python
        "kind": "combobox",
        "options": ["LinkedIn application", "Job board (Seek, Indeed etc.)", "Other"],
    }
    assert _answer_for(field, _RESUME_PROFILE) == "Other"
```

That test still passes unchanged.

## Third change (test fixture) — see `03b-intended-test-change.md`

Restoring the guard made two fixtures in `tests/test_sub_live_form_wait.py`
refuse correctly (`unclassified <input> control` under `channel="ashby"`),
because their markup carried no `[data-field-path]` question block. Fixture
markup only; assertions untouched. Fully documented and justified in
`03b-intended-test-change.md`.
