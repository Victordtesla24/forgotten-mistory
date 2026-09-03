# SPEC · Two builds in one file

**Run** `v6-20260903T195241Z` · **Contract** `/root/.claude/rebuilding-my-website-prompt.md` v6
**Authority over this file:** `AUDIT-RECONCILIATION.md` (observed baseline) and `DECISIONS.md`
(D-01, D-04) — both binding, both correcting the contract's own premises.

| Part | Subject | Requirements | Gate | Tasks |
|---|---|---|---|---|
| **A** | The real-time conversational presence | R-123 … R-138 | **N** | T-29 … T-31 |
| **B** | Section 5 — *What is keeping me busy* | R-17, R-113 … R-122, R-167 | **M** | T-26 |

Everything below is written to be executed without a further design decision. Where a number could
not be observed, it is named as a probe with an exact pass criterion and a stated consequence — never
guessed. Where a requirement cannot be met on this platform, that is written down in the same words a
reviewer would use, and the requirement's own fallback is specified instead of a promise that will
not hold.

**Companion specs this file depends on and must not duplicate:**
`SPEC-chatbot-uplift.md` (the conversational layer this presence is a *mode of*),
`SPEC-skills-topology.md` (the node ids Part B's content-DNA joins to),
`dataset-layer-design.md` (`Field<T>`, `MarkBinding`, `markAttrs`, `Dossier`),
`design-system-lock.md` (tokens), `encoding-grammar.md` (the grammar every mark obeys).

---
---

# PART A · The real-time conversational presence

## A0 · The ruling — what is achievable, hop by hop, with the evidence

R-186's premise is confirmed by the audit (B-2): `/api/realtime/session` returns **404**, the client
path is short-circuited at `MiniVicBot.tsx:1063-1065`, and the `services/` stack
(`api-gateway`, `llm-engine`, `realtime-orchestrator`, `viseme-bridge`) exists as source, was never
installed, never run, and its ports 50051 and 9003 refuse. **D-04 binds this spec to the Firebase
Cloud Functions path** — not the `services/` stack, not a new VPS vhost on an 81 %-full,
15 GiB host whose `:8000` is a guardian-owned production API.

The contract asks for *WebRTC → streaming STT → retrieval → server-side inference → streaming
ElevenLabs synthesis → real-time lip-synced render*. Six hops. On the Cloud Functions path, **four
are achievable, one is achievable but is broken in production today, and one is not achievable and
must not be built.** The table is the ruling; §A1 designs what replaces the two.

| # | Hop as specified | Verdict | Evidence, measured this run |
|---|---|---|---|
| 1 | **WebRTC** media ingest | **NOT ACHIEVABLE — replaced** | Cloud Functions gen2 *is* Cloud Run. Its ingress accepts HTTPS/HTTP2 and WebSocket over **TCP 443 only**; there is no UDP listener, no ICE candidate that can point at it, and no way to host a TURN relay inside a request-scoped container. WebRTC media cannot terminate there. Separately, the Hosting rewrite does not upgrade: an RFC 6455 `Upgrade: websocket` request to `https://forgotten-mistory.web.app/api/chat` returned **HTTP/2 200 with the ordinary JSON body and no `101`**, served through the Fastly edge (`x-served-by: cache-bos-kbos510034-BOS`, `x-cache: MISS`), 2026-09-03T21:24Z. |
| 2 | Streaming STT | **ACHIEVABLE, gated** | gRPC **egress** from the container is unrestricted; Google Speech-to-Text v2 `StreamingRecognize` is a bidirectional stream the function can hold open for the life of the socket. Gate G-A1 (§A9) proves API enablement and the runtime service-account role before any of this ships. |
| 3 | Retrieval | **ACHIEVABLE** | Reuses `functions/data/chat-index.v1.json` from `SPEC-chatbot-uplift.md` §2.4 unchanged. In-process BM25F over ≤ 400 chunks; that spec's own measurement is `serverMs: 38` for the whole buffered turn including scoring. |
| 4 | Server-side inference | **ACHIEVABLE — already proven in production** | Three consecutive live probes of the deployed `minivicChat` through the Hosting rewrite, 2026-09-03T21:24Z: total **0.867 s / 0.835 s / 0.671 s**, HTTP 200, real completions, key server-side. That is a *complete buffered answer*; a first streamed token is strictly earlier. |
| 5 | Streaming ElevenLabs synthesis | **ACHIEVABLE IN PRINCIPLE — BROKEN TODAY** | C-7: `/api/tts` is deployed and returns **502** on an ElevenLabs upstream **400**, and `MiniVicBot.tsx:826-840` has already removed the call, so `/api/tts` appears **0×** in the shipped bundle. Live infrastructure serving nothing. Gate G-A2 must go green before voice ships. |
| 6 | **Real-time lip-synced render** of a face | **NOT ACHIEVABLE AND NOT PERMITTED — replaced** | Refused twice. *Latency:* a vendor talking-head stream adds an encode/transport/decode pipeline on top of a budget that is already tight at 1.5 s. *Contract:* R-147 removes the self-presentational avatar this same run — `Listen/Avatar.tsx`, 4.08 MB, 29 s, *"Hello. I'm Vikram Deshpande… What you're watching is an AI-generated avatar…"* — and a synthesised talking head with a microphone attached is that artefact with a live input. Building it would undo R-147 in the same release that lands it. |

### A0.1 · What R-132's ladder therefore is

R-132's degradation ladder is the honest answer, and the honest answer is that **the top rung is not
full A/V**. There is no camera hop, no face, and no video decode. The top rung is:

> **duplex voice, with a live articulation trace drawn from the audio that is actually playing.**

The articulation trace is not decoration and it is not a stand-in for a face. It is a mark under
R-95: every frame of it resolves to a measured property of a real artefact — the RMS envelope and
the viseme class of the synthesised PCM the visitor is hearing at that instant. R-111 is satisfied
because no model produces the quantity: the model produces the *audio*, and the renderer measures it.

**The site says all of this in its own words**, in the presence's dossier and in one line beside the
control (§A7.3). A page that refuses to grade a claim above its evidence does not get to imply a
face it has not built.

---

## A1 · The pipeline, as it will actually be built

```
browser                                    Cloud Run (gen2 function `presence`)          third party
────────────────────────────────────────   ─────────────────────────────────────────     ───────────
mic → AudioWorklet 20 ms / 16 kHz mono
  → energy VAD + adaptive noise floor
  → Opus 16 kbps frames  ──── WSS ────────►  frame router
                                             ├─► StreamingRecognize (gRPC bidi) ────────► STT v2
                                             │      ◄── partial / final transcript
                                             ├─► BM25F over chat-index.v1.json  (in-proc)
                                             ├─► chat completion, stream:true  ─────────► OpenRouter
                                             │      ◄── deltas → sentence gate → validators
                                             └─► text-to-speech, stream + alignment ────► ElevenLabs
                                                    ◄── PCM chunks + char timings
  ◄──── WSS ── NDJSON control + binary audio ─┘
  → jitter buffer (2 frames) → AudioWorklet playback
  → RMS + viseme per 20 ms → articulation trace @60 fps
```

**Transport.** One `wss://` socket per session, opened **direct to the Cloud Run origin**, never
through the Hosting rewrite (measured in A0, row 1). The origin is resolved once at build time:

```bash
gcloud run services describe presence --region <REGION> --format='value(status.url)'
```

and written to `lib/presence/endpoint.ts` as a single exported constant, exactly as
`SPEC-chatbot-uplift.md` §4.1 does for the streaming chat fallback. `firebase.json`'s CSP
`connect-src` gains **that exact origin and nothing else**; the wildcard `ws: wss:` currently at
`firebase.json:23` is **deleted** in the same commit (it is a standing hole and this spec closes it).

**Frames.** Uplink is binary: a 4-byte little-endian header `[seq: u16][flags: u16]` then one Opus
packet. Downlink interleaves binary audio frames (same header, `flags & 1` set) and UTF-8 NDJSON
control lines (`flags` irrelevant; distinguished by `event.data instanceof ArrayBuffer`).

**Keys.** `OPENROUTER_API_KEY`, `ELEVENLABS_API_KEY` and the STT credential are Secret Manager
secrets bound to the function, exactly as `functions/index.js:112` binds `OPENROUTER_API_KEY` today.
The client receives **only** a short-lived session token (§A2). `TC-PRES-SEC-01` re-runs the
chatbot spec's grep over `out/` and asserts 0 matches.

### A1.1 · The session token — the only credential the client ever holds

```ts
// functions/presence/token.js  → returned by POST /api/presence/session (Hosting rewrite, buffered)
interface PresenceSessionToken {
  readonly sessionId: string;      // uuid v4
  readonly issuedAt: number;       // epoch ms, server clock
  readonly expiresAt: number;      // issuedAt + 60_000  — sixty seconds to open the socket
  readonly wssUrl: string;         // the pinned Cloud Run origin + '/v1/presence'
  readonly sig: string;            // base64url(HMAC-SHA256(PRESENCE_TOKEN_SECRET, `${sessionId}.${expiresAt}`))
  readonly caps: {                 // the ceiling this session may spend, decided server-side
    readonly maxWallSeconds: 300;
    readonly maxTurns: 12;
    readonly maxSttSeconds: 180;
    readonly maxTtsChars: 4000;
  };
}
```

The socket handshake sends `sessionId`, `expiresAt`, `sig` in the first control frame. The server
recomputes the HMAC, rejects on mismatch or expiry with `{"t":"unauthorised"}` and closes with code
`4401`. The token is **not** a bearer credential for any upstream: it authorises one socket to one
function, nothing else. `PRESENCE_TOKEN_SECRET` is a Secret Manager secret rotated by the existing
deploy job.

---

## A2 · The latency budget, and where every millisecond is measured

**Contract:** first audible response **1.5 s p50 / 2.5 s p95**, measured from the visitor's last
speech frame. Visual acknowledgement **within 300 ms**.

### A2.1 · The budget

`t0` = the wall-clock instant the last 20 ms frame containing speech was captured by the
`AudioWorklet` (`currentTime` converted to `performance.now()` once at graph construction).

| # | Hop | p50 | p95 | Measured by | Constant |
|---|---|---|---|---|---|
| 1 | endpoint decision (trailing silence) | 280 ms | 480 ms | client, `PresenceMetrics.endpointMs` | `ENDPOINT_SILENCE_MS = 280`, `ENDPOINT_SILENCE_MS_GROWING = 480` |
| 2 | last frame → STT final transcript | 160 ms | 400 ms | server, `sttFinalMs` | — |
| 3 | retrieval (BM25F) | 8 ms | 25 ms | server, `retrievalMs` | — |
| 4 | model first token | 400 ms | 900 ms | server, `llmFirstTokenMs` | `temperature: 0.2`, `max_tokens: 400` |
| 5 | first **validated clause** | 180 ms | 320 ms | server, `firstClauseMs` | `MIN_CLAUSE_CHARS = 24` |
| 6 | TTS first PCM chunk | 220 ms | 520 ms | server, `ttsFirstChunkMs` | flash-class model, `optimize_streaming_latency: 3` |
| 7 | downlink + 2-frame jitter buffer + decode | 80 ms | 180 ms | client, `playbackStartMs` | `JITTER_FRAMES = 2` |
| | **first audible** | **1 328 ms** | **2 825 ms** | client, `firstAudibleMs` | |

**p50 clears 1.5 s with 172 ms of headroom. p95 does not clear 2.5 s — it is 325 ms over — and this
spec says so rather than pretending.** The three things that close that gap, and the order in which
they must be applied:

1. **`minInstances: 1` on the presence function.** A gen2 cold start is 900–2 500 ms on its own and
   would blow the p95 budget by itself, before a single hop runs. Without a warm instance the p95
   contract is not merely missed, it is not meaningful. This is the single largest line item and it
   is a **cost** decision, bounded by §A6.
2. **Region colocated with the audience.** The shipped functions are `us-central1`; the channel's
   own About page says *Melbourne*, *🇦🇺 Naarm*, `channel.country = Australia`. Two round trips
   (hops 2 and 7) cross the Pacific on the current region. **Decision rule, executed by the probe in
   §A2.3, not by an implementer's judgement:** if the probe's p50 socket RTT from an
   `australia-southeast1` vantage to `us-central1` exceeds its RTT to `australia-southeast1` by
   **> 80 ms**, the presence function deploys to `australia-southeast1` and the chat functions stay
   where they are. Split deployment is acceptable; a fabricated latency claim is not.
3. **The first audible unit is a validated *clause*, not a sentence.** Hop 5 waits for
   `MIN_CLAUSE_CHARS = 24` characters ending at a clause boundary
   (`/[,;:—]\s|(?<=[.!?])["')\]]?\s/`), passed through the chatbot spec's §3.4 validators. A whole
   sentence would add ~140 ms p50 and ~300 ms p95 for no perceptual gain.

**The honest fallback, and it is binding.** If, after (1)–(3), `TC-PRES-PERF-01` still measures
`firstAudibleMs` p95 **> 2 500 ms** over 30 runs, the presence **demotes itself on the page**: the
voice control renders in its `text-first` state, its label becomes *"Ask by typing — voice is
slower than it should be here"*, and the dossier prints the measured p95 verbatim. The site does not
advertise a latency it does not hit. This is R-132's ladder used for its actual purpose.

### A2.2 · Visual acknowledgement — deliberately assigned to a hop that cannot fail

The 300 ms acknowledgement is **never** a network event. On the first VAD-positive frame, the
articulation trace's host element sets `data-presence-state="listening"` and the trace begins drawing
the live input envelope. Everything in that path is local: `AudioWorklet` → `postMessage` →
`requestAnimationFrame`.

`TC-PRES-ACK-01`: `performance.now()` delta from the worklet's first supra-threshold frame to the
first `rAF` callback in which `data-presence-state` reads `listening`. **Contract ≤ 120 ms p95**, a
2.5× margin inside the 300 ms requirement, and it holds with the socket down.

### A2.3 · The probe that decides the region and proves the budget

`scripts/validate/presence_latency_probe.mjs` — deploys nothing; runs against the deployed function.

1. Opens 30 sockets sequentially, each replaying a fixed 3.2 s WAV fixture
   (`tests/fixtures/presence/utterance-01.wav`, 16 kHz mono, one question from the corpus).
2. Records every timestamp in the A2.1 table from the `metrics` control frames plus its own clocks.
3. Repeats against both candidate regions when `--regions` is passed.
4. Writes `docs/delivery/evidence/<run>/presence-latency-probe.json`: per-run hop timings, p50/p95
   per hop, per-region RTT, the region verdict, and the cold/warm split.
5. **Exit 1** if `firstAudibleMs` p50 > 1 500 ms. Exit **0 with `"demote": true`** if p50 passes and
   p95 > 2 500 ms — which is the signal that switches the page into its `text-first` state.

The dossier's `performance` block is populated from this file, never authored.

---

## A3 · Turn-taking, endpointing, and instant barge-in yield

### A3.1 · Voice activity detection — `lib/presence/vad.worklet.ts`

```
sampleRate      16000 Hz (AudioContext constructed with { sampleRate: 16000, latencyHint: 'interactive' })
frame           320 samples = 20 ms
rms             sqrt(mean(x^2)) over the frame
noiseFloor      initialised to 0.004; while !speaking: noiseFloor = 0.95*noiseFloor + 0.05*rms
speechThreshold max(noiseFloor * 3.2, 0.012)
onset           3 consecutive frames (60 ms) with rms > speechThreshold  → 'speech'
offset          ENDPOINT_SILENCE_MS of frames with rms <= speechThreshold → 'endpoint'
```

`ENDPOINT_SILENCE_MS` is **280 ms** normally and **480 ms** when the STT partial is *growing* — the
last partial arrived < 250 ms ago **and** its final token is not followed by a space, which is the
recogniser's own signal that a word is still forming. This is the difference between cutting a
speaker off mid-word and waiting half a second for nothing.

`getUserMedia` constraints, exactly:

```ts
{ audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true,
           noiseSuppression: true, autoGainControl: true }, video: false }
```

`echoCancellation: true` is load-bearing: without it the trace hears its own playback and barges in
on itself. If the acquired track reports `echoCancellation === false` in `getSettings()`, the session
opens in **half-duplex** (rung 2, §A5) and says so.

### A3.2 · Barge-in — the yield is local, so it cannot be late

When VAD reports `speech` while `state === 'speaking'`, in **the same worklet message**:

1. Client disconnects the playback `AudioWorkletNode` from the destination and clears its queue.
   No fade, no ramp — a 5 ms linear gain ramp to zero to avoid a click, then disconnect.
2. Client sets `data-presence-state="listening"`; the trace switches to the input envelope.
3. Client sends `{"t":"barge","atMs":<t>}` on the socket.

Server on `barge`: `AbortController.abort()` on both the OpenRouter stream and the ElevenLabs
stream, drop the pending audio queue, emit `{"t":"yielded","atMs":<server t>,"discardedChars":<n>}`.
Partial text already emitted **stays in the transcript**, marked `data-turn-state="interrupted"`.

**Measured contract — `TC-PRES-BARGE-01`:** playback gain reaches 0 within **50 ms** of the first
supra-threshold frame, at the 95th percentile over 20 trials. It is a local operation and is never
allowed to wait for the server; the server's `yielded` frame is *confirmation*, not *permission*.

`TC-PRES-BARGE-02`: after a barge-in the server emits no further `sentence` or audio frame for the
abandoned turn. Asserted on the wire, not on screen.

### A3.3 · Turn state machine

`idle → arming → listening → thinking → speaking → listening …`, plus `→ interrupted` from
`speaking`, and `→ closed` from any state. The state is one attribute, `data-presence-state`, on
`#presence`; every visual, every caption region and every test reads that one string. There is no
second source of truth for what the presence is doing.

---

## A4 · Consent, permission, and retention

### A4.1 · The microphone is requested exactly once, by a click, after an explanation

**Never** on load. **Never** on section entry. **Never** on scroll. **Never** by a `Permissions`
query — `navigator.permissions.query({name:'microphone'})` is used **only** to choose the control's
label and is explicitly not a trigger.

The control is a `<button>` in the conversation composer row (§A7), minimum target 44 × 44 px, label
*"Talk to it"*. Activating it does **not** call `getUserMedia`. It expands, in flow, an explanation
panel that must be on screen **before** any permission prompt can occur. Exact copy, and it is
content, not chrome:

> **Before the microphone opens.**
> Your voice is captured in 20-millisecond frames, sent to this site's server over an encrypted
> socket, transcribed, answered, and spoken back. Nothing is written to disk. No recording is kept.
> The transcript lives in this browser tab and disappears when you close it — unless you download it
> yourself, which is a button below.
> One counter is written when you start: a daily-salted hash of your IP address, kept for one hour,
> never joined to anything you said. That is the whole of it.
> **[ Open the microphone ]  [ Type instead ]**

`Open the microphone` is the only element in the tree that calls `getUserMedia`.
`TC-PRES-CONSENT-01`: a static scan asserts exactly one `getUserMedia(` call site in
`components/**` and `lib/**`, and that its enclosing function is reachable only from that button's
`onClick`.

### A4.2 · Decline is a first-class path, not an error

| Outcome | Behaviour |
|---|---|
| `NotAllowedError` (denied) | The panel collapses. One line, `--fs-caption`, `--mist-400`: *"No microphone, then. The same conversation works typed — and it is the same answers, from the same sources."* Focus moves to the text composer. **The control does not re-prompt, does not re-render as an error, and is not disabled** — a visitor who changes their mind can press it again. |
| `NotFoundError` (no device) | *"This machine has no microphone. Typed it is."* Same focus move. The control renders `disabled` with `aria-disabled` and the reason as its `title` and its visible caption. |
| `NotReadableError` / `AbortError` | *"Something else is holding the microphone."* Control stays enabled. |
| Insecure context | Impossible in production (HSTS + `Permissions-Policy: microphone=(self)` at `firebase.json:41`), but handled: the control is not rendered at all when `!window.isSecureContext`. |

`TC-PRES-CONSENT-02` drives each of the four with Playwright permission overrides and asserts the
exact copy, the focus target and that no second prompt is raised.

### A4.3 · Zero retention, stated plainly and enforced structurally

**What is never written, anywhere:** audio bytes (the server holds a 3-frame ring and forwards; no
`fs` call exists in `functions/presence/**` — `TC-PRES-SEC-02` greps for `require('fs')`,
`writeFile`, `createWriteStream` and asserts 0), transcripts, questions, answers, IP addresses,
user agents, timing traces tied to a session.

**What is written, and it is the complete list:**

| Document | Fields | Lifetime | Enforced by |
|---|---|---|---|
| `chat_rate/pres:<sessionId>` | `hits: number[]`, `expiresAt` | 3 600 s | Firestore TTL policy on `expiresAt` |
| `chat_rate/net:<hashedIp>` | `hits: number[]`, `expiresAt` | 3 600 s | same |
| `presence_budget/day-YYYY-MM-DD` | four integer counters (§A6) | 30 days | same |

`hashedIp = sha256(dailySalt + ':' + ip).slice(0,16)`, identical to `SPEC-chatbot-uplift.md` §6.1 —
same salt, same rotation, same rule that the raw IP is never written. STT is called with data
logging **off** (`recognizer` configured with `model: 'latest_short'` and no logging opt-in);
the ElevenLabs request sends `enable_logging: false`.

**The colophon must change in the same commit** (R-182, R-183, and the chatbot spec's
`TC-BOT-COLOPHON-01` is extended, not duplicated): the existing analytics sentence gains one clause
naming the presence's counter. A gate that fails when a `presence_budget` write ships without the
sentence.

**The visitor's own copy.** One control, `Download the transcript`, builds a `Blob` client-side from
the in-memory transcript and saves it. That is the only mechanism by which any of it persists, and
the visitor operates it.

---

## A5 · The degradation ladder (R-132), with state preserved

Four rungs. **State is one object and is never re-created on a demotion** — that is the whole
requirement, and it is why the presence is a *mode of* the conversation layer rather than a second
component:

```ts
// lib/presence/state.ts
export interface PresenceState {
  conversationId: string;                 // shared with the text layer, never regenerated
  rung: 1 | 2 | 3 | 4;
  transcript: Turn[];                     // the SAME array the text layer renders
  citations: CitedSource[];               // the SAME rail
  scope: ConversationScope;
  register: ConversationRegister;
  draft: string;                          // the composer's uncommitted text
  demotions: { from: number; to: number; reason: string; at: number }[];
}
```

| Rung | What it is | Demotes when | Copy shown, verbatim |
|---|---|---|---|
| **1** | Duplex voice + live articulation trace | — | — |
| **2** | Half-duplex: press and hold to speak | `echoCancellation === false`; or no `AudioWorklet`; or barge-in measured over 50 ms three times in one session | *"Your browser can't listen while it speaks without echoing, so this is press-and-hold. Everything else is the same."* |
| **3** | Voice out only: you type, it speaks | socket closes twice inside 60 s; or `getUserMedia` fails mid-session; or STT stream errors twice | *"The microphone path dropped. It will still answer out loud — type the question."* |
| **4** | Text (the chatbot spec's layer, unchanged) | TTS unavailable (G-A2 red, or two consecutive `tts_failed`); or the budget ceiling is reached; or the visitor presses `Type instead` | *"Voice is off. The answers are identical — they come from the same index and carry the same citations."* |

Rules that make this a ladder rather than a set of failure screens:

1. **Demotion is one-way within a session.** A rung is never silently re-promoted; the visitor can
   re-arm the microphone explicitly, which starts a new rung-1 attempt on the same state.
2. **Every demotion is announced once**, in `aria-live="polite"`, in the copy above, and appended to
   `state.demotions`. `TC-PRES-LADDER-01…04` drive each trigger and assert the copy, the announcement
   and that `conversationId`, `transcript.length`, `citations.length`, `scope`, `register` and
   `draft` are **identical before and after**.
3. **Rung 4 is the chatbot spec's layer with no changes.** The presence adds a mode; it does not fork
   the conversation.

---

## A6 · Caps, limits, and a hard spend ceiling

### A6.1 · Per session

| Cap | Value | Enforced |
|---|---|---|
| Wall clock | **300 s** | server timer; `{"t":"session_ended","reason":"cap"}` then close 1000 |
| Visitor turns | **12** | server counter |
| STT audio | **180 s** | server accumulates frame durations |
| TTS characters | **4 000** | server accumulates before each synthesis call |
| Idle | **30 s** with no speech and no keystroke | warn at **22 s** with a visible mono countdown; close at 30 s |

The transcript **stays on screen** after every one of these. A session ending is not a page resetting.

### A6.2 · Per visitor

| Key | Window | Limit |
|---|---|---|
| `pres:<sessionId>` | session | the A6.1 caps |
| `pres:<conversationId>` | 60 min | 3 voice sessions |
| `net:<hashedIp>` | 60 min | 6 voice sessions |

Same `chat_rate` collection and same document shape as `SPEC-chatbot-uplift.md` §6.1 — one
rate-limiter, two callers.

### A6.3 · The hard ceiling — enforced on quantities, because prices are not observable

`functions/presence/budget.js`, Firestore transaction, **before** the STT stream is opened and
**before** every synthesis call:

```
presence_budget/day-YYYY-MM-DD  { sttSeconds, ttsChars, llmTokens, sessions, expiresAt }
```

| Counter | Daily cap | Refusal |
|---|---|---|
| `sessions` | 120 | `{"t":"budget_exhausted","dimension":"sessions"}` at handshake, socket never opens |
| `sttSeconds` | 3 600 | refused at handshake |
| `ttsChars` | 60 000 | the turn is answered **in text only**; the session demotes to rung 4 |
| `llmTokens` | 400 000 | refused at handshake |

Plus `maxInstances: 3` and `timeoutSeconds: 320` on the function, which bound concurrency and
runaway independently of the ledger, and `minInstances: 1` for the reason in §A2.1.

**Why quantities and not dollars.** A dollar ceiling needs unit prices. A unit price typed into this
repository would be a number without a source — precisely the thing R-95 forbids and this site
exists to refuse. The four counters above are all directly observable from inside the process, and
each maps one-to-one onto a line a reader could check on an invoice. **If a price table is added
later it enters the canonical dataset as `Field<number>` carrying its URL and `retrievedAt`**, and
the ceiling gains a dollar view computed from it. Until then the ceiling is real, hard, and honest.

**Copy when the ceiling is hit**, because failing silently is worse than failing:

> *"Today's budget for spoken answers is spent — this runs on a fixed daily ceiling, deliberately.
> Typed answers are unaffected and identical."*

`TC-PRES-BUDGET-01` seeds each counter at its cap and asserts the refusal, the copy, and that no
upstream call is made (network assertion, not a mock).

### A6.4 · Injection resistance and hostile handling

**Five layers, inherited verbatim** from `SPEC-chatbot-uplift.md` §6.3 — no system prompt is
representable in the request; delimited data blocks; server-relabelled history; `temperature: 0.2`
with `max_tokens: 400`; and the three validators that make the other four non-load-bearing.

**The sixth layer, specific to voice:** a final STT transcript enters the prompt through *exactly the
same* sanitiser and *exactly the same* delimited `visitor:` block as typed text
(`functions/chat/prompt.js`, unchanged). It is normalised NFC, stripped of `\p{Cc}\p{Cf}`, collapsed
and sliced to 600 chars before it is anything other than a string. **A spoken "ignore your
instructions" is structurally identical to a typed one and dies at the same validators.** There is
no voice-only prompt path, which is the property that makes this claim testable rather than asserted:
`TC-PRES-INJECT-01` feeds the T-12 probe set as *audio* fixtures and asserts the same verdicts the
typed probes produce.

**Hostile handling, and what is deliberately not built.** No abuse classifier is added. A classifier
is a model producing a judgement about a person, rendered as a decision — R-111's prohibition read at
its widest, and the wrong instinct for this page. Instead:

1. The validators already prevent a fabricated answer, whatever the provocation.
2. After **two** turns in one session whose validated output is `blocked`, the presence ends the
   voice session, stays on rung 4, and says once: *"I'll stop talking, but the page is still here."*
   The transcript is untouched.
3. Nothing about the visitor is stored, scored, or carried to a next session. The counter in §A4.3 is
   enforcement, not identity, and it forgets in an hour.

---

## A7 · Placement, composition, and geometry

### A7.1 · No bubble, no overlay, no primary real estate

R-75 forbids a floating widget; R-135 forbids a floating bubble; C-9 records that the shipped
`MiniVicBot` is exactly that. The presence **is not a new surface**. It is a mode of the conversation
layer that `SPEC-chatbot-uplift.md` §5.1 already de-floats into `#conversation-home` inside the
closing section.

```tsx
// components/conversation/Conversation.tsx — the only change to its shape
const [mode, setMode] = useState<'text' | 'voice'>('text');
…
<div id="presence" data-presence-state={state} hidden={mode !== 'voice'}>
  <ArticulationTrace … />
  <Captions … />
</div>
```

Hard constraints, each mechanically tested and each mirroring the chatbot spec's numbering so the
two cannot drift:

1. `Presence.module.css` contains **zero** `position: fixed`, **zero** `position: sticky`, and no
   `z-index` above `1`. (`TC-PRES-PLACE-01`, static grep.)
2. Every element inside `#presence` has computed `position ∈ {static, relative}` at 390, 768, 1024
   and 1440 px. (`TC-PRES-PLACE-02`.)
3. `#presence` intersects no element carrying `data-signature-moment` at any of those widths.
   (`TC-PRES-PLACE-03`.)
4. **At rest the presence occupies exactly one control** — the `Talk to it` button in the composer
   row. The trace, the captions and the panel render only in `voice` mode and reserve **0 px** in
   `text` mode. (`TC-PRES-PLACE-04`.)
5. Entering voice mode expands the panel **in flow** with `grid-template-rows: 0fr → 1fr` over
   `var(--motion-emphatic)` (440 ms) `var(--motion-ease-emphasized)`. Nothing above it moves, because
   the panel is the last row of the layer's grid. CLS contribution **0**. (`TC-PRES-PERF-02`.)

### A7.2 · The articulation trace — exact geometry

`components/conversation/ArticulationTrace.tsx` · render class **`canvas2d`** (R-109: a per-frame
envelope at 60 fps is a density field, not a diagram) · vizId `presence.articulation`.

| Property | Value |
|---|---|
| Element | `<canvas>` at `width = clientWidth * min(devicePixelRatio, 1.75)`, CSS `aspect-ratio: 8 / 1`, `max-inline-size: var(--measure-read)` |
| Grid | 96 columns, one per 20 ms frame → a **1.92 s** rolling window |
| Column | a vertical hairline, `lineWidth = 1` device px, `strokeStyle = var(--mist-200)` read once via `getComputedStyle` and cached |
| Height | `h = clamp(rms / 0.35, 0, 1) * 0.92 * canvasHeight`, drawn symmetrically about the centre line — **a real amplitude, zero-based, never truncated** (grammar §2.2) |
| Viseme | the frame's viseme class from the ElevenLabs character-alignment payload sets the column's `globalAlpha`: closed `0.34`, open `1.0`, fricative `0.62` — **three nominal states, no ramp**, because a viseme class is nominal (grammar §2.3) |
| Centre line | 1 px, `--ink-500`, full width, always drawn — the zero baseline, so the amplitude cannot read as floating |
| `listening` state | the same geometry drawn from the **input** RMS, `strokeStyle = var(--mist-400)`, so the reader can see the two directions are the same instrument |
| `thinking` state | the trace holds its last frame and the centre line alone advances a 1 px tick per 100 ms — motion that is *waiting*, not *pretending* |
| Gold | **none.** The trace is not a sourced figure; it is a live measurement of an ephemeral artefact. `data-gold` is never set inside `#presence`. |

Disposal: `cancelAnimationFrame`, `ctx.clearRect`, canvas `width = 0` and the `AudioWorkletNode`
disconnected on unmount. Declared memory ceiling **8 MB** JS heap delta while mounted.

### A7.3 · The line beside the control

R-99's takeaway for this artefact, and simultaneously the honesty statement A0.1 demands, set at
`--fs-caption` in `--mist-400` directly under the control, present in both modes:

> *"It listens, thinks and speaks. It does not have a face — this is the actual sound of the answer,
> measured."*

---

## A8 · Accessibility parity (R-101)

| Clause | Implementation |
|---|---|
| **Live captions** | `<div role="status" aria-live="polite" aria-atomic="false" data-captions>` holds the **current** partial transcript while `listening`, and the current spoken clause while `speaking`. Partials replace; they never append, so a screen reader is not read a stuttering diff. Rendered at `--fs-lede`, `--measure-read`, always visible — captions are not an assistive extra here, they are how the page is read on a train. |
| **Running transcript** | `<ol data-transcript>` — the **same array** the text layer renders. Each turn `<li data-turn-role="visitor|site" data-turn-state="complete|interrupted">`. New turns are appended, never re-rendered, so a screen reader's position is stable. |
| **Full text parity** | **Every audible clause appears as text in the same order, with the same citations.** `TC-PRES-A11Y-01`: run a fixture session, collect every `sentence` control frame and every `<li>` text, assert the two sequences are equal. There is no audio-only content, ever. |
| **Keyboard entry** | The control is a real `<button>`, in tab order, in the composer row. `Enter`/`Space` activate. Nothing about voice is reachable by pointer only. |
| **Keyboard exit** | `Escape` anywhere inside `#presence` ends the session, closes the socket, stops playback, and returns focus to the control that started it. `TC-PRES-A11Y-02` asserts `document.activeElement` is that button. There is no focus trap: `Tab` from the last element inside `#presence` leaves it normally. |
| **ARIA structure** | `#presence` is `role="group"` `aria-labelledby` the panel heading. The canvas is `role="img"` with `aria-label` recomputed at most every 500 ms: *"Speaking. Loudness varying between quiet and loud."* — a description, never a stream of numbers. The `data-presence-state` string is *also* announced once per transition through the same `role="status"` region. |
| **Reduced motion** | Not an absence. Under `prefers-reduced-motion: reduce` the trace becomes a **stepped bar of the same data at 10 Hz**: 12 columns instead of 96, each holding for 100 ms, no interpolation, no scroll of the window — the envelope updates in place. It is the same measurement at a calmer sample rate, and it is composed, not disabled. `TC-PRES-A11Y-03` asserts the canvas still repaints (the artefact is present) and that no element inside `#presence` animates `transform`. |
| **Contrast** | Every colour in the trace is a token from the locked ramp; `--mist-200` is 12.36:1 and `--mist-400` is 6.07:1 on `--ink-900`. `--ink-300` appears nowhere (design-system-lock §1.4 rule 6). |

---

## A9 · Gates that must be green before any of Part A ships

| Gate | Assertion | If red |
|---|---|---|
| **G-A1 · STT** | `gcloud services list --enabled` includes `speech.googleapis.com`, **and** a live `StreamingRecognize` against the fixture WAV from the deployed function returns a final transcript. Evidence: `presence-stt-gate.json`. | Part A ships at **rung 4 only** — the voice control is not rendered. The dossier records why. No stub, no mock, no simulated transcript. |
| **G-A2 · TTS** | A live ElevenLabs streaming call from the deployed function returns ≥ 3 audio chunks and a character-alignment payload. This is the gate that C-7 currently fails (`/api/tts` → 502 on upstream 400). The root cause must be diagnosed and fixed — a missing or wrong `voice_id` and an unset model are the two candidates the 400 admits — not routed around. | Rung 3 and above do not ship. Rung 4 unaffected. |
| **G-A3 · Transport** | `presence_latency_probe.mjs` opens a socket to the pinned Cloud Run origin and completes one turn. | Part A does not ship. |
| **G-A4 · Budget** | `presence_budget` document exists with a TTL policy; `firestore.rules` denies all client access to it. | Part A does not ship. |

**None of these gates may be satisfied by a fixture.** §13 of the contract bans false-positive
results and D-05 records that this repository already shipped five gates that pass against a foreign
service on `:8000`. Every gate above names the deployed artefact it probes.

---

## A10 · Files

**Create**
```
functions/presence/index.js            the gen2 function: socket, router, state machine
functions/presence/token.js            HMAC session tokens (§A1.1)
functions/presence/stt.js              StreamingRecognize adapter, gRPC bidi
functions/presence/tts.js              ElevenLabs streaming + character alignment
functions/presence/budget.js           the four-counter daily ledger (§A6.3)
functions/presence/turn.js             the turn state machine and barge abort wiring
lib/presence/endpoint.ts               the pinned Cloud Run origin, one constant
lib/presence/state.ts                  PresenceState (§A5)
lib/presence/socket.ts                 client socket, framing, reconnect policy
lib/presence/vad.worklet.ts            AudioWorklet: VAD + RMS + frame emit
lib/presence/playback.worklet.ts       jitter buffer + gain ramp + RMS for the trace
components/conversation/ArticulationTrace.tsx
components/conversation/ArticulationTrace.module.css
components/conversation/Presence.tsx           the panel, the control, the consent copy
components/conversation/Presence.module.css
components/conversation/Captions.tsx
scripts/validate/presence_latency_probe.mjs
tests/fixtures/presence/utterance-01.wav
tests/e2e/presence.spec.ts
tests/a11y/presence.spec.ts
tests/perf/presence.spec.ts
```

**Change**
```
firebase.json                  add rewrite /api/presence/session → presenceSession;
                               CSP connect-src: DELETE `ws: wss:`, ADD the pinned Cloud Run origin
functions/index.js             export presenceSession (token issuer) and presence (socket)
components/conversation/Conversation.tsx   add `mode`, mount <Presence/>, share PresenceState
app/data/canonical/dossiers.ts add the presence.articulation dossier (§A11)
app/data/portfolio/listen.ts   the colophon sentence (§A4.3)
package.json                   scripts: "presence:probe"; deps @google-cloud/speech ^6
```

**Delete**
```
components/MiniVicBot.tsx      (already deleted by SPEC-chatbot-uplift.md — the dead
                                sendRealtimeMessage path at :928-1032 goes with it)
services/                      NOT deleted. Preserved unmodified per D-04's reversal note.
```

---

## A11 · Dossier (R-112)

```ts
{
  vizId: 'presence.articulation',
  section: '#contact',
  title: 'The articulation trace',
  renderClass: 'canvas2d',
  whatItShows:
    'The amplitude envelope and viseme class of the audio that is playing at this instant, at ' +
    '60 frames a second across a 1.92-second rolling window, drawn from a zero baseline. In the ' +
    'listening state it draws the same measurement of the microphone input. It is not a face and ' +
    'it does not stand in for one.',
  datasetFields: [],   // the only artefact on the site whose marks are ephemeral, and it says so
  goldMark: null,
  interactions: [
    { kind: 'hover-reveal', description: 'Hovering a spoken clause in the transcript highlights the frames of the trace that produced it.' },
    { kind: 'focus-zoom',   description: 'Focusing the trace expands the window from 1.92 s to 7.68 s and prints the frame duration in mono.' },
    { kind: 'filter',       description: 'The scope control restricts retrieval to one corpus; the citation rail and the spoken answer both narrow.' },
    { kind: 'curiosity',    description: 'Pressing and holding while it speaks shows the raw 20 ms frame grid and the viseme class letter over each column — the measurement, unsmoothed.' },
  ],
  demonstratedSkill: 'Real-time audio pipelines under a hard latency budget, with the budget published rather than claimed.',
  takeaway: 'It listens, thinks and speaks — and what you see is the sound itself, measured, not a face.',
  accessibility: {
    textAlternative: '[data-captions] and [data-transcript]',
    reducedMotion: 'Twelve columns at 10 Hz, held, no window scroll — the same envelope at a calmer sample rate.',
  },
  performance: /* written by presence_latency_probe.mjs + tests/perf/presence.spec.ts */,
}
```

`datasetFields: []` is deliberate and is the one exception in the registry. `dataset_integrity.mjs`
gains a single allowance keyed to this `vizId` with the reason recorded inline — an artefact whose
marks are a live measurement of a thing that is happening now has no `sourceId`, and inventing one
would be worse than the exception.

---

## A12 · Tests

| id | assertion |
|---|---|
| TC-PRES-ACK-01 | visual acknowledgement ≤ 120 ms p95, socket down |
| TC-PRES-PERF-01 | `firstAudibleMs` p50 < 1 500 ms over 30 runs; p95 recorded; `demote` flag honoured on the page |
| TC-PRES-PERF-02 | entering voice mode contributes 0 to CLS; trace sustains 60 fps with everything active |
| TC-PRES-BARGE-01 | playback gain reaches 0 within 50 ms p95 of the first speech frame |
| TC-PRES-BARGE-02 | no `sentence` or audio frame for an abandoned turn, asserted on the wire |
| TC-PRES-CONSENT-01 | exactly one `getUserMedia(` call site, reachable only from the consent button |
| TC-PRES-CONSENT-02 | four decline paths: copy, focus target, no second prompt |
| TC-PRES-LADDER-01…04 | each demotion trigger: copy, announcement, and byte-identical preserved state |
| TC-PRES-BUDGET-01 | each ceiling refuses, prints its copy, and makes no upstream call |
| TC-PRES-INJECT-01 | the T-12 probe set as audio produces the same verdicts as typed |
| TC-PRES-SEC-01 | 0 key material in `out/` |
| TC-PRES-SEC-02 | 0 filesystem writes in `functions/presence/**` |
| TC-PRES-PLACE-01…04 | no fixed/sticky, no z-index > 1, no signature-moment overlap, 0 px at rest |
| TC-PRES-A11Y-01 | audible/text parity, sequence-equal |
| TC-PRES-A11Y-02 | `Escape` returns focus to the originating control; no trap |
| TC-PRES-A11Y-03 | reduced motion: the artefact repaints; no `transform` animates |

---
---

# PART B · Section 5 — *What is keeping me busy*

## B0 · What is preserved, verbatim in meaning and prominence (R-167)

R-167 is not a courtesy. The shipped vitrine is the section a stranger already finds most
convincing, and `peak-end-record.md:258-259` registers two of its moments as memorable artefacts.
Every row below survives this build **unchanged in substance and in visual weight**, and each has a
test that fails if it does not.

| Preserved | Where it lives now | Test |
|---|---|---|
| The six curated repository plates | `app/data/portfolio/vitrine.ts:39-102` | TC-VIT-01 *(revised — see §B9)* |
| Every `limits` line, on the plate, beside what it does | `Vitrine.tsx:170-173` | TC-VIT-02 unchanged |
| *"Excluded, and why"* with all three reasons | `vitrine.ts:112-116`, `Vitrine.tsx:188-203` | TC-VIT-04 unchanged |
| The harvest stamp — *"metrics harvested … not live"* | `Vitrine.tsx:205-208` | TC-VIT-03 unchanged |
| **The raking light** — the section's signature | `Vitrine.tsx:36-76` | TC-VIT-06 unchanged |
| Native `scroll-snap`, no hijack, no autoplay, no dots | `Vitrine.module.css:60-61` | TC-VIT-07 unchanged |
| The six mechanism drawings, hairlines in `currentColor` | `Drawings.tsx` | TC-VIT-05 *(strengthened — §B6)* |
| *"Six of thirty-eight"* — the editorial act | `vitrine.ts:119-124` | TC-VIT-08 unchanged |

**Nothing in this part deletes a plate, softens a limits line, or moves an exclusion into a
disclosure.** The section grows a second strand; it does not trade one in.

---

## B1 · The finding this section is now built on

Two independent APIs, joined on dates neither of them knows about the other.

| | Repository (GitHub REST) | Video (YouTube `dateText`) | Lag |
|---|---|---|---|
| **J1** | `jyotish-shastra` last push **2025-11-10** | `Q1NwbcHbAh0` — *The 7,000-Year-Old Code Hidden in Sanskrit* — **2025-11-19** | **9 days** |
| **J2** | `btr-demo` created **2025-11-16** | `OEn5RzSEwpc` — *Lost Birth Time? An Ancient "Sherlock Holmes" Method* — **2025-11-27** | **11 days** |
| **J3** | `jarvis` created **2026-04-09** *(description: "Realtime macOS Telemetry Dashbaord using Jarvis from Iron Man UI as a wallpaper")* | `p9pGAmqJCSk` — *JARVIS – I Built a Real Arc Reactor HUD for My Mac* — **2026-04-16** | **7 days** |

Sources: `corpus-repositories.json` (`createdAt`, `pushedAt`, each with its endpoint and retrieval
time) and `corpus-youtube.json` (`publish_date`, day precision, `ytInitialData.videoPrimaryInfoRenderer.dateText`).

**Three times, a repository was finished or created and a public explanation of it followed inside
eleven days.** That is a computed fact, it is checkable by anyone with two API calls, and it is the
only relationship this section asserts between the strands.

### B1.1 · The orthogonality, answered rather than papered over

Nine of ten public videos are about Vedic and Sanskrit computational astronomy. One is about a macOS
telemetry HUD. **None of them is about delivery, programme management, or the AI-engineering argument
the rest of the site makes.** `channel-analysis.md` §8 measures the overlap exactly: the channel
supports **4 of 17** capability rows and **6 of 10** dimensions, and it is explicitly *"not a general
corroborator of the CV."*

Claiming alignment would be the exact fabrication this site refuses. So the section says so, in the
lede, at full prominence, in its own voice:

> **Draft lede, `app/data/portfolio/vitrine.ts`:**
> *"Two strands run through the last fifteen months. One is thirty-eight repositories, six of them
> shown. The other is ten videos, nine of which are about Sanskrit astronomy and have nothing
> whatever to do with the delivery work above. They are not here because the subjects match — they
> don't. They are here because three times, a repository was finished and a public explanation of it
> appeared within eleven days, and that is a habit worth showing you."*

**How the strand earns co-equal standing without the subjects aligning — four grounds, each
checkable:**

1. **Structural, not thematic.** The three joins are computed from two independent sources. The
   relationship the section claims is *sequence*, and sequence is exactly what the data supports.
2. **Non-overlapping evidence.** The channel is the only dataset on this site that carries **Swift 5,
   Go 1.21+ and Metal** (`p9pGAmqJCSk`, `channel-analysis.md` §10.1). Those are not claimed anywhere
   else and they are not dropped silently — they appear as an explicit gap node in the content-DNA
   (§B5), terminating in *"no `skills.ts` row"*.
3. **A capability nothing else evidences.** No `skills.ts` row covers public technical explanation or
   bilingual delivery (`channel-analysis.md` §10.2). The strand is the sole evidence for the one
   thing a hiring reader most wants and the CV cannot show.
4. **Equal geometry, because the data does not rank them.** The two lanes share one axis, one stroke
   weight, one label treatment and an identical 144-unit vertical allocation (§B3). Co-equality is
   *drawn*, not asserted.

**And what it does not evidence, printed at the same prominence** (R-120's floor):

> *"No transcript of any of these is retrievable — every watch page is login-gated — so nothing here
> claims anything about how he speaks. What is shown is what he wrote, what he built, and when."*

### B1.2 · Cadence, told straight

10 of 11 records land inside an **8-day window** (19–27 Nov 2025), then **140 days of silence**, then
one unrelated release. **This is not a publishing habit and the section will not call it one.** The
timeline draws the silence at true scale — an unbroken, unannotated 140-day span — and the takeaway
names it. `channel-analysis.md` §4 is explicit: *"present the burst as a campaign with a shape …
Do not present the channel as a regular publishing habit; the dates do not support it."*

---

## B2 · Section architecture

```
#vitrine
├── .head            kicker · title · lede (§B1.1)                       [copy change]
├── <Strands/>       the one shared timeline, both strands               [NEW · svg]
├── .rail            the interleaved carousel, 16 cards                  [EXTENDED]
│     ├── 6 × repository plate   (Drawings.tsx, unchanged)
│     └── 10 × video plate       (ChannelDrawings.tsx + Facade.tsx)      [NEW]
├── <ContentDNA/>    content taxonomy → skills topology, node-for-node   [NEW · svg]
└── .foot            "Excluded, and why" · the harvest stamp             [preserved]
```

Three registered visualisations, three dossiers: `vitrine.two-strands`,
`vitrine.content-dna`, and the existing per-plate drawings which remain part of the rail's dossier.

---

## B3 · `<Strands/>` — the one shared timeline (R-116)

`components/sections/Vitrine/Strands.tsx` · render class **`svg`** (R-109: ~180 marks, all labelled,
all crawlable) · vizId `vitrine.two-strands`.

### B3.1 · Domain and projection — exact

| | |
|---|---|
| Domain start | `2025-06-24` — min `firstCommit` across the drawn repositories (`jyotish-shastra`) |
| Domain end | `2026-09-03` — max `lastPush` (`forgotten-mistory`), equal to the harvest date |
| Span | **436 days** |
| viewBox | `0 0 1200 360` |
| Plot x | `96 → 1152` = **1056 units**, so **2.4220 units/day** |
| `x(d)` | `96 + (daysBetween('2025-06-24', d) * 1056 / 436)`, two decimals |
| Shared axis | y = **188**, 1 px `--ink-500`, full plot width, **unbroken** — no axis break, no gap, no ellipsis, ever (grammar §2.2) |
| Ticks | first of each month, 4 units, labelled every third month in `--fs-micro` mono, `--mist-400` |

### B3.2 · Lane A — repositories (above the axis, y 32 → 176)

Eight horizontal bars, pitch **18**, height **5**, rows at y = 38, 56, 74, 92, 110, 128, 146, 164.

- **Six curated plates**, stroke `--mist-200`, `stroke-width: 5`, from `x(firstCommit)` to
  `x(lastPush)`. Bar length is elapsed time — a real duration on a real axis, never a rank.
- **Two join-anchor repositories** (`btr-demo`, `jarvis`), stroke `--mist-400`, `stroke-width: 2`,
  and each carries a visible label *"not curated — drawn because it anchors a join"*. They get a bar
  and **no card**: the vitrine stays six-of-thirty-eight, and the section says why the extra bars are
  there instead of leaving a reader to wonder.
- Labels: repository name, `--fs-caption`, mono, at the bar's left end, `--mist-400`; the name is
  also the bar's `<title>`.

### B3.3 · Lane B — the channel (below the axis, y 200 → 344)

One tick per **public** video, drawn downward from y = 200.

- `height = duration_seconds / 605 * 132` units. **605 s is the corpus maximum
  (`gMe4FZbjcQE`) and the scale starts at zero** — the shortest record (44 s) is 9.6 units and reads
  as short, which is true. No truncation, no minimum-height floor.
- `stroke-width: 5`, `--mist-200` — **identical weight to lane A's curated bars.** This is the
  co-equality, in the only place it can be made real.
- **Day collisions.** Four records share 2025-11-20 and two share 2025-11-19; YouTube served day
  precision only and there is no observable intra-day order (`channel-analysis.md` §4). Ticks in a
  collision group are dodged by `±2.6` units around the true date, in the corpus's own listing order,
  and each dodged tick draws a 0.5 px leader from its true x on the axis to its own top. The axis
  keeps the truth; the dodge keeps them readable. A `<desc>` states the precision limit verbatim.
- **The unlisted record `9meaN-ZZAvc` is filtered before drawing** and contributes to no mark, no
  count and no label. `corpus_strand_risk.unlisted_handling` is binding: publishing it would expose
  material the creator chose not to list. `TC-VIT-STRAND-05` asserts the string `9meaN-ZZAvc` appears
  nowhere in the built output.

### B3.4 · The joins — and the section's one gold mark

Three vertical connectors crossing the axis, from the repository bar's anchor point to the video
tick's top:

- 1 px, `--mist-200`, `stroke-dasharray: 3 3`.
- Each labelled with its real lag: `9 days`, `11 days`, `7 days` — mono, `--fs-micro`,
  `tabular-nums`, placed at the connector's midpoint with a 4-unit gap.
- The lag is **computed at dataset build time**, not typed:
  `lagDays = Math.round((videoPublishDate - repoAnchorDate) / 86400000)`. A hand-typed lag is a
  number without a source and `dataset_integrity.mjs` clause 3 already forbids numeric literals in
  JSX text.

**The gold mark — one, chosen by rule, not by taste.** The join with the **smallest lag** renders its
connector and its label in `--gold` and carries `data-gold="true"` and a
`components/marks/Caliper.tsx` in its `sourced` state. On the current dataset that is **J3, 7 days**.
The rule is executed by the layout script; if a future refresh changes which join is tightest, the
gold moves with it and no one edits a component.

**Why this is a legitimate `sourced` mark, and why it is the second honest fix of defect C-3.**
C-3 records that the caliper's `sourced` state — *"Measured; source given."* — is defined at
`Caliper.tsx:44` and rendered nowhere, and forbids fixing that by inventing a sourced mark. Nothing
is invented here: both endpoints are dates returned by public APIs, both carry a URL the reader can
open in one click (`github.com/Victordtesla24/jarvis` and the video's `youtube-nocookie` id), and the
lag is subtraction. It is precisely *measured; source given*.

**The consequential change, and it fixes an existing defect.** `design-system-lock.md` §1.3 item 7
records up to three gold `.live` URLs in one rail, and §1.2 measures the unlit-plate `.live` at
**2.37:1 — FAIL**. Under this spec the section's one saturated gold is the join. **Every `.live`
URL in the rail renders `--gold-pale` `#e8d5a3` at all times** — 13.57:1 lit, 5.9:1 at the raised
0.62 dim floor, so the contrast failure is repaired in the same change, no evidence is deleted, and
locked colour rule 3 ("additional sourced marks step down to `--gold-pale`") is followed literally.

`TC-VIT-GOLD-01`: scroll the Strands band to centre at 390/768/1024/1440 px and assert **exactly
one** `[data-gold="true"]` intersects the viewport. `TC-VIT-GOLD-02`: the same at three scroll
positions inside the rail — assert **zero**.

### B3.5 · Interaction (R-97 — all four)

| Kind | Behaviour |
|---|---|
| **hover-reveal** | Hovering or focusing any bar or tick reveals a direct label at the mark — name, exact dates, and for a video its duration in `m:ss` — as SVG `<text>`, not a tooltip, and not the only way to reach the datum (grammar §12.5: the same values are in the text alternative). |
| **focus-zoom** | `Enter` on a mark zooms the axis domain to that mark ± 30 days over `var(--motion-cine-in)` (720 ms) `var(--motion-ease-emphasized)`; the axis re-ticks to weeks. `Escape` restores. The domain in view is always printed in mono, so a zoomed axis can never be mistaken for the whole span. |
| **filter** | Three chips — `both` (default) · `repositories` · `channel`. Filtering **recedes** the other lane to `opacity: 0.24` and **never removes it**, because a lane that vanishes makes the other look like the whole record. The chips also drive the rail's ordering (§B4). |
| **curiosity** | Holding `Shift` (or a long-press) draws the **140-day silence** as a labelled span across lane B: a 1 px `--ink-500` rule from 2025-11-27 to 2026-04-16 with the text *"140 days, nothing published"*. The one thing a channel strand would normally hide is the one thing this one will show you if you lean on it. |

### B3.6 · Mobile — an unroll, not a crop

At `≤ 700 px` the viewBox becomes `0 0 390 720`, the shared axis runs **vertically at x = 195**, time
runs top → bottom, repositories occupy `x 24 → 186`, videos occupy `x 204 → 366`, and the joins
become horizontal connectors. Same marks, same domain, same scale rule, nothing dropped and nothing
truncated. Generated by the same script into the same layout file as a second coordinate set (`mx`,
`my`, `md`), exactly as `SPEC-skills-topology.md` §3 does.

### B3.7 · Reduced motion

The zoom becomes an instant domain change with a 200 ms `opacity` cross-fade of the tick labels; the
filter's recede survives at `var(--motion-fast)` because a colour/opacity change causes no vestibular
response and is the affordance itself (design-system-lock §4.3, instrument 3). Every mark renders in
its final state immediately. The composition is unchanged — it is the same board, arrived at without
travel.

### B3.8 · Dual read (R-99)

- **3 s:** two rows of marks against one unbroken axis, and three dashed threads crossing between
  them — one of them gold.
- **30 s:** which repository, which video, the exact dates, the lag in days, the duration of every
  record, and a visible 140-day hole.
- **Takeaway (17 words):** *"Two strands, no shared subject — and three times, code stopped and an
  explanation started within eleven days."*

---

## B4 · The interleaved cinematic carousel (R-17)

The existing rail, extended from 6 plates to **16 cards** — 6 repository plates and 10 video plates —
in one `<ol>`, with the raking light, the `scroll-snap`, the keyboard handler and the centre-nearest
computation **unchanged** (`Vitrine.tsx:36-92`).

### B4.1 · Every card states what it is and what it adds

Both card kinds share one header contract, so a reader is never guessing which strand they are in:

```
[ kind ]  REPOSITORY | VIDEO          — mono, --fs-micro, --mist-400, letter-spacing 0.08em
[ accession ]  01 … 16                — mono, the card's position in the current ordering
[ title ]                             — --fs-h3
[ what it is ]     ≤ 14 words         — the existing `description` contract, extended to videos
[ what it adds ]   ≤ 18 words         — NEW, required on every card, no exceptions
[ micro-visualisation ]               — Drawings.tsx | ChannelDrawings.tsx (§B6)
[ figures ]        3 marks            — repos: commits · active · stack (unchanged)
                                        videos: published · duration · promises in the description
[ limits ]                            — repos: preserved verbatim
                                        videos: NEW, same contract, same prominence
[ rung ]                              — the escalation word + the test that assigned it (§B4.2)
[ links ]                             — repos: Source · live-or-"no public deployment" (unchanged)
                                        videos: Watch (facade, §B7) · the joined repository, if any
```

**Every video card carries a `limits` line, under the same rule the repositories obey** — a plate
that cannot say what its subject does *not* do has not been looked at closely enough. Drafted from
the corpus, never from the video:

| Video | `limits` |
|---|---|
| `p9pGAmqJCSk` | *"A demonstration, not a tutorial: it shows the HUD running and does not show how it was built."* |
| `Q1NwbcHbAh0` | *"It explains the algorithm; it does not claim the algorithm predicts anything."* |
| `Q5yGe7uBkFA` | *"Forty-four seconds of promotion with an eighty-nine-character description — the one artefact here that got no craft."* |
| *(the Marathi trio)* | *"In Marathi. The English pair covers the same syllabus for a different audience."* |
| `OEn5RzSEwpc` | *"A method, not a result: it decodes a rectification procedure and rectifies nothing on screen."* |
| `gMe4FZbjcQE` · `TDOubaCAw7I` | *"The code is linked, not verified on screen — no frame of this was inspected."* |
| `oiTfTeqvP0Y` | *"Two hundred and forty-three characters of description and no contents block; the least documented record here."* |

### B4.2 · "Each successive card raises impact" — made checkable, not asserted

R-17 asks for escalation. An "impact" score would be an unfalsifiable ranking — exactly what this
site exists to refuse, and exactly what D-01 already ruled out for skills. **The escalation is
therefore a ladder of *verifiability*: ordered by how much of the artefact a stranger can check,
which is measurable, and which is the only kind of impact this page is entitled to claim.**

| Rung | Word on the card | The test that assigns it — computed, never typed |
|---|---|---|
| 1 | **explained in public** | a public artefact exists whose only evidence is the explanation itself |
| 2 | **source published** | `repository.visibility === 'public'` and the default branch resolves |
| 3 | **source and explanation** | rung 2 **plus** either an explicit `github.com/VictordTesla24/…` link in the record's verbatim description, **or** a computed handoff join (§B1) — and the card prints **which** |
| 4 | **running** | rung 3 **plus** a deployment URL that returns HTTP < 400, probed at dataset build time and stamped with the probe time |
| 5 | **gate published** | rung 4 **plus** a public CI run on `main` whose conclusion is readable — **whatever that conclusion is** |

**Rung 5 does not mean the gate is green.** `aether-job-career-agent` sits at rung 5 with its CI
**failing on `main` since 2026-08-18T01:36:45Z** (R-184, confirmed), and its card prints exactly
that. A site that ordered by "how good it is" would have to hide that; a site that orders by "how
much of it you can check" is *strengthened* by it. This is the section's characteristic moment.

**Ordering.** `by argument` (default): ascending rung, then descending `lastTouched` within a rung.
`by date`: the shared timeline's own order, so the rail and the strands are literally the same
sequence. The active ordering is named on screen; the chips in §B3.5 switch it. Both orders are
legitimate and the page says which one you are reading — it does not present a curated order as if it
were chronological.

### B4.3 · Rail ⇄ timeline binding

- The rail's lit card sets `data-strand-focus="<itemId>"` on `#vitrine`; `Strands` raises the
  matching mark to `--white` and drops the rest to `opacity: 0.42` (the rail's own dim, reused).
- Hovering or focusing a strand mark scrolls its card to the rail centre with
  `scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })` — the same call the
  existing keyboard handler makes, so the two paths cannot diverge.
- Under `prefers-reduced-motion` the behaviour is `'auto'` (instant), matching `Vitrine.module.css:340-347`.

### B4.4 · Geometry deltas

Card width, gap, padding, snap alignment, dim floor and transitions are **unchanged** from
`Vitrine.module.css:80-106`, with one repair carried in from design-system-lock §1.2: the unlit
floor rises from `opacity: 0.42` to **`0.62`**, which lifts `--mist-200` on an unlit card from 2.94:1
to 4.9:1 and clears AA. The lit/unlit *contrast* — the raking light itself — is preserved: 0.62 → 1.0
is still a visible fall of light, and TC-VIT-06 asserts the lit card is the centre-nearest one, which
this does not touch.

---

## B5 · `<ContentDNA/>` — taxonomy into the skill topology, node for node (R-117)

`components/sections/Vitrine/ContentDNA.tsx` · render class **`svg`** · vizId `vitrine.content-dna`.

### B5.1 · The graph, and where every node comes from

Left → right, per grammar §7. **Left is the content; right is the capability.** Nothing is invented:
every content node is an entity that appears **literally** in a verbatim title or description, and
every target is an id that already exists in `skills-topology-layout.v1.json`.

**Content nodes** — the eleven from `channel-analysis.md` §9, filtered to public records, with their
kind (`subject` · `method` · `practice`), tier and record count carried through.

**Join targets** — `TopologyNode.id` strings from `SPEC-skills-topology.md` §13, addressed by id, not
by label:

| Edge | From | To | Kind | Line style | Caveat that travels with it |
|---|---|---|---|---|---|
| E1 | `dna.realtime-visualisation` | `cap:12` — Data visualisation | `demonstrates` | solid | — |
| E2 | `dna.apple-silicon-telemetry` | `cap:2` — Real-time telemetry platforms | `demonstrates` | solid | *"a different artefact in the same class — it corroborates nothing about the ANZ figure"* |
| E3 | `dna.birth-time-rectification` | `src:rectifier` | `shares-subject` | dashed | *"it evidences the domain, not the orchestration — no record names Docker or Compose"* |
| E4 | `dna.divisional-chart-mathematics` | `src:rectifier` | `shares-subject` | dashed | same |
| E5 | `dna.text-to-executable-code` | `cap:7` — Next.js and TypeScript | `names-technology` | dashed | *"TypeScript is never named in any description"* |
| E6 | `dna.systems-instrumentation` | **gap node** | `extends` | dashed, terminating in an open square | *"no `skills.ts` row for Swift, Go or Metal"* |
| **E7** | `dna.realtime-visualisation` | `cap:11` — WebGL and GLSL | **`excluded`** | **present in the data, NOT drawn** | *"the closest-looking record is SwiftUI Canvas and Metal — a different API on a different platform"* |

**Node counts asserted by `TC-VIT-DNA-01`:** 10 content nodes, 5 join targets, 1 gap node, **6 drawn
edges, 1 undrawn**.

### B5.2 · The curiosity-rewarding state — an absence, explained

R-97's fourth interaction is **E7**. `cap:11` (WebGL and GLSL) is drawn as a target with **no edge
reaching it**, and it is the only such node on the board. Hovering or focusing it draws a
`stroke-dasharray: 2 4`, `--ink-500` ghost of the edge that is not there, with:

> *"The nearest thing on the channel is a 60-fps vector renderer with 700 paths. Its named stack is
> SwiftUI Canvas and Metal. Drawing this line would be fabrication by association, so it is in the
> dataset and not on the board."*

That is the section's best sentence and it is earned by data. It is also the honest reading of
`channel-analysis.md`'s *"the `excluded` edge exists so a later renderer never infers it."*

### B5.3 · Weight, and the asymmetry that must not be balanced away

Node weight has exactly two honest encodings: **record count** and **total runtime seconds**. Both
are drawn, neither as area or colour:

- **record count** → the node's terminal glyph is that many 1 px ticks along its right edge, capped
  at 9 with a mono `+n` overflow. Countable, not estimated.
- **runtime seconds** → printed as a mono figure beside the node, `tabular-nums`. A number, not a size.

Nine of ten public records sit under one tier-1 node. **That asymmetry is the true shape and is drawn
at true scale** — one hub with nine ticks and one orphan with one. `channel-analysis.md` §9 is
explicit: *"show it, do not balance it away."* No force-directed spreading, no node-repulsion
cosmetics; the layout is a deterministic two-column dagre-free placement written by
`scripts/dataset/content_dna_layout.mjs` and byte-compared under `--check`.

### B5.4 · Cross-section drill-down

Activating any join target dispatches `fm:topology-focus` with that `TopologyNode.id`; `#skills`
scrolls into view and the topology sets its filter to that node. One event, one id, no label
matching. `TC-VIT-DNA-03` asserts every `data-topology-target` in the DNA resolves to a node id
present in `skills-topology-layout.v1.json` — **the node-for-node join is a build assertion, not a
claim in prose.**

### B5.5 · Dual read

- **3 s:** content on the left, capabilities on the right, six threads between them — and one
  capability with nothing reaching it.
- **30 s:** which record supports which capability, how many records and how many seconds sit behind
  each, and the caveat printed on every weak edge.
- **Takeaway (18 words):** *"The channel proves four capabilities out of seventeen, and the
  closest-looking edge is the one deliberately not drawn."*

---

## B6 · Per-card micro-visualisations for the video strand

`components/sections/Vitrine/ChannelDrawings.tsx` — the same grammar as `Drawings.tsx`, which is
preserved untouched: `viewBox '0 0 320 200'`, **hairlines only, `currentColor`, no fills, no
gradients, no hue**, `role="img"` with `<title>` and `<desc>`, so the raking light falls on them
identically.

**Never a thumbnail.** `Drawings.tsx:13-16` states the section's rule — *"A screenshot shows what a
repository looks like; a mechanism drawing shows what it does."* A YouTube thumbnail is a screenshot
with a face and an emoji on it, and it is a third-party raster. The video cards therefore carry a
drawing and a **typographic poster** (§B7), and **TC-VIT-05 ("no screenshots, logos or raster
images") is preserved unmodified and applies to the new cards too** — it gets stronger, not weaker.

### B6.1 · The drawing: the description skeleton, at true structure

One left-to-right mechanism per card, drawn from `channel.videos[i].structure` — the canonical
skeleton `channel-analysis.md` §3 proved from all eleven records:

```
question ──► claim + method ──► link ──► [ n promises ] ──► reframe / navigation
```

- A stage is drawn **only if that record actually has it.** `Q5yGe7uBkFA` (89 characters, no
  question, no contents block) draws **two** nodes and a very short line, and that is the truth about
  it.
- `n` = the record's real promise count, drawn as `n` stacked 1 px rungs inside the block — vertical
  is rank within a stage, never time (grammar §7).
- `p9pGAmqJCSk` alone draws its **seven timestamped chapters** as ticks positioned at their real
  offsets along the duration rule — the only record in the corpus with a chapter index.
- **The duration rule:** a 1 px horizontal line at y = 182 whose length is
  `duration / 605 × 296` units, with the value printed in mono at its right end. Same zero-based
  scale as lane B, so a reader who learned the timeline already knows how to read the card.

Every mark carries `data-source-id` of the form `channel.videos.<videoId>.<field>` and resolves in
`provenance-index.v1.json`. `dataset_integrity.mjs` already fails the build otherwise.

---

## B7 · The facade player (R-118)

`components/sections/Vitrine/Facade.tsx` + `Facade.player.tsx` (dynamically imported).

### B7.1 · Zero third-party contact before explicit intent — and how it is proved

**Before a click, the card contains:** no `<iframe>`, no `<link rel="preconnect">`, no
`<link rel="dns-prefetch">`, no `<script>`, no image from any third-party host, and no `<a>` that is
prefetched. The poster is **typographic**: the title set in Source Serif 4 on `--ink-800`, the
publish date and duration in mono, a 1 px frame, and the §B6 drawing behind it at `opacity: 0.18`.
It is generated in the browser from data the page already has — nothing is fetched at all.

`TC-VIT-FACADE-01` (Playwright, nothing blocked): load `/`, scroll `#vitrine` end to end, hover and
focus every card, then assert (a) `page.context().cookies()` contains **no** cookie whose domain is
not `forgotten-mistory.web.app`, and (b) the captured `request` events contain **zero** requests to
any host other than `forgotten-mistory.web.app`. Then click one facade and assert requests to
`www.youtube-nocookie.com` appear **only after** that click. This is the same assertion the audit
already runs to prove B-4 (0 third-party hosts, 0 third-party requests), extended to survive the new
strand — **R-183's honesty claim must not be broken by this build.**

### B7.2 · What the click loads

```
import('./Facade.player')      // a separate chunk, never on the critical path
```

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=0&color=white&enablejsapi=1&origin=https%3A%2F%2Fforgotten-mistory.web.app"
  title="<verbatim video title>"
  allow="accelerometer; encrypted-media; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  loading="lazy" width="1280" height="720"></iframe>
```

- `autoplay=1` is **not** R-118's prohibited autoplay: it plays because the visitor pressed play, and
  the click is the gesture the browser requires. Nothing plays without one.
- `iv_load_policy=3` removes annotations; `modestbranding=1` reduces chrome; `cc_load_policy=0`
  leaves captions to the viewer; `allow` deliberately **omits** `autoplay` and `fullscreen` is left
  to the default so the attribute list stays minimal.
- The wrapper is `aspect-ratio: 16 / 9` with explicit `width`/`height`, so the swap contributes
  **0 to CLS**.

### B7.3 · End screens — what is in our gift, and what is not

R-118 asks for no end screens. **We cannot suppress YouTube's end screen from outside the player, and
this spec will not pretend otherwise.** What we do instead removes the frame it would appear in:

`Facade.player.tsx` speaks the player's `postMessage` protocol **directly** — no
`https://www.youtube.com/iframe_api` script, no third-party JavaScript, ever:

```ts
iframe.contentWindow.postMessage(
  JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
  'https://www.youtube-nocookie.com',
);
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://www.youtube-nocookie.com') return;
  const d = JSON.parse(e.data);
  if (d.event === 'onStateChange' && d.info === 0 /* ENDED */) closeAndRestoreFacade();
});
```

On `ENDED` the iframe is **removed from the DOM in the same task**, the facade returns, and two
controls appear: `Play again` and `Next in this strand` (the next video card by the current
ordering). The end screen never gets a paint. `TC-VIT-FACADE-02` seeks a short record to its final
second and asserts the iframe is detached within 400 ms of `ENDED`.

**CSP:** `frame-src` at `firebase.json:23` already permits `https://www.youtube-nocookie.com`.
`script-src` is **unchanged** — the postMessage approach is precisely why. The redundant
`https://www.youtube.com` entry in `frame-src` is **removed** in the same commit, because nothing
loads from it any more.

### B7.4 · Disposal

Closing (button, `Escape`, or `ENDED`) removes the iframe, removes the `message` listener, and
returns focus to the card's `Watch` control. Declared memory ceiling **12 MB** JS heap delta while a
player is mounted; `TC-VIT-PERF-02` mounts and unmounts a player five times and asserts the heap
returns to within 2 MB of baseline.

---

## B8 · Vanity metrics (R-119) — enforced by the schema, not by discipline

1. **Nothing to render.** `ChannelData` declares no `subscriberCount`, `viewCount`, `likeCount` or
   `watchTime` field (`dataset-layer-design.md` §2.4). A vanity metric has nowhere to go.
2. **Nothing to import.** New static gate `TC-NFR-VANITY` in `overhaul_static_audit.mjs`: scan
   `components/sections/Vitrine/**` and `app/data/canonical/**` for
   `/\b(subscribers?|viewCount|view_count|\bviews\b|likes?Count|watch[_ ]?time)\b/i` outside comment
   spans → **0 hits**.
3. **Nothing leads with a count.** `TC-VIT-STRAND-06`: the first text node of every
   `[data-card-kind="video"]` header is the record's subject, never a number.
4. **Weight is never reach.** Every weight channel in §B3.3 and §B5.3 is record count, runtime
   seconds, or duration — each observable, none a measure of audience.

---

## B9 · Files, dossiers, tests

**Create**
```
components/sections/Vitrine/Strands.tsx
components/sections/Vitrine/Strands.module.css
components/sections/Vitrine/ContentDNA.tsx
components/sections/Vitrine/ContentDNA.module.css
components/sections/Vitrine/ChannelDrawings.tsx
components/sections/Vitrine/Facade.tsx
components/sections/Vitrine/Facade.player.tsx
components/sections/Vitrine/Facade.module.css
app/data/portfolio/channel.ts                         editorial copy only: what-it-adds, limits, rung reasons
app/data/canonical/generated/strands-layout.v1.json   (generated)
app/data/canonical/generated/content-dna.v1.json      (generated)
scripts/dataset/strands_layout.mjs                    domain, projection, dodging, joins, gold rule
scripts/dataset/content_dna_layout.mjs                deterministic two-column placement
tests/e2e/vitrine-strands.spec.ts
tests/e2e/vitrine-facade.spec.ts
```

**Change**
```
app/data/portfolio/vitrine.ts        lede → §B1.1; add `whatItAdds` to each plate;
                                     stamp gains the join-anchor sentence
components/sections/Vitrine/Vitrine.tsx    mount <Strands/> and <ContentDNA/>;
                                     rail iterates 16 cards from the ordering selector;
                                     add data-card-kind, data-rung, data-strand-focus
components/sections/Vitrine/Vitrine.module.css   unlit floor 0.42 → 0.62;
                                     .live → var(--gold-pale) in every state
app/data/canonical/selectors.ts      selectStrands(), selectContentDna(), selectRailOrder()
app/data/canonical/dossiers.ts       add vitrine.two-strands and vitrine.content-dna
scripts/dataset/sources/channel.mjs  emit structure{}, promises, chapters, rung inputs
scripts/dataset/sources/repositories.mjs   add btr-demo + jarvis (createdAt only);
                                     probe each homepage for HTTP<400 with a stamped time
scripts/dataset/build_dataset.mjs    invoke both layout scripts; assert datasetHash match
scripts/validate/overhaul_static_audit.mjs   add TC-NFR-VANITY
firebase.json                        frame-src: drop https://www.youtube.com
tests/e2e/vitrine.spec.ts            TC-VIT-01 → assert exactly six [data-card-kind="repository"]
                                     (all other TC-VIT-* untouched and must keep passing)
```

### B9.1 · Tests

| id | assertion |
|---|---|
| TC-VIT-01 *(revised)* | exactly **six** `[data-card-kind="repository"]`, each with a source link |
| TC-VIT-02 … 09 | **unchanged, must keep passing** — R-167's mechanical proof |
| TC-VIT-STRAND-01 | both lanes render; curated repository bars and video ticks have **identical** computed `stroke-width` |
| TC-VIT-STRAND-02 | the axis path is one unbroken segment; no element carries a break marker |
| TC-VIT-STRAND-03 | three joins, each labelled with a lag that equals the recomputed date difference |
| TC-VIT-STRAND-04 | the 140-day silence renders on `Shift`-hold with its exact label |
| TC-VIT-STRAND-05 | `9meaN-ZZAvc` appears **nowhere** in `out/` |
| TC-VIT-STRAND-06 | no video card leads with a number |
| TC-VIT-GOLD-01 / 02 | exactly one `[data-gold="true"]` at the Strands band; zero in the rail |
| TC-VIT-RUNG-01 | every card's rung word equals the rung the dataset computed; `aether-job-career-agent` prints rung 5 **and** its failing CI conclusion |
| TC-VIT-ORDER-01 | `by date` ordering is element-wise equal to the strands' own order |
| TC-VIT-DNA-01 | 10 content nodes, 5 targets, 1 gap node, 6 drawn edges, 1 undrawn |
| TC-VIT-DNA-02 | `cap:11` has no incoming edge; the ghost edge and its sentence appear on focus |
| TC-VIT-DNA-03 | every `data-topology-target` resolves in `skills-topology-layout.v1.json` |
| TC-VIT-FACADE-01 | zero third-party requests and cookies before a click; requests appear only after |
| TC-VIT-FACADE-02 | iframe detached within 400 ms of `ENDED` |
| TC-VIT-PERF-01 | rail with 16 cards sustains 60 fps while scrolling, 4× CPU throttle; CLS < 0.05 |
| TC-VIT-PERF-02 | five player mount/unmount cycles return the heap to within 2 MB |
| TC-VIT-A11Y-01 | rail keyboard traversal reaches all 16 cards; nothing traps; the two visualisations each expose an insight-equivalent text alternative, not a bare table |
| TC-VIT-LAYOUT-01 | `node scripts/dataset/strands_layout.mjs --check` and `content_dna_layout.mjs --check` both exit 0 (byte-identical on re-run) |

### B9.2 · Performance envelope

| Artefact | Marks | Init | Memory ceiling | Frame budget |
|---|---|---|---|---|
| `vitrine.two-strands` | ~180 | ≤ 40 ms | **6 MB** | no rAF at rest; one rAF while zooming or scrubbing |
| `vitrine.content-dna` | ~60 | ≤ 25 ms | **4 MB** | no rAF at all; hover is CSS |
| the rail (16 cards) | — | — | **10 MB** | the existing single rAF, unchanged |
| a mounted facade player | — | — | **12 MB** | third-party, disposed on close |

LCP is unaffected: nothing in this section is above the fold, both SVGs sit in fixed-aspect boxes,
and the posters are text. CLS contribution is **0** by construction, asserted by TC-VIT-PERF-01.

---
---

# Decisions taken in these specs, recorded for R-164

| # | Decision | Alternative the Owner would have to approve | Reversal cost |
|---|---|---|---|
| **P-A1** | WebRTC is replaced by a WebSocket duplex to the Cloud Run origin, because Cloud Run has no UDP ingress and cannot host ICE or TURN. | Provision a media server on the VPS — a new guardian surface on an 81 %-full host, against D-04. | Moderate |
| **P-A2** | No synthesised face. The "lip-synced render" becomes a measured articulation trace. | Ship a talking head in the same release that R-147 removes one. | Low |
| **P-A3** | The p95 latency contract is published with its measured value, and the page demotes itself rather than claiming a number it misses. | Advertise 2.5 s p95 unmeasured. | None |
| **P-A4** | The spend ceiling is enforced on quantities, not dollars, because unit prices are not observable from inside the build. | Hard-code prices — a number without a source. | Low |
| **P-A5** | No abuse classifier. The validators are the whole defence. | A model judging a visitor, rendered as a decision. | Low |
| **P-B1** | The section's one gold mark is the tightest computed join; every `.live` URL steps down to `--gold-pale`. | Keep three gold URLs in one rail, at 2.37:1 unlit. | Trivial |
| **P-B2** | Escalation is a ladder of verifiability, not an impact score. Rung 5 includes a red gate. | An unfalsifiable ranking — the thing D-01 already refused for skills. | Low |
| **P-B3** | No thumbnails anywhere. The facade poster is typographic. | A third-party raster, breaking TC-VIT-05 and the zero-third-party-request claim. | Trivial |
| **P-B4** | The end screen is defeated by detaching the iframe on `ENDED` over raw `postMessage`, not by loading YouTube's IFrame API. | A third-party script, and a `script-src` widening. | Trivial |
| **P-B5** | Two uncurated repositories get a timeline bar and no card, labelled as such, so the joins can be drawn without diluting "six of thirty-eight". | Draw joins whose one end is invisible. | Trivial |
| **P-B6** | The section states in its lede that the strands' subjects do not align. | Imply an alignment the data refutes. | None — and it is the point |

---
---

## Adversarial critique

**Verdict: NEEDS-REVISION.** Part B is the strongest section spec in this run and must not be
weakened; Part A rests on three unmeasured foundations and one number the repository itself
contradicts. Nothing below is a matter of taste. Every failure names the file and the arithmetic.

### Failures — must be fixed before build

| # | Severity | Failure |
|---|---|---|
| **F-1** | **BLOCKER · fabrication that ships** | **§B5.3's drawn weights leak the unlisted record.** `channel-analysis.md` §9 gives the hub `dna.vedic-computational-astronomy` **9 records / 3,928 s**. That total is arithmetically `Σ(all 11 durations) − 190 (OEn5RzSEwpc) − 121 (p9pGAmqJCSk) = 4,239 − 311 = 3,928` — it **includes `9meaN-ZZAvc` (603 s)**, exactly as §9's render note warns ("It contributes to node weights in this analysis but must not be rendered"). Filtered to public records the node is **8 records / 3,325 s**. §B5.3's *"one hub with nine ticks"* and §B5.1's *"nine of ten public records"* are therefore both false; §9 says *"nine of **eleven**"*. As specified, the board draws 9 ticks and prints 3,928 s — publishing a count that only exists because an unlisted video was counted, while `TC-VIT-STRAND-05` simultaneously forbids that id from `out/`. **Fix:** recompute every node's `records` and `weightSeconds` from public records only, inside `content_dna_layout.mjs`, and add `TC-VIT-DNA-04` asserting `Σ records over content nodes` equals the public-record join count. |
| **F-2** | **BLOCKER · unbuildable** | **§A10 cannot produce §A1's transport.** `functions/package.json` pins `firebase-functions ^5.1.1`; a v2 `onRequest` handler is invoked by the Functions Framework's Express app. An RFC 6455 upgrade arrives as an `'upgrade'` event on the underlying `http.Server`, which `onRequest` never sees and never exposes — no `ws` server can be attached. §A1 already concedes this by resolving the origin with `gcloud run services describe presence`, i.e. a **Cloud Run service**, which is a different deploy artefact (container/source build) from `firebase deploy --only functions`. §A10 nevertheless lists *"functions/index.js — export … presence (socket)"* under **Change**. One of the two is wrong and D-04's wording does not settle it. |
| **F-3** | **BLOCKER · unbuildable** | **There is no Opus encoder.** §A1 specifies *"Opus 16 kbps frames"* emitted from an `AudioWorklet`. Browsers expose no Opus encoder to worklet scope; `MediaRecorder` yields a WebM/Ogg container off the `MediaStream`, not 20 ms raw packets. §A10 lists no encoder module, no `.wasm` asset, no dependency, and §B9.2's page-weight reasoning never accounts for one (libopus-wasm is ~250–400 KB). **Fix:** either ship a named, versioned encoder as a file in §A10 with its byte cost, or specify raw PCM16 uplink (640 B/frame ≈ 256 kbps) and state the bandwidth consequence. |
| **F-4** | **BLOCKER · contradicted by this repository** | **G-A2's diagnosis is wrong.** §A9 says the `/api/tts` 400 *"admits two candidates — a missing or wrong `voice_id` and an unset model."* `components/MiniVicBot.tsx:826-833` records the actual cause: *"the ElevenLabs key is invalid and OpenAI/Gemini TTS are not accessible on this account."* An invalid credential is not an implementer fix; it is an Owner action. Rungs 1–3 are blocked on a decision this spec never surfaces. **Fix:** add it to the §A9 gate table and to the Decisions table as an Owner-blocked item. |
| **F-5** | **MAJOR · fabricated numbers presented as a budget** | **§A2.1 hops 1, 2, 4, 5, 6 have no source.** The only latency measured this run is a *buffered* `minivicChat` total of **0.867 / 0.835 / 0.671 s** (§A0 row 4, n=3). From that, the table asserts `sttFinalMs` 160/400, `llmFirstTokenMs` 400/900, `firstClauseMs` 180/320, `ttsFirstChunkMs` 220/520 — none observed, none marked as a target. Hop 4's p95 (900 ms *for the first token*) **exceeds the slowest complete buffered answer ever measured (867 ms)** and the spec offers no reconciliation. Worse, the totals are **sums of per-hop p95s**, which is not a p95 of anything; the "2 825 ms, 325 ms over" figure that justifies the whole `demote` mechanism, the `minInstances: 1` cost decision and the region rule is an artefact of that error. The spec's own preamble forbids this: *"Where a number could not be observed, it is named as a probe … never guessed."* **Fix:** mark the whole table `target`, not `p50/p95`, and make `presence_latency_probe.mjs` the *first* deliverable of Part A, not its validator. |
| **F-6** | **MAJOR · geometry that cannot render** | **§B3.3's collision dodge is impossible.** Ticks are `stroke-width: 5` and the scale is 2.4220 units/day. Four records share 2025-11-20 and are to be dodged by **±2.6 units** — a 5.2-unit span for four marks each 5 units wide. They overlap into a single blob; `TC-VIT-STRAND-01` (which only compares computed `stroke-width`) passes anyway. **Fix:** dodge on a pitch ≥ `strokeWidth + 2` (≥ 7 units, so offsets −10.5/−3.5/+3.5/+10.5), and state the maximum group size the rule supports. |
| **F-7** | **MAJOR · the trace's central claim is not true of half its marks** | **§A0.1 / §A7.2: the viseme channel is inferred, not measured.** The defence of the artefact under R-95/R-111 is *"every frame … resolves to a measured property … the model produces the audio, and the renderer measures it."* True of the RMS envelope. **Not true of the viseme class.** ElevenLabs' alignment payload returns **characters with start/end times** — not viseme classes. Deriving `closed / open / fricative` from graphemes requires an unspecified grapheme→phoneme→viseme heuristic; that is a *model producing a categorical mark about the artefact*, which is precisely R-111. **Fix:** either drop the viseme alpha channel and ship the measured envelope alone (the honest artefact, and still beautiful), or classify from the **playing PCM** (a spectral-centroid/zero-crossing band split), which is a measurement, and say so in the dossier. |
| **F-8** | **MAJOR · the escalation ladder does not cover half the rail** | **§B4.2's rungs are defined only on repositories.** Rung 2 is `repository.visibility === 'public'`; rung 3 is *"rung 2 **plus** …"*. A video can never satisfy rung 2, so every video card is pinned at rung 1 — yet §B4.2 offers videos rung 3 via a computed join. Two consequences: (a) the rule is internally contradictory; (b) under the **default** `by argument` ordering (ascending rung), the rail renders ten rung-1 video cards, then six repository cards. §B2 and §B4 call this *"the interleaved cinematic carousel."* It is not interleaved in its own default order. **Fix:** define the ladder over *artefacts* (an explanation, a repository, or a join is each a checkable layer), or make `by date` the default and say why. |
| **F-9** | **MAJOR · honesty regression in visitor-facing copy** | **§A4.1's consent panel omits every third party.** It says the voice is *"sent to this site's server … transcribed, answered, and spoken back"* and *"That is the whole of it."* It is not: audio goes to **Google Speech-to-Text**, the transcript to **OpenRouter** (and thence to Meta's Llama-3.3-70B host), and the answer text to **ElevenLabs**. §A4.3 quietly configures `enable_logging: false` on two of them, which proves the spec knows they are there. On a site whose entire thesis is refusing to grade a claim above its evidence, a consent panel that hides three processors is the sharpest possible R-171 regression. **Fix:** name all three in the panel, in the same register, with what each receives. |
| **F-10** | **MODERATE · claim graded above its evidence** | **`firstCommit` is not a first commit.** §B3.1 sets the domain start at *"min `firstCommit`"* = 2025-06-24. `scripts/build/harvest_repos.mjs:76` defines `firstCommit: parsed.created` — it is the GitHub **repository creation date**, and `corpus-repositories.json` confirms `jyotish-shastra.createdAt = 2025-06-24T19:14:09Z`. Drawing a bar labelled "first commit → last push" from `createdAt` to `pushedAt` puts a mislabelled quantity on a true-scale axis, in the section that exists to be checkable. (`pushedAt` also moves on a tag or branch push with no commit.) **Fix:** rename the field to `createdAt` everywhere and label the bars *"repository created → last push"*, or harvest the real first commit. |
| **F-11** | **MODERATE · contradicts a locked decision** | §B3.4 states *"**Every** `.live` URL in the rail renders `--gold-pale` **at all times**"*, citing `design-system-lock.md`. The lock's own ruling at line 126 is the opposite: *"the **lit** plate keeps `--gold`; unlit plates render `.live` in `--gold-pale`."* The spec may well be right — one saturated gold per view is cleaner — but overriding a locked artefact silently, while citing it as authority, is how a design system stops meaning anything. Record it as a decision (P-B1 currently records only the join). |
| **F-12** | **MODERATE · gold encodes magnitude** | §B3.4 awards gold to *"the join with the **smallest** lag."* All three joins are equally sourced — same two APIs, same subtraction. Selecting by minimum makes gold encode *which lag is tightest*, i.e. magnitude, which the binding design law forbids ("never a theme, never decoration, never 'you are here'"; no colour encoding magnitude). **Fix:** choose the gold join by a rule with no ordinal content — e.g. *the most recent* join, or the join whose repository is a curated plate — and say the rule on the board. |
| **F-13** | **MODERATE · unbuildable interaction** | §A11 promises *"hovering a spoken clause in the transcript highlights the frames of the trace that produced it"* and *"focus expands the window from 1.92 s to 7.68 s."* §A7.2 defines a **96-column, 1.92 s rolling window** and no retained history. Both interactions need 384+ frames of retained envelope and a clause→frame index that nothing in §A1's control protocol emits. Two of the four R-97 depths are currently undeliverable; a third (`filter`) is the conversation's scope control, not an interaction with this artefact at all. |
| **F-14** | **MODERATE · R-165 gap** | R-165 requires the provenance labelling be carried *"into the chatbot and **the live presence**."* §A8's parity table covers captions, transcript and ARIA; nothing in Part A states how a caliper state or a source annotation attaches to a **spoken** answer. §A11 sets `goldMark: null` and `datasetFields: []` for the trace — correct for the trace, silent for the answers. |
| **F-15** | **MINOR** | §B6.1 calls the description skeleton *"the canonical skeleton … proved from all eleven records."* `channel-analysis.md` §3 says *"conformed to by **9 of 11**"* and names **two** non-conformers — `Q5yGe7uBkFA` **and `oiTfTeqvP0Y`**. §B6.1 names only the first. |
| **F-16** | **MINOR** | §B1.2's prose *"10 of 11 records land inside an 8-day window"* is correct in `channel-analysis.md` §4 but counts the unlisted record. If any part of that sentence reaches the page it discloses that an eleventh record exists. Restate as *"nine of ten public records, inside eight days."* |
| **F-17** | **MINOR** | §B5.1 addresses targets as `cap:2/7/11/12`. These do resolve — `skills.ts` capability indices 2, 7, 11, 12 are exactly *Real-time telemetry platforms*, *Next.js and TypeScript at production scale*, *WebGL and GLSL*, *Data visualisation* — but `channel-analysis.md` §10.3 explicitly warns that *"`skills.ts` capabilities have no stable id … every cross-link keys on the verbatim capability string."* The spec chose the keying its own source told it not to, and `TC-VIT-DNA-03` (id resolves) would still pass after a refactor silently re-pointed `cap:11`. Assert the **label** as well as the id. Separately, E3/E4 retarget `channel-analysis.md`'s `S10` (*Multi-service orchestration — Docker Compose*, a **capability**) to `src:rectifier` (a **source**) with no note that the target class changed. |

### Where the tests would not catch a mediocre implementation

- `TC-VIT-RUNG-01` compares the rendered rung word to *the rung the dataset computed*. A dataset that computes every rung wrong passes. Only the `aether-job-career-agent` clause tests anything real. Assert the rung **rule** against its inputs (visibility, link presence, probe status, CI conclusion) on at least one card per rung.
- `TC-VIT-STRAND-01` asserts identical `stroke-width` and calls it co-equality. A 20-unit horizontal bar and a 132-unit vertical tick at the same weight are not equal ink. If co-equality is the claim, assert total path length per lane, or drop the claim from §B1.1 point 4.
- `TC-PRES-SEC-02` greps `require('fs')`, `writeFile`, `createWriteStream`. It misses `node:fs`, `fs/promises`, aliased handles, and every Firestore write of a transcript — which is the actual retention risk. Assert on behaviour (a fixture session, then a read of every collection).
- `TC-VIT-A11Y-01` requires an *"insight-equivalent text alternative, not a bare table."* Not mechanically decidable; any non-table string passes. Assert the specific facts (both lane counts, all three lags, the 140-day span, the undrawn edge's sentence).
- `TC-PRES-INJECT-01` runs the T-12 probes as **audio**, so it passes or fails on STT accuracy rather than on the validators, and it is non-deterministic. It also spends the §A6.3 daily ledger — CI can exhaust the visitor budget. Carve CI out of the ledger explicitly, and keep a deterministic typed-transcript variant as the gating test.
- `TC-PRES-CONSENT-01` asserts a call site is *"reachable only from that button's `onClick`"* by "static scan". No call-graph tool is named and none is in `package.json`.

### Buildability, beyond F-2/F-3

- **§A6.3's "hard ceiling" does not bound the largest guaranteed cost.** `minInstances: 1` is a 24/7 floor, invariant in the four counters (`sttSeconds`, `ttsChars`, `llmTokens`, `sessions`). §A2.1 correctly calls it *"the single largest line item"*; §A6.3 then omits it from the ceiling and says *"the ceiling is real, hard, and honest."* Two of those three hold.
- **§B7.2's autoplay will not fire.** `allow` *"deliberately omits `autoplay`"*, but a cross-origin iframe does not inherit autoplay permission from a parent-page gesture. With `autoplay=1` and no `allow="autoplay"`, Chrome blocks it and the visitor gets a paused player after clicking Play. Add `autoplay` to `allow` (the gesture requirement is still satisfied and R-118 is still honoured) or drop `autoplay=1` and say the visitor presses play twice.
- **§B7.3's `ENDED` handler never fires as written.** The widget protocol needs `{event:'command',func:'addEventListener',args:['onStateChange']}` after the `listening` handshake, and the handshake must be repeated until the player answers. The snippet has neither, so `TC-VIT-FACADE-02` fails on a correct implementation of the spec. It is also an undocumented protocol with no stated fallback — specify a `timeupdate`-free fallback (a `duration`-length timer armed on play) so the end screen cannot paint if the protocol changes.
- **`lib/presence/vad.worklet.ts`** must be emitted as a standalone module for `audioWorklet.addModule()`. Next.js static export does not do this from a `lib/**` TypeScript file without a declared build step. None is specified.
- **Design tokens.** `--fs-micro`, `--fs-caption`, `--fs-lede`, `--measure-read`, `--motion-emphatic`, `--motion-cine-in` are **proposals in `design-system-lock.md`**, absent from `app/globals.css`. The spec is right to use them, but must declare the token migration as a hard predecessor, as `SPEC-skills-topology.md` F-8 was forced to.
- **§B1.1 point 3 has no representation on its own board.** The spec's best argument for the strand's co-equal standing is that it is the *sole* evidence for public technical explanation and bilingual delivery. `channel-analysis.md` §9 carries those as `dna.bilingual-explanation` / `dna.serialised-curriculum` / `dna.build-in-public`, whose only edges run to **dimensions** (`about.ts`) — which §B5's capability-only graph drops entirely. The section argues in prose for something its visualisation cannot show.
- **Cross-spec claim.** §B7.1 asserts *"zero requests to any host other than `forgotten-mistory.web.app`."* Part A adds a pinned `*.run.app` origin to `connect-src`. The two survive together only because the socket opens on a click; the **colophon** sentence (§A4.3) must be written so R-183's honesty claim stays literally true, and §B7.1's test comment should say why it still holds.

### Does it make the site more honest?

**Overwhelmingly yes, and it should be built.** §A0's six-hop refusal table, P-A2 (no synthesised face in the release that removes one), P-A3 (publishing a missed p95 and demoting rather than claiming it), §B1.1's lede admitting the strands share no subject, §B1.2 drawing the 140-day silence at true scale, §B4.2's rung 5 that *includes* a red CI gate, and §B5.2's deliberately undrawn `cap:11` edge with its sentence — that is the best writing in this run, and §B5.2 is the single best sentence anywhere in these six specs. F-1, F-5, F-9 and F-10 are the four places the spec does to itself what it forbids everyone else, and each is a small, local fix. Fix them and this is a net honesty gain of a size the rest of the site does not reach.

### The single strongest improvement

**Split Part A at §A0 and put a measurement spike in front of it — `G-A0`, which must be green before §A1–§A12 is treated as buildable at all.** Three of Part A's foundations are presently assumed rather than known: that the chosen runtime can accept a WebSocket upgrade (F-2), that a 20 ms Opus uplink is reachable from browser code the repo ships (F-3), and that an ElevenLabs credential exists (F-4, which this repository's own comment says it does not). Every number in §A2.1 that justifies `minInstances: 1`, the `australia-southeast1` region rule and the self-demotion mechanism is an estimate stacked on those assumptions (F-5). `G-A0` is small: deploy a bare echo endpoint on the candidate runtime, open one socket, push one PCM frame, get one STT final, one OpenRouter delta and one ElevenLabs chunk, and write the real per-hop timings to `presence-transport-spike.json`. Then rewrite §A2.1 from that file. This costs a day and converts Part A from a beautifully argued design resting on four unverified premises into the same design resting on measurements — which is the standard Part A applies to everyone else, and the standard §A0 itself sets when it refuses WebRTC on evidence rather than on preference. Part B needs no such gate and should not wait for it.
