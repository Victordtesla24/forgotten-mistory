# P0 — Aether pre-prod removal + CI rewire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Aether test and staging environments from the Hostinger VPS (after recoverable backups) and make the GitHub delivery pipeline `verify → deploy-prod` with a working, isolated CI database and CI runner.

**Architecture:** All host changes happen over `ssh hos-vps` (root@187.77.12.13, key auth). Repo changes are made in a fresh clone on the VPS (`/root/ci/aether-clone`) on branch `chore/remove-preprod-envs`, opened as a PR and merged with `gh`; the guardian tooling in `/opt` is then re-installed from the merged `main` with the repo's own `ops/guardian/install.sh`. A dedicated `aether-ci-postgres` (loopback 5436) seeded with the structure of the production `aether` schema replaces the empty template that CI pointed at.

**Tech Stack:** systemd, Docker Compose v5, Postgres 18 (`postgres:18-alpine`), Traefik v3 file provider, GitHub Actions self-hosted runners (v2.336.0), `gh` CLI (logged in as Victordtesla24 with `repo`+`workflow` scope), bash, Python 3.

**Verified facts this plan relies on (2026-09-03):**
- Staging = units `aether-dev-api` (8100) / `aether-dev-web` (3100), checkout `/root/dev/aether-staging`, compose `/root/dev/.agent/staging/docker-compose.yml` (containers `aether-staging-postgres` 5433, `aether-staging-redis` 6380; DB `aether_staging`, 101 MB), Traefik `aether-dev.yml`, timer `aether-guardian@dev.timer`.
- Test = units `aether-test-api` (8300) / `aether-test-web` (3300), checkout `/root/test/app`, compose `/root/test/docker-compose.yml` (containers `aether-test-postgres` 5435, `aether-test-redis` 6382; DB `aether_test`, 16 MB), Traefik `aether-test.yml`, timer `aether-guardian@test.timer`.
- Must stay: `/root/dev/aether-job-career-agent` (prod units' `ExecStartPre` guard + CI venv live there), `/root/prod`, `aether-prod-*`, `aether-logstream`, `aether-guardian@prod`/`@ci`, runner `/opt/actions-runner` (label `hostinger-vps`), `/root/dev/.agent/{bin,servers,verify,prod-migration,rescued-from-abacus,staging-credentials.txt,staging-htpasswd}`.
- `/opt/aether-guardian/{guardian.py,deploy_env.sh,manifest.py}` and `/opt/aether-logstream/logstream.py` are installed from repo `ops/guardian/` by `ops/guardian/install.sh`. Drift today: `/opt/deploy_env.sh` is AHEAD of `origin/main` (dedicated-checkout + `safe.directory` + `git clean` fixes, never committed); `/opt/guardian.py` is BEHIND `origin/main` (missing the "monitor shells are not runner jobs" fix). The PR resolves both directions.
- Prod DB `aether_prod` (container `aether-prod-postgres`, 5434, user `aether`): schema `aether` has 48 tables; schema `aether_test` has 0 tables (empty template — CI could never provision from it).
- Second runner `/home/aetheragent/actions-runner-2` (name `aether-ci-2`, v2.336.0, owner `aetheragent` uid 1002) is configured on disk but no longer registered on GitHub (only `hostinger-vps-srv1356245` is). `ci.yml`'s `api-tests` job targets label `hostinger-vps-ci`, so every `CI` run has failed since 2026-08-20.
- `main` has no branch protection; environments `production` and `staging` exist with no rules. No workflow runs in progress.
- Repo secrets: `DATABASE_URL_TEST`, `AETHER_CREDENTIAL_KEY_TEST`.

---

## File structure

VPS (created/modified):
- Create `/root/backups/aether-envs-2026-09-03/` — dumps, tarballs, unit/route copies, `SHA256SUMS`, `/opt` snapshot.
- Create `/root/ci/docker-compose.yml`, `/root/ci/.env` (600) — `aether-ci-postgres`.
- Create `/root/ci/seed-ci-template.sh` — one-shot seeding of schema `aether_test` from prod structure.
- Create `/root/ci/aether-clone/` — fresh clone of the repo for the PR (kept afterwards as the `main` checkout used to run `install.sh`).
- Modify `/home/aetheragent/actions-runner-2/` registration; create systemd unit via `svc.sh`.
- Remove: the four `aether-dev/test` unit files, two Traefik files, `/root/test`, `/root/dev/aether-staging`, `/root/dev/.agent/staging`, four containers + volumes; `/var/log/aether-{dev,test}` → `/var/log/aether-archive/`.
- Re-install `/opt/aether-guardian/*` and `/opt/aether-logstream/logstream.py` from merged `main`.

Repo `Victordtesla24/aether-job-career-agent` (branch `chore/remove-preprod-envs`):
- Modify `.github/workflows/vps-delivery.yml` — drop `deploy-dev`, `deploy-test`; `deploy-prod.needs: verify`.
- Modify `.github/workflows/ci.yml` — comment only (runner label unchanged) — or relabel if Task 4 fallback is taken.
- Modify `ops/guardian/deploy_env.sh` — prod-only, with the VPS hot-fixes committed.
- Modify `ops/guardian/guardian.py` — `ENVS` = prod + ci.
- Modify `ops/guardian/manifest.py` — `ENVS` = prod + ci; streams, flow, invoke strings.
- Modify `ops/guardian/logstream.py` — `STREAMS`/`JOURNAL_UNITS` = prod, guardian-prod, guardian-ci, journal-prod, journal-ci.

Conventions for every task: run remote scripts by writing them locally to `/tmp/p0-<task>.sh`, `scp` to `hos-vps:/tmp/`, `ssh hos-vps 'bash /tmp/p0-<task>.sh'`. Never print secret values. Never `pkill -f` a pattern that appears in your own command line.

---

### Task 1: Stop the two guardian timers and take recoverable backups

**Files:**
- Create: `/root/backups/aether-envs-2026-09-03/*`

- [ ] **Step 1: Write the backup script**

```bash
cat > /tmp/p0-backup.sh <<'EOF'
set -euo pipefail
B=/root/backups/aether-envs-2026-09-03
mkdir -p "$B"
# Guardians for the doomed envs must not run mid-removal.
systemctl disable --now aether-guardian@dev.timer aether-guardian@test.timer || true
systemctl stop aether-guardian@dev.service aether-guardian@test.service 2>/dev/null || true

dump() { # container db name
  docker exec "$1" pg_dump -U aether -d "$2" -Fc -f "/tmp/$2.dump"
  docker cp "$1:/tmp/$2.dump" "$B/$2.dump"
  docker exec "$1" rm -f "/tmp/$2.dump"
  docker exec "$1" pg_dump -U aether -d "$2" | gzip > "$B/$2.sql.gz"
}
dump aether-test-postgres aether_test
dump aether-staging-postgres aether_staging

TAR='tar --warning=no-file-changed --exclude=node_modules --exclude=.venv --exclude=.next --exclude=.turbo --exclude=__pycache__'
$TAR -czf "$B/root_test.tgz" -C / root/test
$TAR -czf "$B/root_dev_aether-staging.tgz" -C / root/dev/aether-staging
tar -czf "$B/root_dev_.agent_staging.tgz" -C / root/dev/.agent/staging root/dev/.agent/staging-credentials.txt root/dev/.agent/staging-htpasswd
tar -czf "$B/var_log_aether-dev-test.tgz" -C / var/log/aether-dev var/log/aether-test
cp -p /etc/systemd/system/aether-dev-api.service /etc/systemd/system/aether-dev-web.service \
      /etc/systemd/system/aether-test-api.service /etc/systemd/system/aether-test-web.service "$B/"
cp -p /docker/traefik-vplw/dynamic/aether-dev.yml /docker/traefik-vplw/dynamic/aether-test.yml "$B/"
cp -a /opt/aether-guardian "$B/opt_aether-guardian.before"
cp -p /opt/aether-logstream/logstream.py "$B/logstream.py.before"
docker volume ls --format '{{.Name}}' | grep -E 'aether-(test|staging)' > "$B/volumes-before.txt"
( cd "$B" && sha256sum *.dump *.gz *.tgz *.service *.yml > SHA256SUMS )
chmod 600 "$B"/*.dump "$B"/*.sql.gz "$B"/*.tgz
echo "BACKUP_DONE"; ls -la "$B"
EOF
scp /tmp/p0-backup.sh hos-vps:/tmp/p0-backup.sh && ssh hos-vps 'bash /tmp/p0-backup.sh'
```
Expected: `BACKUP_DONE` and a listing with `aether_test.dump`, `aether_staging.dump`, both `.sql.gz`, four `.tgz`, four `.service`, two `.yml`, `SHA256SUMS`, `opt_aether-guardian.before/`.

- [ ] **Step 2: Verify the dumps are restorable**

```bash
ssh hos-vps 'B=/root/backups/aether-envs-2026-09-03; for d in aether_test aether_staging; do echo -n "$d tables in dump: "; docker exec -i aether-test-postgres pg_restore --list /dev/stdin < $B/$d.dump | grep -c "TABLE DATA"; done; sha256sum -c $B/SHA256SUMS | grep -c OK; systemctl is-enabled aether-guardian@dev.timer aether-guardian@test.timer'
```
Expected: both counts > 0 (staging ≈ 48, test ≈ 48), `SHA256SUMS` OK count = 12, both timers `disabled`.

---

### Task 2: Create and seed the CI database

**Files:**
- Create: `/root/ci/docker-compose.yml`, `/root/ci/.env`, `/root/ci/seed-ci-template.sh`

- [ ] **Step 1: Write the compose project and the seed script**

```bash
cat > /tmp/p0-ci-db.sh <<'EOF'
set -euo pipefail
mkdir -p /root/ci && cd /root/ci
umask 077
[ -f .env ] || printf 'CI_PG_PASSWORD=%s\n' "$(openssl rand -hex 20)" > .env
umask 022
cat > docker-compose.yml <<'YML'
# Aether CI datastore — used ONLY by the GitHub Actions api-tests job
# (scripts/test-schema.sh provisions aether_test_<wave> schemas here by
# cloning the structure of the aether_test template schema). Loopback-only.
name: aether-ci
services:
  postgres:
    image: postgres:18-alpine
    container_name: aether-ci-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: aether
      POSTGRES_PASSWORD: ${CI_PG_PASSWORD}
      POSTGRES_DB: aether_ci
    ports: ["127.0.0.1:5436:5432"]
    volumes: ["aether-ci-pgdata:/var/lib/postgresql"]
    mem_limit: 384m
    cpus: 1
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aether -d aether_ci"]
      interval: 10s
      timeout: 5s
      retries: 12
volumes:
  aether-ci-pgdata:
YML
cat > seed-ci-template.sh <<'SEED'
#!/usr/bin/env bash
# Seed the CI template schema `aether_test` in aether_ci with the STRUCTURE
# (zero rows) of the live production `aether` schema, exactly the way
# scripts/test-schema.sh clones a template: schema-only dump, identifiers
# renamed, loaded in one transaction. Idempotent: refuses if aether_test
# already has tables.
set -euo pipefail
have=$(docker exec aether-ci-postgres psql -U aether -d aether_ci -tAc \
  "select count(*) from information_schema.tables where table_schema='aether_test'")
if [ "$have" != "0" ]; then echo "aether_test already has $have tables — nothing to do"; exit 0; fi
# Same extensions as prod (extensions are DB-level, not part of a -n dump).
docker exec aether-prod-postgres psql -U aether -d aether_prod -tAc \
  "select extname from pg_extension where extname<>'plpgsql'" | while read -r ext; do
  [ -n "$ext" ] && docker exec aether-ci-postgres psql -U aether -d aether_ci -v ON_ERROR_STOP=1 -q -c "CREATE EXTENSION IF NOT EXISTS \"$ext\""
done
docker exec aether-prod-postgres pg_dump -U aether -d aether_prod \
    --schema-only --no-owner --no-privileges --no-comments --no-tablespaces -n aether \
  | sed -E 's/\baether\b/aether_test/g' \
  | docker exec -i aether-ci-postgres psql -U aether -d aether_ci -X -q -v ON_ERROR_STOP=1 --single-transaction
echo "seeded: $(docker exec aether-ci-postgres psql -U aether -d aether_ci -tAc "select count(*) from information_schema.tables where table_schema='aether_test'") tables"
SEED
chmod 755 seed-ci-template.sh
docker compose up -d
for i in $(seq 1 30); do docker inspect --format '{{.State.Health.Status}}' aether-ci-postgres 2>/dev/null | grep -q healthy && break; sleep 2; done
docker inspect --format 'health={{.State.Health.Status}}' aether-ci-postgres
bash ./seed-ci-template.sh
EOF
scp /tmp/p0-ci-db.sh hos-vps:/tmp/p0-ci-db.sh && ssh hos-vps 'bash /tmp/p0-ci-db.sh'
```
Expected: `health=healthy`, then `seeded: 48 tables` (the exact number equals the prod `aether` table count; anything > 40 is acceptable, 0 is a failure).

- [ ] **Step 2: Prove the repo's provisioning script works against it**

```bash
cat > /tmp/p0-ci-prov.sh <<'EOF'
set -euo pipefail
command -v psql >/dev/null && command -v pg_dump >/dev/null || { DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql-client >/dev/null; }
psql --version; pg_dump --version
PW=$(sed -n 's/^CI_PG_PASSWORD=//p' /root/ci/.env)
export DATABASE_URL_TEST="postgresql://aether:${PW}@127.0.0.1:5436/aether_ci?schema=aether_test_p0chk&connect_timeout=15"
cd /root/dev/aether-job-career-agent && git show origin/main:scripts/test-schema.sh > /tmp/p0-test-schema.sh
bash /tmp/p0-test-schema.sh provision p0chk
docker exec aether-ci-postgres psql -U aether -d aether_ci -tAc "select count(*) from information_schema.tables where table_schema='aether_test_p0chk'"
bash /tmp/p0-test-schema.sh drop p0chk
docker exec aether-ci-postgres psql -U aether -d aether_ci -tAc "select count(*) from pg_namespace where nspname='aether_test_p0chk'"
rm -f /tmp/p0-test-schema.sh; unset PW DATABASE_URL_TEST
EOF
scp /tmp/p0-ci-prov.sh hos-vps:/tmp/p0-ci-prov.sh && ssh hos-vps 'bash /tmp/p0-ci-prov.sh'
```
Expected: client versions ≥ 18 (a `pg_dump` older than the server refuses to dump — if the installed client is < 18, add the PGDG apt repo and install `postgresql-client-18` before continuing), then `[test-schema.sh] … provisioned` output, table count ≈ 48 (+1 marker), then `0` after drop.

---

### Task 3: Point the repo secret at the CI database

- [ ] **Step 1: Update `DATABASE_URL_TEST`**

```bash
ssh hos-vps 'PW=$(sed -n "s/^CI_PG_PASSWORD=//p" /root/ci/.env); gh secret set DATABASE_URL_TEST -R Victordtesla24/aether-job-career-agent --body "postgresql://aether:${PW}@127.0.0.1:5436/aether_ci?schema=aether_test_ci&connect_timeout=15" && gh secret list -R Victordtesla24/aether-job-career-agent'
```
Expected: `DATABASE_URL_TEST` with today's timestamp; `AETHER_CREDENTIAL_KEY_TEST` untouched.

---

### Task 4: Re-register the dedicated CI runner (`aether-ci-2`, label `hostinger-vps-ci`)

**Files:**
- Modify: `/home/aetheragent/actions-runner-2/.runner`, `.credentials*` (re-created by `config.sh`)
- Create: `/etc/systemd/system/actions.runner.Victordtesla24-aether-job-career-agent.aether-ci-2.service` (by `svc.sh`)

- [ ] **Step 1: Register and install as a service**

```bash
cat > /tmp/p0-runner2.sh <<'EOF'
set -euo pipefail
cd /home/aetheragent/actions-runner-2
TOKEN=$(gh api -X POST repos/Victordtesla24/aether-job-career-agent/actions/runners/registration-token --jq .token)
[ -n "$TOKEN" ] || { echo "NO_TOKEN"; exit 3; }
sudo -u aetheragent ./config.sh remove --local >/dev/null 2>&1 || true
sudo -u aetheragent ./config.sh --unattended --replace \
  --url https://github.com/Victordtesla24/aether-job-career-agent --token "$TOKEN" \
  --name aether-ci-2 --labels hostinger-vps-ci --work _work
unset TOKEN
./svc.sh install aetheragent
./svc.sh start
sleep 8
systemctl is-active 'actions.runner.Victordtesla24-aether-job-career-agent.aether-ci-2.service'
gh api repos/Victordtesla24/aether-job-career-agent/actions/runners --jq '.runners[] | "\(.name) \(.status) \([.labels[].name] | join(","))"'
EOF
scp /tmp/p0-runner2.sh hos-vps:/tmp/p0-runner2.sh && ssh hos-vps 'bash /tmp/p0-runner2.sh'
```
Expected: `active`, and two runners listed: `hostinger-vps-srv1356245 online …hostinger-vps` and `aether-ci-2 online …hostinger-vps-ci`.

- [ ] **Step 2 (fallback only if Step 1 printed `NO_TOKEN` or a 403):** record `RUNNER2=fallback` and, in Task 5, change `ci.yml` `runs-on: [self-hosted, hostinger-vps-ci]` to `runs-on: [self-hosted, hostinger-vps]` (the pytest suite then shares the deploy runner's single slot).

---

### Task 5: Repository changes on a branch, PR, merge

**Files:**
- Create: `/root/ci/aether-clone/` (clone of `main`)
- Modify (in the clone): `.github/workflows/vps-delivery.yml`, `.github/workflows/ci.yml`, `ops/guardian/deploy_env.sh`, `ops/guardian/guardian.py`, `ops/guardian/manifest.py`, `ops/guardian/logstream.py`

- [ ] **Step 1: Fresh clone and branch**

```bash
ssh hos-vps 'gh auth setup-git >/dev/null 2>&1; rm -rf /root/ci/aether-clone; gh repo clone Victordtesla24/aether-job-career-agent /root/ci/aether-clone -- -q && cd /root/ci/aether-clone && git checkout -q -b chore/remove-preprod-envs && git log --oneline -1'
```
Expected: one commit line from `main`.

- [ ] **Step 2: Rewrite `vps-delivery.yml` (delete the two pre-prod jobs)**

```bash
cat > /tmp/p0-edit-delivery.py <<'EOF'
import re, pathlib
p = pathlib.Path('/root/ci/aether-clone/.github/workflows/vps-delivery.yml')
s = p.read_text()
s = s.replace("# A push to main flows: verify -> dev -> test -> production.\n",
              "# A push to main flows: verify -> production. (The persistent dev/test\n# environments were retired 2026-09-03; CI runs the full suite against an\n# isolated CI database instead.)\n", 1)
# drop the deploy-dev and deploy-test job blocks (each starts at column 2 and ends before the next job)
s = re.sub(r"\n  deploy-dev:\n.*?(?=\n  deploy-test:\n)", "", s, flags=re.S)
s = re.sub(r"\n  deploy-test:\n.*?(?=\n  deploy-prod:\n)", "", s, flags=re.S)
assert s.count("deploy-dev") == 0 and s.count("deploy-test") == 0, "pre-prod jobs still present"
s = s.replace("  deploy-prod:\n    name: Deploy production (auto, with rollback)\n    needs: deploy-test\n",
              "  deploy-prod:\n    name: Deploy production (auto, with rollback)\n    needs: verify\n", 1)
assert "needs: verify" in s.split("deploy-prod:")[1]
p.write_text(s); print("delivery ok:", [l for l in s.splitlines() if l.startswith("  ") and l.endswith(":") and not l.startswith("   ")])
EOF
scp /tmp/p0-edit-delivery.py hos-vps:/tmp/ && ssh hos-vps 'python3 /tmp/p0-edit-delivery.py && python3 -c "import yaml;yaml.safe_load(open(\"/root/ci/aether-clone/.github/workflows/vps-delivery.yml\"))" && echo YAML_OK'
```
Expected: `delivery ok: ['  verify:', '  deploy-prod:']` and `YAML_OK`.

- [ ] **Step 3: `ci.yml` — update the runner comment (label stays `hostinger-vps-ci`; fallback relabel if Task 4 fell back)**

```bash
cat > /tmp/p0-edit-ci.py <<'EOF'
import pathlib, sys
fallback = len(sys.argv) > 1 and sys.argv[1] == 'fallback'
p = pathlib.Path('/root/ci/aether-clone/.github/workflows/ci.yml'); s = p.read_text()
old = "    # Dedicated CI runner (aether-ci-2, user-space, label hostinger-vps-ci) so\n    # full suites never occupy the root deploy runner's single slot. Deploy\n    # jobs stay exclusively on [self-hosted, hostinger-vps].\n    runs-on: [self-hosted, hostinger-vps-ci]\n"
assert s.count(old) == 1
if fallback:
    new = "    # The dedicated CI runner could not be re-registered (2026-09-03); the\n    # suite shares the deploy runner's slot until it is.\n    runs-on: [self-hosted, hostinger-vps]\n"
else:
    new = "    # Dedicated CI runner (aether-ci-2, user aetheragent, label hostinger-vps-ci,\n    # re-registered 2026-09-03) so full suites never occupy the root deploy\n    # runner's single slot. Deploy jobs stay exclusively on [self-hosted, hostinger-vps].\n    # DATABASE_URL_TEST points at the dedicated aether-ci-postgres (127.0.0.1:5436,\n    # db aether_ci) whose aether_test template mirrors the prod schema structure.\n    runs-on: [self-hosted, hostinger-vps-ci]\n"
p.write_text(s.replace(old, new, 1)); print("ci.yml ok", "fallback" if fallback else "")
EOF
scp /tmp/p0-edit-ci.py hos-vps:/tmp/ && ssh hos-vps 'python3 /tmp/p0-edit-ci.py'   # add the word fallback as an argument only if Task 4 Step 2 applied
```
Expected: `ci.yml ok`.

- [ ] **Step 4: Replace `ops/guardian/deploy_env.sh` with the prod-only version (VPS hot-fixes included)**

```bash
cat > /tmp/p0-deploy_env.sh <<'EOF'
#!/usr/bin/env bash
# Deploy production from a verified ref, smoke-test it, and roll back
# automatically if the smoke test fails.
#
#   deploy_env.sh prod [--rollback-on-failure] [<sha>]
#
# The persistent dev/test environments were retired on 2026-09-03; the full
# test suite runs in CI against an isolated CI database instead.
set -euo pipefail

ENV="${1:?usage: deploy_env.sh prod [--rollback-on-failure] [<sha>]}"
ROLLBACK=""
PINNED_REF="origin/main"
for arg in "${@:2}"; do
  case "$arg" in
    --rollback-on-failure) ROLLBACK="--rollback-on-failure" ;;
    "" ) ;;
    * ) PINNED_REF="$arg" ;;     # a commit SHA from CI: deploy exactly what was verified
  esac
done

case "$ENV" in
  prod) REPO=/root/prod/app;                    EXPORTS=/root/prod/env.export.sh
        UNITS="aether-prod-api aether-prod-web aether-prod-worker"; API=8000; WEB=3200 ;;
  *) echo "unknown environment '$ENV' (only 'prod' exists since 2026-09-03)" >&2; exit 2 ;;
esac

if [ ! -e "$REPO/.git" ]; then
  echo "[$ENV] checkout missing: $REPO" >&2
  exit 1
fi

# The self-hosted runner is not the directory owner. Git 2.35+ refuses
# "dubious ownership" (exit 128) unless safe.directory is set. Do not write
# git config — export it for this process AND children (pnpm/turbo spawn
# their own git).
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=safe.directory
export GIT_CONFIG_VALUE_0="$REPO"
git() { command git -c "safe.directory=$REPO" "$@"; }

GUARD=/root/dev/aether-job-career-agent/scripts/integrity/runtime_env_guard.sh

# The environment guardian sweeps this same checkout on a 15-minute timer: it
# deletes build artefacts and stashes dirty worktrees. Without a shared lock it
# can do that in the middle of a `git reset --hard` / `pnpm build`, which is how
# a deploy ends up shipping a half-deleted .next. Both sides take this lock.
# The deploy WAITS for it (a deploy must never be silently skipped); the
# guardian does not (its next cycle is 15 minutes away and costs nothing).
LOCKDIR=/var/lib/aether-orchestrator/locks
mkdir -p "$LOCKDIR"
exec 9>"$LOCKDIR/$ENV.lock"
if ! flock -w 900 9; then
  echo "[$ENV] environment lock still held after 900s - refusing to deploy" >&2
  exit 1
fi

cd "$REPO"

# Self-hosted runner checkout ownership differs from the unit runtime user;
# mark this environment's tree safe for this process only (no global git config).
git config --local --add safe.directory "$REPO" >/dev/null 2>&1 || true

PREV=$(git rev-parse HEAD)
echo "[$ENV] current commit: $PREV ; deploying ref: $PINNED_REF"

smoke() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "http://127.0.0.1:$API/health") || code=000
  [ "$code" = "200" ] || { echo "[$ENV] API health = $code"; return 1; }
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "http://127.0.0.1:$WEB/") || code=000
  [ "$code" = "200" ] || { echo "[$ENV] web = $code"; return 1; }
  return 0
}

build_and_restart() {
  git fetch --all --prune -q
  git reset --hard -q "${1:-origin/main}"
  # Untracked source files survive reset --hard and are typechecked by
  # `next build`. Ignored paths (.env, .venv, node_modules, .next) stay.
  git clean -fd -e .env
  echo "[$ENV] deploying $(git rev-parse --short HEAD): $(git log -1 --format=%s | cut -c1-60)"
  # .env is environment-local and untracked; it must survive every deploy.
  test -f .env || { echo "[$ENV] .env missing — refusing to deploy"; exit 1; }
  "$GUARD" "$REPO/.env"
  corepack prepare pnpm@11.9.0 --activate >/dev/null 2>&1
  pnpm install --frozen-lockfile
  ( set +u; . "$EXPORTS"; set -u; pnpm build )
  # shellcheck disable=SC2086
  systemctl restart $UNITS
  sleep 8
}

wait_for_smoke() {
  # Sentence-transformer weights load after uvicorn binds. Prod 2026-08-18T20:25Z
  # returned health=000 at 18s, then rollback hit the same race. Wait until
  # both API and web answer 200, bounded.
  local waited=0
  local delay=5
  local budget=90
  while [ "$waited" -lt "$budget" ]; do
    if smoke; then
      echo "[$ENV] smoke test PASSED after ${waited}s"
      return 0
    fi
    sleep "$delay"
    waited=$((waited + delay))
  done
  echo "[$ENV] smoke test FAILED after ${waited}s"
  return 1
}

build_and_restart "$PINNED_REF"

if wait_for_smoke; then
  echo "[$ENV] smoke test PASSED"
  exit 0
fi

echo "[$ENV] smoke test FAILED"
if [ "$ROLLBACK" = "--rollback-on-failure" ]; then
  echo "[$ENV] rolling back to $PREV"
  build_and_restart "$PREV"
  if wait_for_smoke; then
    echo "[$ENV] ROLLED BACK successfully to $PREV — production is serving the previous good commit"
    # The deploy failed; the pipeline must say so even though the rollback worked.
    exit 1
  fi
  echo "[$ENV] ROLLBACK ALSO FAILED — escalating"
  exit 1
fi
exit 1
EOF
bash -n /tmp/p0-deploy_env.sh && scp /tmp/p0-deploy_env.sh hos-vps:/root/ci/aether-clone/ops/guardian/deploy_env.sh && ssh hos-vps 'chmod 755 /root/ci/aether-clone/ops/guardian/deploy_env.sh && bash -n /root/ci/aether-clone/ops/guardian/deploy_env.sh && echo DEPLOY_ENV_OK'
```
Expected: `DEPLOY_ENV_OK`.

- [ ] **Step 5: Trim `guardian.py`, `manifest.py`, `logstream.py` (exact string replacements, assert each matches once)**

```bash
cat > /tmp/p0-edit-ops.py <<'EOF'
import pathlib
root = pathlib.Path('/root/ci/aether-clone/ops/guardian')

def edit(name, pairs):
    p = root / name; s = p.read_text()
    for old, new in pairs:
        assert s.count(old) == 1, f"{name}: anchor not found exactly once: {old[:60]!r}"
        s = s.replace(old, new, 1)
    p.write_text(s); print(name, "ok")

edit('guardian.py', [(
'''    "test": dict(root="/root/test", repo="/root/test/app", units=["aether-test-api","aether-test-web"],
                 url="https://aether-test.srv1356245.hstgr.cloud", api="http://127.0.0.1:8300",
                 pg="aether-test-postgres", redis="aether-test-redis", protected=False),
    "dev":  dict(root="/root/dev", repo="/root/dev/aether-job-career-agent", units=["aether-dev-api","aether-dev-web"],
                 url="https://aether-dev.srv1356245.hstgr.cloud", api="http://127.0.0.1:8100",
                 pg="aether-staging-postgres", redis="aether-staging-redis", protected=False),
''',
'''    # The persistent "test" and "dev" (staging) environments were retired on
    # 2026-09-03. Pre-production verification is the CI suite against the
    # isolated aether-ci-postgres database.
''')])

edit('manifest.py', [(
'''    dict(name="test", purpose="Test/QA — schema mirrors prod, data does NOT. Safe for destructive tests.",
         repo="/root/test/app", url="https://aether-test.srv1356245.hstgr.cloud",
         api_port=8300, web_port=3300, pg=5435, redis=6382,
         units=["aether-test-api","aether-test-web"], auth="basic"),
    dict(name="dev", purpose="Development/staging — day-to-day SDLC work and feature verification.",
         repo="/root/dev/aether-job-career-agent", url="https://aether-dev.srv1356245.hstgr.cloud",
         api_port=8100, web_port=3100, pg=5433, redis=6380,
         units=["aether-dev-api","aether-dev-web"], auth="basic"),
''', ''),
('invoke="python3 /opt/aether-guardian/guardian.py <prod|test|dev|ci> [--apply]",',
 'invoke="python3 /opt/aether-guardian/guardian.py <prod|ci> [--apply]",'),
('''            streams=sorted(["prod-api","prod-web","prod-worker","dev-api","dev-web","test-api","test-web",
                            "guardian-prod","guardian-dev","guardian-test","guardian-ci",
                            "journal-prod","journal-dev","journal-test","journal-ci"]),''',
 '''            streams=sorted(["prod-api","prod-web","prod-worker",
                            "guardian-prod","guardian-ci",
                            "journal-prod","journal-ci"]),'''),
('flow="push to main -> verify -> deploy dev -> deploy test -> deploy production (auto)",',
 'flow="push to main -> verify (integrity, lint, types, tests, build) -> deploy production (auto); the full API suite runs in CI against the isolated aether-ci-postgres",'),
])

edit('logstream.py', [(
'''    "dev-api":     "/var/log/aether-dev/api.log",
    "dev-web":     "/var/log/aether-dev/web.log",
    "test-api":    "/var/log/aether-test/api.log",
    "test-web":    "/var/log/aether-test/web.log",
''', ''),
('''    "guardian-dev":  "/var/log/aether-guardian/dev.log",
    "guardian-test": "/var/log/aether-guardian/test.log",
''', ''),
('''    "journal-dev":  ["aether-dev-api", "aether-dev-web"],
    "journal-test": ["aether-test-api", "aether-test-web"],
''', ''),
])
EOF
scp /tmp/p0-edit-ops.py hos-vps:/tmp/ && ssh hos-vps 'python3 /tmp/p0-edit-ops.py && cd /root/ci/aether-clone && python3 -m py_compile ops/guardian/guardian.py ops/guardian/manifest.py ops/guardian/logstream.py && echo PYCOMPILE_OK && grep -nE "aether-(dev|test)|/root/test|aether-staging|hstgr.cloud\"" ops/guardian/guardian.py ops/guardian/manifest.py ops/guardian/logstream.py ops/guardian/deploy_env.sh | grep -v "aether.srv1356245" ; echo "(grep above must show no dev/test env references)"'
```
Expected: `guardian.py ok`, `manifest.py ok`, `logstream.py ok`, `PYCOMPILE_OK`, and the grep prints nothing except the `(grep above…)` line.

- [ ] **Step 6: Run the repo's guardian tests in the clone**

```bash
ssh hos-vps 'cd /root/ci/aether-clone && python3 ops/guardian/test_guardian_git.py 2>&1 | tail -3 && python3 ops/guardian/test_guardian_lock.py 2>&1 | tail -3'
```
Expected: both end with an OK/passed line (the same tests the `verify` job runs). If a test references the removed envs and fails, fix the test in the same branch (the failure text tells you the assertion) — do not skip it.

- [ ] **Step 7: Commit, push, open the PR**

```bash
ssh hos-vps 'cd /root/ci/aether-clone && git add -A && git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "ops: retire persistent dev/test environments; delivery is verify -> prod; CI uses aether-ci-postgres

- vps-delivery.yml: drop deploy-dev/deploy-test, deploy-prod needs verify
- ci.yml: api-tests documents the dedicated runner + CI database
- ops/guardian: prod+ci only; deploy_env.sh gains the VPS hot-fixes that were
  never committed (dedicated checkout, safe.directory, git clean -fd -e .env)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git push -q -u origin chore/remove-preprod-envs && gh pr create --fill --base main --head chore/remove-preprod-envs --title "ops: retire dev/test environments, verify -> prod delivery, isolated CI database" --body "Retires the persistent Aether test and staging environments on the VPS (backups in /root/backups/aether-envs-2026-09-03). Delivery becomes verify -> deploy-prod (smoke test + auto-rollback unchanged). The api-tests CI job runs on the re-registered aether-ci-2 runner against aether-ci-postgres, whose aether_test template mirrors the prod schema structure. Merging deploys current main to production once." && gh pr view --json number,url --jq ".url"'
```
Expected: a PR URL. The `CI` workflow starts on the PR (web/api jobs on GitHub-hosted runners; `api-tests` on `aether-ci-2`).

- [ ] **Step 8: Wait for the PR checks, then merge**

```bash
ssh hos-vps 'cd /root/ci/aether-clone && gh pr checks --watch --interval 30 2>&1 | tail -8'
```
Expected: `web`, `api` and `API — full pytest suite` all pass. If `api-tests` fails on *test assertions* (not on provisioning/DB/runner), record the failing test names — the infrastructure goal is met when the job log shows `[test-schema.sh] aether_test_ci` provisioned and pytest ran; report the assertion failures to the owner and continue.

```bash
ssh hos-vps 'cd /root/ci/aether-clone && gh pr merge --squash --delete-branch --admin && git checkout -q main && git pull -q && git log --oneline -1'
```
Expected: merged; `main` now at the squash commit. This push to `main` triggers `VPS Delivery` (verify → deploy-prod).

- [ ] **Step 9: Watch the production delivery**

```bash
ssh hos-vps 'sleep 20; ID=$(gh run list -R Victordtesla24/aether-job-career-agent --workflow "VPS Delivery" -L 1 --json databaseId --jq ".[0].databaseId"); gh run watch -R Victordtesla24/aether-job-career-agent "$ID" --exit-status --interval 30 >/dev/null 2>&1; gh run view -R Victordtesla24/aether-job-career-agent "$ID" --json conclusion,jobs --jq "{conclusion, jobs: [.jobs[] | {name, conclusion}]}"'
```
Expected: `conclusion: success`, jobs exactly `Verify …` and `Deploy production (auto, with rollback)`, both `success`. If the deploy job fails, its own rollback restores the previous commit; read `gh run view --log-failed` and report — do not re-run blindly.

---

### Task 6: Install the merged tooling into `/opt` and remove the environments

**Files:**
- Modify: `/opt/aether-guardian/{guardian.py,deploy_env.sh,manifest.py}`, `/opt/aether-logstream/logstream.py` (via `install.sh`)
- Remove: units, containers, volumes, routes, directories listed in the file structure

- [ ] **Step 1: Install from merged `main` and restart the log stream**

```bash
ssh hos-vps 'cd /root/ci/aether-clone && git status --porcelain | wc -l && bash ops/guardian/install.sh && systemctl restart aether-logstream && sleep 2 && systemctl is-active aether-logstream && for f in guardian.py deploy_env.sh manifest.py; do cmp ops/guardian/$f /opt/aether-guardian/$f && echo "$f in sync"; done && cmp ops/guardian/logstream.py /opt/aether-logstream/logstream.py && echo "logstream.py in sync" && curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:9400/logs/prod-api?tail=3"'
```
Expected: `0` (clean tree), `active`, four `in sync` lines, `200`.

- [ ] **Step 2: Remove the environments**

```bash
cat > /tmp/p0-remove.sh <<'EOF'
set -euo pipefail
B=/root/backups/aether-envs-2026-09-03
test -f "$B/aether_test.dump" && test -f "$B/aether_staging.dump" || { echo "backups missing — refusing"; exit 1; }
systemctl disable --now aether-dev-api aether-dev-web aether-test-api aether-test-web
rm -f /etc/systemd/system/aether-dev-api.service /etc/systemd/system/aether-dev-web.service \
      /etc/systemd/system/aether-test-api.service /etc/systemd/system/aether-test-web.service
systemctl daemon-reload; systemctl reset-failed
( cd /root/test && docker compose down -v --remove-orphans )
( cd /root/dev/.agent/staging && docker compose down -v --remove-orphans )
rm -f /docker/traefik-vplw/dynamic/aether-dev.yml /docker/traefik-vplw/dynamic/aether-test.yml
rm -rf /root/test /root/dev/aether-staging /root/dev/.agent/staging
mkdir -p /var/log/aether-archive
mv /var/log/aether-dev /var/log/aether-archive/aether-dev-2026-09-03 2>/dev/null || true
mv /var/log/aether-test /var/log/aether-archive/aether-test-2026-09-03 2>/dev/null || true
rm -f /var/lib/aether-orchestrator/locks/dev.lock /var/lib/aether-orchestrator/locks/test.lock
echo "REMOVED"
EOF
scp /tmp/p0-remove.sh hos-vps:/tmp/p0-remove.sh && ssh hos-vps 'bash /tmp/p0-remove.sh'
```
Expected: `REMOVED`, with compose reporting the two containers and two volumes removed per project.

- [ ] **Step 3: Verify the host state**

```bash
ssh hos-vps 'echo "-- units:"; systemctl list-units --all --no-legend "aether-*" | awk "{print \$1, \$3}"; echo "-- timers:"; systemctl list-timers --all --no-legend "aether-*" | awk "{print \$NF}"; echo "-- containers:"; docker ps -a --format "{{.Names}}" | grep aether; echo "-- volumes:"; docker volume ls --format "{{.Name}}" | grep -E "aether-(test|staging)" || echo "(none)"; echo "-- routes:"; ls /docker/traefik-vplw/dynamic | grep aether; echo "-- dirs:"; ls -d /root/test /root/dev/aether-staging /root/dev/.agent/staging 2>&1; ls /root/dev/.agent; echo "-- prod:"; curl -s -o /dev/null -w "%{http_code}\n" https://aether.srv1356245.hstgr.cloud/; curl -s http://127.0.0.1:8000/health; echo; echo "-- removed hosts via traefik:"; for h in aether-dev aether-test; do curl -s -o /dev/null -w "$h %{http_code}\n" -m 10 https://$h.srv1356245.hstgr.cloud/; done; echo "-- guardian prod sweep:"; systemctl start aether-guardian@prod.service; sleep 15; journalctl -u aether-guardian@prod --since "1 min ago" --no-pager | grep -ciE "traceback|error"; echo "-- memory:"; free -m | awk "NR==2{print \"available=\"\$7\"MB\"}"; systemctl --failed --no-pager | tail -1'
```
Expected: units = `aether-logstream`, `aether-prod-api/web/worker`, guardian `@prod`/`@ci` only; timers = `aether-guardian@ci.timer`, `aether-guardian@prod.timer`; containers = `aether-ci-postgres`, `aether-prod-postgres`, `aether-prod-redis`; volumes `(none)`; routes `aether-logs.yml`, `aether-prod.yml`; the three dirs "No such file"; `/root/dev/.agent` still lists `bin prod-migration rescued-from-abacus servers staging-credentials.txt staging-htpasswd verify`; prod `200` and `{"status":"ok"…}`; removed hosts `404`; guardian error count `0`; available memory ≥ 1.5 GB higher than before Task 6; `0 loaded units listed`.

---

### Task 7: Confirm CI is green end-to-end

- [ ] **Step 1: Latest `CI` run on `main`**

```bash
ssh hos-vps 'ID=$(gh run list -R Victordtesla24/aether-job-career-agent --workflow CI --branch main -L 1 --json databaseId --jq ".[0].databaseId"); gh run watch -R Victordtesla24/aether-job-career-agent "$ID" --exit-status --interval 30 >/dev/null 2>&1; gh run view -R Victordtesla24/aether-job-career-agent "$ID" --json conclusion,jobs --jq "{conclusion, jobs: [.jobs[] | {name, conclusion, runner: .runnerName}]}"'
```
Expected: `conclusion: success`; `API — full pytest suite` ran on `aether-ci-2` (or `hostinger-vps-srv1356245` under the fallback) and succeeded. If the suite itself fails on assertions, capture `gh run view "$ID" --log-failed | grep -E "FAILED|Error" | head -20` and report; confirm the log contains `[test-schema.sh]` provisioning of `aether_test_ci`.

- [ ] **Step 2: Record the outcome**

Append to `/root/backups/aether-envs-2026-09-03/README.txt`: what was removed, where the dumps are, the PR URL, the `VPS Delivery` and `CI` run URLs, and how to restore (`docker compose up -d` from the tarball's compose file, `pg_restore -U aether -d aether_test /root/backups/aether-envs-2026-09-03/aether_test.dump`).

---

## Rollback

- Environments: recreate from `/root/backups/aether-envs-2026-09-03/` (`root_test.tgz`, `root_dev_aether-staging.tgz`, `root_dev_.agent_staging.tgz`, the four `.service` files, two Traefik `.yml`), `docker compose up -d` in each compose dir, `pg_restore` the `.dump` files, `systemctl enable --now` the units and timers.
- Pipeline: `gh pr revert` (or `git revert` of the squash commit) restores the three-stage flow; `bash ops/guardian/install.sh` from that state restores `/opt`.
- CI database/runner: `cd /root/ci && docker compose down -v`; `./svc.sh uninstall` in the runner-2 directory and `gh api -X DELETE repos/…/actions/runners/<id>`.
- Secret: `gh secret set DATABASE_URL_TEST` with the previous value (the owner holds it; it is not recorded anywhere on the VPS).
