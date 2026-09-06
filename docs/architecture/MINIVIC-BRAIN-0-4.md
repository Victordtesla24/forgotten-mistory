# MINIVIC-BRAIN-0-4 — §0.4 provider ladder, honest labels, and the first-token budget

**Task:** `t_w1_r2sa` · solutions-architect (`sa-w1-r2`) · read-only architecture pass
**Date of every measurement below:** 2026-09-06, 00:1xZ–00:3xZ, from VPS `srv1356245`
**Gaps addressed:** G-R2 (§0.4 routing + `MINIVIC LIVE` badge), G-M4 (chat latency), G-R3 (realtime avatar)
**Hands off to:** `t_w1_r2ap` (analyst-programmer). **No app code is edited by this task.**

Every number in this document came out of a command run inside this task. Nothing is
estimated; where a figure is an inference from two measured figures it is written as a
subtraction and both operands are shown.

---

## 1. Measurements

### 1.1 Provider account state (key names only — no secret value is printed or logged)

Keys read by name from `/root/.claude/.env.production` with
`grep -E '^<NAME>=' … | head -1 | cut -d= -f2-`. The file contains each key **twice**;
without `head -1` the reader produces a two-line Authorization header and every request
silently fails — that is why an earlier probe in this session returned nothing.

| Rung | Endpoint probed | HTTP | TTFB | Body (verbatim, trimmed) |
|---|---|---|---|---|
| `openrouter` | `/api/v1/chat/completions` `meta-llama/llama-3.3-70b-instruct` | **402** | **0.080 s** | `Insufficient credits. Add more using https://openrouter.ai/settings/credits` |
| `deepseek` | `/v1/chat/completions` `deepseek-v4-flash` | **402** | **0.918 s** | `Insufficient Balance` |
| `deepseek` | `/v1/chat/completions` `deepseek-chat` | **402** | 0.643 s | `Insufficient Balance` |
| `zai` | `/api/paas/v4/chat/completions` `glm-4.6` | **429** | **0.668 s** | `code 1113 — Insufficient balance or no resource package. Please recharge.` |
| `openai` | `/v1/chat/completions` `gpt-4.1-mini` | **200** | 2.121 s (from the VPS; from Cloud Run it is inside the origin totals in §1.3) | answered |

**OpenRouter account balance** — `GET /api/v1/auth/key` and `GET /api/v1/credits`:

```
auth/key : usage 527.695786591 · limit null · limit_remaining null · is_free_tier false
credits  : total_credits 2890.5 · total_usage 2895.884318264
balance  = 2890.5 − 2895.884318264 = −5.384318264 USD   (overdrawn)
```

The key itself is unrestricted (`limit: null`); it is the **account** that is out. The
minimum top-up that restores the OpenRouter rung is **USD 5.39**; **USD 25** is the
recommended figure — at `llama-3.3-70b-instruct` list pricing that is thousands of
128-token MiniVic answers.

**OpenRouter free-tier models were tested as a way to keep OpenRouter first *and*
answering with no top-up, and they do not work for this product.** `:free` aliases of the
ladder's models are gone (`404 — This model is unavailable for free`). Of the 22 currently
zero-priced models, three were run with MiniVic's real system prompt and `max_tokens: 128`:

| Model | HTTP | TTFB | total | content |
|---|---|---|---|---|
| `nvidia/nemotron-3.5-lightning:free` | 200 | 0.246–0.483 s | **3.40–3.43 s** | leaks chain-of-thought — `Here's a thinking process: 1. **Analyze User Input:**…` |
| `dots-studio/dots-3-note-preview:free` | 200 | 0.545–0.616 s | 2.19–2.29 s | `message.content` **null** |
| `liquid/lfm-2.5-2.6b:free` | 200 | 0.239–0.522 s | 1.32–1.93 s | `message.content` **null** |

All three are slower end-to-end than the rung that answers today and none returns a usable
recruiter-facing sentence. Free models are **rejected** as the OpenRouter rung's model.

### 1.2 Anthropic-over-OAuth relay feasibility (S-2(4))

`claude -p 'Reply with the single word ready.' --model sonnet --output-format json --max-turns 1`,
run twice back to back on this VPS. The harness did **not** refuse it.

| Run | `ttft_ms` (first token) | `duration_api_ms` | `duration_ms` | wall (`/usr/bin/time`) | `total_cost_usd` |
|---|---|---|---|---|---|
| cold | **2112** | 1424 | 2943 | **9.79 s** | 0.2192748 |
| warm | **3130** | 2287 | 3703 | **9.23 s** | 0.2020312 |

