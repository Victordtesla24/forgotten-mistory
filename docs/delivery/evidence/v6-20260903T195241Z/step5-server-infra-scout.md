# Step 5 — Server-side infrastructure scout (v6)

Scout run: 2026-09-03, repo `/root/forgotten-mistory` @ `d1fce27f8a28ef6b4ef2df3bf77436e7f5be7bc5`.
Working tree clean apart from the untracked `docs/delivery/` evidence dir.
Nothing was modified, started, stopped or deployed. All probes are read-only.

---

## 0. Verdict summary (failures first)

| Layer | Requirement | Verdict |
| --- | --- | --- |
| Chatbot | R-65..R-74 — server-side inference, strict retrieval grounding, streaming | **PARTIAL** — server inference is live; retrieval and streaming are ABSENT; grounding is client-side only, so it is not a server guarantee |
| Video avatar | R-123..R-138 — WebRTC → streaming STT → retrieval → OpenRouter → streaming ElevenLabs → lip-sync | **ABSENT in production.** PARTIAL as never-built, never-run source under `services/` |
| Telemetry | R-87 / R-183 — first-party, cookieless, no personal data | **ABSENT** — no collector, no beacon, no analytics of any kind |
| Data refresh | R-108 / R-182 — deploy-time refresh from real GitHub + YouTube APIs | **PARTIAL** for GitHub (real API, but manual, not deploy-time); **ABSENT** for YouTube (zero references in the repo) |

---

## 1. `services/` inventory — four services, none installed, none running

Complete file listing (`find services -type f -not -name package-lock.json`, sizes in bytes):

```
186	services/api-gateway/Dockerfile
712	services/api-gateway/package.json
21911	services/api-gateway/src/index.ts
964	services/api-gateway/src/lib/metrics.ts
3565	services/api-gateway/src/lib/provider-error.ts
952	services/api-gateway/src/lib/ttft-benchmark.ts
1559	services/api-gateway/src/providers/gemini-provider.ts
959	services/api-gateway/src/providers/index.ts
577	services/api-gateway/src/providers/interface.ts
1154	services/api-gateway/src/providers/local-llama-provider.ts
427	services/api-gateway/src/providers/mock-provider.ts
1179	services/api-gateway/src/providers/openai-provider.ts
4074	services/api-gateway/src/realtime/grpc-client.ts
1651	services/api-gateway/src/realtime/realtime_orchestrator.proto
501	services/api-gateway/src/types.ts
8145	services/api-gateway/src/viseme/__tests__/bridge.test.ts
16930	services/api-gateway/src/viseme/bridge.ts
12260	services/api-gateway/src/viseme/elevenlabs-ws.ts
1442	services/api-gateway/src/viseme/smoother.ts
229	services/llm-engine/Dockerfile
187	services/realtime-orchestrator/Dockerfile
462	services/realtime-orchestrator/package.json
1651	services/realtime-orchestrator/src/grpc/realtime_orchestrator.proto
6017	services/realtime-orchestrator/src/grpc/server.ts
1636	services/realtime-orchestrator/src/index.ts
1077	services/realtime-orchestrator/src/integrations/did.ts
1817	services/realtime-orchestrator/src/integrations/elevenlabs.ts
3496	services/realtime-orchestrator/src/lib/provider-error.ts
5617	services/realtime-orchestrator/src/orchestrator/session-manager.ts
1559	services/realtime-orchestrator/src/providers/gemini-provider.ts
959	services/realtime-orchestrator/src/providers/index.ts
577	services/realtime-orchestrator/src/providers/interface.ts
1155	services/realtime-orchestrator/src/providers/local-llama-provider.ts
1179	services/realtime-orchestrator/src/providers/openai-provider.ts
1177	services/realtime-orchestrator/src/types.ts
503	services/viseme-bridge/Dockerfile
537	services/viseme-bridge/package.json
10919	services/viseme-bridge/src/index.ts
```

### 1.1 `services/api-gateway` — TypeScript / Fastify 5, entry `src/index.ts`, port 8000

