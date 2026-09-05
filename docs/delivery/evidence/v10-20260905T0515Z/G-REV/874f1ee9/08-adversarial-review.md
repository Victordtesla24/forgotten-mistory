# G-REV phase 2 — live adversarial re-probe of the MiniVic gaps (G-M1, G-M2, G-M3)

**Reviewer:** `reviewer` council profile (docs/prompt.md §5) — verification / 3rd_party_independent_adversarial_review, effort max. Read-only; nothing in this pass was implemented.
**Task:** `artifacts/kanban/tasks/t_g_rev.md` PHASE 2 · acceptance from `artifacts/adversarial/GAP-BACKLOG.md` (G-M1, G-M2, G-M3).
**Target:** live `https://forgotten-mistory.web.app/`.
**Under review:** commit `91f46e9` *refactor(minivic): send path goes straight to /api/chat; greeting regenerated*, consolidated into `main` at `874f1ee9`.
**Probe window:** 2026-09-05 12:51:34Z → 12:59Z.

## 0. Which build was actually on the wire (read this before the table)

The dispatch named live build **`874f1ee9`** served at 12:50:05Z. That is what the first capture saw, and it is what this directory is named for:

```
12:51:34Z  curl https://forgotten-mistory.web.app/ → 200
           <meta name="build-commit" content="874f1ee9">
           last-modified: Sat, 05 Sep 2026 12:49:56 GMT
           cache-control: public, max-age=0, must-revalidate        (captures/live-headers-874f1ee9.txt)
```

**The site rolled forward mid-probe.** Every browser run (12:53:56Z onward) read
`build-commit = 7d467770` off the live document (`captures/probe2-b.json` → `buildCommit`,
same in `probe2-c/d`), and a second curl at 12:55:12Z confirms it:
`build-commit" content="7d467770"`. `7d467770` is two commits past `874f1ee9`
(`d958917` fix(about) G-A1 correction → `37cbb52` consolidate → `7d46777` docs-only).

I checked whether that invalidates the probe rather than assuming it does not:

```
git diff --stat 874f1ee9 7d467770 -- components/MiniVicBot.tsx lib/miniVicBrain.ts \
    app/data/miniVicKnowledge.ts app/data/generated/greeting-asset.ts public/assets/ functions/index.js
(empty — the two trees are identical across every file G-M1/G-M2/G-M3 touch)
```

So the wire behaviour measured below is `874f1ee9`'s MiniVic, observed on the build that
replaced it. Both hashes are recorded against every measurement. **Anything in this report
about the *hero*, *about* or *global CSS* is `7d467770`, not `874f1ee9`** — those trees do differ.

---

## 1. Verdicts — failures first

