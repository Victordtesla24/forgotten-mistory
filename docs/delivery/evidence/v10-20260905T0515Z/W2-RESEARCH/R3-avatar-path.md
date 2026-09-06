# R3 research — the honest zero-credit avatar path (t_w2_r3r)

**Role:** researcher · **Identity:** res-w2-r3r · **Date:** 2026-09-06 (probed 00:56–01:20Z)
**Scope:** read-only research. No app code touched. Confirms G-R3's premise (Higgsfield credits
block the real-time generative avatar), specifies the achievable zero-credit slice with numbers,
and records what stays OPEN. **R3 is NOT claimed PASS by this document.**

---

## 1. Facts table (tool + raw response + timestamp)

| # | Claim | Tool used | Raw result (verbatim/excerpted) | When |
|---|-------|-----------|----------------------------------|------|
| 1 | Higgsfield account has **0 credits**, plan **free** | `mcp__claude_ai_Higgsfield__balance` | `{"credits":0,"subscription_plan_type":"free"}` | 2026-09-06 ~01:05Z, this session |
| 2 | Higgsfield's paid tiers (PLUS/ULTRA) are 1,000–3,000 credits/mo, no free real-time-avatar tier | `mcp__claude_ai_Higgsfield__show_plans_and_credits` | `plans:[{"id":"plus","credits":1000,"monthly_final_price_cents":4900,...},{"id":"ultra","credits":3000,"monthly_final_price_cents":9900,...}]`; a 3-day MCP-only free trial exists (100 credits, then auto-charges $49/mo) — **MCP-only, not usable by the production Cloud Function**, and requires a card | same call | same |
| 3 | Configured `ELEVENLABS_VOICE_ID` (`JBFqnCBsd6RMkjVDRZzb`, `functions/index.js:52`) is a **premade/stock** voice, not the account's cloned voice | `mcp__claude_ai_ElevenLabs__creative_list_voices` | `{"voice_id":"JBFqnCBsd6RMkjVDRZzb","name":"George - Warm, Captivating Storyteller","category":"premade",...}`. The account **does** hold a genuine clone — `{"voice_id":"0ZJ4kFDo6bZUNQsuULOW","name":"my_voice_clone","category":"cloned"}` — which the deployed function deliberately does **not** use (comment at `functions/index.js:33-48`: IVC refused on the `payg` plan) | same session |
| 4 | ElevenLabs REST `/v1/text-to-speech/{voice_id}/with-timestamps` returns **character-level** alignment, not phoneme/viseme level | `WebFetch` → `https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps` | Response carries `alignment` and `normalized_alignment` objects, each with `characters`, `character_start_times_seconds`, `character_end_times_seconds` — floating-point seconds, per character | fetched this session |
| 5 | ElevenLabs WebSocket `stream-input` API exists and streams word-level alignment inline with audio chunks | `WebFetch` → `https://elevenlabs.io/docs/websockets` | `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={model_id}`; client sends `{"text":...}` chunks + init message with `voice_settings`/`generation_config.chunk_length_schedule`; server returns `{"audio":"base64..."}` per chunk and `{"isFinal":true}` at the end; doc text: *"You can use `alignment` to get the word-level timestamps for each word in the text"* — **word-level**, coarser than the REST endpoint's character-level | fetched this session |
| 6 | Higgsfield has **no real-time/streaming generation product** — every documented endpoint is async submit-then-poll | `WebFetch` → `https://docs.higgsfield.ai/` | *"submit a request to a model endpoint, then poll for the result or receive a webhook when processing finishes"*; results retained "at least seven days"; no low-latency/live/WebSocket avatar product is documented | fetched this session |
| 7 | Production code has **zero references** to Higgsfield anywhere in `components/`, `functions/`, `app/` | `grep -rn "higgsfield" components functions app` | 0 hits | this session |
| 8 | The dock shows a literal **"MiniVic Live"** badge | `Read components/MiniVicBot.tsx` | line 1112: `<span>MiniVic Live</span>` — a plain liveness dot (bright while speaking), not a Higgsfield/WSS claim in the markup itself, but the word "Live" beside a pre-rendered loop is the label ADV-2315Z calls false | this session |
| 9 | `/api/tts` cold vs warm TTFB on the live site | `curl -w '%{time_starttransfer}'` ×3 against `https://forgotten-mistory.web.app/api/tts` | sample1 (cold): `time_starttransfer=2.897s`; sample2: `0.462s`; sample3: `0.456s` — Cloud Run cold start dominates the first hit | 2026-09-06, this session |
| 10 | `/api/chat` TTFB (brain) on a single warm probe | `curl -w '%{time_starttransfer}'` against `https://forgotten-mistory.web.app/api/chat` | `ttfb=1.292s` (non-streaming full JSON response measured by curl; the SSE-mode first-token figure that t_1e4e053e's decisions log — 732/594 ms P50 — was measured with a different client and is not re-verified here) | same session |
| 11 | Existing 4K master of the greeting shot | `Read docs/delivery/evidence/.../asset-ladder.md §9` | `artifacts/masters/minivic-greeting-2160p-master.mp4` — 3840×2160 @ **24 fps**, 12.325 s, same shot as the shipped loop (frame-compared at t=2s) | prior evidence, cited not re-measured |
| 12 | Existing viseme set already implements a named phoneme→shape convention | `Read lib/visemeMap.ts` | header comment: *"Reference: D-ID Viseme Reference Table (21 visemes), mapped to standard IPA mouth shapes"*; `VISEME_SHAPES` array defines 21 entries (indices 0–20) with `upperLipY/lowerLipY/jawDrop/lipRound/lipWidth/teethVisible` | this session |

No probe tool failed in this session; every credential name referenced above (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`) came from a `grep -E '^[A-Z][A-Z0-9_]*='` name-only read of `/root/.claude/.env.production` or from `functions/index.js`'s public comments — no value is printed anywhere in this file or this session's tool output.

---

## 2. The achievable zero-credit slice, with numbers

### (a) Viseme track — timestamps → grapheme-to-viseme → schedule

1. Call ElevenLabs REST `POST /v1/text-to-speech/{voice_id}/with-timestamps` (not the current plain `/v1/text-to-speech/{voice_id}` the Cloud Function calls today) for every dynamic chat reply, and once, offline, for the fixed greeting text (`minivic-greeting.txt`).
2. The response's `alignment.characters[]` + `alignment.character_start_times_seconds[]`/`character_end_times_seconds[]` give a per-character time window.
3. Map each character (or, for multi-letter graphemes, each character run — e.g. `"th"`, `"sh"`, `"ch"`) to one of the **21 D-ID visemes already defined in `lib/visemeMap.ts`** via a grapheme→phoneme→viseme table (the same D-ID/Microsoft convention the file already cites, so no new taxonomy is introduced — only the letter→viseme lookup is new code). A minimal English grapheme table (≈40 rules: vowel digraphs, common consonant clusters, default single-letter fallback) covers the greeting script and typical chat answers without a full G2P library.
4. Emit a schedule: `[{tStart, tEnd, visemeIndex}]` — this is exactly the shape `startSyntheticMouth`'s consumer already expects (`getVisemeShape(result.visemeIndex)` at `MiniVicBot.tsx:663`), so the existing lerp/draw path (`visemeLerpRef`, `drawViseme`) needs no rewrite — only its *driver* changes from an amplitude heuristic to a timestamp-driven schedule.

### (b) Mouth rendering — can the 4K master supply real viseme frames?

Yes, in principle, for the **fixed greeting only** (the 4K master is a single 12.325 s take of the greeting, not a corpus of every phoneme):
1. `ffmpeg -i artifacts/masters/minivic-greeting-2160p-master.mp4 -vf fps=24 frame_%04d.png` — extract all ≈296 frames (24 fps × 12.325 s) once, offline.
2. Run `with-timestamps` on the greeting text against the **same voice** already used to render `minivic-greeting.mp3` (same `VOICE_ID`, same `MODEL_ID`) — this gives the character timing for that exact audio.
3. Because the master is a video of the *owner speaking the same greeting*, the mouth shapes on-frame already correspond to the greeting's real phonemes; aligning the ElevenLabs character timestamps to the master's own frame timestamps (both keyed to the same spoken text, just two different recordings — the master's original speech vs. the ElevenLabs synthetic voice) lets each ElevenLabs-timed viseme window be mapped to the **nearest master frame whose mouth shape matches that viseme class** (a one-time manual/scripted lookup table: viseme index → best representative frame number in the master, chosen by eye once).
4. This produces a fixed set of ≤21 still frames (one per viseme class) cropped to the mouth region — a sprite sheet, not a video — that can replace the current Canvas-2D vector-drawn mouth shapes with real photographic mouth crops for the **greeting only**. Dynamic chat replies (arbitrary text, no matching master footage) still fall back to the vector-drawn Canvas-2D/GLSL viseme shapes already shipped (`VisemeStage`/`drawViseme`) — there is no photographic master for text nobody has spoken on camera. This is real-time-seeming for the one scripted line only; it is not the general chat answer.
5. This entire pipeline is **offline/asset-prep**, so it costs 0 Higgsfield credits and 0 additional ElevenLabs credits beyond one `with-timestamps` call already needed for (a).

### (c) Sync budget — measuring ≤40 ms drift

Drift sources, largest first:
- **Cloud Run cold start** (§(d) below) — not a sync-drift source, a latency source; irrelevant to steady-state drift once audio is playing.
- **`HTMLAudioElement.currentTime` resolution** — spec'd as a `double` in seconds but browser-observed update granularity is commonly ~15–250 ms depending on `timeupdate` throttling; **do not** drive the viseme schedule from `timeupdate` events. Instead poll `audio.currentTime` inside a `requestAnimationFrame` loop (already how `visemeLerpRef` is advanced at `MiniVicBot.tsx:676`), which ties the read to the render frame rather than the throttled event.
- **rAF jitter** — typically ≤1 frame (≈16.7 ms at 60 Hz, ≈33 ms at 30 Hz on a throttled/background tab); this is the dominant remaining error term once `timeupdate` is avoided.
- **Alignment quantization** — ElevenLabs character timestamps are themselves model-estimated, not ground truth; no published error bound, so this is an unverifiable systematic error, not a measurable one from the client side.
- **Net effect:** rAF-driven `currentTime` sampling keeps drift inside roughly ±1 rAF frame (≤16.7 ms at 60 fps) *relative to the audio clock*, which is under the 40 ms budget — **provided** the alignment data itself is accurate, which cannot be verified without a ground-truth phoneme aligner (out of scope here, OPEN below).
- **Playwright verification method (`tests/e2e/avatar-voice.spec.ts` — exists, 3,551 bytes, currently exercises playback/labels, not drift):** extend it to (1) start playback, (2) at N sampled instants read both `audio.currentTime` (via `page.evaluate`) and the currently-rendered viseme index/timestamp exposed on a `data-viseme-index`/`data-viseme-t` attribute the component would need to add, (3) look up the *expected* viseme index for that `currentTime` from the same schedule array (exposed to the test via a `window.__minivicVisemeSchedule` debug hook, dev/test builds only), (4) assert `|actualWindowStart - currentTime| <= 0.04` for every sample. This requires two small, test-only additions to `MiniVicBot.tsx` (a debug attribute + a debug global) — not present today; implementing them is out of this research task's read-only scope.

### (d) First-word budget — brain + TTS

- `/api/tts` cold: **2.897 s**; warm: **0.456–0.462 s** (curl `time_starttransfer`, 3 live samples, §1 row 9).
- `/api/chat` warm (single sample, non-streaming curl): **1.292 s** TTFB (§1 row 10). Prior evidence (t_1e4e053e decisions log, not re-verified this session) claims a streaming-mode P50 of 732/594 ms measured with a different client — the two numbers are not directly comparable (SSE first-token vs. full-JSON TTFB) and should not be combined without a matching-methodology re-measure.
- **Composed first-word estimate, warm path:** brain TTFB (~0.6–1.3 s, method-dependent) + TTS TTFB (~0.46 s, warm) ≈ **1.1–1.8 s** before the first audio byte reaches the browser, before browser buffering/decode. This straddles the R3 target of "<~1.5 s first word" — warm it is plausibly inside budget on the SSE figure, outside it on the plain-fetch figure; **cold** (either service having scaled to zero) it is **not** met (2.9 s on TTS alone). G-M4's own gate language ("cold probe, not only Cloud Run origin") flags exactly this — this research does not re-run G-M4's own dedicated cold-probe methodology, it reports the raw numbers this session measured.

### (e) What stays OPEN

1. **Full real-time generative Higgsfield avatar** (a video model producing new frames live from arbitrary chat text): Higgsfield balance is **0 credits, free plan** (row 1); the product itself is **async-only** with no live/WebSocket surface documented anywhere (row 6) — so even fully credited, Higgsfield cannot deliver a *live-generated* video frame per chat answer; it can only pre-render clips offline. **This makes "real-time Higgsfield avatar" structurally unreachable with Higgsfield's current API shape, credits or not** — the only credit-gated piece is a *richer pre-rendered clip library* (e.g., generating additional greeting-style takes for other canned lines), not per-answer real-time generation. Unblock cost to test that richer-library path: cheapest paid tier is **PLUS, $29–49/mo for 1,000 credits/mo** (row 2).
2. **Phoneme-accurate (not character-approximated) viseme timing**: ElevenLabs' finest published granularity is character-level (REST `with-timestamps`) or word-level (WebSocket `stream-input`) — neither is phoneme-level; the grapheme→viseme table in §2(a) is therefore an approximation, not a measured phoneme boundary. A dedicated forced-aligner (e.g. Montreal Forced Aligner) against the rendered MP3 would give true phoneme boundaries but is new infrastructure, not covered by any credit already held.
3. **Cloned-voice speech**: the account holds a real clone (`0ZJ4kFDo6bZUNQsuULOW`) but the deployed function cannot use it — IVC is refused on the current ElevenLabs plan (`functions/index.js:33-48`, prior evidence, not re-verified this session since doing so would require a live TTS call against that voice id, out of this task's read-only/no-secrets scope).
4. **Verified ≤40 ms drift**: the measurement method is specified (§2c) but not implemented — `tests/e2e/avatar-voice.spec.ts` does not yet assert drift, and the two debug hooks it needs do not exist in `MiniVicBot.tsx` today.
5. **Matching-methodology first-word number**: the 732/594 ms SSE figure and this session's 1.292 s plain-fetch figure were taken with different client protocols; a single, reproducible, cold-and-warm methodology per G-M4 is not re-run here.

### Honest badge wording

Replace `MiniVic Live` (line 1112) — which, next to a pre-rendered loop and no Higgsfield/WSS pipeline, reads as a false real-time claim per ADV-2315Z — with **`Synthetic voice · pre-rendered avatar`** or, if space-constrained, **`Synthetic — not real-time video`**. This states plainly what row 7–9 confirm: no live avatar generation exists in the shipped path; only TTS audio (real, live-called) drives a pre-rendered clip's mouth overlay. (Wording change is a recommendation for the analyst-programmer task that owns G-R3/G-R2 — not applied here; this task is read-only.)

---

## 3. Reproduce

```bash
# Higgsfield credits/plan (MCP tool call, this session)
# via ToolSearch 'select:mcp__claude_ai_Higgsfield__balance' then call with {} — returns:
#   {"credits":0,"subscription_plan_type":"free"}

# ElevenLabs voice identity check (MCP tool call, this session)
# via ToolSearch 'select:mcp__claude_ai_ElevenLabs__creative_list_voices' — search the
# returned list for voice_id "JBFqnCBsd6RMkjVDRZzb" → category "premade"

# TTS cold/warm TTFB, live
for i in 1 2 3; do
  curl -s -o /tmp/tts_out_$i.mp3 -w "sample$i: http=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s size=%{size_download}\n" \
    -X POST "https://forgotten-mistory.web.app/api/tts" \
    -H "Content-Type: application/json" -H "Origin: https://forgotten-mistory.web.app" \
    -d '{"text":"Hello, this is a latency probe for the avatar research task."}' --max-time 15
done

# Chat TTFB, live (single non-streaming sample)
curl -s -o /dev/null -w "http=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
  -X POST "https://forgotten-mistory.web.app/api/chat" \
  -H "Content-Type: application/json" -H "Origin: https://forgotten-mistory.web.app" \
  -d '{"messages":[{"role":"user","content":"What is your strongest skill?"}]}' --max-time 20

# Badge text location
grep -n "MiniVic Live" /root/forgotten-mistory/components/MiniVicBot.tsx   # → line 1112

# Zero Higgsfield references in shipped app code
grep -rn "higgsfield" /root/forgotten-mistory/components /root/forgotten-mistory/functions /root/forgotten-mistory/app   # → 0 hits

# 4K master (prior evidence, cited not re-run here)
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -of csv=p=0 /root/forgotten-mistory/artifacts/masters/minivic-greeting-2160p-master.mp4   # → 3840,2160,24/1

# 21-viseme convention already in code
sed -n '1,20p' /root/forgotten-mistory/lib/visemeMap.ts
```

**Docs fetched this session (cited above):**
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- https://elevenlabs.io/docs/websockets
- https://docs.higgsfield.ai/

**R3 verdict:** not claimed. This document is research only — it establishes credits (0, free plan),
API capabilities (character-level REST timestamps, word-level WS alignment, Higgsfield async-only
with no real-time surface at any credit level), and a specified, numbered, zero-credit slice for an
analyst-programmer to implement and test. The full generative real-time Higgsfield avatar remains
OPEN per G-R3, and is shown here to be structurally unreachable via Higgsfield's current API even
once credited — only a richer pre-rendered library is credit-gated.