Env contract at `services/api-gateway/src/index.ts:24-36`: `PORT` (default `8000`),
`LLM_PROVIDER` ∈ `local|gemini|gpt4o|mock` (default `local`), `LLM_BASE_URL`
(`http://llm-engine:11434`), `REDIS_URL` (`redis://redis:6379`), `JWT_SECRET`,
`ORCHESTRATOR_GRPC_ADDR` (`realtime-orchestrator:50051`), plus optional
`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `DID_API_KEY`.
Binds `0.0.0.0` at `services/api-gateway/src/index.ts:710`.

Route table (`services/api-gateway/src/index.ts`):

| Line | Route |
| --- | --- |
| 107 | `GET /health` |
| 117 | `GET /metrics` (prom-client) |
| 122 | `GET /ws/viseme/:streamId` (WebSocket) |
| 148 | `POST /api/realtime/session` (→ gRPC orchestrator) |
| 171 | `POST /api/realtime/session/:id/interrupt` |
| 195 | `GET /api/realtime/session/:id/metrics` |
| 227 | `GET /ws/realtime/:sessionId` (WebSocket, bidi gRPC bridge) |
| 301 | `POST /api/chat` |
| 345 | `POST /api/tts/stream` |
| 395 | `POST /api/avatar/streams` (D-ID) |
| 435 | `POST /api/avatar/streams/:id/sdp` (WebRTC SDP relay) |
| 471 / 486 | `GET` / `POST /api/avatar/streams/:id/stats` |
| 503 | `POST /api/viseme/smooth` |
| 520 | `GET /internal/cache/health` |
| 546 / 623 / 643 / 672 | `POST /api/bridge/stream`, `GET .../:id`, `POST .../:id/text`, `POST .../:id/flush` |

Dependencies (`services/api-gateway/package.json`): fastify 5.6.1, @fastify/{cors,jwt,rate-limit,websocket},
@grpc/grpc-js 1.14.0, ioredis 5.7.0, prom-client 15.1.3, zod 3.24.1.
**Has never been installed or built in this checkout** — `find services -maxdepth 2 -name node_modules -o -maxdepth 2 -name dist` returns nothing.

### 1.2 `services/realtime-orchestrator` — TypeScript, gRPC server, port 50051

Entry `services/realtime-orchestrator/src/index.ts`; binds `0.0.0.0:${ORCHESTRATOR_GRPC_PORT}` (default 50051)
at line 36. Wires `SessionManager` (`src/orchestrator/session-manager.ts`) over an LLM provider,
with D-ID (`src/integrations/did.ts`) and ElevenLabs (`src/integrations/elevenlabs.ts`) integrations.
Same install status: never installed, never built.

### 1.3 `services/viseme-bridge` — TypeScript **library, not a service**

`services/viseme-bridge/src/index.ts` is 10,919 bytes of FFT/formant viseme extraction and contains
**no `listen`, no `PORT`, no `WebSocketServer`, no `createServer`, and no imports at all** —
`grep -n "PORT\|listen\|WebSocketServer\|createServer\|import " services/viseme-bridge/src/index.ts`
exits 1 with no output. Yet `services/viseme-bridge/Dockerfile:17-18` does
`EXPOSE 9003` / `CMD ["node", "dist/index.js"]`. Running that image would import a module with no
side effects and exit immediately. It is not a runnable service.

### 1.4 `services/llm-engine` — **Dockerfile only, no source**

The entire service is 4 lines (`services/llm-engine/Dockerfile`):

```dockerfile
FROM ghcr.io/ggerganov/llama.cpp:server
ENV MODEL_PATH=/models/mistral-7b-instruct.Q5_K_M.gguf
EXPOSE 11434
CMD ["--host", "0.0.0.0", "--port", "11434", "-m", "/models/mistral-7b-instruct.Q5_K_M.gguf", "-ngl", "0", "-c", "4096"]
```

`docker-compose.yml:101-105` allocates it `cpus: "6"` / `memory: 12G`. There is no `/models` volume
content and no GGUF in the repo. On this host the whole box shares ~15 GiB (`/etc/aether/ENVIRONMENTS.md`).

### 1.5 Has any of this ever run here? No.

```
$ ps aux | grep -i "forgotten\|mistory\|api-gateway\|realtime-orch\|viseme" | grep -v grep
(no output)

$ systemctl list-units --all | grep -iE "forgot|mistory|viseme|gateway|orchestr|llm-engine|minivic"
  9router.service         loaded active running  9router AI gateway (local-only)
  hermes-gateway.service  loaded active running  Hermes Agent Gateway - Messaging Platform Integration
