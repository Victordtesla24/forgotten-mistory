# P2 — Agent services (agentmemory, Local Deep Research + SearXNG, Steel) and Hermes wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the three agent-facing services to the `/docker/agent-ops` compose project, publish Local Deep Research and Steel over HTTPS (Steel behind the Traefik basic-auth middleware), and wire agentmemory, Steel and the platform tokens into the Hermes gateway so agents can remember, browse and research.

**Architecture:** Same compose project as P1 (loopback ports, Traefik file routes). agentmemory runs as one container built from the upstream Coolify Dockerfile (Node worker + iii engine), loopback-only, consumed by Hermes through the `@agentmemory/mcp` stdio server and `memory.provider: agentmemory`. LDR runs with SearXNG on the compose network and talks to OpenRouter (no local models). Steel runs as one memory-capped container; Hermes gets it both as a CDP endpoint (`browser.cdp_url`) and as an MCP server (`steel-mcp-server`, local mode). LDR has no bearer-token API, so agents use it through a small host-side wrapper script that logs in with a session cookie.

**Tech Stack:** `ghcr.io/steel-dev/steel-browser` (pinned by digest), `localdeepresearch/local-deep-research:1.10.7`, `searxng/searxng` (pinned by digest), agentmemory 0.9.29 (+ iii 0.11.2), Node 22 (`npx`), Hermes Agent 0.20.4 (`~/.hermes/config.yaml`, `mcp_servers:`, `plugins`, `browser.cdp_url`).

**Verified facts (2026-09-03):** host ports 3030, 3111, 3112, 5050, 8890, 9223 free; `/root/.config/agents/providers.env` has `OPENROUTER_API_KEY`; `/root/.hermes/.env` (600) is the gateway's env file; Hermes browser toolset currently reports "system dependency not met" (it wants the `agent-browser` npm CLI unless `browser.cdp_url` is honoured); `hermes-chrome-cdp.service` runs headless Chrome on 127.0.0.1:9222; the gateway must only be restarted when `/root/.hermes/gateway_state.json` shows `"active_agents":0`. agentmemory health `GET /agentmemory/health`, auth `Authorization: Bearer <AGENTMEMORY_SECRET>` (secret printed once by the entrypoint into `/data/.hmac`). LDR health `GET /api/v1/health`; first user via `/auth/register`; API `POST /api/v1/quick_summary` with session cookie + `X-CSRF-Token`. Steel health `GET /v1/health`; sessions `POST /v1/sessions`; CDP on 9223.

Conventions as in P0/P1: scripts via `scp` to `/tmp/p2-<name>.sh`; never print secret values; never publish on `0.0.0.0`; back up `/root/.hermes/config.yaml` before editing (`cp -p` to `/root/backups/vps-fix-2026-09-02/p2/`).

---

## File structure

```
/docker/agent-ops/
  docker-compose.yml                    # + agentmemory, searxng, ldr, steel
  agentmemory-deploy/Dockerfile         # copy of upstream deploy/coolify/Dockerfile (pinned versions)
  config/searxng/settings.yml           # json format enabled
  data/agentmemory, data/ldr, data/searxng, data/steel-{logs,exports,cache}
  bin/ldr-query.sh                      # host-side helper: login + quick_summary
/docker/traefik-vplw/dynamic/agent-ops.yml   # + ldr, steel routers (steel with basic-auth)
/root/.hermes/config.yaml               # mcp_servers (agentmemory, steel), memory.provider, browser.cdp_url, plugins
/root/.hermes/.env                      # + AGENTMEMORY_URL, AGENTMEMORY_SECRET, STEEL_BASE_URL, HARNESS_TOKEN, CODER_SESSION_TOKEN, LDR_URL
/root/.hermes/plugins/agentmemory/      # upstream integrations/hermes
```

---

### Task 1: agentmemory (loopback only)

