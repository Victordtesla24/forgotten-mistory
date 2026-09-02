# P4 — Multi-project generalization of the platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Implementer subagents run on **Opus** (never Fable); verifiers may use Fable.

**Goal:** Make the `/docker/agent-ops` platform explicitly project-agnostic: a shared CI Postgres inside the platform with one database per project, every active GitHub repo mirrored into Harness with a standard pipeline template proven on a non-Aether project, a project registry that drives docs/health/dumps, and a runbook with an onboarding checklist.

**Architecture:** see `docs/superpowers/specs/2026-09-03-vps-operations-architecture-v2.md` (two tiers: platform services vs production tenants; resource budget) and the addendum `2026-09-03-vps-platform-multi-project-architecture.md`. Nothing about existing project runtimes moves. Aether's GitHub Actions delivery is kept; it simply consumes the same `aether_ci` database from the relocated CI Postgres.

**Tech Stack:** Docker Compose v5, Postgres 18, Harness Open Source 3.3.0 API (`/api/v1/spaces`, `/api/v1/repos` import, pipelines/executions), `gh` CLI, YAML registry, bash.

**Preconditions:** P2 and P3 done; no CI run in progress on the Aether repo (`gh run list --status in_progress` empty) before Task 1.

---

### Task 1: Move the CI datastore into the platform (same data, same port)

**Files:** Modify `/docker/agent-ops/docker-compose.yml` (append `ci-postgres`), retire `/root/ci/docker-compose.yml` (keep as `.retired`), `/docker/agent-ops/.env` (+`CI_PG_PASSWORD` copied from `/root/ci/.env`).

- [ ] Step 1: Confirm idle: `gh run list -R Victordtesla24/aether-job-career-agent --status in_progress -L 1` → empty; `docker exec aether-ci-postgres psql -U aether -d aether_ci -tAc "select count(*) from pg_stat_activity where datname='aether_ci'"` → 0 or 1.
- [ ] Step 2: Append `CI_PG_PASSWORD=<value from /root/ci/.env>` to `/docker/agent-ops/.env` (umask 077, only if absent). Append the service:
```yaml
  ci-postgres:
    image: postgres:18-alpine
    container_name: agentops-ci-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: aether
      POSTGRES_PASSWORD: ${CI_PG_PASSWORD}
      POSTGRES_DB: aether_ci
    ports: ["127.0.0.1:5436:5432"]
    volumes:
      - aether-ci_aether-ci-pgdata:/var/lib/postgresql
    mem_limit: 512m
    cpus: 1
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aether -d aether_ci"]
      interval: 10s
      timeout: 5s
      retries: 12
volumes:
  aether-ci_aether-ci-pgdata:
    external: true
```
(The `volumes:` block goes at the end of the file; if a top-level `volumes:` already exists, merge into it.)
- [ ] Step 3: `cd /root/ci && docker compose down` (stops and removes the old container; the named volume is kept), `mv /root/ci/docker-compose.yml /root/ci/docker-compose.yml.retired-2026-09-03`, then `cd /docker/agent-ops && docker compose up -d ci-postgres`; wait healthy.
- [ ] Step 4: Verify: `ss -tlnp | grep ':5436 '` → 127.0.0.1 only; `docker exec agentops-ci-postgres psql -U aether -d aether_ci -tAc "select count(*) from information_schema.tables where table_schema='aether_test'"` → 48; the repo's provisioning script still works (`git -C /root/ci/aether-clone show HEAD:scripts/test-schema.sh > /tmp/ts.sh; DATABASE_URL_TEST="postgresql://aether:$PW@127.0.0.1:5436/aether_ci?schema=aether_test_p4chk&connect_timeout=15" bash /tmp/ts.sh provision p4chk && bash /tmp/ts.sh drop p4chk; rm /tmp/ts.sh`); `/root/ci/seed-ci-template.sh` updated to target `agentops-ci-postgres`; `gh workflow run CI` NOT triggered here (Task 4 verifies via a real run).
- [ ] Step 5: Per-project CI databases: for each tenant in Task 2 that has a test suite (initially none besides Aether), `CREATE DATABASE <project>_ci OWNER aether` on demand — documented in the runbook; not created speculatively.

