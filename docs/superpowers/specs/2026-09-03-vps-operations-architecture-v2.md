# VPS Operations Architecture v2 — Platform services vs Production tenants

Date: 2026-09-03. Owner direction: the Docker/VPS architecture must be generic and cost-optimal — **platform services** (CI/CD, bug finding, environments for AI app building, testing, deployments, automation, agent tooling) shared by every current and future project, and **production projects** (abentertainment website, Aether app, …) kept as live, user-facing tenants. Supersedes the "agent-ops platform design" framing; the P0–P3 work already done fits this model unchanged.

## 1. The two tiers

### Tier P — Platform (shared, generic)
Compose project `agent-ops` at `/docker/agent-ops` (the name is the Hostinger Docker Manager's convention: `/docker/<project>/docker-compose.yml`). Every service is loopback-bound and published only through Traefik. Nothing here knows a specific project; projects are tenants configured through the registry.

| Capability | Service (container) | Loopback | Public host | Auth |
|---|---|---|---|---|
| Edge / TLS | Traefik v3 (`traefik-vplw`, separate compose, host network) | 80/443 | `*.srv1356245.hstgr.cloud` + custom domains | per route |
| Git + CI/CD for all repos | Harness OSS 3.3.0 (`agentops-harness`) | 3010 | `harness.` | native |
| Bug finding | pipeline stage template (`semgrep`, `trivy fs/image`, ruff/eslint/mypy/tsc) + Hermes adversarial-review skill | in pipeline containers | — | — |
| Build/dev environments | Coder v2.36.4 (`agentops-coder`), Docker workspace template (2 GB/1 vCPU each) | 3020 | `coder.` | native |
| Test data | CI Postgres 18 (`agentops-ci-postgres`), one `<project>_ci` DB per project, per-run schemas | 5436 | — | — |
| Shared app DB for platform apps | Postgres 18 (`agentops-postgres`) — `coder`, future `n8n` | 5440 | — | — |
| Deployments | Harness deploy stage → `/docker/agent-ops/bin/deploy-hook.sh <project> <ref>` on the host (SSH step with a scoped key) → the project's own deploy script | — | — | key |
| Automation / webhooks | n8n (`agentops-n8n`) | 5678 | `n8n.` (webhooks basic-auth) | native + basic-auth |
| Agent memory | agentmemory (`agentops-agentmemory`) | 3111 | — | bearer |
| Agent browsing | Steel (`agentops-steel`) | 3030/9223 | `steel.` | basic-auth |
| Research | Local Deep Research + SearXNG (`agentops-ldr`, `agentops-searxng`) | 5050/8890 | `ldr.` | native |
| Published artefacts | static nginx (`agentops-static`) | 3040 | `ghostery.` (+ others by path) | none (read-only) |
| Availability | `agent-ops-health.timer` (5 min, restart after 3 failures, `state/health.json`); optional Uptime Kuma later if external alerting is wanted | — | — | — |
| Recovery | `agentops-dump.timer` (02:10) + `backup.sh` v5 (02:30, private GitHub repo, secrets excluded/redacted) | — | — | — |

Retirements once equivalents are proven: `hermes-chrome-cdp.service` (Steel), `aether-ci` standalone compose (folded into platform), the OpenClaw leftovers (done).

### Tier T — Production tenants (real users)
Each project keeps its own runtime and data, isolated from the platform and from other tenants:

| Tenant | Runtime today | Target location | Public surface |
|---|---|---|---|
| abentertainment (site + ab-chatbot API) | compose `/opt/abentertainment` (:3000 public — used by the shared-host PHP proxy), unit `ab-chatbot` (:3001) | `/docker/abentertainment/` compose (site) + unit kept for the API until containerised | `api.abentertainment.com.au`; `:3000` stays open until `api-proxy.php` is repointed |
| Aether | units `aether-prod-*` + compose `/root/prod` (postgres/redis) | `/docker/aether-prod/` compose for datastores; units stay | `aether.`, `aether-logs.` |
| portfolio | compose `/root/portfolio-project` | `/docker/portfolio/` | `portfolio.` |
| ticketalay | unit (Next.js :3400) | unit stays (registry entry) | `ticketalay.` |
| horizon | nginx static :8095 | registry entry | `horizon.`, `melbournetohorizon.com.au` (DNS missing) |
| recon | unit (:8791) | registry entry | `recon.` |
| Nextcloud | compose `/docker/nextcloud-kdka` (Hostinger) | unchanged | `srv1356245.hstgr.cloud` |
| HOS pipeline (cobol) | unit `hos-server` (:8080) | registry entry | `hos.`, `:8080` |
| Ghostery filter generator | platform tenant: code `/opt/ghostery-gen`, state `data/ghostery-gen`, n8n workflow | unchanged | `ghostery.`, n8n webhook |

Tenant rules: memory/CPU caps on every container; loopback ports + Traefik routes only (exception: abentertainment `:3000` until the proxy is repointed); health endpoint registered; `.env` per tenant (600); backup paths declared; deploy hook declared; no shared volumes with the platform.

## 2. Resource budget (16 GB / 4 vCPU)

| Pool | Cap (sum of `mem_limit`) | Idle today | Notes |
|---|---|---|---|
| Platform | ≤ 8.5 GB caps, ≤ 3 GB idle | ~1.2 GB | steel 2G, ldr 2G, harness 1.5G, coder 1.5G, n8n 1G, agentmemory 768M, postgres 512M, ci-postgres 512M, searxng 256M, static 64M |
| Production | ≤ 6 GB caps | ~4 GB (Aether API/worker/test venvs dominate) | add caps: abentertainment 512M, portfolio 512M, nextcloud 1G total, aether-prod-postgres 512M, redis 128M each |
| Host/OS/agents | remainder | ~2 GB (Hermes gateway, hos-server, Chrome) | keep ≥ 4 GB free at idle; CPU: platform services capped so ≥ 1 vCPU stays free |

Cost levers: pinned images, nightly `docker builder prune` (>48h) only, no local LLM inference, workspaces stopped when idle (Coder autostop 2h), Steel sessions released (`KILL_TIMEOUT`), LDR/Steel `cpus` caps, CI runs serialised per runner.

## 3. Registry and onboarding
`/docker/agent-ops/projects.yml` is the single source of truth (tier, name, repo, Harness space, runtime, hosts, caps, health, ci_db, deploy hook, backup paths). `bin/registry-check.sh` validates it against the live host; `README.md`/`ONBOARDING.md` are generated from it; the watchdog and dump scripts read it. Onboarding a new project = one registry entry + `harness-onboard.sh` + a route file.

## 4. Delivery flow for any project
push → Harness pipeline (`.harness/pipeline.yaml` from the template: deps → lint → bug-find (semgrep/trivy/linters) → test (against `<project>_ci`) → build → deploy stage) → `deploy-hook.sh <project> <sha>` on the host → project deploy script (compose pull/up or unit restart) → smoke test → automatic rollback on failure. Aether keeps its GitHub Actions equivalent until ported; both are just deploy hooks.

## 5. What changes from today (feeds P4)
1. `ci-postgres` moves into the platform compose (same volume/port) — P4 T1.
2. Registry + `registry-check.sh` — P4 T2.
3. Harness onboarding script + pipeline template incl. bug-find stage; proven on portfolio and forgotten-mistory — P4 T3.
4. Production caps + relocation of the three compose-based tenants to `/docker/<project>/` with unchanged container names/ports (seconds of downtime each, backups first) — P4 T4 (new).
5. `deploy-hook.sh` + per-tenant deploy scripts registered — P4 T5 (new).
6. Runbook/onboarding generated from the registry — P4 T6; final adversarial sweep — P4 T7.
