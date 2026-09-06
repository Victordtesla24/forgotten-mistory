# MINIVIC-AVATAR-v1 — the avatar that *seems* real-time

**Task:** `t_w2_r3sa` · solutions-architect (`sa-w2-r3`) · read-only architecture pass
**Date:** 2026-09-06, 01:10–01:40Z, VPS `srv1356245`
**Requirement:** docs/prompt.md §2.1 R3 — *"a pre-made animated avatar that seems real-time,
driven by frame-accurate (~40 ms) lip-sync"*; §14 C-4 / C-6 / C-7; §0.3-3/-5/-7.
**Inputs:** `docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/R3-avatar-path.md` (facts),
`docs/architecture/MINIVIC-BRAIN-0-4.md` (brain ladder + labels), `docs/adversarial/ADV-REVIEW-20260905T2315Z.md` §MiniVic.
**Hands off to:** analyst-programmer, in the seven slices of §8. **No app code is edited by this task.**

Every number below is either (a) produced by a command run inside this task — the command is
printed beside it — or (b) quoted from the research doc with its origin named, or (c) explicitly
labelled **estimate**. Nothing else is a number.

---

## 0. What this design does and does not promise

R3's second form is not "generate video live". It is: **the voice is real and called live; the
face is a fixed set of frames recorded once; the two are joined by a schedule derived from the
real audio's own timing, and the join is measured.** That sentence is the product, the copy, and
the test, and they are deliberately the same sentence.

| Claim | Status after this design |
|---|---|
| ElevenLabs TTS is called live for every reply | **true today**, kept true |
| The mouth follows the words that are actually being spoken | **new** — §3, §4 |
| The renderer follows the schedule to ≤40 ms | **new and measured** — §5, TEST R3-DRIFT-01 |
| The schedule matches ground-truth phoneme boundaries | **not claimed** — ElevenLabs' finest published granularity is *character*, and its own timing error has no published bound (research §2e-2). §5.4 says exactly what the 40 ms number is a bound on. |
| Video is generated in real time for your question | **never claimed** — §7, TEST R3-COPY-02 |

---

## 1. Measurements taken in this task