```

Both matches are unrelated host services. `ls /etc/systemd/system/` contains no forgotten-mistory unit.
`docker ps -a` lists 23 containers (agentops-*, aether-prod-*, nextcloud-*, abentertainment-app-1,
portfolio-project-app-1, traefik, hermes) and **none** from `docker-compose.yml` in this repo.

Last commit touching `services/`: `cdc60d77` — 2026-06-28 — *"feat(overhaul): add viseme-bridge, new E2E/overhaul tests, CI scripts, verification reports"*. Untouched for ~2 months.

---

## 2. `functions/` (Firebase Functions) — the ONE real server-side layer, and it IS deployed

`functions/` contains exactly `index.js`, `package.json`, `package-lock.json`, `.gitignore`.
Sole runtime dependency: `firebase-functions ^5.1.1`; `"engines": {"node": "20"}`.

Two functions are defined (`functions/index.js`):

- `exports.elevenLabsTts` — line 48. `onRequest({secrets:[ELEVENLABS_API_KEY], region:"us-central1", maxInstances:5, timeoutSeconds:30, memory:"256MiB"})`. Voice `0ZJ4kFDo6bZUNQsuULOW` (line 26), model `eleven_turbo_v2_5` (line 28), 600-char cap (line 29).
- `exports.minivicChat` — line 111. `onRequest({secrets:[OPENROUTER_API_KEY], region:"us-central1", maxInstances:5, timeoutSeconds:30, memory:"256MiB"})`. Relays OpenAI-style `{messages}` to `https://openrouter.ai/api/v1/chat/completions` with `model = "meta-llama/llama-3.3-70b-instruct"` (line 23), `temperature 0.6`, `max_tokens 512`, and returns `{text}`.

Hosting rewrites (`firebase.json:12-15`):

```json
{ "source": "/api/tts",  "function": { "functionId": "elevenLabsTts", "region": "us-central1" } },
{ "source": "/api/chat", "function": { "functionId": "minivicChat",  "region": "us-central1" } }
```

`firebase.json:1-8` declares one functions codebase `tts`, source `functions`, runtime `nodejs20`.
Project: `forgotten-mistory` (`.firebaserc`).

### 2.1 Deployed functions (read-only `functions:list`)

```
$ /usr/bin/firebase functions:list --project forgotten-mistory     # firebase-tools 15.25.0
┌─────────────────────┬─────────┬─────────┬─────────────┬────────┬──────────┐
│ Function            │ Version │ Trigger │ Location    │ Memory │ Runtime  │
├─────────────────────┼─────────┼─────────┼─────────────┼────────┼──────────┤
│ elevenLabsTts       │ v2      │ https   │ us-central1 │ 256    │ nodejs20 │
│ minivicChat         │ v2      │ https   │ us-central1 │ 256    │ nodejs20 │
│ ssrforgottenmistory │ v2      │ https   │ us-central1 │ 256    │ nodejs20 │
└─────────────────────┴─────────┴─────────┴─────────────┴────────┴──────────┘
```

`ssrforgottenmistory` is an **orphan**: it appears in neither `firebase.json` nor `functions/index.js`.
It is the leftover Next.js `webframeworks` SSR function from an earlier deploy strategy, still live and
still billable on the project.

### 2.2 Live probes against production

```
$ curl -X POST https://forgotten-mistory.web.app/api/chat \
    -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'
http=200 ct=application/json; charset=utf-8
{"text":"Hello! It's nice to meet you. Is there something I can help you with or would you like to chat?"}

$ curl -X POST https://forgotten-mistory.web.app/api/tts \
    -H 'content-type: application/json' -d '{"text":"hello"}'
http=502 ct=application/json; charset=utf-8 size=44
{"error":"tts_upstream_failed","status":400}
```

`/api/chat` is **PRESENT-AND-RUNNING** with genuine server-side inference.
`/api/tts` is deployed but its ElevenLabs upstream rejects the request (400 → wrapped 502), i.e. the
`ELEVENLABS_API_KEY` secret is invalid or unauthorised for that voice.

Note what the passing `/api/chat` probe proves about **grounding**: I sent a bare user message with no
system prompt and got a generic, ungrounded reply. The function validates only role/length
(`functions/index.js:126-152`); it never injects the persona or the knowledge base. Grounding is
assembled entirely in the browser (`lib/miniVicBrain.ts:197-217 buildSystemPrompt`, sent from
`callOpenRouter` at `lib/miniVicBrain.ts:324-345`). **The server enforces no grounding whatsoever.**

