# VPS Agent-Ops Platform — Design

Date: 2026-09-03. Host: Hostinger VPS `srv1356245` (187.77.12.13), 4 vCPU / 16 GB / 193 GB, Ubuntu 26.04, Docker, Traefik v3 (host network, 80/443, wildcard `*.srv1356245.hstgr.cloud`, Let's Encrypt HTTP-01), Hermes Agent 0.20.4 as the orchestrating "brain" (`hermes-gateway.service`, `HERMES_HOME=/root/.hermes`).

Approved by the owner on 2026-09-03 after three choices: remove both Aether pre-prod environments and rewire CI; build an agent-ops platform (not a plain CI stack); native logins plus one Traefik basic-auth layer; "Lean core" composition.

## 1. Goal

Replace the two persistent Aether pre-production environments (staging = `aether-dev-*`, test = `aether-test-*`) with an agent-operations platform that Hermes and the owner use to build, test and research: Harness Open Source (Git + CI), Coder (dev workspaces), agentmemory (Hermes memory), Local Deep Research + SearXNG (research), Steel (browser for agents). Everything is TLS-published through the existing Traefik pattern, capped in memory/CPU so production always has headroom, health-watched, and included in the nightly off-site backup.

Explicitly out: BuildBot (duplicate of Harness CI) and LocalAI (CPU inference on this box starves production; agentmemory and LDR do their own embeddings).

## 2. Phases and acceptance

| Phase | Delivers | Accepted when |
|---|---|---|
| P0 | Aether test/staging removed; CI rewired | Both DB dumps + env tarball in `/root/backups/aether-envs-2026-09-03/`; no `aether-dev-*`/`aether-test-*` units, containers, volumes or Traefik routes; prod units + `aether-logstream` + runner untouched and healthy; PR merged; `VPS Delivery` (verify → deploy-prod) and `CI` (pytest on the registered runner against `aether-ci-postgres`) both green on GitHub |
| P1 | Platform core: `/docker/agent-ops` compose with `agentops-postgres`, Harness, Coder; Traefik routes | `https://harness.` and `https://coder.` on `srv1356245.hstgr.cloud` serve their login pages with valid certs from the neutral host; a hello-world Harness pipeline runs; a Coder Docker workspace starts and stops; admin credentials recorded in `CREDENTIALS.txt` |
| P2 | Agent services: agentmemory, LDR + SearXNG, Steel; Hermes wiring | `https://ldr.` login page; `https://steel.` returns 401 without / 200 with basic auth; LDR answers a query via API; Steel opens a session via API; `hermes doctor` shows the agentmemory plugin and the MCP servers; a Hermes `/chat` stores and recalls a memory |
| P3 | Ops layer: caps, watchdog, dumps, backup, runbook | `docker stats` shows limits; `agent-ops-health.timer` active and its `state/health.json` all-green; `agentops-dump.sh` produced dumps; nightly `backup.sh` run includes `docker_agent-ops` (config + dumps, no data dirs, no secrets); `README.md` runbook present |

Each phase is executed by delegated units with an independent verifier, then a read-only critic sweep (same pattern as the 2026-09-02 fix rounds).

## 3. Architecture

### 3.1 Layout
```
/docker/agent-ops/
  docker-compose.yml        # all services, ports on 127.0.0.1 only
  .env                      # generated passwords/tokens (mode 600)
  CREDENTIALS.txt           # human-readable admin logins (mode 600)
  README.md                 # runbook: URLs, restart/stop, where state lives
  config/<service>/         # static config (backed up)
  data/<service>/           # bind-mounted state (NOT backed up, except dumps/)
  dumps/                    # nightly DB dumps, 7-day rotation (backed up)
  state/health.json         # watchdog output
  bin/agent-ops-health.sh, bin/agentops-dump.sh
/docker/traefik-vplw/dynamic/agent-ops.yml   # routers/services/middlewares
```

### 3.2 Services and ports (loopback)

| Service | Image | Port | Public host | Auth | Limits |
|---|---|---|---|---|---|
| agentops-postgres | postgres:18-alpine | 5440 | — | — | 512 MB / 0.5 cpu |
| harness | harness/harness (3.x) | 3010 (HTTP), 3022 (SSH) | harness.srv… | native (admin) | 1.5 GB / 2 cpu |
| coder | ghcr.io/coder/coder (stable) | 3020 | coder.srv… | native (admin) | 1.5 GB / 2 cpu; workspaces 2 GB / 1 cpu each via the Docker template |
| agentmemory | rohitg00/agentmemory (compose) | 3111 REST, 3112 stream | — (loopback only) | — | 512 MB / 0.5 cpu |
| ldr | localdeepresearch/local-deep-research | 5050 | ldr.srv… | native multi-user | 2 GB / 2 cpu |
| searxng | searxng/searxng | 8890 | — (loopback only) | — | 256 MB / 0.5 cpu |
| steel | ghcr.io/steel-dev/steel-browser | 3030 (API/UI), 9223 (CDP) | steel.srv… | Traefik basicAuth | 2 GB / 1.5 cpu |
| aether-ci-postgres (separate: `/root/ci/docker-compose.yml`) | postgres:18-alpine | 5436 | — | — | 384 MB |

Harness and Coder mount `/var/run/docker.sock` (root-equivalent) — they are therefore never exposed without their own login, and their loopback ports are not in UFW. Harness Gitspaces disabled (`GITNESS_GITSPACE_ENABLE=false`); Coder is the workspace layer. Coder wildcard app URLs are not available (the Hostinger wildcard DNS is single-level); path-based apps work. Harness SSH (3022) is loopback-only; agents and the owner use HTTPS Git.

### 3.3 Traefik
File-provider `agent-ops.yml`: one router per public host on `websecure` with `certResolver: letsencrypt`, services pointing at `http://127.0.0.1:<port>`. A `agentops-basicauth` middleware (users file `/docker/traefik-vplw/dynamic/agentops.htpasswd`, user `vic`) is attached to the Steel router only. Coder needs websockets; Traefik passes them by default.

### 3.4 Data
Bind mounts under `data/` for Postgres, Harness (`/data`), Coder (Postgres), agentmemory (SQLite), LDR (SQLite/FAISS), SearXNG (settings). Nightly `agentops-dump.sh`: `pg_dumpall` of `agentops-postgres`, `.backup` of Harness/agentmemory/LDR SQLite files, gzip, keep 7. `backup.sh` SOURCES gain `/docker/agent-ops` with `data/` excluded (dumps included, capped by the existing size guard).

## 4. P0 — Aether removal and CI rewire

Manifest (verified 2026-09-02):
- Units: `aether-dev-api`, `aether-dev-web`, `aether-test-api`, `aether-test-web` (stop, disable, remove unit files → backup dir).
- Timers: `aether-guardian@dev.timer`, `aether-guardian@test.timer` (disable).
- Containers + volumes: `aether-staging-postgres`, `aether-staging-redis` (`/root/dev/.agent/staging/docker-compose.yml`), `aether-test-postgres`, `aether-test-redis` (`/root/test/docker-compose.yml`) — `pg_dump -U aether` of `aether_staging` and `aether_test` first, then `docker compose down -v`.
- Directories: `/root/test`, `/root/dev/aether-staging`, `/root/dev/.agent/staging` (tar to backup dir, then remove). Keep `/root/dev/aether-job-career-agent`, `/root/dev/.agent/{bin,servers,verify,prod-migration,rescued-from-abacus}`, `/root/prod`.
- Traefik: remove `aether-dev.yml`, `aether-test.yml` (backup). Keep `aether-prod.yml`, `aether-logs.yml`.
- Code trims: `/opt/aether-guardian/guardian.py` `ENVS` → prod + ci; `deploy_env.sh` → prod only (dev/test cases removed); `/opt/aether-logstream/logstream.py` log map → prod + guardian-prod. Log dirs `/var/log/aether-dev`, `/var/log/aether-test` archived.
- CI (branch `chore/remove-preprod-envs` → PR → merge to `main`):
  - `vps-delivery.yml`: delete `deploy-dev` and `deploy-test`; `deploy-prod.needs: verify`.
  - `ci.yml`: pytest job `runs-on: [self-hosted, hostinger-vps]` (the only registered runner; the `hostinger-vps-ci` runner at `/home/aetheragent/actions-runner-2` is not registered and every CI run has failed since 2026-08-20).
  - `aether-ci-postgres` (`/root/ci/docker-compose.yml`, user `aether`, db `aether_ci`, loopback 5436); repo secret `DATABASE_URL_TEST` updated via `gh secret set` to point at it with the `?schema=aether_test_ci` parameter the provisioning script requires.
  - Merging triggers one production deploy of current `main` through the existing smoke test + rollback.

## 5. Hermes wiring (P2)
- agentmemory: install the first-party Hermes plugin (`~/.hermes/plugins/agentmemory`), set `memory.provider: agentmemory`, endpoint `http://127.0.0.1:3111`.
- Steel: `steel-mcp-server` (`STEEL_LOCAL=true`, API `http://127.0.0.1:3030`) registered as an MCP server in `config.yaml`; if Hermes's native browser toolset accepts `browser.cdp_url: ws://127.0.0.1:9223`, retire `hermes-chrome-cdp.service` (else keep it).
- LDR: its MCP server registered in `config.yaml`; LDR itself uses OpenRouter (`LDR_LLM_PROVIDER=openai_endpoint`) with the existing key, SearXNG at `http://searxng:8080` inside the compose network.
- Tokens added (never removed) to `/root/.hermes/.env`: `HARNESS_TOKEN`, `CODER_SESSION_TOKEN`, `STEEL_API_URL`, `LDR_API_URL`, `AGENTMEMORY_URL`.
- Gateway restart only when `active_agents` is 0.

## 6. Ops layer (P3)
- `agent-ops-health.sh` (systemd timer, 5 min): probes each service's health endpoint; after 3 consecutive failures `docker compose restart <svc>`; writes `state/health.json`; logs to journal. `restart: unless-stopped` + compose `healthcheck` on every service.
- Memory/CPU limits as in §3.2 (`mem_limit`, `cpus`), so at least one vCPU and ~4 GB stay free for production under any single-service peak.
- `gc.sh` never touches `/docker/agent-ops` (explicit comment); `backup.sh` includes it as above.
- Runbook `README.md`: URLs, credential file locations, how to stop/start/upgrade each service, where dumps are, how to restore.

## 7. Verification
Per phase: executor unit → independent verifier (read-only, refutes claims with fresh output, including checks from the neutral host `abacus-tunnel`) → critic sweep. Owner-visible acceptance is the table in §2. Nothing is declared done without the artifact (log line, HTTP code, `gh run` conclusion) cited.

## 8. Risks and rollback
- Merging the CI PR deploys `main` to production once; rollback is the workflow's own `--rollback-on-failure` plus `git revert` of the PR.
- Removed environments are recoverable from the dumps + tarball (re-create compose, restore with `psql`).
- Docker-socket services: auth-gated, loopback-only, memory-capped; compromise of Harness/Coder would be root on the host — accepted for a single-owner box.
- CPU contention: caps plus the watchdog; if production latency suffers, lower `cpus` on Steel/LDR first.
- Each platform service is one compose service: rollback = `docker compose rm -sf <svc>` + delete its Traefik router.