| # | Fact | Value | Command (run 2026-09-06, this task) |
|---|---|---|---|
| M1 | 4K master geometry | `3840×2160`, `24/1` fps, **295 frames**, **12.291667 s** video | `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,duration -of default=nw=1 artifacts/masters/minivic-greeting-2160p-master.mp4` |
| M2 | 4K master **has** an audio stream | `0,h264,video` / `1,aac,audio`; audio **12.325011 s** | `ffprobe -v error -show_entries stream=index,codec_type,codec_name -of csv=p=0 …master.mp4` |
| M3 | Greeting audio | **24.984671 s**, **417 702 B** | `ffprobe -v error -show_entries format=duration,size -of default=nw=1 public/assets/minivic-greeting.mp3` |
| M4 | Greeting text | **365 code units**, 367 bytes, 61 words → **14.61 chars/s** | `cat public/assets/minivic-greeting.txt` + `node -e` char count |
| M5 | Shipped loop | `public/assets/my-hero-avatar.mp4` = `1280×720`, `24/1`, 295 frames, 12.291667 s, 1 916 328 B — **exists** (ADV-2315Z's 404 is closed) | `ffprobe …/my-hero-avatar.mp4`; `ls -la public/assets/` |
| M6 | 4K master is **untracked**, and stays so | `error: pathspec … did not match any file(s) known to git`; `.gitignore:196` = `artifacts/*` | `git ls-files --error-unmatch artifacts/masters/…mp4` |
| M7 | ffmpeg + ffprobe available on this host | `/usr/bin/ffmpeg`, `/usr/bin/ffprobe` | `which ffmpeg ffprobe` |
| M8 | Image asset cap enforced by the audit | **500 kB** for `png\|jpe?g\|gif\|webp\|avif\|svg\|woff2?\|ttf` under `public/` | `sed -n '155,190p' scripts/validate/overhaul_static_audit.mjs` (`TC-NFR-PERF`) |
| M9 | Size comparator for the atlas budget | `my_avatar.webp` = **51 028 B** at 1480×826 ≈ 1 222 480 px | `ls -la public/assets/my_avatar.webp` |
| M10 | Viseme set already in the tree | `VISEME_SHAPES` = **22 entries, indices 0–21**, index 0 = `sil`; header cites *"D-ID Viseme Reference Table (21 visemes) … standard IPA mouth shapes"* | `cat lib/visemeMap.ts` |
| M11 | The badge still lies | `components/MiniVicBot.tsx:1112` → `<span>MiniVic Live</span>` | `grep -n 'MiniVic Live' components/MiniVicBot.tsx` |
| M12 | TTS today buffers the whole MP3 before responding | `const audio = Buffer.from(await upstream.arrayBuffer());` (`functions/index.js:129`) — the shipped TTS path is **already non-streaming** | `sed -n '25,145p' functions/index.js` |
| M13 | Build hooks generated modules before `next build` | `build:static` = `build_stamp → cv_fingerprint → greeting_envelope → minivic_origin → next build` | `node -e "…package.json.scripts"` |

Quoted, not re-measured here (research doc §1, cited by row): `/api/tts` warm TTFB
**0.456 / 0.462 s**, cold **2.897 s** (row 9). Brain first token at the Cloud Run origin
**0.691 / 0.762 / 0.823 s** warm (MINIVIC-BRAIN-0-4 §1.3, five+three samples).

### 1.1 The finding that changes the plan

**M1/M3: the master is 12.291667 s. The greeting is 24.984671 s.** The master's *own* audio is
12.325011 s (M2). It is therefore **not** a recording of anyone speaking this 24.98 s greeting —
it is a 12.29 s take, and the shipped 720p loop (M5) is the same 295 frames.

This invalidates step 3 of the research doc's §2(b) ("*the master is a video of the owner
speaking the same greeting … aligning the ElevenLabs character timestamps to the master's own
frame timestamps*"). **There is no timeline to align to.** The sprite plan survives — because it
never needed a timeline — but its alignment step is re-specified in §4.2 as *viseme-class
representative selection*, which needs only that each of the 22 mouth shapes occurs somewhere in
295 frames, not that the master and the greeting share a clock.

---

## 2. TTS path — REST `/with-timestamps`, not the WebSocket

**Decision: `rest-with-timestamps`.** Logged under docs/prompt.md §0.1.

Three reasons, in order of finality.

1. **The WebSocket is structurally unavailable, not merely slower.** ElevenLabs `stream-input`
   is `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input` and is authenticated
   with `xi-api-key` (research row 5). Two ways to reach it, both closed:
   - *From the browser* — ships `ELEVENLABS_API_KEY` to the client. Forbidden by §14 C-7 and
     caught by the audit's own `TC-NFR-SEC` and `scripts/validate/built_output_secret_scan.mjs`.
   - *From the function* — `onRequest` (Cloud Functions v2 / Cloud Run) serves HTTP request →
     response; there is no socket to upgrade and hand back to the browser. A WS relay needs a
     persistent process, i.e. new infrastructure on the VPS, i.e. a new credential surface and a
     new moving part — the same class MINIVIC-BRAIN-0-4 §2(c) rejected for the warm timer.
2. **The WebSocket is *coarser* on the one axis this task exists for.** Its alignment is
   **word-level**; REST `/with-timestamps` is **character-level** (research rows 4–5). Trading
   character timing for word timing to chase latency is trading the deliverable for the budget.
3. **The latency argument is smaller than it looks.** The shipped function already awaits the
   complete MP3 before it answers (**M12**), so today's warm 0.46 s TTFB is *already* a
   whole-utterance figure. `/with-timestamps` returns the same synthesis in the same one round
   trip, as JSON. Cost: base64 inflates the audio ≈4/3, plus ≈3 kB of alignment. There is no
   streaming being given up, because none is being done.

### 2.1 Response shape

`POST https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps?output_format=mp3_44100_128`
returns JSON. The function re-shapes it once, so the client never learns ElevenLabs' schema:

```jsonc
// 200 application/json  ← POST /api/tts  with  Accept: application/json
{
  "audioBase64": "…",              // mp3_44100_128, exactly the bytes the old endpoint sent
  "alignment": {
    "characters":                  ["I", "'", "m", " ", "V", …],
    "characterStartTimesSeconds":  [0.0, 0.081, 0.116, …],
    "characterEndTimesSeconds":    [0.081, 0.116, 0.174, …]
  }
}
```

**Back-compatibility is a hard requirement, not a nicety.** A visitor holding a cached bundle
from before this change sends no `Accept` header change and expects `audio/mpeg`. The function
therefore **content-negotiates**: `Accept: application/json` ⇒ the JSON above; anything else ⇒
today's binary MP3 body, byte-identical behaviour, `Cache-Control: public, max-age=86400`
unchanged. Asserted by TEST **TS-FN-05**. Without this, the deploy window between function and
static export is a broken voice for every returning visitor — the same shape of defect as the
stale-service-worker incident.

### 2.2 The greeting's alignment must come from the greeting's own synthesis

`public/assets/minivic-greeting.mp3` was rendered once by `scripts/generate-cloned-greeting.ts`.
ElevenLabs synthesis is not reproducible across calls: a `/with-timestamps` call made *today* on
the same text returns the alignment of **a different render**, and using it against the committed
MP3 would produce unbounded, invisible drift — a schedule that is precise about the wrong audio.
**Explicitly rejected.**

The alignment is therefore produced **in the same call that produces the MP3**, by extending
`scripts/generate-cloned-greeting.ts` to request `/with-timestamps` and write three artefacts in
one pass, all pinned to one digest:

| Artefact | Written by | Pinned by |
|---|---|---|
| `public/assets/minivic-greeting.mp3` | `scripts/generate-cloned-greeting.ts` | — |
| `app/data/generated/greeting-asset.ts` (`greetingAudioSha256`, `greetingSpokenText`) | same run | — |
| `app/data/generated/greeting-alignment.ts` (**new** — raw character alignment + `sourceSha256`) | same run | `sourceSha256 === greetingAudioSha256`, asserted at build |
| `app/data/generated/greeting-envelope.ts` | `scripts/build/greeting_envelope.mjs` (unchanged) | already asserts the same equality |

This is the pattern `greeting_envelope.mjs` already established and documents at length in its
own header ("*a regenerated greeting with a stale envelope fails the build here*"). We are adding
a third file to an existing three-way pin, not inventing a mechanism.

**Cost gate.** Regenerating the greeting is **one ordinary TTS call of 365 characters (M4)** on
the already-configured premade voice — normal TTS usage, inside the gate. **No IVC, no cloning,
no new voice** is designed in anywhere in this document.

### 2.3 First-word budget — two numbers, and only one of them is a promise

| Path | Composition | Budget |
|---|---|---|
| **B1 — greeting** (panel open → first audio sample) | one static fetch of a 417 702 B MP3 (M3) from Firebase Hosting's CDN. **No brain, no TTS, no function.** | **< 1.5 s, met by construction.** This is the first voice every visitor hears, and it is the only first-word number this design claims. Measured by `scripts/validate/first_word_budget.mjs` (§6.6), 7 samples, P50 and max both reported. |
| **B2 — dynamic reply** (send → first audio sample) | brain first token **0.691–0.823 s** (measured, MINIVIC-BRAIN §1.3) + Δ to end of *first sentence* (**estimate 0.3–0.6 s**; never measured) + TTS warm TTFB **0.456–0.462 s** (measured, research row 9) + browser decode/play-start (**estimate ≤0.1 s**) | **≈1.55–1.98 s warm — outside 1.5 s.** Reported, not claimed. Cold it is worse: TTS alone cold is **2.897 s**. |

**The one lever with measured leverage on B2 is sentence-chunking**: call TTS on the first
complete sentence of the streamed answer instead of on the whole answer, so the TTS call starts
at "brain first sentence" rather than "brain done" (measured brain totals were 1.157–1.846 s).
The residue after that is upstream generation time, which is not ours to spend. **Rejected as
budget levers:** shortening answers (the gaming MINIVIC-BRAIN §2(c) already refused), a
lower-bitrate first chunk (transfer is not the bottleneck; ElevenLabs TTFB is generation-bound),
and any change that moves first *byte* without moving first *word*.

`first_word_budget_s` for the structured record: **1.5 (B1, met by construction) · 1.55–1.98
estimate (B2, warm, composed from measured operands)**.

---

## 3. The viseme schedule

### 3.1 The set — the one already in the tree

The **22-entry D-ID / Microsoft viseme set in `lib/visemeMap.ts`**, indices 0–21, index 0 = `sil`
(M10). No new taxonomy is introduced anywhere in this design. Every index this document names
comes from that file's own `label`/`phonemes` fields.

### 3.2 Grapheme-run → viseme rules

`lib/visemeSchedule.ts` (**new**, pure, no DOM, no React) exports:

```ts
export function graphemeRuns(text: string): Array<{ start: number; end: number; viseme: number }>;
export function buildSchedule(alignment: Alignment, opts?): VisemeSchedule;
export function visemeIndexAt(schedule: VisemeSchedule, t: number): number;
```

`graphemeRuns` walks the lowercased text with **ordered longest-match**: multi-character rules
first, single letters last, so `th` never resolves as `t`+`h`.

| Rule class | Graphemes | → index (label in `visemeMap.ts`) |
|---|---|---|
| dental fricative | `th` | 17 `TH` |
| postalveolar | `sh`, `ch`, `tch`, `ti`(in `-tion`), `si`(in `-sion`), `j`, `ge`(final) | 16 `SH` |
| labiodental | `f`, `ph`, `v`, `gh`(in `laugh`, `-ough` exceptions list) | 18 `FV` |
| velar | `ng`, `nk`, `k`, `ck`, `c`(before `a o u` or a consonant), `q`, `g`(hard), `x`→19+15 | 19 `NG` |
| bilabial | `p`, `b`, `m`, `mm`, `pp`, `bb` | 20 `PB` |
| alveolar stop/nasal | `t`, `d`, `n`, `tt`, `dd`, `nn`, `ed`(final) | 21 `TD` |
| sibilant | `s`, `z`, `ss`, `zz`, `c`(before `e i y`), `ce`, `x`(coda) | 15 `S` |
| lateral | `l`, `ll` | 14 `L` |
| rhotic | `r`, `rr`, `wr` | 13 `R` |
| aspirate | `h`(onset) | 12 `H` |
| rounded glide | `w`, `wh`, `oo`, `u`(after `r j`), `ew`, `ue`, `oe`(in `shoe`) | 7 `UW` |
| back rounded | `ow`, `oa`, `o`(open syllable), `oe` | 8 `OW` |
| open back | `aw`, `au`, `augh`, `ough`(in `bought`) | 9 `AW` |
| diphthong /ɔɪ/ | `oy`, `oi` | 10 `OY` |
| diphthong /aɪ/ | `ay`(in `say`→4), `i`(open syllable), `igh`, `ie`, `y`(final, stressed) | 11 `AY` |
| front spread | `ee`, `ea`, `ie`(in `field`), `i`(closed), `y`(final, unstressed) | 6 `IH` |
| mid front | `e`, `eh`, `ai`, `ay`, `ei`, `ey` | 4 `EY` |
| r-coloured | `er`, `ir`, `ur`, `ar`(unstressed), `or`(unstressed), `our` | 5 `ER` |
| rounded mid-back | `aw`(rounded ctx), `or`, `au`(in `caught`), `al`(in `talk`) | 3 `AO` |
| open front | `a`(open syllable), `aa`, `ah` | 2 `AA` |
| default vowel / schwa | `a`, `u`, any unmatched vowel | 1 `AE` |
| default consonant | any unmatched consonant | 21 `TD` |
| silence | `.` `,` `!` `?` `;` `:` `—` `–` `…` and whitespace | 0 `sil`, subject to §3.4 |

≈45 rules. **This is an approximation of English orthography, not a phonemiser**, and §9-2 keeps
that on the OPEN register rather than in the marketing copy.

### 3.3 Schedule shape

```ts
export interface VisemeSchedule {
  version: 1;
  /** SHA-256 of the audio these cues describe. Never absent. */
  sourceSha256: string;
  durationSeconds: number;
  /** [tStart, tEnd, visemeIndex] — flat triples, seconds, never rounded. */
  cues: Array<[number, number, number]>;
}
```

Triples, not objects: **M4** gives 365 characters ⇒ ≈201 runs after merging (estimate, 0.55
run/char) ⇒ ≈3 kB of JSON as triples versus ≈5.2 kB as objects. At 24.98 s that is one cue per
124 ms — coarse enough to be cheap, fine enough that a 40 ms budget is not dominated by the data.

**Cue times are never rounded.** Rounding to milliseconds would inject up to 0.5 ms of avoidable
systematic error into a 40 ms budget for no gain; float64 seconds go through untouched.

### 3.4 Silence and the anti-strobe rule

Two constants, both in `lib/visemeSchedule.ts`, both asserted by tests:

- `SILENCE_MIN_S = 0.06` — a punctuation/whitespace gap becomes a real viseme-0 cue only if it
  is **≥60 ms**. Shorter gaps are absorbed into the preceding run. Without this, every space in
  a 61-word greeting (M4) closes the mouth for one frame and the face flickers.
- `MIN_CUE_S = 0.04` — after merging adjacent identical indices, any cue still shorter than
  **40 ms** is merged into its longer neighbour. 40 ms is chosen to equal the drift budget: a cue
  the renderer cannot be *proven* to hit is a cue that should not exist.

Merging is deterministic and order-independent (left-to-right, longest-neighbour-wins with a
documented tie-break to the left). TEST **VS-06** asserts byte-identical output across runs.

---

## 4. Rendering

### 4.1 The driver changes; the renderer does not

This is the whole point of the design's shape. `startMouthRef.current`
(`components/MiniVicBot.tsx:642–688`) already owns an rAF loop that computes a `visemeIndex`,
lerps `currentVisemeRef → targetVisemeRef` through `visemeLerpRef`, and calls `drawVisemeMouth`.
`VisemeStage` (`components/gl/scenes/VisemeStage.tsx`) reads those same three refs and resolves
them with the *same* `lerpVisemeShapes` call.

**Exactly one line changes in kind:**

```
- const result = heuristicVisemeFromFrequency(dataArray, sampleRate, fftSize);
- const target = getVisemeShape(result.visemeIndex);
+ const target = getVisemeShape(visemeIndexAt(scheduleRef.current, el.currentTime));
```

Consequences, all of them wanted:
- `VisemeStage`, the GLSL, `drawVisemeMouth`, `lerpVisemeShapes`, the reduced-motion path and the
  no-GL path are **untouched** — zero regression surface (§14 C-7 "0 regression").
- The `AnalyserNode` graph stays wired, because it is still the **named fallback** (§4.4).
- `tests/overhaul/viseme-stage.spec.ts` TC-VISEME-GL-01…03 keep passing unmodified: they assert
  the stage is *lit by* the viseme stream, not where the stream came from.

### 4.2 The greeting's mouth — a sprite atlas from the 4K master

Because of **§1.1** there is no timeline to align. The atlas is built by **viseme-class
representative selection**, in three committed, reviewable steps.

**Step 1 — contact sheet (once, by a human eye, output not committed):**
```bash
ffmpeg -v error -i artifacts/masters/minivic-greeting-2160p-master.mp4 \
  -vf "scale=384:-1,drawtext=text='%{n}':x=4:y=4:fontsize=20:fontcolor=white,tile=20x15" \
  -frames:v 1 /tmp/minivic-contact.png     # 295 frames (M1) fit in one 20×15 tile
```

**Step 2 — the map, committed as data:** `data/minivic-viseme-frames.json`

```jsonc
{
  "master": "artifacts/masters/minivic-greeting-2160p-master.mp4",
  "masterSha256": "…",          // pinned; the build FATALs if the untracked master differs (M6)
  "crop": { "x": 1560, "y": 1290, "w": 720, "h": 480 },   // mouth box in 3840×2160 coords
  "frames": { "0": 7, "1": 41, "2": 88, "…": 0, "21": 268 }   // visemeIndex → frame number
}
```
Verify the crop box before trusting it:
```bash
ffmpeg -v error -i artifacts/masters/minivic-greeting-2160p-master.mp4 \
  -vf "select='eq(n\,120)',crop=720:480:1560:1290" -frames:v 1 -vsync 0 /tmp/crop-check.png
```

**Step 3 — build the atlas** (`scripts/build/minivic_viseme_atlas.mjs`, run in the
`build`/`build:static` chain beside `greeting_envelope.mjs` — **M13**):
```bash
ffmpeg -v error -i artifacts/masters/minivic-greeting-2160p-master.mp4 \
  -vf "select='eq(n\,7)+eq(n\,41)+…+eq(n\,268)',crop=720:480:1560:1290,scale=192:128,tile=22x1" \
  -frames:v 1 -vsync 0 /tmp/minivic-visemes.png
cwebp -q 82 /tmp/minivic-visemes.png -o public/assets/minivic-visemes.webp
```
Cell order is `visemeIndex` ascending, so cell *i* is at `sx = i * 192`. No index table ships.

**Budget.** Atlas is 4224×128 = **540 672 px**. `my_avatar.webp` is **51 028 B for ≈1 222 480 px**
(M9) — 44 % of the pixels at the same encoder class ⇒ **≈22 kB, estimate**. Hard gate: the
audit's `TC-NFR-PERF` image cap of **500 kB** (M8); soft target **120 kB**, asserted directly by
TEST **R3-ATLAS-01** so a regression is caught at 120 kB rather than at 500 kB.

**Graceful degradation is mandatory (§14 C-6):** the master is untracked (M6) and ffmpeg may be
absent on a deploy runner. `minivic_viseme_atlas.mjs` follows `greeting_envelope.mjs`'s own
precedent exactly — if the committed `public/assets/minivic-visemes.webp` exists and
`data/minivic-viseme-frames.json`'s `masterSha256` is unchanged, keep it and exit 0; FATAL only
when there is nothing safe to keep.

**Drawing.** In `drawVisemeMouth`'s place, only when `atlasReady && mode === 'greeting'`:
```
ctx.globalAlpha = 1 - lerp;  ctx.drawImage(atlas, prev*192,0,192,128, dx,dy,dw,dh);
ctx.globalAlpha = lerp;      ctx.drawImage(atlas, next*192,0,192,128, dx,dy,dw,dh);
```
The crossfade uses the **same `visemeLerpRef`** the vector path and the GLSL stage use, so all
three surfaces stay in step by construction rather than by coincidence.

### 4.3 Dynamic replies

No atlas. There is no photographic footage of Vikram saying an arbitrary chat answer, and
inventing one is exactly the fabrication §14 C-7 forbids. Replies drive the **existing vector
`drawVisemeMouth` + `VisemeStage` GLSL** path — unchanged pixels, new driver (§4.1). The mouth
becomes photographic for the one line that was really filmed and stays honest-synthetic for
everything else, which is also what the copy says (§7).

### 4.4 Named fallbacks — never silent (§14 C-6)

| Condition | Behaviour | Notice |
|---|---|---|
| No schedule (browser-TTS last resort; `/api/tts` degraded to MP3-only) | analyser-driven `heuristicVisemeFromFrequency`, exactly as today | `logMiniVicIssue('viseme: no schedule, falling back to analyser')` |
| Atlas fetch fails / decode fails | vector `drawVisemeMouth` for the greeting too | `logMiniVicIssue('viseme atlas unavailable, drawing vector mouth')` |
| `schedule.sourceSha256 !== ` the audio's digest | **refuse the schedule**, fall back to the analyser | `logMiniVicIssue('viseme schedule digest mismatch')` — a wrong schedule is worse than none |

---

## 5. Sync — how the 40 ms is earned and what it bounds

### 5.1 Clock

`audio.currentTime`, sampled **inside the rAF loop that already exists**. `timeupdate` is never
used for this: its firing rate is implementation-defined and commonly throttled to ~4 Hz, which
alone would exceed the budget six-fold.

### 5.2 Lookup

A monotonic cursor over `cues`, advanced while `t > cues[i][1]` — O(1) amortised, since `t` rises
monotonically inside one playback. `onseeking` / `onended` reset the cursor to 0 and a binary
search re-seats it (TEST **R3-DRIFT-03**).

### 5.3 Error budget

| Term | Bound | Basis |
|---|---|---|
| rAF quantisation (the schedule is applied at most one frame late) | **16.7 ms @ 60 Hz · 33.3 ms @ 30 Hz** | 1 / refresh rate — arithmetic, not measured |
| `audio.currentTime` read resolution | **estimate ≤5 ms** | spec'd `double`; browsers update it per audio render quantum (128 frames @ 48 kHz ≈ 2.7 ms). Not independently measured this session. |
| Cue-time quantisation contributed by us | **0** | §3.3 — cue times are never rounded |
| Merge quantisation (`MIN_CUE_S`) | **≤40 ms, by construction, on cues that were discarded** | §3.4 — deliberately equal to the budget |
| **Total, renderer-vs-clock** | **≈21.7 ms @ 60 Hz · ≈38.3 ms @ 30 Hz** | sum of the two live terms — **estimate**, and the tight case is a 30 Hz display |
| ElevenLabs alignment vs. real phoneme boundaries | **unbounded, unmeasurable client-side** | research §2e-2: no published error bound |

### 5.4 What the 40 ms number is a bound on — stated so nobody overstates it

**The test proves: the mouth the renderer shows at time *t* is the mouth the schedule specifies
for time *t*, to within 40 ms.** It does **not** prove that the schedule matches the true
phoneme boundaries of the audio, because character-level timing from a TTS vendor is an estimate
with no published error bound. Proving the second thing needs a forced aligner (§9-2). Both the
document and the evidence pack must use the first sentence and never the second.

### 5.5 The two hooks, and why they ship in production

```ts
// components/MiniVicBot.tsx — written in the rAF loop, only when the index changes
canvas.dataset.visemeIndex = String(appliedIndex);
// module scope, set whenever a schedule is installed
window.__minivicVisemeSchedule = schedule;              // the cues
window.__minivicViseme = () => ({ t: el.currentTime, index: appliedIndex });  // atomic pair
```

`data-viseme-index` is written **only on change** (≈8 writes/s at one cue per 124 ms, §3.3), not
per frame — attribute churn at 60 Hz would be a real cost for a debug affordance.

**They ship in production, not behind a dev flag.** The schedule is derived from public text and a
public MP3 and carries nothing secret; it costs ≈3 kB. A dev-only hook would mean the drift test
measures a build no visitor receives — precisely the "wrong success metric" failure ADV-2315Z
ranks second. TEST **R3-DRIFT-02** asserts the hook is present on the deployed origin.

### 5.6 The drift assertion

At each of **N ≥ 20** instants spread across the greeting, one `page.evaluate` reads the pair
`{t, index}` atomically (never two evaluates — the audio moves between them):

```
expected = visemeIndexAt(schedule, t)
if (index === expected) driftMs = 0
else                    driftMs = 1000 * min over cue boundaries b of |t - b|
```
A mismatch is only forgiven when the sample landed inside a legitimate transition window.
**PASS = every sample's `driftMs` ≤ 40, and `max(driftMs)` is recorded in the evidence pack.**
Reporting the max — not just the pass — is what stops the number quietly rotting toward 39.

---

## 6. Tests, written and failing before any of §2–§5 is implemented (R9 / §14)

### 6.1 `tests/minivic_tts_timestamps.test.mjs` — `node --test`

| ID | Assertion | Threshold |
|---|---|---|
| **TS-FN-01** | JSON response has `audioBase64` plus three alignment arrays of **equal length** | exact equality |
| **TS-FN-02** | `content-type: application/json` when `Accept: application/json` | exact |
| **TS-FN-03** | start times non-decreasing; `end[i] >= start[i]` for every i | all i |
| **TS-FN-04** | upstream non-200 ⇒ `502 {error:'tts_upstream_failed'}` and **no synthesised alignment** in the body | body has no `alignment` key |
| **TS-FN-05** | **back-compat:** no `Accept` (or `audio/mpeg`) ⇒ binary body, `content-type: audio/mpeg`, `Cache-Control: public, max-age=86400` | byte-shape identical to today |
| **TS-FN-06** | text > `MAX_CHARS` (600) is still truncated before spend; empty ⇒ `400 text_required` | unchanged contract |

### 6.2 `tests/viseme_schedule.test.mjs` — `node --test`

| ID | Assertion | Threshold |
|---|---|---|
| **VS-01** | cues sorted, `tEnd > tStart`, no overlap | all cues |
| **VS-02** | cues cover `[0, durationSeconds]`; every gap is an explicit viseme-0 cue | no implicit gaps |
| **VS-03** | every `visemeIndex` ∈ `[0, VISEME_SHAPES.length-1]` (**0–21**, M10) | all cues |
| **VS-04** | no cue shorter than `MIN_CUE_S` | **0.04 s** |
| **VS-05** | table-driven grapheme rules: `th`→17, `sh`→16, `oo`→7, `m`→20, `f`→18, `s`→15, `ng`→19 — indices read from `visemeMap.ts` labels, never retyped | exact |
| **VS-06** | determinism: `JSON.stringify(buildSchedule(x))` identical across two runs and across input orderings of equal alignments | byte equality |
| **VS-07** | a ≥60 ms punctuation gap yields a viseme-0 cue; a <60 ms gap is absorbed | `SILENCE_MIN_S = 0.06` |
| **VS-08** | the real greeting alignment (`app/data/generated/greeting-alignment.ts`) builds a schedule whose `durationSeconds` is within 50 ms of **24.984671** (M3) and whose `sourceSha256 === greetingAudioSha256` | 0.05 s / exact |

### 6.3 `tests/e2e/avatar-voice.spec.ts` — extend (Playwright)

| ID | Assertion | Threshold |
|---|---|---|
| **R3-DRIFT-01** | ≥20 atomic `{t,index}` samples across the greeting; every sample's `driftMs` (§5.6) ≤ **40**; `max(driftMs)` written to the evidence pack | **40 ms**, 0 failures |
| **R3-DRIFT-02** | `window.__minivicVisemeSchedule` is a non-empty cue array **on the deployed origin's bundle** | length > 0 |
| **R3-DRIFT-03** | after `audio.currentTime = 8`, within 100 ms `data-viseme-index` equals `visemeIndexAt(schedule, 8)` | 100 ms |
| **R3-DRIFT-04** | the schedule's `sourceSha256` equals `window.__CLONED_VOICE_GREETING_HASH__` | exact |
| *(kept)* | the existing two tests — `/api/tts` returns ≥8 kB of `audio/mpeg`, panel labels the voice synthetic — must still pass with `Accept` defaulting as today | unchanged |

### 6.4 `tests/e2e/chatbot.spec.ts` — extend (Playwright)

| ID | Assertion | Threshold |
|---|---|---|
| **R3-COPY-01** | `[data-testid="minivic-synthetic-label"]` matches `/Voice: ElevenLabs stock, spoken live · Face: pre-rendered frames, lip-synced to that audio · Answers: /` | regex |
| **R3-COPY-02** | full page text matches **none** of `/real-?time video\|live video\|video is generated\|generates? video\|video avatar (is )?generated/i` | count 0 |
| **R3-COPY-03** | `getByText('MiniVic Live', {exact:true})` count 0 anywhere | 0 |
| **R3-COPY-04** | the truth line is visible idle, listening **and** speaking | 3 states |

### 6.5 `tests/overhaul/viseme-atlas.spec.ts` — new (Playwright)

| ID | Assertion | Threshold |
|---|---|---|
| **R3-ATLAS-01** | `GET /assets/minivic-visemes.webp` → 200 and `content-length` ≤ **122 880 B** (soft target; the audit's `TC-NFR-PERF` holds the 500 kB hard cap, M8) | 120 kB |
| **R3-ATLAS-02** | with the atlas route aborted, the greeting mouth still changes shape and a `logMiniVicIssue` line fired — named fallback, never silent | ≥3 distinct indices |
| **R3-ATLAS-03** | reduced motion: shape still changes with the audio (keeps `TC-VISEME-GL-02` true) **and** `visemeLerp` is 1 at every sample — cut, not tween | all samples |
| **R3-ATLAS-04** | `?gl=block`: 0 WebGL canvases, mouth still schedule-driven | 0 canvases |

### 6.6 First-word budget — `scripts/validate/first_word_budget.mjs` (method, not a CI gate)

Headless Chromium, `--no-sandbox`, on the **live** origin. `t0` = the click / the send;
`t1` = the `playing` event on `[data-testid="minivic-audio"]`.
- **B1** greeting: 7 samples, fresh context each. **PASS if max < 1.5 s.**
- **B2** reply: 7 warm + 7 after a ≥10 min idle. **Reported, never PASS/FAIL** — the composition
  in §2.3 says the warm estimate is 1.55–1.98 s, and a gate on a number the design does not
  claim is a gate that will be gamed.
Runs on demand, never in the deploy path (O3: no chronic blockers).

---

## 7. Copy — honest, and identical to the sentence the tests assert

**Do not fork the wording from `MINIVIC-BRAIN-0-4.md` §2(b).** That document assigned the badge
and panel line to `t_w1_r2ap`; **M11** shows neither has landed yet. This document keeps its badge
and panel line verbatim and refines only the third line, which is the one R3 makes more specific.

| Where | Today (M11) | Becomes |
|---|---|---|
| `MiniVicBot.tsx:1112` badge | `MiniVic Live` | **`MiniVic · synthetic`** |
| `MiniVicBot.tsx:1155` panel line | `Vikram's AI clone · ask me anything` | **`A synthetic stand-in for Vikram · ask me anything`** |
| `MiniVicBot.tsx:1163` truth line (`data-testid="minivic-synthetic-label"`) | `Synthetic voice · not a recording of Vikram` | **`Voice: ElevenLabs stock, spoken live · Face: pre-rendered frames, lip-synced to that audio · Answers: live text via {provider}`** |
| privacy page, synthetic-media section | — | **add:** *"No video is generated for your question. The face is a fixed set of frames recorded once, re-timed to the voice the site speaks with."* |

`{provider}` is read at runtime from `BrainReply.source` — the plumbing MINIVIC-BRAIN §3 E6–E8
specifies. It is never a literal.

Read the truth line against the four claims: TTS is real and called live (**"spoken live"**);
the face is pre-rendered (**"pre-rendered frames"**); the join is the product, not the pixels
(**"lip-synced to that audio"**); no video generation is claimed anywhere. TEST **R3-COPY-02**
enforces the last one as an absence, which is the only way an absence stays true.

**Whichever of `t_w1_r2ap` or slice R3-A1 lands first, the other rebases onto it.** The wording of
record is this table's, because it is the later and stricter one, and it keeps the brain doc's
`{provider}` plumbing unchanged.

Tone note: nothing here is a superlative, so `TC-NFR-TONE` is unaffected. The badge stays
luminous white, never gold — gold means *sourced figure* (§14 C-8), and a liveness dot is not a
figure; `tests/monochrome/gold-semantics.spec.ts:85-86` targets the old string and must be
retargeted in the same commit (MINIVIC-BRAIN E12).

---

## 8. Slices — analyst-programmer, ≤30 min each, recruiter-visible first

| # | id | Title | Files | Gates | min |
|---|----|-------|-------|-------|-----|
| 1 | **R3-A1** | Honest badge, panel line and truth line — visible in one deploy, needs no pipeline | `components/MiniVicBot.tsx` · `tests/e2e/chatbot.spec.ts` · `tests/monochrome/gold-semantics.spec.ts` | R3-COPY-01…04 green · `tsc` · `lint` · audit 10/10 | 25 |
| 2 | **R3-A2** | Greeting alignment at build time: `generate-cloned-greeting.ts` → `/with-timestamps`, writes `app/data/generated/greeting-alignment.ts` pinned to `greetingAudioSha256`; `lib/visemeSchedule.ts` with the §3.2 table | `scripts/generate-cloned-greeting.ts` · `app/data/generated/greeting-alignment.ts` · `lib/visemeSchedule.ts` · `tests/viseme_schedule.test.mjs` | VS-01…08 green · `greeting_envelope.mjs` digest assert still passes · exactly **one** TTS call spent | 30 |
| 3 | **R3-A3** | Schedule-driven mouth on the greeting + the two hooks + the drift test — **the mouth now moves with the words** | `components/MiniVicBot.tsx` · `tests/e2e/avatar-voice.spec.ts` | R3-DRIFT-01…04 green (max drift recorded) · TC-VISEME-GL-01…03 still green · reduced-motion path unchanged | 30 |
| 4 | **R3-A4** | `elevenLabsTts` content-negotiates `/with-timestamps`, JSON out, MP3 back-compat | `functions/index.js` · `tests/minivic_tts_timestamps.test.mjs` | TS-FN-01…06 green · deployed function answers both `Accept`s · no secret logged | 30 |
| 5 | **R3-A5** | Dynamic replies driven by the returned alignment, first sentence chunked so TTS starts before the answer ends | `lib/miniVicBrain.ts` · `components/MiniVicBot.tsx` · `tests/e2e/chatbot.spec.ts` | reply mouth is schedule-driven; analyser fallback still fires **with its notice** when no alignment returns | 30 |
| 6 | **R3-A6** | Mouth atlas from the 4K master: contact sheet → `data/minivic-viseme-frames.json` → `scripts/build/minivic_viseme_atlas.mjs` → `public/assets/minivic-visemes.webp`; greeting draws photographic crops | `data/minivic-viseme-frames.json` · `scripts/build/minivic_viseme_atlas.mjs` · `package.json` · `components/MiniVicBot.tsx` · `tests/overhaul/viseme-atlas.spec.ts` | R3-ATLAS-01…04 green · atlas ≤120 kB · `TC-NFR-PERF` 10/10 · keep-committed path works with ffmpeg absent | 30 |
| 7 | **R3-A7** | First-word budget measurement + evidence pack (B1 pass/fail, B2 reported, max drift, atlas bytes) | `scripts/validate/first_word_budget.mjs` · `docs/delivery/evidence/…/R3-avatar/` | B1 max < 1.5 s recorded; B2 warm+cold recorded without a pass claim | 20 |

**Ordering rationale.** Slice 1 is one deploy away from a recruiter seeing an honest badge instead
of a false one — the single highest-value ten minutes in this plan, and it depends on nothing.
Slices 2–3 together are the first *functional* recruiter-visible change (the greeting's mouth
starts saying the greeting's words) and they are split only because each must fit 30 minutes.
Slices 4–5 extend it to answers; 6 makes the greeting photographic; 7 measures.

Dependencies: 3←2 · 5←4 · 6←3 · 7←(3,5,6). 1 and 4 have none, so they can run in parallel with 2.

---

## 9. OPEN register — what is *not* claimed

1. **True generative real-time video.** Structurally unreachable through Higgsfield: balance is
   **0 credits, free plan**, and the product is **async submit-then-poll with no live surface at
   any tier** (research rows 1, 2, 6). Credits would buy a *richer pre-rendered clip library*,
   never a live frame per answer. Cheapest tier that would test that: PLUS, **USD 29–49/mo**.
2. **Phoneme-accurate timing.** ElevenLabs' finest published granularity is character (REST) or
   word (WS). §3.2 is an orthographic approximation. A forced aligner (e.g. Montreal Forced
   Aligner) over the committed MP3 would give real phoneme boundaries; it is new infrastructure,
   not covered by any credential held, and would also make §5.4's second sentence provable.
3. **The 40 ms bounds renderer-vs-schedule, not renderer-vs-truth** (§5.4). Nothing in this
   design may be reported as "lip-sync accurate to 40 ms" without that qualifier.
4. **B2, the dynamic-reply first word, is an estimate** (§2.3) composed from measured operands and
   never measured end-to-end. Slice 7 measures it; until then it is reported as a range.
5. **A greeting-length photographic take does not exist.** The master is 12.29 s against a
   24.98 s greeting (§1.1), which is why the atlas holds 22 representatives rather than a frame
   per cue. A re-shoot of the full greeting at 2160p would allow per-cue photographic frames and
   is the single highest-fidelity unblocked-by-credits improvement available.
6. **The cloned voice.** The account holds a real clone (`0ZJ4kFDo6bZUNQsuULOW`, research row 3)
   and the deployed function deliberately does not use it — IVC is refused on the `payg` plan
   (`functions/index.js:33-48`). **It is not authorised by this task and is designed in nowhere.**
   What it would change if a plan ever permitted it: **nothing architectural** —
   `/with-timestamps` returns alignment for any `voice_id`, so §3–§5 are voice-agnostic. It would
   change exactly two things: the truth line's first clause would become *"Voice: Vikram's cloned
   voice"*, and the greeting MP3 + its alignment + the envelope would all have to be regenerated
   **in one pass** (the §2.2 three-way digest pin is what makes that safe, and is a reason to
   build the pin now rather than later).

---

## 10. Risk register

| Assumption | Mitigation |
|---|---|
| The 22 viseme classes all occur somewhere in 295 master frames (M1) | The contact sheet (§4.2 step 1) is inspected before the map is written. Classes with no good frame map to their nearest neighbour and that substitution is recorded **in the JSON**, not hidden — an unfilled cell must never be a black frame. |
| Regenerating the greeting is safe | The digest is asserted three ways at build (§2.2) and `TC-VOICE-01` already reads it at runtime. If the new render's text drifts from `GREETING.hiring`, the existing assert fails the build — the exact defect class this pin was created for. |
| Base64 inflation is acceptable | ≈4/3 on a body the function already buffers whole (M12); the greeting path never uses it (static MP3). If reply payloads become a problem the function can return multipart — a function-local change behind the same client contract. |
| The two debug hooks are not a liability | They carry public data only (§5.5) and are covered by `TC-NFR-SEC` + `built_output_secret_scan.mjs`. If a future audit gate bans globals, move them to `data-*` attributes — the test reads both today for exactly this reason. |
| ffmpeg exists where the atlas is built (M7 on this host) | The keep-committed-artefact path (§4.2) mirrors `greeting_envelope.mjs` and FATALs only when there is nothing safe to keep. |
| 30 Hz displays fit the budget (§5.3: ≈38.3 ms) | It is the tight case and it is *inside* 40 ms with ≈1.7 ms of headroom. R3-DRIFT-01 records `max(driftMs)`, so an erosion shows as a number before it shows as a failure. If a real 30 Hz sample ever exceeds 40 ms, the fix is to raise `MIN_CUE_S`, not to loosen the assertion. |
| `t_w1_r2ap` and slice R3-A1 do not collide | §7 names the wording of record and the rebase direction explicitly. |

---

*Read-only architecture task. No file under `app/`, `components/`, `lib/`, `functions/`,
`scripts/` or `tests/` was modified. The only paid call designed in is one ordinary 365-character
TTS synthesis on the already-configured premade voice (§2.2); no IVC, cloning, Higgsfield or
video-render call is designed in anywhere.*