Warm first token **3.130 s** — against the S-3(a) threshold of **< 1.2 s**. It fails by
2.6×, and the wall clock (9.2 s per single-word reply) is what a relay would actually
serve, because each `claude -p` turn re-ships a ~50 k-token harness prompt
(`cache_creation_input_tokens` 49 303–53 881) at **USD 0.20 per trivial answer**.

### 1.3 Live chat latency — Hosting rewrite vs Cloud Run origin

Probe: `POST` with `{"messages":[{"role":"user","content":"In one sentence, what did Vikram do at the ATO?"}]}`.
First-token time is read by a Node script that timestamps the first non-empty `delta`
event on the SSE body (`/tmp/fm_ft_probe.mjs`, written and run in this task).

**Honesty note on "cold":** `minivicChat` runs `minInstances: 1` (`functions/index.js:653`),
so a read-only probe from this VPS cannot force a scale-to-zero cold start. **Every row
below is a WARM sample.** The 2.17 s cold figure in the review stands unreproduced here and
is quoted as the reviewer's, not re-measured as mine.

`POST https://forgotten-mistory.web.app/api/chat` — **Hosting rewrite, SSE**

| # | headers (first byte) | **first token** | total | provider / model | `x-timer` |
|---|---|---|---|---|---|
| 1 | 1.291 s | 1.306 s | 1.313 s | `openai` / `gpt-4.1-mini` | `VE1102` |
| 2 | 1.344 s | 1.367 s | 1.420 s | `openai` / `gpt-4.1-mini` | `VE991` |
| 3 | 1.822 s | 1.869 s | 1.882 s | `openai` / `gpt-4.1-mini` | `VE1334` |
| 4 | 1.584 s | 1.586 s | 1.624 s | `openai` / `gpt-4.1-mini` | `VE1300` |
| 5 | 1.476 s | 1.497 s | 1.501 s | `openai` / `gpt-4.1-mini` | `VE1268` |

Hosting JSON mode: 1.122 / 1.544 / 1.397 s. `curl -w %{time_starttransfer}` ×5:
1.319 / 1.154 / 1.308 / 0.991 / 1.090 s (median **1.154 s**).

`POST https://minivicchat-hjdyjsrzvq-uc.a.run.app` — **Cloud Run origin, SSE**

| # | headers (first byte) | **first token** | total | provider / model |
|---|---|---|---|---|
| 1 | 0.761 s | **0.762 s** | 1.157 s | `openai` / `gpt-4.1-mini` |
| 2 | 0.822 s | **0.823 s** | 1.846 s | `openai` / `gpt-4.1-mini` |
| 3 | 0.689 s | **0.691 s** | 1.248 s | `openai` / `gpt-4.1-mini` |

Origin `curl` TTFB (non-stream): 1.169 / 1.220 / 1.834 s; `connect` 0.044–0.087 s,
`appconnect` 0.110–0.143 s. Hosting `connect` 0.014 s, `appconnect` 0.095 s.

`provider` was **`openai` / `gpt-4.1-mini` on all 11 live samples.** Zero `openrouter`.

### 1.4 Where the Hosting time goes — decomposed from the two tables above