### Task 2: Project registry

**Files:** Create `/docker/agent-ops/projects.yml`, `/docker/agent-ops/bin/registry-check.sh`.

- [ ] Step 1: Write `projects.yml` with one entry per tenant (fields: `name`, `github`, `harness_space`, `runtime` (paths/units/containers), `public_hosts`, `ci_db`, `coder_template`, `n8n_workflows`, `backup_paths`, `notes`) for: aether (github Victordtesla24/aether-job-career-agent; runtime /root/prod/app + aether-prod-* + aether-prod-postgres/redis; hosts aether., aether-logs.; ci_db aether_ci; notes: GitHub Actions delivery kept), forgotten-mistory (github Victordtesla24/forgotten-mistory; runtime /root/forgotten-mistory (+ Firebase hosting)), abentertainment (/opt/abentertainment container :3000 + /opt/ab-chatbot :3001; hosts api.abentertainment.com.au), ticketalay (/opt/global-ticketing-initiative; ticketalay.), portfolio (/root/portfolio-project; portfolio.), horizon (/var/www via nginx 8095; horizon., melbournetohorizon.com.au [DNS missing]), recon (/opt/recon-backend; recon.), hos-pipeline (/root/cobol-testing-ato-work; hos., 8080), ghostery-filter-generator (/opt/ghostery-gen + data; n8n workflow; ghostery.), platform (agent-ops itself).
- [ ] Step 2: `registry-check.sh`: parses the YAML (python3 + PyYAML) and verifies each listed unit/container is active, each public host answers with a valid certificate (from the VPS), and each backup path is present in `backup.sh` SOURCES or excluded on purpose; prints a table and exits non-zero on any red row. Wire it into `agent-ops-health.sh` as an extra section (informational only) and into the README.

### Task 3: Mirror repos into Harness with the standard pipeline template

**Files:** Create `/docker/agent-ops/config/harness/pipeline-template.yaml`, `/docker/agent-ops/bin/harness-onboard.sh <project> <github-url>`.

- [ ] Step 1: `harness-onboard.sh`: with `HARNESS_TOKEN` (from `.env`) create space `<project>` (idempotent), import the GitHub repo (`POST /api/v1/repos/import` or the 3.3.0 equivalent — read `/swagger`) using the `gh auth token` as the provider token, then add `.harness/pipeline.yaml` from the template (lint → test → build steps parameterised by a few `template` variables: language, install command, test command, build command, `ci_db`), create pipeline `ci`, and print the repo URL.
- [ ] Step 2: Template content: stages `ci` with steps `deps`, `lint`, `test`, `build` in a container (node:22 or python:3.12 per language), env `DATABASE_URL_TEST` injected from a Harness secret named `<project>_ci_dsn` when `ci_db` is set (create the secret via API from the CI Postgres password; never print).
- [ ] Step 3: Prove on **portfolio** (Next.js) and **forgotten-mistory** (static/vite — whichever has a test/build script): run the pipeline; acceptance = execution `success` with real lint/build output in the step logs. Record execution URLs.
- [ ] Step 4: Onboard the remaining tenants' repos (import only, pipeline present but not required to pass yet); list them in `projects.yml` under `harness_space`.

### Task 4: Aether on the shared CI Postgres — real proof

- [ ] Step 1: Trigger `gh workflow run CI -R Victordtesla24/aether-job-career-agent --ref main`; wait; the `api-tests` job must provision `aether_test_ci` against `agentops-ci-postgres` (job log shows `[test-schema.sh] provisioned`), run the three slices and drop the schema. Application-level test failures (the 20 live-submitter assertions) are reported, not fixed here.


### Task 4 (new): Production-tenant caps and relocation to /docker/<project>

