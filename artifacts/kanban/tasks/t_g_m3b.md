# t_g_m3b — G-M3b — stream MiniVic answers from the Cloud Run origin directly (Firebase Hosting buffers SSE): browser first token < 1.5 s on live, /api/chat kept as the real fallback

**Status:** todo · **Priority:** 97 · **Parents:** — · **Created:** 2026-09-05T13:31:34.400Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). From t_g_m3's decision memo (docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md): Hosting rewrite /api/chat → minivicChat returns first byte == last byte (1836 ms P50) while the same SSE request direct to https://minivicchat-hjdyjsrzvq-uc.a.run.app streams (665 ms P50 first byte, 1521 ms total). The function already applies CORS for https://forgotten-mistory.web.app (functions/index.js applyCors). Implement: (1) lib/miniVicBrain.ts streams from the origin URL when configured — the run.app hostname is deploy-specific so it lives in ONE config point (a NEXT_PUBLIC_MINIVIC_ORIGIN build-time value written by scripts/build (read from a committed config, not a secret — the URL is public) or app/data/generated/), never hard-coded in a component; (2) on any failure of the direct route (network/CORS/5xx/timeout 1.5 s to first byte) fall back to the existing POST /api/chat through Hosting — a REAL fallback that keeps answering, never a fabricated reply; (3) firebase.json CSP connect-src extended to the origin host (and any preconnect <link> for it in app/layout.tsx); (4) the warm ping also targets the origin so the instance is hot on the direct path; (5) tests: node:test for the route selection + fallback, e2e MV-WIRE on the static server (origin unreachable locally → fallback to /api/chat path exercised), and a LIVE browser measurement after deploy: Enter→first visible token, 5 warm trials at 1440 + 5 at 390 — PASS only if P50 < 1500 ms; record P95 and the cold first send. (6) Keep the client light: no new dependency.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read 08-decision-first-token.md, functions/index.js (applyCors, SSE frames, warm branch), lib/miniVicBrain.ts + components/MiniVicBot.tsx as merged on origin/main (G-M1 + G-M3 client slices), firebase.json headers/CSP, tests/e2e/minivic-send-path.spec.ts, tests/minivic_chat_function.test.mjs.
- S-2 TDD: node:test for pickChatRoute/fallback (origin configured → origin first; origin failure → /api/chat; no origin configured → /api/chat) RED; e2e asserting the request order on the wire RED.
- S-3 Implement (1)-(4); build:static must embed the origin constant; verify the CSP header on the built firebase.json serves connect-src with the origin.
- S-4 PUSH RULE (RECTIFY): tsc + lint + build:static + audit 10/10 → ledger → commit → push (merge origin/main immediately before). Then battery + live browser measurement after the consolidation deploys (poll the live build-commit meta) → 07-prod-verification/ + follow-up evidence commit.
- S-5 Report P50/P95/cold honestly; R3 PASS on the latency clause only if P50 < 1500 ms in the browser on live.

## QUALITY GATES
- node:test + e2e red → green
- Live browser TTFT P50 < 1500 ms (n≥5, 1440 and 390) — else the exact numbers + the next honest step
- Fallback to /api/chat proven on the wire when the origin is blocked (route-intercept)
- CSP connect-src carries the origin; 0 console CSP violations on live; tsc, lint, audit 10/10; ledger; pushed

## VERIFICATION
```bash
node --test tests/minivic_chat_route.test.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5619 npx playwright test tests/e2e/minivic-send-path.spec.ts --workers=1
curl -sI https://forgotten-mistory.web.app/ | grep -i content-security-policy | grep -o 'connect-src[^;]*'
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T13:31:34.465Z)
running — dispatched 13:31Z — analyst-programmer xhigh, isolated worktree, port 5619

## COMMENT (2026-09-05T13:54:12.392Z)
LANE RESULT (8978c2c + 16144a0 evidence, live 8978c2c4+): browser Enter→first visible token on LIVE — P50 683 ms / P95 799 (1440, n=5 warm), P50 711 / P95 1285 (390); cold 774/980 ms; route = origin root https://minivicchat-hjdyjsrzvq-uc.a.run.app/ 200 on 12/12 sends; fallback to the Hosting rewrite proven on the wire (MV-ORIGIN-01 aborts the origin at network layer → origin,hosting + rendered reply); MV-ROUTE-01..09 9/9, 72/72 node contract, 6/6 e2e; CSP connect-src carries the origin on live, 0 CSP violations / 0 pageerrors in 12 loads; function CORS max-age deployed. Was 1836 ms via Hosting. Awaiting INDEPENDENT reviewer on live before R3-latency PASS.

## COMPLETE (2026-09-05T14:04:38.070Z)
INDEPENDENT REVIEWER PASS on live 753bc5ad/5a8c8c34 (G-REV/411650c2/08-adversarial-review.md, 1062dc6, own probe): Enter→first visible bot text 1440 cold 821 / warm P50 732 / P95 994 ms; 390 cold 644 / P50 594 / P95 741 — 12/12 under 1500 ms; one chat request per send (POST origin 200 text/event-stream), 0 dead endpoints, 0 WebSockets; warm pings on open 15/15; CSP connect-src carries the origin, 0 violations, 0 pageerrors in 15 loads; reply grounded (ATO, Payday Super, Agile Kookaburras…) and progressive (31→172→355 chars over 300 ms samples); fallback REAL: origin refused → /api/chat 200 with a grounded reply 3/3 (1655–2134 ms, one shot — Hosting buffering, recorded as a limitation, never a latency PASS). Caveats recorded: observer stops on bubble chrome (<1 frame overstatement), 'cold' is metronome-warm. False-positive register empty.