- [ ] **Step 1: Vendor the upstream Dockerfile and add the service**

```bash
cat > /tmp/p2-agentmemory.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
mkdir -p agentmemory-deploy data/agentmemory
curl -fsSL https://raw.githubusercontent.com/rohitg00/agentmemory/v0.9.29/deploy/coolify/Dockerfile -o agentmemory-deploy/Dockerfile
# local embeddings need the optional @huggingface/transformers dependency
sed -i 's/ --omit=optional//' agentmemory-deploy/Dockerfile
grep -c omit=optional agentmemory-deploy/Dockerfile || true
grep -q '^  agentmemory:' docker-compose.yml || cat >> docker-compose.yml <<'YML'
  agentmemory:
    build:
      context: ./agentmemory-deploy
      args:
        AGENTMEMORY_VERSION: "0.9.29"
        III_VERSION: "0.11.2"
        III_SDK_VERSION: "0.11.2"
    image: local/agentmemory:0.9.29
    container_name: agentops-agentmemory
    restart: unless-stopped
    environment:
      EMBEDDING_PROVIDER: local
      AGENTMEMORY_AUTO_COMPRESS: "true"
    ports: ["127.0.0.1:3111:3111"]
    volumes:
      - ./data/agentmemory:/data
    mem_limit: 768m
    cpus: 1
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://127.0.0.1:3111/agentmemory/livez >/dev/null"]
      interval: 30s
      timeout: 5s
      start_period: 90s
      retries: 3
YML
docker compose build agentmemory 2>&1 | tail -3
docker compose up -d agentmemory
for i in $(seq 1 60); do curl -fsS -o /dev/null http://127.0.0.1:3111/agentmemory/health 2>/dev/null && break; sleep 3; done
echo "health: $(curl -s http://127.0.0.1:3111/agentmemory/health)"
# capture the generated secret into .env (never print it)
umask 077
if ! grep -q '^AGENTMEMORY_SECRET=' .env; then
  S=$(docker exec agentops-agentmemory sh -c 'cat /data/.hmac 2>/dev/null || true' | tr -d '\n')
  [ -n "$S" ] || S=$(docker logs agentops-agentmemory 2>&1 | grep -oE 'AGENTMEMORY_SECRET[=: ]+[A-Za-z0-9_-]{20,}' | head -1 | sed -E 's/.*[=: ]+//')
  [ -n "$S" ] || { echo "SECRET_NOT_FOUND"; exit 1; }
  printf 'AGENTMEMORY_SECRET=%s\n' "$S" >> .env; unset S
fi
S=$(sed -n 's/^AGENTMEMORY_SECRET=//p' .env)
curl -s -o /dev/null -w "authed health: %{http_code}\n" -H "Authorization: Bearer $S" http://127.0.0.1:3111/agentmemory/health
unset S
EOF
scp /tmp/p2-agentmemory.sh hos-vps:/tmp/p2-agentmemory.sh && ssh hos-vps 'bash /tmp/p2-agentmemory.sh'
```
Expected: image builds; `health: {"status":"healthy"...}`; `authed health: 200`. If the Dockerfile's entrypoint stores the secret elsewhere, read `docker logs agentops-agentmemory` for the one-time print and adjust the capture — the requirement is that `AGENTMEMORY_SECRET` ends up in `.env` and an authenticated request succeeds.

- [ ] **Step 2: Store/recall round trip through the REST API**

```bash
ssh hos-vps 'cd /docker/agent-ops && S=$(sed -n "s/^AGENTMEMORY_SECRET=//p" .env) && curl -s -X POST http://127.0.0.1:3111/agentmemory/memories -H "Authorization: Bearer $S" -H "Content-Type: application/json" -d "{\"content\":\"P2 smoke: the VPS hostname is srv1356245\",\"type\":\"fact\",\"tags\":[\"p2-smoke\"]}" | head -c 300; echo; curl -s "http://127.0.0.1:3111/agentmemory/search?q=VPS%20hostname&limit=3" -H "Authorization: Bearer $S" | head -c 400; echo; unset S'
```
Expected: a created memory id, then a search hit containing `srv1356245`. If the route names differ in 0.9.29, take them from `curl http://127.0.0.1:3111/agentmemory/openapi.json` (or the README) and use the equivalent store + search calls; the acceptance is a successful round trip.

