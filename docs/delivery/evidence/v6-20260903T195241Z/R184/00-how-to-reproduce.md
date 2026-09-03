# R184 — exact reproduction recipe (as CI runs it)

```bash
# 1. CI database (from .github/workflows/ci.yml `api-tests` + conftest.py)
export DATABASE_URL_TEST='postgresql://aether:<pw>@127.0.0.1:5436/aether_ci?schema=aether_test&connect_timeout=15'
#    container: agentops-ci-postgres  (127.0.0.1:5436 -> 5432, db aether_ci, user aether)
#    template schema: aether_test (49 tables)

# 2. Host's provisioned API venv (CI reuses it rather than building one)
export PATH="/root/dev/aether-job-career-agent/apps/api/.venv/bin:$PATH"

# 3. The one runner-env fact that is NOT in ci.yml (it is in /opt/actions-runner/.env)
export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright

# 4. Isolated per-wave schema, then run
cd /var/tmp/v6-r184/repo
bash scripts/test-schema.sh provision r184          # -> aether_test_r184
AETHER_TEST_SCHEMA=aether_test_r184 \
  flock /tmp/aether-pytest-r184.lock bash scripts/run-tests.sh <files...> -q
# cleanup: bash scripts/test-schema.sh drop r184
```

Full suite is run the way CI does: `ls tests/test_*.py | sort` split into three
alphabetical slices, each slice one pytest process under the wave lock.

Lint / types (with the task-provided venv):

```bash
cd /var/tmp/v6-r184/repo/apps/api
/var/tmp/v6-r184/venv/bin/ruff check app/ tests/
/var/tmp/v6-r184/venv/bin/mypy app/ --ignore-missing-imports
```

## Files in this directory

| file | what it is |
|---|---|
| `01-scout-pytest.log` | BEFORE — verbatim pytest output, the three named suites |
| `02-after-fix-full-suite.log` | AFTER — verbatim full-suite run, three CI slices |
| `02b-before-fix-full-suite.log` | BEFORE — verbatim full-suite run on the untouched given state |
| `03-full-fix.patch` | `git diff` of the whole working tree at the end |
| `03a-root-cause.md` | root cause of both groups, with the evidence for each |
| `03b-intended-test-change.md` | the one test-fixture change, quoted before/after and justified |
| `04-probe-fill-verify-never-ran.py` | the instrumented probe that proved `_commit_state` was never called |
| `05-lint-and-types.log` | ruff + mypy output after the fix |
