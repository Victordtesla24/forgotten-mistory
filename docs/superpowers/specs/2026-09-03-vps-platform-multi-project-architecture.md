# VPS Operations Architecture — Multi-Project Platform (addendum, 2026-09-03)

Supersedes the Aether-centred framing in `2026-09-03-vps-agent-ops-platform-design.md`. Owner direction (2026-09-03): *all platform applications, including the CI/CD app, serve every project on the VPS; nothing is Aether-specific.*

## 1. Principle

One shared operations platform (`/docker/agent-ops`, compose project `agent-ops`) provides the same services to every project. A project is a **tenant**: it gets a repo in Harness, a pipeline from the standard template, a Coder workspace template (or the generic Docker one), an agentmemory namespace, n8n workflows, a CI database on the shared CI Postgres, an HTTPS hostname per public surface, and inclusion in dumps/backups/health checks. Project-specific runtime (the app's own containers/units) stays with the project; project-specific *ops tooling* (e.g. Aether's guardian/log-stream) is allowed but is the exception, not the pattern.

## 2. Layers

| Layer | Where | Rule |
|---|---|---|
| Edge | Traefik (host network, 80/443, Let's Encrypt, wildcard `*.srv1356245.hstgr.cloud`) + nginx 8443 (legacy) | Every public surface is a Traefik file-provider route to a loopback port. Never publish container ports on 0.0.0.0 (Docker bypasses UFW). Weak-auth UIs get the shared `agentops-basicauth` middleware. |
| Platform (shared) | `/docker/agent-ops` | postgres (shared; one database per consumer), **ci-postgres** (shared; one database per project, per-run schemas), harness (Git + CI/CD for all projects), coder (workspaces), n8n (automation/webhooks for all projects), agentmemory, ldr + searxng, steel, static (published artefacts such as the Ghostery list). Memory/CPU caps per service; health watchdog; nightly dumps. |
| Project runtime | `/root/prod/<project>`, `/opt/<project>`, `/docker/<project>` (existing locations kept) | Each project keeps its own containers/units and `.env`; publishes only via Traefik; registered in the project registry. |
| Agents | Hermes gateway (`/root/.hermes`) | Uses the platform through loopback URLs + tokens in `/root/.hermes/.env`; memory provider agentmemory; browser via Steel; research via LDR; repos/pipelines via Harness API; workspaces via Coder API; automations via n8n webhooks. |
| Host ops | `/root/scripts/vps-maintenance` (gc.sh, backup.sh v5), `sshd-hardening-guard`, `agent-ops-health.timer`, `agentops-dump.timer` | Off-site backup covers `/docker/agent-ops` (config + dumps), `/root/.hermes`, `/etc/*`, project code; never data dirs or secrets. |

## 3. Tenancy conventions

- **Naming**: hostnames `<app>.srv1356245.hstgr.cloud` for platform apps, `<project>.srv…` (or the project's own domain) for project surfaces. Containers `agentops-<svc>` for platform, `<project>-<role>` for projects. CI databases `<project>_ci` on `ci-postgres` (loopback 5436), CI role per project.
- **Registry**: `/docker/agent-ops/projects.yml` — one entry per project: name, repo (GitHub URL + Harness path), runtime location, public hosts, CI database, Coder template, n8n workflows, owner contacts, backup paths. The health watchdog, dump script and README are generated/validated from it.
- **CI/CD**: Harness Open Source is the CI/CD system for all projects. Standard pipeline template (`.harness/pipeline.yaml`): lint → test (against `<project>_ci` on ci-postgres, per-run schema) → build → deploy step that calls the project's own deploy script on the host through an SSH/`docker exec` step with the project's token. GitHub remains the source of truth for repos that live there; Harness holds mirrors (import) and runs the pipelines. **Aether** keeps its GitHub Actions delivery (verify → deploy-prod, self-hosted runners) as the legacy path until its pipeline is ported to the template; both use the same `aether_ci` database.
- **Workspaces**: Coder's Docker template is generic (clones any repo); per-project templates only when a project needs extra tooling.
- **Automation**: n8n is the shared webhook/automation hub; each project's workflows are tagged with the project name; webhooks are basic-auth protected externally and open on loopback.
- **Memory**: agentmemory is shared; agents tag memories with the project name.
- **Secrets**: platform secrets in `/docker/agent-ops/.env` (600); per-project secrets stay in the project's own `.env`; automation tokens for agents in `/root/.hermes/.env` (append-only, never removed).

## 4. Migration from the current state (P4 plan)

1. Move the CI datastore into the platform: service `ci-postgres` (container `agentops-ci-postgres`) in `/docker/agent-ops/docker-compose.yml`, same volume data, same loopback port 5436 so the `DATABASE_URL_TEST` secret stays valid; retire `/root/ci/docker-compose.yml`. (Only when no CI run is in progress.)
2. Create the project registry with today's tenants: aether, forgotten-mistory, abentertainment (+ ab-chatbot API), ticketalay (global-ticketing-initiative), portfolio, horizon, recon, cobol/HOS pipeline, ghostery-filter-generator.
3. Import every active GitHub repo into Harness (space per project) and install the standard pipeline template; prove it end-to-end on one non-Aether project first (portfolio or forgotten-mistory: lint/test/build in a container, no deploy), then add deploy steps per project.
4. Generalize docs: `/docker/agent-ops/README.md` becomes the platform runbook with an onboarding checklist; the Aether-specific notes move under a per-project section.
5. P3 (watchdog, dumps, backups) reads the registry so new tenants are covered automatically.

## 5. Out of scope / not changed

- Existing project runtimes and their locations are not moved.
- Aether's GitHub Actions stays until ported (no regression of a working delivery).
- `aether-guardian`/`aether-logstream` remain Aether's own ops tooling.
