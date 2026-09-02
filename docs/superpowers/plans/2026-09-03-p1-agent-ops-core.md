# P1 — Agent-ops platform core (Postgres, Harness, Coder, Traefik) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `/docker/agent-ops` compose project with a shared Postgres 18, Harness Open Source (Git + CI) and Coder (Docker workspaces), published over HTTPS through the existing Traefik, with admin accounts, automation tokens, memory/CPU caps and a runbook.

**Architecture:** One compose project, every container port bound to `127.0.0.1`; Traefik (host network, file provider, Let's Encrypt) routes `harness.` and `coder.` on `srv1356245.hstgr.cloud` to those loopback ports. Harness keeps its embedded SQLite in a bind-mounted `/data`; Coder uses a database on the shared `agentops-postgres`. Both mount the Docker socket (pipelines / workspaces run as sibling containers) and therefore rely on their own logins.

**Tech Stack:** Docker 29.7 / Compose v5.5, `postgres:18-alpine`, `harness/harness:3.3.0`, `ghcr.io/coder/coder:v2.36.4`, Traefik v3 file provider, bash, `curl`, `jq`.

**Verified facts (2026-09-03):** docker group gid `989`; host ports 3010, 3020, 3022, 5440 free; host port 3000 is taken by `abentertainment-app-1` (never publish 3000); Traefik dynamic dir `/docker/traefik-vplw/dynamic` (mounted read-only inside Traefik at `/etc/traefik/dynamic`, `watch=true`); wildcard DNS `*.srv1356245.hstgr.cloud` → this VPS; `/root/.config/agents/providers.env` holds provider keys (read on the VPS only). Harness: admin bootstrap via `GITNESS_PRINCIPAL_ADMIN_EMAIL/PASSWORD`, health `GET /api/v1/system/health`, needs `/var/run/docker.sock`, Gitspaces off by default, PAT via `POST /api/v1/login` then `POST /api/v1/user/tokens`. Coder: health `GET /healthz`, first user via `coder login --first-user-*`, Docker template via `coder templates init --id docker` + `coder templates push`, token via `coder tokens create`, official compose mounts docker.sock with `group_add`.

Conventions: remote scripts go to `/tmp/p1-<name>.sh` locally, `scp` to `hos-vps:/tmp/`, run with `ssh -o BatchMode=yes -o ConnectTimeout=20 hos-vps 'bash /tmp/p1-<name>.sh'`. Never print secret values. Never publish a port on `0.0.0.0`.

---

## File structure

```
/docker/agent-ops/
  docker-compose.yml          # Task 1 (postgres), Task 2 (+harness), Task 3 (+coder)
  .env                        # 600: generated passwords/tokens
  CREDENTIALS.txt             # 600: human-readable logins
  README.md                   # runbook (Task 5)
  config/postgres/init/01-databases.sh   # creates role+db for coder
  data/postgres, data/harness, data/coder-home   # bind-mounted state
  dumps/                      # P3
/docker/traefik-vplw/dynamic/agent-ops.yml     # Task 4
/docker/traefik-vplw/dynamic/agentops.htpasswd # P2 (Steel), created empty-safe in Task 4
```

---

### Task 1: Compose skeleton + shared Postgres

**Files:**
- Create: `/docker/agent-ops/docker-compose.yml`, `/docker/agent-ops/.env`, `/docker/agent-ops/config/postgres/init/01-databases.sh`

- [ ] **Step 1: Create the project, secrets and the Postgres service**

```bash
cat > /tmp/p1-postgres.sh <<'EOF'
set -euo pipefail
mkdir -p /docker/agent-ops/{config/postgres/init,data/postgres,data/harness,data/coder-home,dumps,state,bin}
cd /docker/agent-ops
umask 077
if [ ! -f .env ]; then
  cat > .env <<ENV
# agent-ops secrets — generated 2026-09-03, mode 600. Never commit.
AGENTOPS_PG_PASSWORD=$(openssl rand -hex 20)
CODER_DB_PASSWORD=$(openssl rand -hex 20)
HARNESS_ADMIN_EMAIL=sarkar.vikram@gmail.com
HARNESS_ADMIN_PASSWORD=$(openssl rand -base64 30 | tr -dc A-Za-z0-9 | cut -c1-24)
CODER_ADMIN_EMAIL=sarkar.vikram@gmail.com
CODER_ADMIN_PASSWORD=$(openssl rand -base64 30 | tr -dc A-Za-z0-9 | cut -c1-24)
DOCKER_GID=$(getent group docker | cut -d: -f3)
ENV
fi
umask 022
cat > config/postgres/init/01-databases.sh <<'INIT'
#!/bin/bash
# Runs once on first start of the empty data dir. Creates the Coder role + database.
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<SQL
CREATE ROLE coder LOGIN PASSWORD '${CODER_DB_PASSWORD}';
CREATE DATABASE coder OWNER coder;
SQL
INIT
chmod 755 config/postgres/init/01-databases.sh
cat > docker-compose.yml <<'YML'
# agent-ops platform — Hermes-centred tooling. Every port is loopback-only;
# Traefik (host network) publishes the HTTPS hostnames. See README.md.
name: agent-ops
services:
  postgres:
    image: postgres:18-alpine
    container_name: agentops-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: agentops
      POSTGRES_PASSWORD: ${AGENTOPS_PG_PASSWORD}
      POSTGRES_DB: agentops
      CODER_DB_PASSWORD: ${CODER_DB_PASSWORD}
    ports: ["127.0.0.1:5440:5432"]
    volumes:
      - ./data/postgres:/var/lib/postgresql
      - ./config/postgres/init:/docker-entrypoint-initdb.d:ro
    mem_limit: 512m
    cpus: 0.5
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentops -d agentops"]
      interval: 10s
      timeout: 5s
      retries: 12
YML
docker compose up -d postgres
for i in $(seq 1 30); do docker inspect --format '{{.State.Health.Status}}' agentops-postgres 2>/dev/null | grep -q healthy && break; sleep 2; done
docker inspect --format 'health={{.State.Health.Status}}' agentops-postgres
docker exec agentops-postgres psql -U agentops -d postgres -tAc "select datname from pg_database where datname in ('agentops','coder') order by 1" | tr '\n' ' '; echo
docker exec agentops-postgres psql -U agentops -d postgres -tAc "select rolname from pg_roles where rolname='coder'"
ss -tlnp | grep ':5440 ' | grep -c '127.0.0.1'
EOF
scp /tmp/p1-postgres.sh hos-vps:/tmp/p1-postgres.sh && ssh hos-vps 'bash /tmp/p1-postgres.sh'
```
Expected: `health=healthy`, `agentops coder`, `coder`, `1`.

- [ ] **Step 2: Verify the coder role can connect**

```bash
ssh hos-vps 'cd /docker/agent-ops && PW=$(sed -n "s/^CODER_DB_PASSWORD=//p" .env) && docker exec -e PGPASSWORD="$PW" agentops-postgres psql -U coder -d coder -h 127.0.0.1 -tAc "select current_user, current_database()"; unset PW'
```
Expected: `coder|coder`.

---

### Task 2: Harness Open Source

**Files:**
- Modify: `/docker/agent-ops/docker-compose.yml` (append service), `/docker/agent-ops/.env` (append `HARNESS_TOKEN` in Step 3)

- [ ] **Step 1: Append the service and start it**

```bash
cat > /tmp/p1-harness.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
grep -q '^  harness:' docker-compose.yml || cat >> docker-compose.yml <<'YML'
  harness:
    image: harness/harness:3.3.0
    container_name: agentops-harness
    restart: unless-stopped
    environment:
      GITNESS_URL_BASE: https://harness.srv1356245.hstgr.cloud
      GITNESS_URL_CONTAINER: https://harness.srv1356245.hstgr.cloud   # pipeline step containers reach Harness via Traefik
      GITNESS_PRINCIPAL_ADMIN_UID: vic
      GITNESS_PRINCIPAL_ADMIN_EMAIL: ${HARNESS_ADMIN_EMAIL}
      GITNESS_PRINCIPAL_ADMIN_PASSWORD: ${HARNESS_ADMIN_PASSWORD}
      GITNESS_USER_SIGNUP_ENABLED: "false"
      GITNESS_GITSPACE_ENABLE: "false"
      GITNESS_SSH_ENABLE: "false"
      GITNESS_CI_PARALLEL_WORKERS: "2"
    ports: ["127.0.0.1:3010:3000"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data/harness:/data
    mem_limit: 1536m
    cpus: 2
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/v1/system/health >/dev/null 2>&1 || curl -fsS http://127.0.0.1:3000/api/v1/system/health >/dev/null"]
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 5
YML
docker compose up -d harness
for i in $(seq 1 40); do curl -fsS -o /dev/null http://127.0.0.1:3010/api/v1/system/health 2>/dev/null && break; sleep 3; done
echo "health: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/api/v1/system/health)"
docker inspect --format 'mem={{.HostConfig.Memory}} cpus={{.HostConfig.NanoCpus}}' agentops-harness
EOF
scp /tmp/p1-harness.sh hos-vps:/tmp/p1-harness.sh && ssh hos-vps 'bash /tmp/p1-harness.sh'
```
Expected: `health: 200`, `mem=1610612736 cpus=2000000000`. If the container's healthcheck stays `starting`/`unhealthy` because the image lacks both `wget` and `curl`, replace the healthcheck `test` with `["CMD", "/bin/sh", "-c", "exit 0"]` is NOT acceptable — instead use `test: ["CMD-SHELL", "nc -z 127.0.0.1 3000"]` and note it in the report.

- [ ] **Step 2: Prove the admin login works and mint an automation token**

```bash
cat > /tmp/p1-harness-token.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
PW=$(sed -n 's/^HARNESS_ADMIN_PASSWORD=//p' .env)
JWT=$(curl -fsS -X POST http://127.0.0.1:3010/api/v1/login -H 'Content-Type: application/json' \
  -d "{\"login_identifier\":\"vic\",\"password\":\"${PW}\"}" | jq -r .access_token)
[ -n "$JWT" ] && [ "$JWT" != null ] || { echo "LOGIN_FAILED"; exit 1; }
if ! grep -q '^HARNESS_TOKEN=' .env; then
  PAT=$(curl -fsS -X POST http://127.0.0.1:3010/api/v1/user/tokens -H "Authorization: Bearer $JWT" \
    -H 'Content-Type: application/json' -d '{"identifier":"hermes-automation","lifetime":null}' | jq -r .access_token)
  [ -n "$PAT" ] && [ "$PAT" != null ] || { echo "TOKEN_FAILED"; exit 1; }
  umask 077; printf 'HARNESS_TOKEN=%s\n' "$PAT" >> .env; unset PAT
fi
PAT=$(sed -n 's/^HARNESS_TOKEN=//p' .env)
echo "whoami via PAT: $(curl -fsS http://127.0.0.1:3010/api/v1/user -H "Authorization: Bearer $PAT" | jq -r .uid)"
unset PW JWT PAT
EOF
scp /tmp/p1-harness-token.sh hos-vps:/tmp/p1-harness-token.sh && ssh hos-vps 'bash /tmp/p1-harness-token.sh'
```
Expected: `whoami via PAT: vic`.

- [ ] **Step 3: Run a hello-world pipeline end to end (proves docker.sock + container networking)**

```bash
cat > /tmp/p1-harness-pipeline.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
PAT=$(sed -n 's/^HARNESS_TOKEN=//p' .env); H="Authorization: Bearer $PAT"; B=http://127.0.0.1:3010/api/v1
curl -fsS -X POST "$B/spaces" -H "$H" -H 'Content-Type: application/json' -d '{"identifier":"agentops","description":"platform smoke tests","is_public":false}' >/dev/null 2>&1 || true
curl -fsS -X POST "$B/repos?space_path=agentops" -H "$H" -H 'Content-Type: application/json' -d '{"identifier":"smoke","default_branch":"main","description":"hello-world pipeline","is_public":false,"readme":true}' >/dev/null 2>&1 || true
# pipeline file committed through the API (base64 content)
PIPE=$(printf 'pipeline:\n  stages:\n    - type: ci\n      spec:\n        steps:\n          - name: hello\n            type: run\n            spec:\n              container: alpine:3.20\n              script: echo HELLO_FROM_HARNESS && uname -a\n' | base64 -w0)
curl -fsS -X POST "$B/repos/agentops/smoke/+/commits" -H "$H" -H 'Content-Type: application/json' \
  -d "{\"actions\":[{\"action\":\"CREATE\",\"path\":\".harness/hello.yaml\",\"payload\":\"$PIPE\",\"encoding\":\"base64\"}],\"branch\":\"main\",\"message\":\"add hello pipeline\",\"title\":\"add hello pipeline\"}" >/dev/null
curl -fsS -X POST "$B/repos/agentops/smoke/+/pipelines" -H "$H" -H 'Content-Type: application/json' -d '{"identifier":"hello","config_path":".harness/hello.yaml","default_branch":"main","disabled":false}' >/dev/null 2>&1 || true
curl -fsS -X POST "$B/repos/agentops/smoke/+/pipelines/hello/executions?branch=main" -H "$H" >/dev/null
for i in $(seq 1 40); do
  ST=$(curl -fsS "$B/repos/agentops/smoke/+/pipelines/hello/executions/1" -H "$H" | jq -r .status)
  case "$ST" in success|failure|error|killed) break;; esac; sleep 5
done
echo "execution status: $ST"
curl -fsS "$B/repos/agentops/smoke/+/pipelines/hello/executions/1/logs/1/1/1" -H "$H" 2>/dev/null | grep -o HELLO_FROM_HARNESS | head -1 || echo "(log fetch path differs — inspect execution 1 in the UI)"
unset PAT
EOF
scp /tmp/p1-harness-pipeline.sh hos-vps:/tmp/p1-harness-pipeline.sh && ssh hos-vps 'bash /tmp/p1-harness-pipeline.sh'
```
Expected: `execution status: success` and `HELLO_FROM_HARNESS`. If the API paths differ from the 3.3.0 router (`/repos/{space}/{repo}/+/...`), read `docker logs agentops-harness` and the Swagger at `http://127.0.0.1:3010/swagger` to correct the path; the acceptance is the same (a run with status `success` whose log contains `HELLO_FROM_HARNESS`).

---

### Task 3: Coder

**Files:**
- Modify: `/docker/agent-ops/docker-compose.yml` (append), `/docker/agent-ops/.env` (append `CODER_SESSION_TOKEN`)

- [ ] **Step 1: Append the service and start it**

```bash
cat > /tmp/p1-coder.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
grep -q '^  coder:' docker-compose.yml || cat >> docker-compose.yml <<'YML'
  coder:
    image: ghcr.io/coder/coder:v2.36.4
    container_name: agentops-coder
    restart: unless-stopped
    environment:
      CODER_PG_CONNECTION_URL: postgresql://coder:${CODER_DB_PASSWORD}@postgres:5432/coder?sslmode=disable
      CODER_HTTP_ADDRESS: 0.0.0.0:7080
      CODER_ACCESS_URL: https://coder.srv1356245.hstgr.cloud
      CODER_PROXY_TRUSTED_HEADERS: X-Forwarded-For
      CODER_PROXY_TRUSTED_ORIGINS: 127.0.0.1/32
      CODER_TELEMETRY_ENABLE: "false"
    ports: ["127.0.0.1:3020:7080"]
    group_add: ["${DOCKER_GID}"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data/coder-home:/home/coder
    mem_limit: 1536m
    cpus: 2
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://127.0.0.1:7080/healthz >/dev/null"]
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 5
YML
docker compose up -d coder
for i in $(seq 1 40); do curl -fsS -o /dev/null http://127.0.0.1:3020/healthz 2>/dev/null && break; sleep 3; done
echo "healthz: $(curl -s http://127.0.0.1:3020/healthz)"
curl -s http://127.0.0.1:3020/api/v2/buildinfo | jq -r .version
EOF
scp /tmp/p1-coder.sh hos-vps:/tmp/p1-coder.sh && ssh hos-vps 'bash /tmp/p1-coder.sh'
```
Expected: `healthz: OK`, version `v2.36.4`.

- [ ] **Step 2: First admin user, Docker template, automation token**

```bash
cat > /tmp/p1-coder-bootstrap.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
PW=$(sed -n 's/^CODER_ADMIN_PASSWORD=//p' .env); EM=$(sed -n 's/^CODER_ADMIN_EMAIL=//p' .env)
docker exec agentops-coder coder login http://127.0.0.1:7080 --first-user-username vic --first-user-email "$EM" \
  --first-user-password "$PW" --first-user-trial=false --first-user-full-name "Vic" 2>&1 | grep -vi password || true
docker exec agentops-coder coder whoami 2>/dev/null || docker exec agentops-coder coder users list | head -3
# Built-in Docker template (workspaces = sibling containers, 2 GB / 1 vCPU default limits set below)
docker exec agentops-coder sh -c 'cd /home/coder && rm -rf docker && coder templates init --id docker ./docker >/dev/null && ls docker'
docker exec agentops-coder sh -c 'cd /home/coder/docker && sed -i "s/^\(resource \"docker_container\" \"workspace\" {\)/\1\n  memory = 2048\n  cpu_shares = 1024/" main.tf && grep -n "memory = 2048" main.tf'
docker exec agentops-coder sh -c 'cd /home/coder && coder templates push docker -d ./docker --yes 2>&1 | tail -3'
if ! grep -q '^CODER_SESSION_TOKEN=' .env; then
  TOK=$(docker exec agentops-coder coder tokens create --name hermes-automation --lifetime 8760h 2>/dev/null | tail -1)
  [ -n "$TOK" ] || { echo "TOKEN_FAILED"; exit 1; }
  umask 077; printf 'CODER_SESSION_TOKEN=%s\n' "$TOK" >> .env; unset TOK
fi
TOK=$(sed -n 's/^CODER_SESSION_TOKEN=//p' .env)
echo "token check: $(curl -s -H "Coder-Session-Token: $TOK" http://127.0.0.1:3020/api/v2/users/me | jq -r .username)"
unset PW EM TOK
EOF
scp /tmp/p1-coder-bootstrap.sh hos-vps:/tmp/p1-coder-bootstrap.sh && ssh hos-vps 'bash /tmp/p1-coder-bootstrap.sh'
```
Expected: `templates push` reports the template; `token check: vic`.

- [ ] **Step 3: Create, verify and delete a Docker workspace (proves the provisioner)**

```bash
ssh hos-vps 'docker exec agentops-coder sh -c "coder create smoke --template docker --yes 2>&1 | tail -5; coder list; docker ps --format \"{{.Names}}\" | grep -i coder-vic-smoke; coder delete smoke --yes 2>&1 | tail -2; coder list"'
```
Expected: workspace `vic/smoke` reaches `Started`/`running`, a container named like `coder-vic-smoke` exists during the test, and `coder list` is empty afterwards.

---

### Task 4: Traefik routes + basic-auth middleware file

**Files:**
- Create: `/docker/traefik-vplw/dynamic/agent-ops.yml`, `/docker/traefik-vplw/dynamic/agentops.htpasswd`

- [ ] **Step 1: Write the route file (scp it — never heredoc backticks over ssh)**

```bash
cat > /tmp/agent-ops.yml <<'EOF'
# agent-ops platform routes (added 2026-09-03). Backends are loopback ports of
# /docker/agent-ops containers. Coder needs websockets (Traefik passes them).
http:
  middlewares:
    agentops-basicauth:
      basicAuth:
        usersFile: /etc/traefik/dynamic/agentops.htpasswd
        removeHeader: true
  routers:
    agentops-harness:
      rule: "Host(`harness.srv1356245.hstgr.cloud`)"
      entryPoints: [websecure]
      service: agentops-harness
      tls: { certResolver: letsencrypt }
    agentops-coder:
      rule: "Host(`coder.srv1356245.hstgr.cloud`)"
      entryPoints: [websecure]
      service: agentops-coder
      tls: { certResolver: letsencrypt }
  services:
    agentops-harness:
      loadBalancer:
        servers: [{ url: "http://127.0.0.1:3010" }]
    agentops-coder:
      loadBalancer:
        servers: [{ url: "http://127.0.0.1:3020" }]
EOF
cat > /tmp/p1-traefik.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
umask 077
if ! grep -q '^AGENTOPS_BASICAUTH_PASSWORD=' .env; then printf 'AGENTOPS_BASICAUTH_PASSWORD=%s\n' "$(openssl rand -base64 30 | tr -dc A-Za-z0-9 | cut -c1-24)" >> .env; fi
PW=$(sed -n 's/^AGENTOPS_BASICAUTH_PASSWORD=//p' .env)
htpasswd -bB -c /docker/traefik-vplw/dynamic/agentops.htpasswd vic "$PW"; unset PW
chmod 644 /docker/traefik-vplw/dynamic/agentops.htpasswd   # Traefik reads it as non-root inside the container; bcrypt hash only
install -m 644 /tmp/agent-ops.yml /docker/traefik-vplw/dynamic/agent-ops.yml
sleep 5; docker logs --since 1m traefik-vplw-traefik-1 2>&1 | grep -iE "error|agentops" | tail -5 || true
for h in harness coder; do
  for i in $(seq 1 8); do code=$(curl -s -o /dev/null -w '%{http_code} ssl=%{ssl_verify_result}' -m 15 "https://$h.srv1356245.hstgr.cloud/"); case "$code" in *"ssl=0"*) break;; esac; sleep 10; done
  echo "$h -> $code"
done
EOF
scp /tmp/agent-ops.yml hos-vps:/tmp/agent-ops.yml && scp /tmp/p1-traefik.sh hos-vps:/tmp/p1-traefik.sh && ssh hos-vps 'bash /tmp/p1-traefik.sh'
```
Expected: `harness -> 200 ssl=0` (login page; Harness may answer 302/200), `coder -> 200 ssl=0` (Coder login page), no Traefik errors.

- [ ] **Step 2: External verification**

```bash
ssh -o BatchMode=yes -o ConnectTimeout=25 abacus-tunnel 'for h in harness coder; do echo -n "$h: "; curl -s -o /dev/null -w "%{http_code} ssl=%{ssl_verify_result}\n" -m 15 https://$h.srv1356245.hstgr.cloud/; done; curl -s -m 10 https://coder.srv1356245.hstgr.cloud/healthz; echo; for p in 3010 3020 3022 5440; do timeout 4 bash -c "</dev/tcp/187.77.12.13/$p" 2>/dev/null && echo "$p OPEN (BAD)" || echo "$p closed"; done'
```
Expected: both hosts `200 ssl=0` (or 302), `OK` from `/healthz`, and every raw port `closed`.

---

### Task 5: Credentials file and runbook

**Files:**
- Create: `/docker/agent-ops/CREDENTIALS.txt` (600), `/docker/agent-ops/README.md`

- [ ] **Step 1: Write both files from the `.env` values (values are copied on the VPS, never printed)**

```bash
cat > /tmp/p1-docs.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
umask 077
{
  echo "agent-ops platform — admin logins (created 2026-09-03). Keep this file at mode 600."
  echo
  echo "Harness Open Source   https://harness.srv1356245.hstgr.cloud   user: vic   password: $(sed -n 's/^HARNESS_ADMIN_PASSWORD=//p' .env)"
  echo "  automation PAT (identifier hermes-automation): HARNESS_TOKEN in /docker/agent-ops/.env"
  echo "Coder                 https://coder.srv1356245.hstgr.cloud     user: vic   password: $(sed -n 's/^CODER_ADMIN_PASSWORD=//p' .env)"
  echo "  automation token (hermes-automation): CODER_SESSION_TOKEN in /docker/agent-ops/.env"
  echo "Traefik basic-auth (Steel and any weak-auth UI)  user: vic   password: $(sed -n 's/^AGENTOPS_BASICAUTH_PASSWORD=//p' .env)"
  echo "Shared Postgres       127.0.0.1:5440  superuser agentops (AGENTOPS_PG_PASSWORD), db coder / role coder (CODER_DB_PASSWORD)"
} > CREDENTIALS.txt
umask 022
cat > README.md <<'MD'
# agent-ops platform — runbook

Compose project `agent-ops` in `/docker/agent-ops` (all ports loopback; Traefik publishes HTTPS).

| Service | Container | Loopback | Public | Login |
|---|---|---|---|---|
| Postgres 18 | agentops-postgres | 127.0.0.1:5440 | — | see CREDENTIALS.txt |
| Harness OSS 3.3.0 | agentops-harness | 127.0.0.1:3010 | https://harness.srv1356245.hstgr.cloud | vic (native) |
| Coder v2.36.4 | agentops-coder | 127.0.0.1:3020 | https://coder.srv1356245.hstgr.cloud | vic (native) |

State: `data/postgres`, `data/harness` (SQLite + repos), `data/coder-home` (templates). Secrets: `.env` (600). Logins: `CREDENTIALS.txt` (600).

Operate:
- status: `docker compose ps`; logs: `docker compose logs -f <svc>`
- restart one: `docker compose restart <svc>`; upgrade: edit the image tag, `docker compose pull <svc> && docker compose up -d <svc>`
- health: harness `curl 127.0.0.1:3010/api/v1/system/health`, coder `curl 127.0.0.1:3020/healthz`
- routes: `/docker/traefik-vplw/dynamic/agent-ops.yml` (hot-reloaded); basic-auth users `/docker/traefik-vplw/dynamic/agentops.htpasswd`
- Harness pipelines and Coder workspaces run as sibling Docker containers (docker.sock). Gitspaces are disabled; Coder is the workspace layer.
- Coder Docker template: `/docker/agent-ops/data/coder-home/docker` (2 GB / 1 vCPU per workspace). Push changes with `docker exec agentops-coder sh -c 'cd /home/coder && coder templates push docker -d ./docker --yes'`.
- Never publish a port on 0.0.0.0 here: Docker bypasses UFW.

Removal of one service: `docker compose rm -sf <svc>` and delete its router/service block in `agent-ops.yml`.
MD
ls -la CREDENTIALS.txt README.md; stat -c '%a %n' .env CREDENTIALS.txt
EOF
scp /tmp/p1-docs.sh hos-vps:/tmp/p1-docs.sh && ssh hos-vps 'bash /tmp/p1-docs.sh'
```
Expected: both files listed; `.env` and `CREDENTIALS.txt` mode `600`.

- [ ] **Step 2: Resource snapshot for the record**

```bash
ssh hos-vps 'docker stats --no-stream --format "{{.Name}} {{.MemUsage}} {{.CPUPerc}}" | grep agentops; free -m | awk "NR==2{print \"available=\"\$7\"MB\"}"; systemctl --failed --no-pager | tail -1'
```
Expected: three `agentops-*` lines within their caps; available memory ≥ 8 GB; `0 loaded units listed`.

---

## Rollback
`cd /docker/agent-ops && docker compose down` (data dirs stay); `rm /docker/traefik-vplw/dynamic/agent-ops.yml` (routes vanish on reload); to delete state, remove `/docker/agent-ops` entirely. Nothing outside `/docker/agent-ops` and the two Traefik files is touched.