---

### Task 2: SearXNG + Local Deep Research

- [ ] **Step 1: SearXNG settings, both services, OpenRouter wiring**

```bash
cat > /tmp/p2-ldr.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
mkdir -p config/searxng data/searxng data/ldr data/ldr-scripts
umask 077
grep -q '^OPENROUTER_API_KEY=' .env || sed -n 's/^\(export \)\{0,1\}OPENROUTER_API_KEY=/OPENROUTER_API_KEY=/p' /root/.config/agents/providers.env | head -1 >> .env
grep -q '^SEARXNG_SECRET=' .env || printf 'SEARXNG_SECRET=%s\n' "$(openssl rand -hex 32)" >> .env
umask 022
cat > config/searxng/settings.yml <<'YML'
use_default_settings: true
server:
  secret_key: "${SEARXNG_SECRET}"
  limiter: false
  image_proxy: false
search:
  safe_search: 0
  formats: [html, json]
ui:
  static_use_hash: true
YML
grep -q '^  searxng:' docker-compose.yml || cat >> docker-compose.yml <<'YML'
  searxng:
    image: searxng/searxng@sha256:6dd0dffc05a75d92bbacd858953b4e93b8f709403c3fb1fb8a33ca8fd02e40a4
    container_name: agentops-searxng
    restart: unless-stopped
    environment:
      SEARXNG_BASE_URL: http://searxng:8080/
      SEARXNG_SECRET: ${SEARXNG_SECRET}
    ports: ["127.0.0.1:8890:8080"]
    volumes:
      - ./config/searxng/settings.yml:/etc/searxng/settings.yml:ro
      - ./data/searxng:/var/cache/searxng
    mem_limit: 256m
    cpus: 0.5
    security_opt: ["no-new-privileges:true"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      start_period: 30s
      retries: 3
  ldr:
    image: localdeepresearch/local-deep-research:1.10.7
    container_name: agentops-ldr
    restart: unless-stopped
    environment:
      LDR_WEB_HOST: 0.0.0.0
      LDR_WEB_PORT: "5000"
      LDR_DATA_DIR: /data
      LDR_LLM_PROVIDER: openai_endpoint
      LDR_LLM_OPENAI_ENDPOINT_URL: https://openrouter.ai/api/v1
      LDR_LLM_OPENAI_ENDPOINT_API_KEY: ${OPENROUTER_API_KEY}
      LDR_LLM_MODEL: anthropic/claude-sonnet-4
      LDR_SEARCH_TOOL: searxng
      LDR_SEARCH_ENGINE_WEB_SEARXNG_DEFAULT_PARAMS_INSTANCE_URL: http://searxng:8080
    ports: ["127.0.0.1:5050:5000"]
    volumes:
      - ./data/ldr:/data
      - ./data/ldr-scripts:/scripts
    mem_limit: 2048m
    cpus: 2
    security_opt: ["no-new-privileges:true"]
    depends_on:
      searxng:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://127.0.0.1:5000/api/v1/health >/dev/null || wget -qO- http://127.0.0.1:5000/api/v1/health >/dev/null"]
      interval: 30s
      timeout: 10s
      start_period: 120s
      retries: 5
YML
docker compose up -d searxng ldr
for i in $(seq 1 40); do curl -fsS -o /dev/null "http://127.0.0.1:8890/search?q=test&format=json" 2>/dev/null && break; sleep 3; done
echo "searxng json: $(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8890/search?q=test&format=json')"
for i in $(seq 1 60); do curl -fsS -o /dev/null http://127.0.0.1:5050/api/v1/health 2>/dev/null && break; sleep 5; done
echo "ldr health: $(curl -s http://127.0.0.1:5050/api/v1/health | head -c 200)"
EOF
scp /tmp/p2-ldr.sh hos-vps:/tmp/p2-ldr.sh && ssh hos-vps 'bash /tmp/p2-ldr.sh'
```
Expected: `searxng json: 200`, `ldr health: {"status":"ok"...}`. (SearXNG's `${SEARXNG_SECRET}` substitution: if the image does not expand env in settings.yml, replace the placeholder with the literal value from `.env` using `sed` on the VPS and keep the file mode 600.)

- [ ] **Step 2: First LDR user + host-side query helper**

```bash
cat > /tmp/ldr-query.sh <<'EOF'
#!/usr/bin/env bash
# ldr-query.sh "<question>" — logs into Local Deep Research with the platform
# service user (LDR_USER/LDR_PASSWORD from /docker/agent-ops/.env) and runs a
# quick_summary. Prints the JSON summary. Used by Hermes agents and by humans.
set -euo pipefail
Q="${1:?usage: ldr-query.sh <question>}"
ENVF=/docker/agent-ops/.env
U=$(sed -n 's/^LDR_USER=//p' "$ENVF"); P=$(sed -n 's/^LDR_PASSWORD=//p' "$ENVF")
J=$(mktemp); trap 'rm -f "$J"' EXIT
B=http://127.0.0.1:5050
curl -s -c "$J" -b "$J" "$B/auth/login" >/dev/null
CSRF=$(curl -s -c "$J" -b "$J" "$B/auth/csrf-token" | sed -nE 's/.*"csrf_token"\s*:\s*"([^"]+)".*/\1/p')
curl -s -c "$J" -b "$J" -X POST "$B/auth/login" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$U\",\"password\":\"$P\"}" >/dev/null
CSRF=$(curl -s -c "$J" -b "$J" "$B/auth/csrf-token" | sed -nE 's/.*"csrf_token"\s*:\s*"([^"]+)".*/\1/p')
curl -s -b "$J" -X POST "$B/api/v1/quick_summary" -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"query": sys.argv[1], "search_tool": "searxng", "iterations": 1, "questions_per_iteration": 2}))' "$Q")"
echo
EOF
cat > /tmp/p2-ldr-user.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
umask 077
grep -q '^LDR_USER=' .env || { printf 'LDR_USER=vic\nLDR_PASSWORD=%s\n' "$(openssl rand -base64 30 | tr -dc A-Za-z0-9 | cut -c1-24)" >> .env; }
U=$(sed -n 's/^LDR_USER=//p' .env); P=$(sed -n 's/^LDR_PASSWORD=//p' .env)
J=$(mktemp)
curl -s -c "$J" -b "$J" http://127.0.0.1:5050/auth/register >/dev/null
CSRF=$(curl -s -c "$J" -b "$J" http://127.0.0.1:5050/auth/csrf-token | sed -nE 's/.*"csrf_token"\s*:\s*"([^"]+)".*/\1/p')
code=$(curl -s -o /tmp/p2-reg.out -w '%{http_code}' -c "$J" -b "$J" -X POST http://127.0.0.1:5050/auth/register -H "X-CSRF-Token: $CSRF" \
  -H 'Content-Type: application/json' -d "{\"username\":\"$U\",\"password\":\"$P\",\"confirm_password\":\"$P\",\"acknowledge\":true}")
echo "register: $code"; head -c 200 /tmp/p2-reg.out; echo; rm -f "$J" /tmp/p2-reg.out
install -m 755 /tmp/ldr-query.sh /docker/agent-ops/bin/ldr-query.sh; rm -f /tmp/ldr-query.sh
timeout 300 /docker/agent-ops/bin/ldr-query.sh "What is the capital of Australia? One sentence." | head -c 600; echo
unset U P
EOF
scp /tmp/ldr-query.sh hos-vps:/tmp/ldr-query.sh && scp /tmp/p2-ldr-user.sh hos-vps:/tmp/p2-ldr-user.sh && ssh hos-vps 'bash /tmp/p2-ldr-user.sh'
```
Expected: `register: 200` (or 302), then a JSON summary mentioning Canberra. If the register/login form field names differ in 1.10.7 (check `docker exec agentops-ldr grep -rn "confirm_password\|acknowledge" /app 2>/dev/null | head`), adjust the JSON and the helper accordingly — acceptance is a summary returned through the API with the service user. Afterwards lock registrations: add `LDR_APP_ALLOW_REGISTRATIONS: "false"` to the `ldr` service environment and `docker compose up -d ldr`.

---

### Task 3: Steel

- [ ] **Step 1: Service + smoke session**

```bash
cat > /tmp/p2-steel.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
mkdir -p data/steel-logs data/steel-exports data/steel-cache
grep -q '^  steel:' docker-compose.yml || cat >> docker-compose.yml <<'YML'
  steel:
    image: ghcr.io/steel-dev/steel-browser@sha256:21cf2a5785aa9478d0f7933c04bce96ca79f3d7a93d9824ea184800d29d3cd02
    container_name: agentops-steel
    restart: unless-stopped
    environment:
      HOST: 0.0.0.0
      PORT: "3000"
      DOMAIN: steel.srv1356245.hstgr.cloud
      LOG_STORAGE_ENABLED: "true"
      LOG_STORAGE_PATH: /data/logs/browser-logs.duckdb
      CHROME_HEADLESS: "true"
      KILL_TIMEOUT: "600000"
    ports:
      - "127.0.0.1:3030:3000"
      - "127.0.0.1:9223:9223"
    volumes:
      - ./data/steel-logs:/data/logs
      - ./data/steel-exports:/tmp/steel-browser-exports
      - ./data/steel-cache:/app/.cache
    shm_size: 512m
    mem_limit: 2048m
    cpus: 1.5
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://127.0.0.1:3000/v1/health >/dev/null || wget -qO- http://127.0.0.1:3000/v1/health >/dev/null"]
      interval: 30s
      timeout: 10s
      start_period: 60s
      retries: 5
YML
docker compose up -d steel
for i in $(seq 1 40); do curl -fsS -o /dev/null http://127.0.0.1:3030/v1/health 2>/dev/null && break; sleep 3; done
echo "health: $(curl -s http://127.0.0.1:3030/v1/health)"
SID=$(curl -s -X POST http://127.0.0.1:3030/v1/sessions -H 'Content-Type: application/json' -d '{}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
echo "session: $SID"
curl -s -o /dev/null -w "cdp version: %{http_code}\n" http://127.0.0.1:9223/json/version
curl -s -X POST "http://127.0.0.1:3030/v1/sessions/$SID/release" >/dev/null && echo "released"
echo "mem: $(docker stats --no-stream --format '{{.MemUsage}}' agentops-steel)"
EOF
scp /tmp/p2-steel.sh hos-vps:/tmp/p2-steel.sh && ssh hos-vps 'bash /tmp/p2-steel.sh'
```
Expected: `health: {"status":"ok"}`, a session id, `cdp version: 200`, `released`.

---

### Task 4: Traefik routes for LDR (native login) and Steel (basic-auth)

- [ ] **Step 1: Append routers/services**

```bash
cat > /tmp/agent-ops-p2.py <<'EOF'
import pathlib
p = pathlib.Path('/docker/traefik-vplw/dynamic/agent-ops.yml'); s = p.read_text()
if 'agentops-ldr:' not in s:
    s = s.replace('  routers:\n', '''  routers:
    agentops-ldr:
      rule: "Host(`ldr.srv1356245.hstgr.cloud`)"
      entryPoints: [websecure]
      service: agentops-ldr
      tls: { certResolver: letsencrypt }
    agentops-steel:
      rule: "Host(`steel.srv1356245.hstgr.cloud`)"
      entryPoints: [websecure]
      service: agentops-steel
      middlewares: [agentops-basicauth]
      tls: { certResolver: letsencrypt }
''', 1)
    s = s.replace('  services:\n', '''  services:
    agentops-ldr:
      loadBalancer:
        servers: [{ url: "http://127.0.0.1:5050" }]
    agentops-steel:
      loadBalancer:
        servers: [{ url: "http://127.0.0.1:3030" }]
''', 1)
    p.write_text(s)
print(s.count('agentops-ldr'), s.count('agentops-steel'))
EOF
scp /tmp/agent-ops-p2.py hos-vps:/tmp/agent-ops-p2.py && ssh hos-vps 'python3 /tmp/agent-ops-p2.py && sleep 8 && for h in ldr steel; do for i in $(seq 1 8); do code=$(curl -s -o /dev/null -w "%{http_code} ssl=%{ssl_verify_result}" -m 15 https://$h.srv1356245.hstgr.cloud/); case "$code" in *"ssl=0"*) break;; esac; sleep 10; done; echo "$h -> $code"; done; cd /docker/agent-ops && P=$(sed -n "s/^AGENTOPS_BASICAUTH_PASSWORD=//p" .env) && curl -s -o /dev/null -w "steel with auth -> %{http_code}\n" -u "vic:$P" https://steel.srv1356245.hstgr.cloud/v1/health; unset P'
```
Expected: `ldr -> 200 ssl=0` (or 302 to login), `steel -> 401 ssl=0`, `steel with auth -> 200`.

- [ ] **Step 2: External verification**

```bash
ssh -o BatchMode=yes -o ConnectTimeout=25 abacus-tunnel 'for h in ldr steel; do echo -n "$h: "; curl -s -o /dev/null -w "%{http_code} ssl=%{ssl_verify_result}\n" -m 15 https://$h.srv1356245.hstgr.cloud/; done; for p in 3030 3111 3112 5050 8890 9223; do timeout 4 bash -c "</dev/tcp/187.77.12.13/$p" 2>/dev/null && echo "$p OPEN (BAD)" || echo "$p closed"; done'
```
Expected: `ldr: 200/302 ssl=0`, `steel: 401 ssl=0`, all raw ports `closed`.

---

### Task 5: Hermes wiring

**Files:**
- Modify: `/root/.hermes/config.yaml` (backup first), `/root/.hermes/.env` (append only)
- Create: `/root/.hermes/plugins/agentmemory/`

- [ ] **Step 1: Tokens/URLs into the gateway env (append only)**

```bash
cat > /tmp/p2-hermes-env.sh <<'EOF'
set -euo pipefail
cd /docker/agent-ops
umask 077
add() { grep -q "^$1=" /root/.hermes/.env || printf '%s=%s\n' "$1" "$2" >> /root/.hermes/.env; }
add AGENTMEMORY_URL http://127.0.0.1:3111
add AGENTMEMORY_SECRET "$(sed -n 's/^AGENTMEMORY_SECRET=//p' .env)"
add STEEL_BASE_URL http://127.0.0.1:3030
add STEEL_CONNECT_URL ws://127.0.0.1:3030
add STEEL_LOCAL true
add HARNESS_URL https://harness.srv1356245.hstgr.cloud
add HARNESS_TOKEN "$(sed -n 's/^HARNESS_TOKEN=//p' .env)"
add CODER_URL https://coder.srv1356245.hstgr.cloud
add CODER_SESSION_TOKEN "$(sed -n 's/^CODER_SESSION_TOKEN=//p' .env)"
add LDR_URL http://127.0.0.1:5050
grep -oE '^[A-Z_]+=' /root/.hermes/.env | tr -d '=' | tr '\n' ' '; echo; stat -c %a /root/.hermes/.env
EOF
scp /tmp/p2-hermes-env.sh hos-vps:/tmp/p2-hermes-env.sh && ssh hos-vps 'bash /tmp/p2-hermes-env.sh'
```
Expected: the name list now includes `AGENTMEMORY_URL AGENTMEMORY_SECRET STEEL_BASE_URL STEEL_CONNECT_URL STEEL_LOCAL HARNESS_URL HARNESS_TOKEN CODER_URL CODER_SESSION_TOKEN LDR_URL`; mode `600`.

- [ ] **Step 2: Plugin, MCP servers, memory provider, browser CDP**

```bash
cat > /tmp/p2-hermes-config.py <<'EOF'
import pathlib, re, subprocess, sys
p = pathlib.Path('/root/.hermes/config.yaml'); s = p.read_text()
def ensure_block(key, block):
    global s
    if re.search(rf'^{key}:\s*$', s, re.M): return
    s = s.rstrip('\n') + '\n' + block
# MCP servers (stdio). Secrets come from the gateway env, not from this file.
if 'mcp_servers:' not in s:
    s = s.rstrip('\n') + '''
mcp_servers:
  agentmemory:
    command: npx
    args: ["-y", "@agentmemory/mcp"]
    env:
      AGENTMEMORY_URL: "${AGENTMEMORY_URL}"
      AGENTMEMORY_SECRET: "${AGENTMEMORY_SECRET}"
  steel:
    command: npx
    args: ["-y", "github:steel-dev/steel-mcp-server"]
    env:
      STEEL_LOCAL: "true"
      STEEL_BASE_URL: "${STEEL_BASE_URL}"
      STEEL_CONNECT_URL: "${STEEL_CONNECT_URL}"
'''
# memory provider
m = re.search(r'^memory:\n((?:  .*\n)*)', s, re.M)
if m and 'provider:' in m.group(1):
    s = re.sub(r'(^memory:\n(?:  .*\n)*?  provider:)[^\n]*', r'\1 agentmemory', s, count=1, flags=re.M)
elif m:
    s = s.replace(m.group(0), m.group(0) + '  provider: agentmemory\n', 1)
else:
    s = s.rstrip('\n') + '\nmemory:\n  provider: agentmemory\n'
# browser CDP -> Steel
s = re.sub(r'(^browser:\n(?:  .*\n)*?  cdp_url:)[^\n]*', r'\1 ws://127.0.0.1:9223', s, count=1, flags=re.M)
# third-party plugin opt-in
pm = re.search(r'^plugins:\n((?:  .*\n)*)', s, re.M)
if pm and re.search(r'^  enabled:', pm.group(1), re.M):
    if 'agentmemory' not in pm.group(1):
        s = re.sub(r'(^plugins:\n(?:  .*\n)*?  enabled:\s*)\[([^\]]*)\]', lambda mm: f"{mm.group(1)}[{(mm.group(2)+', ' if mm.group(2).strip() else '')}agentmemory]", s, count=1, flags=re.M)
elif pm:
    s = s.replace(pm.group(0), pm.group(0) + '  enabled: [agentmemory]\n', 1)
else:
    s = s.rstrip('\n') + '\nplugins:\n  enabled: [agentmemory]\n'
p.write_text(s)
print('mcp_servers:', 'mcp_servers:' in s, '| memory.provider agentmemory:', bool(re.search(r'^memory:\n(?:  .*\n)*?  provider: agentmemory', s, re.M)), '| cdp:', bool(re.search(r'cdp_url: ws://127.0.0.1:9223', s)))
EOF
cat > /tmp/p2-hermes-wire.sh <<'EOF'
set -euo pipefail
mkdir -p /root/backups/vps-fix-2026-09-02/p2 && cp -p /root/.hermes/config.yaml /root/backups/vps-fix-2026-09-02/p2/config.yaml.pre-p2
command -v node >/dev/null && node --version; command -v npx >/dev/null || { echo "NPX_MISSING"; exit 1; }
npm install -g agent-browser >/dev/null 2>&1 || true
rm -rf /tmp/am && git clone -q --depth 1 --branch v0.9.29 https://github.com/rohitg00/agentmemory /tmp/am
mkdir -p /root/.hermes/plugins && rm -rf /root/.hermes/plugins/agentmemory && cp -r /tmp/am/integrations/hermes /root/.hermes/plugins/agentmemory && rm -rf /tmp/am
ls /root/.hermes/plugins/agentmemory | head
python3 /tmp/p2-hermes-config.py
python3 -c "import yaml; yaml.safe_load(open('/root/.hermes/config.yaml')); print('YAML_OK')"
CLEAN='env -i HOME=/root HERMES_HOME=/root/.hermes PATH=/usr/local/lib/hermes-agent/venv/bin:/root/.local/bin:/usr/local/bin:/usr/bin:/bin'
$CLEAN hermes doctor 2>&1 | grep -iE "browser|plugin|mcp|memory|agentmemory|error" | head -12
grep -q '"active_agents":0' /root/.hermes/gateway_state.json && systemctl restart hermes-gateway || { echo "AGENTS_ACTIVE — not restarting"; exit 1; }
sleep 25; systemctl is-active hermes-gateway
journalctl -u hermes-gateway --since "1 min ago" --no-pager | grep -iE "mcp|agentmemory|steel|plugin|error|traceback" | grep -v Telegram | head -12
EOF
scp /tmp/p2-hermes-config.py hos-vps:/tmp/p2-hermes-config.py && scp /tmp/p2-hermes-wire.sh hos-vps:/tmp/p2-hermes-wire.sh && ssh hos-vps 'bash /tmp/p2-hermes-wire.sh'
```
Expected: `YAML_OK`; `hermes doctor` shows the agentmemory plugin loaded and no browser "dependency not met" line (with `cdp_url` set it should pass; if it still complains, `agent-browser` is installed globally as the fallback); the gateway restarts `active` and its log shows the two MCP servers connecting (tool counts) without tracebacks. Hermes config interpolation: if `${VAR}` in `mcp_servers.env` is not expanded by 0.20.4, replace the two values with the literal values read from `/root/.hermes/.env` (file is already 600) and note it.

- [ ] **Step 3: End-to-end proofs through Hermes**

```bash
ssh hos-vps 'CLEAN="env -i HOME=/root HERMES_HOME=/root/.hermes PATH=/usr/local/lib/hermes-agent/venv/bin:/root/.local/bin:/usr/local/bin:/usr/bin:/bin"; cd /root; timeout 240 $CLEAN hermes chat -Q -q "/chat Use the agentmemory tool to store this fact: the agent-ops platform smoke test ran on 2026-09-03. Then search agentmemory for \"agent-ops platform smoke test\" and reply with exactly the stored text." 2>&1 | tail -4; timeout 240 $CLEAN hermes chat -Q -q "/chat Using the steel browser tool, open https://example.com and reply with the exact text of the page h1." 2>&1 | tail -4'
```
Expected: first reply contains `agent-ops platform smoke test ran on 2026-09-03`; second reply contains `Example Domain`. If the agent cannot see a tool, `hermes doctor` / gateway log names which MCP failed — fix the MCP entry, do not skip.

---

## Rollback
`cd /docker/agent-ops && docker compose rm -sf agentmemory ldr searxng steel`; remove their router/service blocks from `agent-ops.yml`; restore `/root/.hermes/config.yaml` from `/root/backups/vps-fix-2026-09-02/p2/config.yaml.pre-p2`; the appended `.env` lines are inert without the services. Restart the gateway only with `active_agents` 0.