Last commit touching `functions/`: `a5f3af4e` — 2026-06-19 — *"feat(minivic): OpenRouter open-source brain via /api/chat (TC-FR-CHAT)"*.

---

## 3. `app/api/*` — the directory does not exist

```
$ ls -la app/
apple-icon.png  data/  error.tsx  globals.css  icon.png  layout.tsx  loading.tsx
not-found.tsx  page.tsx  performance-benchmark/  robots.ts  sitemap.ts

$ find app -type d
app  app/data  app/performance-benchmark  app/data/portfolio  app/data/generated
```

There is **no `app/api` directory and no route handler anywhere in the repo**. Consequently the
"static export prunes the API routes" premise is false in a stricter way than assumed: there is
nothing to prune, because no Next.js API route was ever written in this tree.

`scripts/build/prune_static_export.mjs:26` prunes exactly one thing and it is not an API route:

```js
const EXCLUDED_ROUTES = ['performance-benchmark'];
```

`next.config.js:42-55` sets `output: 'export'` + `images.unoptimized` only when
`FIREBASE_STATIC_EXPORT === '1'`; the dynamic branch (line 56-72) exists only to emit security headers.
`find out -path "*api*"` returns nothing — the shipped export contains no `/api` artefacts.

The only server surface reachable from the deployed site is therefore the two Hosting rewrites in §2.

---

## 4. Validation scripts — what they assume, and a false-positive readiness trap

### 4.1 What each script assumes

| Script | Boots | Probes | Gate |
| --- | --- | --- | --- |
| `scripts/validate/phase07_llm_ttft.sh` | `services/api-gateway` (`npm install` then `npm run start`), `LLM_PROVIDER=mock PORT=8000` (line 12-13) | `http://127.0.0.1:8000/health` (line 24), then `npm run -s test:ttft` → `src/lib/ttft-benchmark.ts` | TTFT < 800 ms (line 33) |
| `scripts/validate/phase08_tts_latency.sh` | api-gateway on 8000 (line 14); **requires real `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID`** (line 11-12) | `POST http://127.0.0.1:8000/api/tts/stream` (line 36) | TTFB ≤ 600 ms and non-empty audio, best of 5 (line 85) |
| `scripts/validate/phase09_avatar_sync.sh` | api-gateway on 8000 (line 13); **requires real `DID_API_KEY`** (line 11) | `POST /api/avatar/streams`, `POST/GET /api/avatar/streams/:id/stats` (lines 37-53); mints a JWT with `require('jsonwebtoken')` (line 30-34) | reported `latencyMs < 200` (line 56) |
| `scripts/validate/phase10_viseme_bridge.sh` | api-gateway on 8000 (line 11) | `POST /api/viseme/smooth` ×10 (line 30) | every smoothed event ≥ 80 ms, 10/10 (lines 34-43) |
| `scripts/validate/phase21_realtime_pipeline.sh` | `realtime-orchestrator` on gRPC 50051 (line 23) **and** api-gateway on 8000 with `ORCHESTRATOR_GRPC_ADDR=127.0.0.1:50051` (line 27) | `node tests/test_realtime_pipeline.js` with `API_BASE=http://127.0.0.1:8000 WS_BASE=ws://127.0.0.1:8000` (line 37) | none — it parses `.metrics.firstTokenToDoneMs` / `.firstTokenToAvatarMs` and unconditionally writes "PASS" |

### 4.2 FAILURE — `tests/test_realtime_pipeline.js` does not exist

```
$ ls -la tests/test_realtime_pipeline.js
ls: cannot access 'tests/test_realtime_pipeline.js': No such file or directory

$ git log --oneline --diff-filter=D -- tests/test_realtime_pipeline.js
3d6b071 feat(R1-R8): Marvel-grade portfolio overhaul — complete UI/UX redesign
```

It was deleted in `3d6b071` and never restored, yet it is still referenced by
`package.json:42` (`"test:realtime-pipeline": "node tests/test_realtime_pipeline.js"`) and by
`scripts/validate/phase21_realtime_pipeline.sh:37`. **Phase 21 cannot pass.** `npm run test:realtime-pipeline`
is a guaranteed `MODULE_NOT_FOUND`. `phase09` has a second latent break: it `require`s `jsonwebtoken`,
which is in no `package.json` in the repo.