| Gap | Verdict | Evidence |
|-----|---------|----------|
| **G-M3** — *"Stream chat or warm instance so first answer token <1.5 s; drop `provider`/`model` from client payload."* | **FAIL** (measured baseline; no remediation commit exists yet, none was expected) | **Browser, Enter → first visible bot text, 5 trials @1440×900 muted: 1677 / 2089 / 2121 / 2451 / 2813 ms → P50 2121 ms, P95 2813 ms** (`captures/probe2-d.json`). Endpoint alone, `curl -w %{time_starttransfer}` POST /api/chat ×5: 1.450 / 1.616 / 1.674 / 1.945 / 2.564 s → **P50 1674 ms, P95 2564 ms, best case 1450 ms** (`captures/api-chat-timings.csv`). Every sample is over the 1.5 s budget except one 1450 ms endpoint call, and even that leaves the browser no headroom. No streaming exists to soften it: `text/event-stream` occurrences across all 15 served chunks = **0** (`captures/served-js-scan.txt`). Half of the directive *is* met — `provider:"…"` / `model:"…"` literals in the client payload = 0 in the same scan — but the latency half is not, so the gap stays FAIL. |
| **G-M1** — *"Remove `/api/realtime` + `/api/chat-with-vic` from send path; go straight to `/api/chat`."* | **PASS** | **8 live sends** (1440×900 muted, 390×844 muted, 1440×900 unmuted, plus 5 timing trials). Every muted send put **exactly one request on the wire: `POST /api/chat` → 200**, and nothing else — not one non-`/api/` request either (`probe2-a/b/d.json` → `sendRequests`, `sendApiPaths`). `/api/realtime*` = 0, `chat-with-vic` = 0, **WebSockets opened = 0**, `pageerrors` = 0, `console.error` = 0 in all four runs. 10 s watch after the reply landed at 1440 **and** 390: `watchRequests: []` — the 3 s poller is gone. Static confirmation: all 14 chunks referenced from the served HTML **plus** the lazily-loaded `app/page-25b9b5c550d8a886.js` observed in the network log — 15 files — match `api/realtime\|chat-with-vic\|pollTaskId\|polloTaskId` **0 times**; the only `/api/` literals left in the bundle are `/api/chat` and `/api/tts` (`captures/served-js-scan.txt`). The reply is a **real grounded answer from the live brain**, not the deterministic tier: `/api/chat` returned 200 with `{"text":"At the ATO since March 2026, I lead the Agile Kookaburras squad on the Payday Super reform program…"}` (484 chars rendered at 1440, 414 at 390 — different wording per call, i.e. generated, not canned). |
| **G-M2** — *"Regenerate `public/assets/minivic-greeting.mp3` to match rewritten text intro."* | **PASS** (pipeline invariant proven end-to-end; spoken audio not verified by ear — §3) | Served MP3 `sha256 = dd65f259d1bf57728c254763c56399cc5a0dceed5694b4d07b6147d0115c6ccb`, **417 702 B** (`captures/mp3-hash.txt`), `ffprobe`: **24.984671 s**, mp3, 128 kbps, 44.1 kHz, mono (`captures/mp3-ffprobe.txt`). That digest is **identical** to `window.__CLONED_VOICE_GREETING_HASH__` read off the live page at **both** viewports, to `greetingAudioSha256` in `app/data/generated/greeting-asset.ts`, and to `git show HEAD:public/assets/minivic-greeting.mp3 \| sha256sum` (`captures/greeting-text-compare.json`). It is genuinely a **new** asset: the previous blob was `369e1eb2…`, 198 156 B, 12.33 s, and the file's only change since `f944d97` is `91f46e9`. Text: served `/assets/minivic-greeting.txt` (trimmed) **equals `GREETING.hiring` character-for-character** — 365 chars, `firstDiffIndex = -1`, matching sha256 prefix `294685bc…` — and the on-screen introduction contains that string **verbatim and contiguous** (`matchStartIndex: 11`; the only other text in the bubble is the `Vic` + timestamp chrome and the `Copy` button label). |

**Goal state:** G-M1 and G-M2 PASS on live with no regression; G-M3 is a measured baseline and stays FAIL.

---

## 2. Method (so it can be re-run against me)

Script: `captures/probe2.mjs` — Playwright with system Chrome, `--no-sandbox --disable-dev-shm-usage --use-gl=swiftshader`, one browser context at a time (shared host).

The phase-1 baseline could not open the panel headless and recorded G-M1/G-M3 as unmeasurable. **That gap is now explained and closed:** the dock gates on `pastHero`, so a click before hydration and before scrolling hits nothing. This pass opens it the way `tests/monochrome/minivic-launcher.spec.ts` and `tests/e2e/minivic-send-path.spec.ts` do — wait for `__reactFiber` on `[data-testid="minivic-toggle"]`, `scrollTo(0, innerHeight * 1.5)`, then click through the element. It opened first time in all four runs.

- TTFT is measured **in-page**: a `MutationObserver` on the panel stamps `performance.now()` when the first non-empty bot bubble appears, against a `t0` stamped in the page immediately before `Enter`. One CDP round-trip (single-digit ms) sits inside `t0`; it does not move a 2 s number.
- The 5 timing trials are sequential sends in one warm context — i.e. the **friendly** case (no function cold start). The three cold first-sends measured 6151 ms (1440), 1875 ms (390) and 3093 ms (1440 unmuted); over all 8 samples P50 = 2286 ms and P95 = 6151 ms.
- Muting is done through the panel's own "Mute voice" control before sending, so the muted counts are the pure send path.

### The unmuted variant, recorded separately

