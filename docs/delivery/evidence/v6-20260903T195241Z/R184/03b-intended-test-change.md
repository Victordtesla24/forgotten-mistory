# R184 — the one deliberate test-fixture change, quoted before and after

Two of the three files I touched are application code. This file documents the
third: `apps/api/tests/test_sub_live_form_wait.py`, where I changed **fixture
HTML only** — no assertion, no `skip`, no `xfail`, no threshold, no marker, no
deleted case. Both tests still assert exactly what they asserted before, and
they now have to satisfy *more* of the executor to do it.

## Why the change was needed at all

The application fix (see `03-full-fix.patch`) restores
`verify_commit = bool(apply_url)` in `playwright_form_submitter`, so a
navigated `data:` page is put back through the full CLI-SUB-005-R2..R7 path:
fill read-back + retry, `_converge_presubmit_state`, the
`_verify_no_unverifiable_form_surface` refuse-backstop, and the R6/R7
in-page submission guard.

These two tests call `_submit(...)`, which passes **`channel="ashby"`**:

```python
def _submit(html: str, tmp_path: Any, application_id: str) -> dict[str, Any]:
    return playwright_form_submitter(
        application_id=application_id,
        channel="ashby",
        ...
```

With the backstop armed again, the backstop did what it is built to do:

```
app.services.apply_executor.ManualStepRequired: This application page has a
part Aether could not fully read and account for before submitting — rather
than guess whether it held a required question, it stopped and left the form
untouched: unclassified <input> control
```

That refusal is **correct**. Measured directly against the fixture markup:

```
ashby      fields: []            unclassified: ['unclassified <input> control']
generic    fields: [{'name': 'email', ...}]   unclassified: []
greenhouse fields: [{'name': 'email', ...}]   unclassified: []
```

`_parse_ashby` reads one question per `[data-field-path]` block (its own
docstring: *"Ashby renders one `[data-field-path]` block per question"*). The
fixtures had a bare `<label>` + `<input>` with no such block, so under the
Ashby dialect the email control was genuinely unclassifiable — an
`<input>` the parser could not turn into a field. The test's own docstring
calls the fixture *"a real Ashby form"*; it was not one. The fixture was
wrong, not the guard.

## Before / after (verbatim)

`_DELAYED_ASHBY_FORM` — before:

```js
    '<form class="ashby-application-form">' +
    '<label for="email">Email</label>' +
    '<input id="email" name="email" type="email">' +
    '<button class="ashby-application-form-submit-button">Submit Application</button>' +
```

after:

```js
    '<form class="ashby-application-form">' +
    // Ashby renders one [data-field-path] block per question — that block is
    // what parse_form_schema(channel="ashby") turns into a field, and what
    // the pre-submit refuse-backstop checks every control against. Without
    // it this fixture is not the "real Ashby form" the test claims.
    '<div data-field-path="email">' +
    '<label for="email">Email</label>' +
    '<input id="email" name="email" type="email">' +
    '</div>' +
    '<button class="ashby-application-form-submit-button">Submit Application</button>' +
```

`_APPLY_CTA_THEN_FORM` — before:

```js
    '<form>' +
    '<label for="email">Email</label>' +
    '<input id="email" name="email" type="email">' +
    '<button type="submit">Submit Application</button>' +
```

after:

```js
    '<form>' +
    // Same Ashby question block as _DELAYED_ASHBY_FORM: _submit() runs this
    // fixture through channel="ashby", so the email question has to be
    // shaped the way that dialect's parser reads one.
    '<div data-field-path="email">' +
    '<label for="email">Email</label>' +
    '<input id="email" name="email" type="email">' +
    '</div>' +
    '<button type="submit">Submit Application</button>' +
```

## Proof the intent is preserved, not weakened

* **Assertions untouched.** `test_delayed_fetching_form_is_waited_for_then_submitted`
  still asserts `outcome["submitted"] is True`, `outcome.get("confirmation")`
  and `"thank you" in confirmation.lower()`.
  `test_apply_for_this_job_cta_is_clicked_before_fill` still asserts
  `outcome["submitted"] is True` and `outcome.get("confirmation")`. Neither
  string, timeout, nor tolerance changed.
* **The tested behaviour is unchanged.** Both tests exist to prove
  `wait_for_application_form` waits out an SPA spinner (3.5 s) and that the
  "Apply for this job" CTA is clicked before the fill. The wrapper `<div>` is
  inert markup: it adds no control, no requiredness, no script, and does not
  move the submit control or the confirmation text. The 3.5 s delay, the CTA
  button, the submit control and the confirmation copy are all byte-identical.
* **The bar went up, not down.** Before the application fix these two tests
  ran with `verify_commit == False`: no fill read-back, no convergence, no
  refuse-backstop, no submission guard. They now run the *entire* verified
  live path and still return `submitted: True` with a real confirmation —
  which means the email fill is now actually read back out of the DOM before
  the click, where previously it was merely typed and assumed.
* **Nothing was suppressed to get there.** The exception the backstop raised
  is not caught, downgraded, or ignored anywhere; the fixture simply stopped
  triggering it by becoming the Ashby markup the test claims it is.

Result for that file: `11 passed` (was `9 passed, 2 failed` immediately after
the application fix, and `11 passed` before it — but two of those eleven were
passing only because the guard was disabled).