| Component | Measured | How |
|---|---|---|
| **Fastly buffering of the SSE body** | **0.40–1.02 s** | origin `total − first token`: 1.157−0.762, 1.846−0.823, 1.248−0.691. On Hosting the same body arrives with `headers ≈ first token ≈ total` (Δ 15–47 ms), i.e. the stream is collapsed to one chunk. |
| Hosting edge hop (VPS→Fastly→origin, incl. TLS) | 0.211 / 0.429 / 0.548 / 0.324 / 0.233 s — median **0.324 s** | Hosting `total` − `x-timer VE` (the edge's own view of origin time) |
| Ladder tax, dead rungs, **serial** | **1.67 s** | 0.080 (OR 402) + 0.918 (DS 402) + 0.668 (Z.ai 429) from §1.1 |
| Provider generation, 128-token cap | first token 0.691–0.823 s; total 1.157–1.846 s | §1.3 origin rows |
| Function boot | not observable under `minInstances: 1`; reviewer's cold 2.17 s − warm median 1.45 s ⇒ **≈0.7 s** attributable | quoted, not re-measured |

**The single largest and least visible item is Fastly buffering.** `POST /api/chat` has no
first token at all: its first byte *is* the origin's last byte. Any "first-token" number
quoted against the Hosting rewrite is a total-completion number wearing the wrong name.

### 1.5 What the shipped client actually does (correction to the review's framing)

`config/minivic-origin.json` sets `originUrl: https://minivicchat-hjdyjsrzvq-uc.a.run.app`,
and the live bundle carries it — `curl https://forgotten-mistory.web.app/` →
`/_next/static/chunks/611-b50aebf79dc77b8f.js` contains `minivicchat-hjdyjsrzvq`.
`lib/miniVicBrain.ts:212-215, 292` posts to the **Cloud Run origin first** and to
`/api/chat` only as the second route.

So the route a visitor's first send actually takes is the origin one, whose measured first
token is **0.691–0.823 s**. The reviewer measured the *fallback* route. Both numbers are
true; only one describes the product.

---

## 2. Decisions

Taken under docs/prompt.md §0.1 (decide, log, continue) and the §14 rule *narrow the
promise to what is true*. Reversal cost is stated for each.

### (a) Ladder order — `openrouter,deepseek,zai,openai`; `oauth_rung: none`

`DEFAULT_PROVIDER_ORDER` becomes **`"openrouter,deepseek,zai,openai"`**
(`functions/index.js:263`). OpenRouter is first because §0.4 / C-3 says so; OpenAI is
**last** and is labelled in the UI as the fallback that answered. The current
`"openai,openrouter,deepseek,zai"` inverts the contract to buy latency, and §0.4 is not a
latency-conditional rule.

The cost of obeying the contract is the **1.67 s serial dead-rung tax** (§1.1). It is paid
away, not accepted, by (c-2) below — priming the cooldown map on the warm-up ping, during
the seconds the visitor is typing. That is the same reasoning the existing warm-up already
uses, applied to the rungs instead of the container.

**No `anthropic-oauth-relay` rung.** Three independent reasons, in order of finality:

1. **Lawfulness.** A Cloud Function cannot hold the owner's Anthropic OAuth session. The
   only lawful OAuth path is a claude-cli process resident on the owner's VPS, and that is
   still true; the prior SA finding (`t_g2_r2`) is confirmed, not overturned.
2. **Latency.** Measured, not argued: warm first token **3.130 s**, wall **9.23 s** (§1.2)
   — against a 1.2 s bar. A relay would add a VPS hop on top of that.
3. **Quota safety.** There is no per-visitor concurrency or quota guard that could stand
   between anonymous internet traffic and the owner's Max subscription, and at **USD 0.20
   per trivial reply** a single crawler empties it. Naming such a guard was a precondition
   in the task spec; none exists, so the rung is refused.

**And `ANTHROPIC_API_KEY` is not the answer either** — §0.4 forbids it outright, so the
absence of a lawful OAuth path means the Anthropic rung simply does not exist server-side
today. What unblocks §0.4's *intended* happy path is not an Anthropic rung at all: it is
**an OpenRouter top-up of USD 5.39 minimum / USD 25 recommended** (§1.1). Until then the
ladder is honest about walking past OpenRouter and saying which rung answered.

*Reversal cost:* one string in `functions/index.js:263` plus a redeploy, or zero code —
the `CHAT_PROVIDER_ORDER` function env var already overrides it at deploy time
(`functions/index.js:695`).

### (b) Honest labels — the badge, and one truthful line

Three claims are being made by the panel today and two of them are false.

| Where | Today | Becomes |
|---|---|---|
| `components/MiniVicBot.tsx:1112` | `MiniVic Live` | **`MiniVic · synthetic`** |
| `components/MiniVicBot.tsx:1155` | `Vikram's AI clone · ask me anything` | **`A synthetic stand-in for Vikram · ask me anything`** |
| `components/MiniVicBot.tsx:1163-1167` (`data-testid="minivic-synthetic-label"`) | `Synthetic voice · not a recording of Vikram` | **`Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: live text via {provider}`** |

The third line is the one truthful sentence the task asks for, and `{provider}` is **read
at runtime** — never hard-coded. Before the first answer it reads
`Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: live text`; after an answer
it names the rung that actually produced it (`… via openai`, and `… via openrouter` on the
day the account is topped up). If the offline knowledge base answered, it says
`Answers: offline knowledge base` — because on that turn the answers are not live.

This requires a real plumbing fix, not a copy change. `lib/miniVicBrain.ts:45` declares
`BrainSource = 'openrouter' | 'knowledge' | 'fallback'` and `askMiniVicBrain` (line 445)
returns **`source: 'openrouter'` unconditionally** — a hard-coded provider claim that has
been false on every one of the 11 live samples in §1.3. `callChatFunction` throws away the
`provider` field the function already sends (`functions/index.js:751, 756`). The provider
must be carried from the wire to the label.

`MiniVic Live` may only return if a Higgsfield/WSS realtime avatar is actually live.
`tests/monochrome/gold-semantics.spec.ts:85-86` asserts the old string and must be updated
in the same commit.

*Reversal cost:* three strings and one plumbed field; no data model changes.

### (c) G-M4 — the honest first-token budget, and the smallest changes that hold it

The gate as written ("Hosting `POST /api/chat` TTFB < 1.5 s") measures a path with no
first token (§1.4), on a route the shipped client tries **second** (§1.5). Shrinking
`CHAT_MAX_TOKENS` again would move that number by shortening the answer — the exact
gaming the spec forbids. So the promise is narrowed to what is true, and both numbers are
reported rather than one being hidden:

> **G-M4 acceptance (restated):** on the route the shipped client takes first — the Cloud
> Run origin, `Accept: text/event-stream` — **first token < 1.5 s on a cold probe**,
> measured as the timestamp of the first non-empty `delta`. The Hosting rewrite is
> recorded alongside as the buffered fallback, with its first byte reported as what it is:
> the origin's completion time plus the edge hop. Measured today, warm: origin first token
> **0.691 / 0.762 / 0.823 s**; Hosting first byte **0.99–1.87 s**.

Four changes, ranked by measured leverage. Only the first two are required for the gate.

1. **c-1 — Prime the provider cooldowns on the warm-up ping** *(removes 1.67 s from the
   cold path; this is what makes (a) affordable)*. `isWarmRequest` currently 204s and does
   nothing (`functions/index.js:665-671`). Have it also fire, at most once per 10 minutes
   per instance, a `max_tokens: 1` probe at every rung in **parallel** and write the
   results into `providerCooldowns`. Dead rungs cost nothing (402/429 are free); a live
   rung costs one token. The visitor is typing while this runs, and the map self-heals the
   moment an account is topped up — it is measurement, not an assumption baked into code.
2. **c-2 — Classify a balance-flavoured `429` as a credential failure.** Z.ai signals
   exhaustion with **HTTP 429**, not 402 (§1.1: `code 1113 — Insufficient balance`), so it
   lands in `RATE_LIMIT_COOLDOWN_MS` (60 s) instead of `CREDENTIAL_COOLDOWN_MS` (10 min)
   and is re-tried roughly every minute at **0.668 s** a time. A 429 whose body matches
   `/insufficient balance|no resource package|quota|recharge/i` takes the 10-minute
   cooldown.
3. **c-3 — Keep `minInstances: 1` and `CHAT_MAX_TOKENS = 128` exactly as they are.** Both
   are already correct and neither is to be tuned to chase this gate. Do **not** lower the
   token cap further.
4. **c-4 — Publish the origin-first route in the evidence pack, not just in the bundle.**
   The origin route is already live (§1.5); the reviewer measured Hosting because nothing
   told them which route the client takes first. This is a documentation fix that costs
   nothing and prevents the same false FAIL next round.

**Explicitly rejected:** lowering `CHAT_MAX_TOKENS`; a `?warm=1` that pre-generates a real
answer to prime a cache; any change that moves first *byte* without moving first *token*;
and a VPS `systemd` warm timer — the upstream providers are stateless HTTPS endpoints with
no session to keep hot, `minInstances: 1` already owns container warmth, and c-1 covers
rung state from inside the function where it belongs. A timer would add a moving part and
a credential surface on the VPS for no measured gain.

*Reversal cost:* c-1 and c-2 are additive and behind the existing cooldown map; deleting
them restores today's behaviour exactly.

#### Addendum, 2026-09-06 (t_w1_r2c) — the origin race policy, restated after the adversarial review

The independent review of `ec53e2b4`
(`docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/08-adversarial-review.md`)
found that the client made the cold send **worse**, not better, and the finding is
accepted in full. Three facts, each measured on live by the reviewer, not by us:

| Fact | Number | Where |
|---|---|---|
| Origin cold first token (≥10 min idle, sample 1 of 7) | **2 449.2 ms** | F1 |
| Origin warm first token (samples 2–7) | 470–880 ms, median 714.8 ms | F1 |
| The client's abort on the direct rung | `setTimeout(() => abort(), 1500)` | F2 |

The abort fired at 1 500 ms; the first token arrived at 2 449 ms. Because
`functions/index.js` writes the SSE headers on the **first fragment** (`beginStream`,
so that a ladder which fails on every rung can still answer 502 rather than a 200 with
an error inside it), that 1 500 ms "first-byte" deadline was in fact a **first-token**
deadline. On a cold cooldown map it therefore killed the origin request on exactly the
send the gate measures, and the visitor paid 1 500 ms of aborted request **and then the
buffered Hosting fallback in full**.

**The policy now, in one sentence:** the origin stays primary, its budget is derived
from the measured cold walk rather than from the R3 bar, and a stream that has begun is
never discarded.

Concretely, in `lib/miniVicRoute.mjs` / `lib/miniVicBrain.ts`:

1. `DIRECT_FIRST_BYTE_TIMEOUT_MS` is **2 600 ms** — the 2 449 ms worst observed cold
   first token plus a small margin. It is a *ceiling on producing nothing*, not a
   target: a warm origin answers in 470–880 ms and never approaches it.
2. The deadline is cleared by `clearTimeout(firstByte)` the instant the response
   headers land, which for this function is the instant the first token is on the wire.
   **No origin stream whose first token has arrived can be aborted**, whatever the clock
   says — that is the property the review asked for, and it is a code invariant, not a
   number.
3. An origin that has produced *nothing at all* by 2 600 ms is still abandoned for the
   Hosting rung. Abandoning it then is right: it has no answer to lose, and the buffered
   path is the better remaining bet well inside the 14 s overall timeout.
4. `tests/minivic_chat_route.test.mjs` MV-ROUTE-07 now asserts the *relationship*
   (`deadline > measured cold first token`, and still ≤ 4 s) rather than the literal
   `1500` it used to pin, so a future edit that reintroduces the defect fails the suite
   instead of passing it.

**Rejected alternative:** starting the Hosting fallback speculatively when the origin's
headers are late and racing the two. It doubles the upstream spend on precisely the cold
request that already walks three dead rungs, and it needs a "discard the loser" rule that
is easy to get wrong in exactly the way (2) forbids. The single-primary policy above gets
the same worst case for one request's cost.

**Warm priming, corrected (F3).** `?warm=1` returned 204 through Hosting on `GET` but
**400** on `POST`, and every browser run recorded `net::ERR_ABORTED` against both warm
pings. Two causes, both fixed: `isWarmRequest` was GET-only, so a POST fell through to
the send path and was rejected `messages_required` (it now accepts a POST that carries
the explicit flag *and* no `messages` — a POST with a conversation in it is still a send,
always); and the client fired the ping without ever reading the response, which the
browser cancels, so it now consumes the body and sets `keepalive`.

**Observability, corrected (F5).** The `done` event and the JSON body now carry
`attempts: [{ provider, outcome, ms }]` — the same rung walk that already went to the
log. §0.4's ladder order is now readable from a response instead of inferred from a
latency step. Provider ids and outcome codes only: no key, no URL, no upstream body.

### (d) G-R3 — the realtime avatar stays OPEN

**G-R3 remains OPEN and must not be reported as PASS:** the full realtime
Higgsfield-avatar path (live generation + `wss://` viseme stream) is not shipped, and the
LLM budget it shares is measurably empty — the OpenRouter account is **overdrawn by USD
5.384318264** (§1.1) — so what ships in the meantime is the honest label of (b) plus the
latency work of (c), and the gap stays on the backlog with that credit fact attached.

---

## 3. Exact edits for `t_w1_r2ap`

Line hints are against the tree at the time of writing; match on the quoted text, not the
number.

| # | File | Line hint | Change |
|---|---|---|---|
| E1 | `functions/index.js` | 263 | `DEFAULT_PROVIDER_ORDER = "openai,openrouter,deepseek,zai"` → `"openrouter,deepseek,zai,openai"`. Replace the block comment above it (lines 238-262) with the §1.1 measurements and the §2(a) reasoning — the current comment argues for OpenAI-first and would become a lie. |
| E2 | `functions/index.js` | 182-186 | Add `BALANCE_IN_429 = /insufficient balance\|no resource package\|quota exhausted\|recharge/i` beside `CREDENTIAL_FAILURE_STATUS`, citing Z.ai `code 1113`. |
| E3 | `functions/index.js` | 553-558 | In the rung catch, a `429` whose body matches `BALANCE_IN_429` takes `CREDENTIAL_COOLDOWN_MS`, not `RATE_LIMIT_COOLDOWN_MS`. |
| E4 | `functions/index.js` | 665-671 | In the `isWarmRequest` branch: respond `204` **first**, then fire-and-forget `primeProviderCooldowns()`. Guard with a module-level `lastPrimedAt` so it runs at most once per `CREDENTIAL_COOLDOWN_MS` per instance. Never let it reject into the request path. |
| E5 | `functions/index.js` | new, near 493 | `async function primeProviderCooldowns()` — `Promise.allSettled` over `resolveChatProviders()`, one `max_tokens: 1` request each, 3 s timeout, writes only into `providerCooldowns`. No throw, no log of key material. |
| E6 | `lib/miniVicBrain.ts` | 45 | `BrainSource` gains the real rung ids: `'openrouter' \| 'deepseek' \| 'zai' \| 'openai' \| 'knowledge' \| 'fallback'`. |
| E7 | `lib/miniVicBrain.ts` | 305-317 | `callChatFunction` returns `{ text, provider }`: from the SSE `done` event's `provider`, or from the JSON body's `provider`. `readStreamedReply` must surface it too. |
| E8 | `lib/miniVicBrain.ts` | 445-449 | `askMiniVicBrain` returns `source: <provider from the wire>` — delete the hard-coded `source: 'openrouter'`. Unknown/absent provider ⇒ `'fallback'`, never a guess. |
| E9 | `components/MiniVicBot.tsx` | 1112 | `MiniVic Live` → `MiniVic · synthetic`. |
| E10 | `components/MiniVicBot.tsx` | 1155 | `Vikram's AI clone · ask me anything` → `A synthetic stand-in for Vikram · ask me anything`. |
| E11 | `components/MiniVicBot.tsx` | 1163-1167 | The `minivic-synthetic-label` paragraph becomes the runtime truth line of §2(b), reading the provider from the last `BrainReply.source`. Keep the `data-testid`. |
| E12 | `tests/monochrome/gold-semantics.spec.ts` | 85-86 | Retarget from `MiniVic Live` to `MiniVic · synthetic`. |
| E13 | `docs/delivery/evidence/.../G-M4/` | new | Record the §1.3–§1.5 protocol and numbers so the next reviewer measures the origin route. |

**No `scripts/ops` timer is required** (see §2(c), rejected list).

**Deploy (from a worktree with `functions/node_modules` installed):**

```bash
cd functions && npm ci && cd ..
firebase deploy --only functions:minivicChat --project forgotten-mistory --non-interactive
```

Client edits (E6–E12) ship through the ordinary static pipeline
(`npm run build:static` → push to `main`).

---

## 4. TDD cases — written and failing before any of §3 is implemented

### 4.1 `tests/minivic_chat_function.test.mjs` (node --test)

| Name | Assertion |
|---|---|
| `MV-ORDER-01 — the default ladder starts at openrouter` | `DEFAULT_PROVIDER_ORDER.split(',')[0] === 'openrouter'` |
| `MV-ORDER-02 — openai is the last rung, never the first` | `DEFAULT_PROVIDER_ORDER.split(',').at(-1) === 'openai'` |
| `MV-ORDER-03 — every rung is still in the default order` | the split set equals `['openrouter','deepseek','zai','openai']` — no rung silently dropped |
| `MV-PROV-04 — the answer carries the rung that produced it` | `completeChat` with a stub where `openrouter` 402s and `deepseek` answers resolves `{ provider: 'deepseek' }`, and `attempts[0]` is `{ provider: 'openrouter', outcome: 'http_402' }` |
| `MV-429-05 — a balance-flavoured 429 earns the credential cooldown` | rung returns `429` with body `{"error":{"code":"1113","message":"Insufficient balance or no resource package. Please recharge."}}` ⇒ the rung is skipped on a second `completeChat` call within 10 min (`outcome: 'cooling_down'`) |
| `MV-429-06 — a plain 429 keeps the short cooldown` | body without a balance phrase ⇒ rung is retried after 60 s, not suppressed for 10 min |
| `MV-WARM-07 — the warm ping answers 204 without waiting on any rung` | `isWarmRequest` path resolves 204 and the response is sent before `primeProviderCooldowns` settles (stub the probe with a never-resolving fetch) |
| `MV-WARM-08 — priming records dead rungs and spends at most one token on a live one` | after `primeProviderCooldowns()` against a stub set, dead rungs are in `providerCooldowns` and each probe body carried `max_tokens: 1` |
| `MV-WARM-09 — priming never rejects into the request path` | every stubbed rung throws ⇒ `primeProviderCooldowns()` resolves, does not reject |
| `MV-400-10 — an invalid payload is rejected fast and without a rung` | `{"message":"ping"}` ⇒ `400`, and no provider fetch was called |

### 4.2 `tests/e2e/chatbot.spec.ts` (Playwright)

| Name | Assertion |
|---|---|
| `CB-LABEL-01 — the badge does not claim liveness` | the panel badge reads exactly `MiniVic · synthetic`; `getByText('MiniVic Live')` has count 0 anywhere in the page |
| `CB-LABEL-02 — the truth line names voice, face and answers` | `[data-testid="minivic-synthetic-label"]` matches `/Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: /` |
| `CB-LABEL-03 — the provider is read at runtime, not hard-coded` | route-intercept `**/api/chat` **and** the Cloud Run origin to return `{"text":"…","provider":"deepseek","model":"x"}`; after one send the truth line ends `via deepseek`. Re-run returning `provider: "openrouter"` ⇒ it ends `via openrouter`. Neither string may exist in the bundle as a literal beside that sentence. |
| `CB-LABEL-04 — an offline answer is not called live` | intercept both routes with a 502 ⇒ the truth line reads `Answers: offline knowledge base` |
| `CB-LABEL-05 — the disclosure survives every panel state` | the truth line is visible while idle, while listening and while speaking |

### 4.3 Live measurement protocol the reviewer repeats (G-M4)

1. Leave the site untouched for **≥ 10 minutes** (no `?warm=1`, no panel open) so a second
   instance is genuinely cold.
2. **7 cold samples** against the route the client takes first:
   `POST https://minivicchat-hjdyjsrzvq-uc.a.run.app` with
   `Accept: text/event-stream` and
   `{"messages":[{"role":"user","content":"In one sentence, what did Vikram do at the ATO?"}],"stream":true}`.
   Timestamp the **first non-empty `delta`** — not the headers, not the `done` event.
   **PASS = all 7 first-token times < 1.5 s.**
3. Record, in the same table and without a pass/fail attached, 7 samples of
   `POST https://forgotten-mistory.web.app/api/chat` `%{time_starttransfer}`, labelled
   *buffered fallback — first byte equals origin completion*, with each `x-timer VE` value
   beside it so the edge hop stays separable.
4. Record the `provider` field of all 14 responses. **`openai` is an acceptable answer and
   must be labelled as the fallback rung**; what is not acceptable is the UI claiming a
   different one.
5. Re-run §1.1's `auth/key` + `credits` probe and paste the balance arithmetic, so the
   OpenRouter rung's silence stays evidenced rather than assumed.

---

## 5. Risk register

| Assumption | Mitigation |
|---|---|
| Priming on the warm ping is cheap because dead rungs 402 for free | `max_tokens: 1`, 3 s timeout, at most once per 10 min per instance, `Promise.allSettled` — MV-WARM-08/09 assert both the token cap and the no-reject contract |
| OpenRouter-first costs the visitor nothing once priming lands | If priming is skipped (a visitor who never opens the panel before sending), the cold path pays the measured 1.67 s. The reviewer protocol measures exactly that path; if it fails, `CHAT_PROVIDER_ORDER` reorders without a code change (`functions/index.js:695`) and the failure is logged, not hidden |
| The Cloud Run origin URL stays valid | It is a single config point (`config/minivic-origin.json`) already guarded by `tests/minivic_chat_route.test.mjs` MV-ROUTE-08 against `firebase.json`'s CSP |
| `openai` remains the only funded rung | The label names it at runtime, so a top-up changes the sentence with no deploy. The top-up figure is in §1.1 |
| All §1.3 numbers are warm, not cold | Stated in-line wherever they appear; the cold claim is deferred to the reviewer protocol in §4.3, which is the only place a cold number may be asserted |

---

*Read-only architecture task. No file under `functions/` or `components/` was modified.*