Unmuted, one send makes **two** API calls: `POST /api/chat` → 200 then `POST /api/tts` → 200 (`probe2-c.json`). That is the designed voice path, not a leak, and it is the reason the muted runs are the ones the G-M1 count is read from.

**`/api/tts` is alive and the orchestrator's suspicion does not reproduce.** Direct call:
`POST /api/tts {"text":"Testing the site voice endpoint."}` → **200, `audio/mpeg`, 36 824 B, `time_starttransfer` 0.395 s**; the body is a real MP3 (`ID3 v2.4, MPEG layer III, 128 kbps, 44.1 kHz, mono`). `GET /api/tts` → 405 `{"error":"method_not_allowed"}`, which is correct. The deployed function's `ELEVENLABS_API_KEY` therefore works, whatever the locally stored value is. The client's browser-speech fallback (`speakText` on `tts_http_*`/`tts_not_audio`/`tts_body_too_small`) was consequently **not exercised** — I did not observe a failure to fall back from, and I am not reporting it as verified either way.

---

## 3. What I can verify, and what I cannot (G-M2, stated plainly)

**Verified:** the served audio is a new, correctly-sized, 24.98 s MP3; its digest matches the constant the app asserts at runtime, the generated module and the committed blob; the served transcript equals `GREETING.hiring` byte-for-byte; the on-screen introduction is that same string. In other words the **pipeline invariant** — one text definition, audio + transcript + digest emitted in one pass — holds on live, and text-audio drift of the kind phase 1 found (`369e1eb2…`, 12.3 s, speaking the old "Hi, I'm Mini Vic" script) can no longer occur silently.

**Not verified:** that the *spoken words in the recording* are those words. I cannot listen, and the only mechanical route — an ASR pass — is a paid ElevenLabs call, which `CLAUDE.md` puts behind a cost gate I am not permitted to open (and this profile does not ask the Owner). Nor can I verify from the live artifact that the voice is the premade "Sanket" or that the take was made through the connector; those are provenance claims about the generation run, evidenced only in `docs/delivery/evidence/v10-20260905T0515Z/G-M/03-generation.log`. The 24.98 s duration is *consistent* with a 365-character read at natural pace (≈14.6 chars/s), which is corroboration, not proof.

---

## 4. Regressions

**None observed in this pass.** Across four fresh contexts and 8 sends: 0 page errors, 0 console errors, 0 WebSockets, 0 failed requests on the send path, no poller in a 10 s window at either viewport, panel opened and rendered at 1440×900 and 390×844, replies rendered every time (414–648 chars). The greeting asset is 417 702 B — inside the 500 kB per-asset budget in the definition of done.

## 5. False-positive register

Claims examined verbatim, and what the live site says about each:

| Claim (verbatim) | Source | Finding |
|---|---|---|
| "handleSend now calls askMiniVicBrain directly… no realtime route, no compatibility route, no WebSocket, no page errors, with a real reply rendered" | `91f46e9` commit body | **Reproduced in full.** Not a false positive. |
| "the recorded transcript equals `GREETING.hiring`; the MP3 hashes to the digest the app asserts" | `91f46e9` commit body | **Reproduced in full** against the served files, not the repo. |
| "the premade male voice the task allows (Sanket - Professional Indian English, hg1icMxI2KADq9a81ecq, eleven_multilingual_v2, one take, USD 0.133)" | `91f46e9` commit body | **Could not be reproduced or falsified from live.** No artefact on the wire carries voice identity or provenance. Registered as unverified, not as false. |
| "the stored `ELEVENLABS_API_KEY` is a key ID, so the REST call [was rejected]" → dispatch hypothesis: "the orchestrator suspects the function's ELEVENLABS_API_KEY is a key ID → 4xx/502" | `91f46e9` commit body; `t_g_rev` phase-2 dispatch | **The dispatch hypothesis is contradicted for the deployed function.** `POST /api/tts` → 200 `audio/mpeg` 36 824 B in 0.395 s. Whatever the local script read, the function's Secret Manager value is a working key. The commit's own statement is about the *local* key and is not contradicted. |
| Phase-1 baseline: "G-M1 … FAIL … `/api/chat-with-vic` **still ships in the served client bundle** on a `setInterval` poller" | `…/G-REV/9ba97a5c/08-adversarial-review.md` | **True of `9ba97a5c`, no longer true of `874f1ee9`/`7d467770`.** Superseded by remediation, not a false positive — recorded so the two reports are not read as contradicting each other. |