**Files:** `/docker/abentertainment/docker-compose.yml`, `/docker/portfolio/docker-compose.yml`, `/docker/aether-prod/docker-compose.yml` (moved from `/opt/abentertainment`, `/root/portfolio-project`, `/root/prod`), each with `mem_limit`/`cpus` and unchanged container names, ports and volumes; symlinks left at the old paths.

- [ ] Step 1: For each tenant, back up the compose dir (tar to `/root/backups/vps-fix-2026-09-02/p4/`), `docker compose down` (containers only; named volumes stay), move the directory (`.env` included) to `/docker/<project>/`, add caps (abentertainment 512m/1, portfolio 512m/1, aether-prod-postgres 512m/1, aether-prod-redis 128m/0.5), `docker compose up -d` from the new location, verify the same container names/ports/volumes (`docker inspect` Mounts + Ports) and the public route (200), `ln -s /docker/<project> <old path>` for scripts that still reference the old path (deploy_env.sh for Aether uses `/root/prod/app` — the app checkout stays where it is; only the datastore compose moves).
- [ ] Step 2: Nextcloud caps: add `mem_limit` to the four services in `/docker/nextcloud-kdka/docker-compose.yml` (Hostinger-managed file — back it up; total ≤ 1 GB) and `docker compose up -d`; verify status.php still 200.
- [ ] Step 3: `docker compose ls` shows every tenant under `/docker/<project>` except unit-based ones; `docker stats` shows caps everywhere.

### Task 5 (new): Deploy hook

**Files:** `/docker/agent-ops/bin/deploy-hook.sh`, per-tenant `deploy.sh` registered in `projects.yml`.

- [ ] Step 1: `deploy-hook.sh <project> <ref>` reads the registry, runs the tenant's `deploy.sh <ref>` (compose: `git pull`/`docker compose pull` + `up -d` + smoke; Aether: `/opt/aether-guardian/deploy_env.sh prod --rollback-on-failure <ref>`), logs to `/var/log/agent-ops/deploy-<project>.log`, exits non-zero on failed smoke.
- [ ] Step 2: Harness pipeline template gains an optional `deploy` stage that runs the hook over SSH (Harness secret with a deploy-only key restricted by `command=` in `authorized_keys`).

### Task 6 (renumbered): Runbook + onboarding checklist (was Task 5)
### Task 7 (renumbered): Final adversarial sweep (was Task 6) — also verifies the resource budget from the v2 spec (`docker stats` sums per tier) and that every tenant has caps.

### Task 6 (details): Runbook + onboarding checklist

**Files:** Modify `/docker/agent-ops/README.md`; create `/docker/agent-ops/ONBOARDING.md`.

- [ ] Step 1: README becomes the platform runbook: services table (all platform services incl. ci-postgres, n8n, static), tenancy conventions, registry usage, health/dumps/backups, per-project sections generated from `projects.yml`.
- [ ] Step 2: ONBOARDING.md checklist: add to `projects.yml` → `harness-onboard.sh` → (optional) `CREATE DATABASE <project>_ci` → Coder template choice → n8n workflow tag → Traefik route file → `registry-check.sh` green → backup path covered.

### Task 7 (details): Final adversarial sweep (Fable verifier)

- [ ] Read-only sweep of the whole platform against the addendum: every tenant in the registry green, no Aether-only assumptions left in platform scripts (`grep -ri aether /docker/agent-ops/bin /docker/agent-ops/README.md` limited to the Aether tenant section), all public hosts valid TLS, raw ports closed from the neutral host, dumps/backups include the platform, `systemctl --failed` empty.

## Rollback
Task 1: `cd /docker/agent-ops && docker compose rm -sf ci-postgres`, restore `/root/ci/docker-compose.yml` from `.retired-…` and `docker compose up -d` there (same volume, same port). Tasks 2–5 are additive files. Task 3 creates spaces/repos in Harness that can be deleted from its UI.