### 4.3 FAILURE — the port-8000 readiness loop passes against a foreign production service

Every one of phase07/08/09/10/21 waits with:

```bash
for _ in {1..45}; do
  if curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
```

On this host, port 8000 is **already** serving 200 — and it is not this project:

```
$ curl -sS -i http://127.0.0.1:8000/health
HTTP/1.1 200 OK
server: uvicorn
{"status":"ok","version":"0.2.0"}

$ ps -o pid,user,cmd -p 5505
5505 root /root/prod/app/apps/api/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

That is the **Aether production API** (`/etc/aether/ENVIRONMENTS.md`: prod api = 8000, guardian-owned).
So the readiness gate breaks out on iteration 1 regardless of whether the gateway ever started, and the
assertions then hit the wrong service:

```
GET  http://127.0.0.1:8000/metrics       → 404
POST http://127.0.0.1:8000/api/chat      → 404
GET  http://127.0.0.1:8000/              → {"detail":"Not Found"}
```

Worse, the scripts also try to *bind* :8000 themselves (`PORT=8000 ... npm run start`), which is a
collision with a guardian-owned production service. Per the orchestration contract §3.6, 8000 is listed
as occupied and app services must bind `127.0.0.1` behind nginx.

### 4.4 Current reachability of every endpoint these scripts probe

```
port 8000  /health → 200   (FOREIGN — Aether prod uvicorn, not this project)
port 50051         → CLOSED (connection refused; gRPC orchestrator not running)
port 9003  /health → 000    (connection refused; viseme-bridge not running)
port 8080  /health → 200   (FOREIGN — HOS Dashboard Server, pid 983, /root/cobol-testing-ato-work/hos-server.py)
```

Port 8080 matters separately: `package.json:7` `"dev:raw": "... next dev -p 8080"` would fail to bind,
because 8080 is held on `0.0.0.0` by the HOS dashboard.

### 4.5 The committed PASS reports are stale, not evidence

`reports/phase07/phase07-llm-ttft-report.md` is timestamped `2026-02-28T09:01:52Z` (TTFT 31 ms, mock
provider); `reports/phase21/phase21-realtime-pipeline-report.md` is `2026-02-28T12:15:52Z` and records
`First token to avatar latency: 0 ms` — i.e. the avatar leg produced no measurement even then. These
predate the deletion of `tests/test_realtime_pipeline.js` and cannot be reproduced now.

I did **not** execute any phase script: each one starts a service and binds :8000, which the task
constraints and §3.6 forbid.

---

## 5. Chatbot baseline — `components/MiniVicBot.tsx` (R-65..R-74)

1,561 lines, mounted globally from `app/layout.tsx:4` and rendered at `app/layout.tsx:142` — so it is
present on every page. It is **not** a canned client-side experience, but it is **not** a
retrieval-grounded streaming server chatbot either. The three lines that settle it:

**(a) On the static export it refuses the whole backend path before trying anything**
(`components/MiniVicBot.tsx:1061-1065`):

```tsx
      // Static deployments have no /api routes — go straight to the
      // client-side brain instead of probing endpoints that would 404.
      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "1") {
        throw new Error(OFFLINE_MESSAGE);
      }