Nothing else in `91f46e9`'s claim set failed to reproduce.

## 6. One-line status on the other P0 gaps (not re-probed this pass)

- **G-H1** (hero: ≤1 headline / ≤1 sentence / ≤1 CTA group, dominant full-bleed visual) — **no re-probe this pass; last measured FAIL at `9ba97a5c`.** Commits touching the hero since: `d7adf27` *fix(hero): the plates cost the fold nothing*, `13f1b82` — partial work, not a remediation claim; needs its own live pass.
- **G-H2** (atmosphere is the product; no idle-deferred GL blanking first paint) — **no re-probe; last measured FAIL at `9ba97a5c`;** no commit claiming G-H2 observed on `origin/main`.
- **G-H3** (purge non B/W/gold chrome; stop shipping Tailwind red/orange utilities) — **still FAIL on live `7d467770`**, one cheap re-run of the baseline predicate over the three served CSS files (134 943 B): `.bg-red-500` ×3, `.border-red-500` ×3, `.text-red-500`, `.border-orange-400`, `.stroke-amber-400`, `.bg-blue-600`, `.text-blue-500`, `.bg-green-400`, `.bg-green-500` — the red count went **up** (2→3) since baseline — and `body{background:radial-gradient(…#282a3242…),radial-gradient(…#282a3238…),radial-gradient(…#24242a2e…)}` keeps the blue-biased washes (`captures/css-chroma-scan-874f1ee9.txt`).
- **G-S1** (real R3F/GLSL flagship in Skills) — **no re-probe; last measured FAIL at `9ba97a5c`;** no commit claiming G-S1 observed on `origin/main`.
- **G-A1** (About sourced-evidence strings on `--gold`) — **correction in flight and now live**: `03aa1ed` *fix(about): sourced evidence lines carry the gold claim mark (G-A1)* followed by `d958917` *fix(about): gold only where the evidence names a checkable record (G-A1 correction)*, live from `7d467770`. Not verdicted here — it belongs to the next full-section pass.

## 7. Evidence index

All paths relative to `docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/`.

| File | What it holds |
|---|---|
| `captures/probe2.mjs` | the probe, re-runnable (`OUT_DIR=… node probe2.mjs a\|b\|c\|d`) |
| `captures/probe2-a.json` | 1440×900 muted — send requests, API statuses+bodies, 10 s poller watch, greeting hash, intro text |
| `captures/probe2-b.json` | 390×844 muted — same, plus `buildCommit: 7d467770` |
| `captures/probe2-c.json` | 1440×900 **unmuted** — `/api/chat` + `/api/tts`, both 200 |
| `captures/probe2-d.json` | 5 sequential TTFT trials |
| `captures/served-js-scan.txt` | 15 chunks × `api/realtime\|chat-with-vic\|pollTaskId\|polloTaskId` = 0; `/api/` literals; streaming and provider/model scans |
| `captures/api-chat-timings.csv` | 5 × `curl -w` POST /api/chat (status, `time_starttransfer`, total, bytes) |
| `captures/api-tts-headers.txt` | `/api/tts` response headers (200, `audio/mpeg`) |
| `captures/greeting-text-compare.json` | transcript vs `GREETING.hiring` vs on-screen intro vs `window.__CLONED_VOICE_GREETING_HASH__` vs served MP3 digest |
| `captures/mp3-hash.txt`, `captures/mp3-ffprobe.txt`, `captures/mp3-headers.txt`, `captures/served-greeting-transcript.txt` | the served greeting asset and its transcript |
| `captures/css-chroma-scan-874f1ee9.txt` | G-H3 spot check on the live CSS bundle |
| `captures/live-headers-874f1ee9.txt` | 12:51:34Z response headers, `build-commit 874f1ee9` |
| `captures/minivic-1440-muted.png`, `minivic-390-muted.png`, `minivic-1440-unmuted.png`, `minivic-ttft-trials.png` | panel screenshots at the end of each run |

---

*Read-only pass. No production code, test or configuration was modified; the only files written are this report and the captures beside it.*
