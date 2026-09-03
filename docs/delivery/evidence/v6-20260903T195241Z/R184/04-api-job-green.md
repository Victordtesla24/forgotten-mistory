# R-184 · aether-job-career-agent CI repair — the `api` job

Reproduced and repaired in an isolated shallow clone of `main` at bb5f5f01, outside the
guardian-owned checkout (which is on branch feat/submission-live-apply with uncommitted work
and must not be disturbed).

## Before
```
$ ruff check app/ tests/   ->  Found 10 errors. [*] 5 fixable
$ mypy app/ --ignore-missing-imports  ->  never reached: ruff exits non-zero first
```
The CI `api` job runs `ruff check` then `mypy`. Ruff failing aborts the job, which is why
mypy's true state was unknown — it was never run, not deliberately skipped.

## After
```
ruff 0.16.6
$ ruff check app/ tests/
All checks passed!
$ mypy app/ --ignore-missing-imports
Success: no issues found in 201 source files
$ python3 -m compileall -q app/ tests/  ->  OK
```

## Guards
- `grep -c noqa` over the patch → **0**. No violation was silenced.
- `git diff -- apps/api/pyproject.toml` → **0 lines**. No lint config widened, no line-length raised.
- Test-tree changes are **import ordering and one blank line only** — no assertion, no skip, no xfail.