```

`next.config.js:88-91` bakes that flag to `'1'` for `FIREBASE_STATIC_EXPORT=1`. So in production
`sendRealtimeMessage()` (`MiniVicBot.tsx:928` → `POST /api/realtime/session`) and the
`/api/chat-with-vic` compatibility route (`MiniVicBot.tsx:1081`) are **dead code** — neither is ever
called by a real visitor.

**(b) The throw is caught and answered by the client-side brain ladder**
(`MiniVicBot.tsx:1127-1135` → `askMiniVicBrain`). That ladder is `lib/miniVicBrain.ts:367-402`:

1. **Tier 1 — `POST /api/chat`** (`lib/miniVicBrain.ts:322-324`, `CHAT_ENDPOINT = '/api/chat'`) → the
   live `minivicChat` Firebase Function → OpenRouter `meta-llama/llama-3.3-70b-instruct`.
   **This is real server-side inference, and §2.2 proves it answers 200 in production.**
2. Tier 2 — direct browser→Gemini `generateContent` with the referrer-restricted
   `NEXT_PUBLIC_GEMINI_API_KEY` (`lib/miniVicBrain.ts:222-260`).
3. Tier 3 — deterministic keyword matching over `app/data/miniVicKnowledge` (`knowledgeAnswer`).

**(c) The shipped bundle confirms the real production wiring.** The local `out/` build is
byte-identical to what is live:

```
$ md5sum out/_next/static/chunks/app/layout-e0b4d6ac7372434a.js  <live copy of same file>
5dd7a99bad7f2691aec0385851717522  out/_next/static/chunks/app/layout-e0b4d6ac7372434a.js
5dd7a99bad7f2691aec0385851717522  /tmp/.../layout.js
```

and in that chunk: `"/api/chat"` appears **1×**, `/api/tts` appears **0×**, and an `AIza…` Gemini key
is inlined **1×**.

### 5.1 What is missing against R-65..R-74

- **No streaming.** `functions/index.js:159-190` awaits the entire OpenRouter JSON and returns one
  `{text}` object. No SSE, no chunked transfer, no `stream: true`. `lib/miniVicBrain.ts:336-352`
  does a single `await response.json()`. The only streaming code in the repo is
  `services/api-gateway/src/index.ts:301` — unbuilt and unreachable.
- **No retrieval.** There is no index, no embedding, no chunk selection. `lib/miniVicBrain.ts:70-72`
  concatenates the *entire* knowledge base into one static string and stuffs it into every prompt:
  ```ts
  const GROUNDING_FACTS: string = knowledgeBase
    .map((entry: KnowledgeEntry) => `- ${entry.answer}`)
    .join('\n');
  ```
  That is prompt-stuffing, not retrieval, and it does not scale or cite.
- **Grounding is not enforced server-side.** See §2.2 — the function accepts any `messages` array.
  A client that omits the system prompt gets an ungrounded model. R-65..R-74's "strict retrieval
  grounding" cannot be satisfied by a component the browser controls.
- **Cloned-voice TTS is switched off in code**, not merely broken
  (`components/MiniVicBot.tsx:826-840`):
  ```tsx
   * (Server-side cloned-voice TTS is not provisioned — see the body — so we no
   * longer POST /api/tts, which only 502'd per reply.)
   ...
    // ... Voice the reply directly with
    // the browser's speech synthesis in a MALE voice ...
    speakText(text);
  ```
- **STT is browser-only** — `window.SpeechRecognition ?? window.webkitSpeechRecognition`
  (`components/MiniVicBot.tsx:530-539`). No server-side STT exists anywhere in the repo.

---

## 6. Host infrastructure available to serve a server-side layer

### 6.1 `/etc/aether/ENVIRONMENTS.md` (auto-generated 2026-09-03T19:51:42Z)

Two live environments: **prod** — `https://aether.srv1356245.hstgr.cloud`, api `8000`, web `3200`,
pg `5434`, redis `6381`, repo `/root/prod/app` @ `bb5f5f01`; and an ephemeral **ci** workspace at
`/opt/actions-runner/_work/aether-job-career-agent/...`. Every environment has an autonomous guardian
on a 15-minute systemd timer, and the manifest is explicit: *"Do not perform environment or server
management yourself."* Live console at `http://127.0.0.1:9400/logs/...`.

### 6.2 Port allocation (orchestration contract §3.6, lines 254-281)

Convention: web `3200–3299`, API `8000–8099`, Postgres `5430–5449`, Redis `6380–6399`, `9400` reserved.
**Bind app services to `127.0.0.1` only and expose them through nginx.** `3000`, `3001`, `1024` are
bound to `0.0.0.0` by other tenants and must not be imitated.

Observed now (`ss -tlnp`), occupied: 22, 53, 1024, 1080, 2222, 3000, 3001, 3002, 3010, 3020, 3030,
3040, 3111, 3200, 3400, 5050, 5434, 5436, 5440, 5599, 5678, 6381, **8000**, **8080**, 8095, 8099,
8443, 8644, 8791, 8890, 9119, 9222, 9223, 9400, 20128, 24282, 35380, 43774, 65529, 80, 443.

**Free and in-convention for this project:** API tier `8001–8079`, `8081–8094`, `8096–8098`;
web tier `3201–3399`; Redis `6380`, `6382+`. The repo's own defaults — api-gateway `8000`
(`services/api-gateway/src/index.ts:25`, `docker-compose.yml:31,44`) and `next dev -p 8080`
(`package.json:7`) — **both collide with live foreign services and must be reallocated.**
gRPC `50051` and viseme `9003` are free.

### 6.3 nginx

```
$ ls -la /etc/nginx/sites-enabled/
ab-chatbot -> /etc/nginx/sites-available/ab-chatbot
horizon.conf -> /etc/nginx/sites-available/horizon.conf
orch-mon

$ grep -ril "forgotten\|mistory" /etc/nginx/
(no matches)
```

**There is no nginx vhost for forgotten-mistory.** nginx itself is running (pids 1398-1402) on
`0.0.0.0:8099`, `127.0.0.1:8095`, `0.0.0.0:8443`; ports 80/443 are held by `traefik` (pid 3580).
Standing up a public server-side layer would require a new vhost plus a routing decision against traefik.

### 6.4 Credentials present on the host (names only — values never read)

`~/.claude/.env.production` defines, among others:
`OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`,
`DI_D_API_KEY` (note the typo — the repo expects `DID_API_KEY`), `GITHUB_PERSONAL_ACCESS_TOKEN`,
`PERPLEXITY_API_KEY`, `DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`, `ANTHROPIC_API_KEY1`, `DATABASE_URL`,
`NEXT_PUBLIC_SITE_URL`, `PRODUCTION_WEBSITE_URL`.
**There is no `YOUTUBE_API_KEY` anywhere on this host.**

The repo has **no `.env`** — only `.env.example` (names: `ALLOWED_ORIGINS`, `API_GATEWAY_URL`,
`DID_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `GEMINI_API_KEY`, `IMAGE_TAG`,
`JWT_SECRET`, `LLM_BASE_URL`, `LLM_PROVIDER`, `NEXT_PUBLIC_REALTIME_WS_URL`, `OPENAI_API_KEY`,
`ORCHESTRATOR_GRPC_ADDR`, `REDIS_URL`).

---

## 7. Telemetry (R-87 / R-183) — ABSENT

```
$ grep -rn "sendBeacon\|navigator.sendBeacon\|/api/telemetry\|/collect" --include=*.ts --include=*.tsx app components lib
(no matches)
```

The only files containing the string "telemetry" are prose: `components/MiniVicBot.tsx:114,126`
(persona blurb and a sample prompt) and content data files. There is no collector endpoint, no beacon,
no first-party analytics, and no third-party analytics either (no Plausible/Umami/GA).

`tests/overhaul/telemetry-stability.spec.ts:6-35` documents why: `lib/githubTelemetry.ts` and the
`#telemetry-panel` were **deleted** after a 2026-07-09 production outage (a `useSyncExternalStore`
returning a fresh object from `getSnapshot()` → React #185 → the root error boundary replaced the whole
page). The surviving spec is a render-stability regression guard, not a telemetry test — it explicitly
records that "TS-03 was deleted with its subject". Nothing replaced the telemetry layer.

---

## 8. Deploy-time data refresh (R-108 / R-182) — PARTIAL (GitHub), ABSENT (YouTube)

**GitHub — real API, but manual and not wired to the build.**
`scripts/build/harvest_repos.mjs:1-17` states its own terms:

```
 * Run by hand, not by the build. The metrics printed in "What is keeping me
 * busy" are dated rather than live, for two reasons: a static site cannot query
 * the GitHub API at request time anyway, and a build that depends on a network
 * call is a build that fails for reasons that have nothing to do with the code.
 ...
 * Usage:  node scripts/build/harvest_repos.mjs          (needs an authenticated `gh`)
 * Writes: app/data/generated/repo-harvest.json
```

It shells out to the real GitHub API via `execFileSync('gh', ['api', path, ...])`
(`scripts/build/harvest_repos.mjs:35-42`) over six repos (`OWNER = 'Victordtesla24'`, lines 23-31), and
writes `null` — rendered as "not harvested" — for anything the API declines, so it never fabricates.

But it is **not** in either build script. `package.json:9-10`:

```
"build":        "rm -rf .next && node scripts/build/cv_fingerprint.mjs && node scripts/build/feedback_log.mjs && NODE_ENV=production next build",
"build:static": "rm -rf .next out && node scripts/build/cv_fingerprint.mjs && node scripts/build/feedback_log.mjs && NODE_ENV=production FIREBASE_STATIC_EXPORT=1 next build && node scripts/build/prune_static_export.mjs",
```

`app/data/generated/repo-harvest.json` is 2,092 bytes, last written 2026-09-03 11:03 — by hand.
`.github/workflows/deploy.yml` never invokes it (its only GitHub-API touch points are
`secrets.GITHUB_TOKEN` for Lighthouse status at lines 677 and 705).

**YouTube — nothing at all.**

```
$ grep -rn "api\.github\.com\|youtube\.googleapis\|GITHUB_TOKEN\|YOUTUBE_API_KEY" \
    --include=*.mjs --include=*.js --include=*.ts --include=*.tsx --include=*.yml --include=*.sh .
next.config.js:31:  ... connect-src 'self' ... https://api.github.com ...
.github/workflows/deploy.yml:677:  repoToken: ${{ secrets.GITHUB_TOKEN }}
.github/workflows/deploy.yml:705:  repoToken: ${{ secrets.GITHUB_TOKEN }}
```

Zero YouTube references. `app/data/portfolio/listen.ts` contains no `youtube`, `videoId` or `embed`.
The CSP does allowlist `frame-src https://www.youtube.com` (`firebase.json` / `next.config.js:32`) —
a leftover from a removed embed. No YouTube Data API call exists, and no key for one is on the host.

---

## 9. Verdicts in full

**1. R-65..R-74 chatbot — PARTIAL.**
PRESENT-AND-RUNNING: server-side inference. `minivicChat` (`functions/index.js:111`) is deployed
(`functions:list`) and answered a live production probe 200 with a genuine OpenRouter
`meta-llama/llama-3.3-70b-instruct` completion. The shipped bundle (md5 `5dd7a99b…`, byte-identical to
live) calls `/api/chat` and the client brain ladder puts it first (`lib/miniVicBrain.ts:372-375`).
ABSENT: streaming (single JSON reply, no SSE anywhere in the served path), retrieval (whole-KB prompt
stuffing at `lib/miniVicBrain.ts:70-72`), and server-enforced grounding (the function accepts arbitrary
`messages`; grounding is built in the browser and is trivially bypassable). Cloned-voice output is
disabled in code (`MiniVicBot.tsx:826-840`) and `/api/tts` 502s upstream.

**2. R-123..R-138 real-time conversational video avatar — ABSENT (production); PARTIAL as source.**
A substantial, coherent implementation exists on disk: api-gateway realtime + D-ID + WebRTC-SDP +
viseme routes (`services/api-gateway/src/index.ts:148,227,395,435,503`), a gRPC orchestrator
(`services/realtime-orchestrator/src/index.ts:36`), an ElevenLabs WS client
(`services/api-gateway/src/viseme/elevenlabs-ws.ts`) and an FFT viseme extractor
(`services/viseme-bridge/src/index.ts`). None of it has ever been installed (no `node_modules`, no
`dist` under `services/`), none of it runs (no process, no systemd unit, no container, no nginx vhost),
50051 and 9003 are refused, `services/llm-engine` is a Dockerfile with no source, `viseme-bridge` is a
library that cannot serve despite `EXPOSE 9003`, and the browser never calls any of it because
`MiniVicBot.tsx:1063` short-circuits first. There is **no server-side STT anywhere** — only the
browser Web Speech API — so the "streaming STT" leg of the required pipeline does not exist even as
source. Last touched 2026-06-28.

**3. R-87 / R-183 first-party telemetry — ABSENT.**
No collector, no beacon, no analytics. The previous telemetry layer (`lib/githubTelemetry.ts`) was
deleted after the 2026-07-09 outage and nothing replaced it
(`tests/overhaul/telemetry-stability.spec.ts:6-35`).

**4. R-108 / R-182 deploy-time data refresh — PARTIAL (GitHub) / ABSENT (YouTube).**
`scripts/build/harvest_repos.mjs` hits the real GitHub API through `gh api` and honestly marks missing
metrics `null`, but it is explicitly hand-run (line 3), is absent from both `build` and `build:static`
(`package.json:9-10`) and from `.github/workflows/deploy.yml`. YouTube has no code, no data, and no key
anywhere in the repo or on the host.
