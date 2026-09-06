# 08 — Independent adversarial review of the composite live build (G-R2 / G-M4 / G-MV1 / G-OG1 / ladder doc + regression)

- **Reviewer:** `rev-97e19d07-w1` · task `t_w1_rev4` · role `3rd_party_independent_adversarial_review` (docs/prompt.md §5), effort max. I implemented none of this and reused none of the implementers' probe code — the first-token reader is `00-first-token-reader.mjs`, written in this task.
- **Probed:** 2026-09-06T02:49Z–03:20Z on VPS srv1356245 (4 cores, three implementer lanes concurrently active) · system Google Chrome 152.0.7977.82 `--no-sandbox`, one browser at a time · `curl` · `ffprobe` 8.0.1 · Pillow.
- **Subject:** the live site only — <https://forgotten-mistory.web.app/>.

## SHA drift — which number was taken on which build

| Window | live `build-commit` | What was measured there |
|---|---|---|
| 02:49–02:51Z | **`97e19d07`** (`consolidate: merge worktree-w2-x2s1`) | served HTML greps, the two strict-cold chat sequences (S-2), all asset/`curl` measurements |
| 03:02–03:20Z | **`4043b8e9`** (`consolidate: merge worktree-w1-red2`, 02:56:43Z) | every browser measurement, the five spaced sequences |

`git diff --name-only 97e19d07 4043b8e9` outside `docs/`+`artifacts/` is **three files**: `app/globals.css`, `tests/e2e/hero.spec.ts`, `tests/e2e/hero-photo.spec.ts`. No component, data file or `lib/` module differs, so the browser findings apply to both.

**Ancestry verified** (`git merge-base --is-ancestor`): `97e19d07` is a descendant of `a134bb5c` (r2c), `fc03a0e6` (og1), `46accc4` (lad1) and `9287089` (hero S1). `4043b8e9` is its descendant. `origin/main` == `4043b8e9`.

---

## FAILURES FIRST

### F-1 — **G-M4 FAIL**: the strict-cold Hosting first token is 1 805 ms against a < 1 500 ms bar

The implementer's 7/7 Hosting cold sequences under 1 500 ms (max 1 194) **does not reproduce**. My own reader, after 32 minutes of zero chat traffic from this host (last traffic 02:19:22Z per `W1-R2C/07-first-token-strictcold.json` `finishedAt`), warm ping first exactly as the shipped client does:

```
node 00-first-token-reader.mjs coldA-hosting \
  'https://forgotten-mistory.web.app/api/chat?warm=1' \
  'https://forgotten-mistory.web.app/api/chat'          → 01-coldA-hosting.json
GET  ?warm=1 → 204 in 339 ms   → sleep 1.5 s → POST {messages:[…],mode:'hiring',stream:true}
headersMs 1804 · firstChunkMs 1805 · firstTokenMs 1805 · totalMs 1809 · provider openai
```

Every Hosting sample I took (`03-spaced-sequences.jsonl`), each preceded by its own `?warm=1`:

| sample | at | first token | total | provider's own answered-ms | chars |
|---|---|---|---|---|---|
| strict cold (32 min idle) | 02:51:50Z | **1 805** | 1 809 | 1 696 | 320 |
| spaced 1 | 03:02:32Z | **1 886** | 1 888 | 1 735 | 312 |
| spaced 3 | 03:08:48Z | 1 284 | 1 285 | 1 121 | 317 |
| spaced 5 | 03:15:05Z | 1 329 | 1 331 | 1 169 | 342 |

**2 of 4 over the bar.** The mechanism is structural, not luck: on every Hosting sample `firstChunkMs == headersMs == firstTokenMs` and `totalMs − firstTokenMs ≤ 4 ms` — Fastly buffers the whole SSE body, so *Hosting first byte is the origin's TOTAL completion time*. `functions/index.js:762-773` says exactly this. The gate is therefore hostage to how long the model takes to finish a ~320-character answer, and openai's own answered-ms in my four samples ranged 1 121 → 1 735. Nothing in this wave changed that; the warm ping only removes the dead-rung walk (see the PASS below).

**What the visitor actually gets, measured in the browser — and it is much better.** In both real browser runs the panel rendered the **origin**, never Hosting (`04-panel-1440.json`, `04-panel-390.json` network logs):

```
1440×900  GET a.run.app/?warm=1 →204 @153ms   GET /api/chat?warm=1 →204 @178ms
          POST a.run.app/ @4105ms → 200 @4830ms   ⇒ first token 725 ms.   No POST to /api/chat at all.
390×844   POST a.run.app/ @2220ms → 200 @3198ms   ⇒ first token 978 ms.   No POST to /api/chat at all.
```

Origin samples, all five, none over the bar: strict cold **965 ms** (`02-coldB-origin.json`, own 10-min idle window 02:51:52→03:02:07Z), spaced 528 ms, spaced 795 ms, browser 725 ms, browser 978 ms. The origin genuinely streams (cold: firstChunk 965, total 1 712).

**Verdict: FAIL.** The task's rule is `every strict-cold Hosting sequence < 1.5 s` **and** the origin condition; the first clause fails at 1 805 ms. This is not pedantry: the Hosting rung is the path a visitor behind a proxy that blocks the deploy-specific `*.a.run.app` host takes — exactly the reader the fallback exists for — and that reader waits 1.3–1.9 s for the first word with no streaming to soften it. There is **no race**: `lib/miniVicRoute.mjs` orders origin-then-Hosting and `callChatRoute` walks them sequentially, so the "Hosting answer first" escape clause is not available. What *is* true, and should be recorded, is that the client's route order means the failing number is not the one most visitors meet.

### F-2 — **TC-BOT-14 FAIL**: at 1440×900 the open MiniVic panel covers the surname in the H1

Measured on the H1's **glyph rects** (`Range.getClientRects`), not its block box (`04-panel-1440.json.h1Clearance`):

```
H1 text runs   x  96.0→533.8 | 533.8→560.3 | 560.3→1215.2   (y 480→660)
panel          x 984.0→1416.0                                (y 360→812)
overlap of the last run: 231.2 px horizontally × 180.0 px vertically
minHorizontalGap = −231.2 px      contract: ≥ +16 px
document.elementFromPoint(H1 right text edge)  panel OPEN → "truncate" (a panel child)
                                               panel CLOSED → "H1.Hero_name__vovn8"   (06-final-1440.json)
```

`07-b2-1440x900-answered.png` shows what a reader sees: **"Vikram Deshpa"** — the panel eats the rest of the surname, the single most important word on the page.

**Not attributable to this wave.** `.name` in `Hero.module.css` (`font-size: clamp(3.75rem, 9.7vw, 8.2rem)`, `letter-spacing:-0.035em`) and `--fs-display` are byte-identical between `12cd9123` and HEAD — only a `text-shadow` was added — so the H1 was already 1 119 px wide before hero S1. I could not reproduce the "11 px" baseline the task cites, so I record this as **pre-existing and still FAIL**, not a hero-S1 regression.

### F-3 — Asset-ladder §1 carries two stale rows (documentation defect, minor)

The defect the doc task was raised to fix **is fixed**: §1–§2 on `origin/main` now describe the live rungs and mark the 640×360 orphan "History only, not the current file. … RETIRED 2026-09-05". Every video/still row matches the bytes I downloaded from live. Two rows do not, both changed by same-wave siblings after the doc was written:

| §1 row | doc | live (`curl`) |
|---|---|---|
| `og-image.png` | 1200×630, 182,547 B | **2400×1260, 209,035 B** |
| `minivic-greeting.txt` | 368 B | **384 B** |

§11 also still reads "`og-image.png` (1200×630 social card) is deliberately **untouched**", which G-OG1 has since made untrue.

### F-4 — `MINIVIC-BRAIN-0-4.md` addendum contradicts itself on the direct-rung deadline

Point 1: "`DIRECT_FIRST_BYTE_TIMEOUT_MS` is **3 200 ms**" — matches `lib/miniVicRoute.mjs:56` and the shipped chunk (`grep -oh 3200 chunks/*` → 1 hit, no `2600`). Point 3, nine lines later: "An origin that has produced *nothing at all* by **2 600 ms** is still abandoned." One of the two sentences is wrong.

### F-5 — greeting MP3 still speaks the retired sentence — **known OPEN, assigned `t_w2_r3a2`**, not a new FAIL

```
sha256  public/assets/minivic-greeting.mp3 == live /assets/minivic-greeting.mp3 == dd65f259d1bf5772…
git log -1 -- public/assets/minivic-greeting.mp3   → 91f46e9  2026-09-05 12:48  "greeting regenerated"
git show 91f46e9:public/assets/minivic-greeting.txt → "I'm Vikram — his AI clone, speaking from his CV. …"
git log -1 -- public/assets/minivic-greeting.txt   → 2353948  2026-09-06 01:56  (the r2c copy fix)
live   /assets/minivic-greeting.txt                 → "I'm Vikram — a synthetic stand-in for him, …"
```

The audio bytes have not changed since the render whose transcript said "his AI clone"; the transcript beside it was rewritten 13 hours later without re-rendering. A reader who presses play **hears** the retired line while the page **prints** the new one. No ASR is installed on this host, so the proof is the unchanged digest predating the copy change rather than a transcription. Re-rendering is a paid ElevenLabs call (cost gate). **Graded assigned-OPEN.**

### F-6 — **R3 OPEN** (carried, per the task).

---

## G-R2 — **PASS** (readable disclosure, `attempts[]`, no "AI clone")

- **Disclosure, after a real answer, both widths** (`04-panel-*.json`): *"Voice: ElevenLabs stock · Face: pre-rendered loop · Answers: live text via openai"* — `scrollWidth 430 == clientWidth 430` and `scrollHeight 41 == clientHeight 41` at 1440; `340 == 340`, `41 == 41` at 390. Two rendered lines, both inside the box, `fullyInViewport: true`, `text-transform: none` (sentence case), `text-overflow: clip` with nothing to clip. Nothing is cut at either width.
- **Provider read at runtime, not baked:** the shipped chunk contains `"…Answers: ".concat(null===$?"live text":"knowledge"===$||"fallback"===$?"offline knowledge base":"live text via ".concat($))`.
- **`attempts[]`:** present on the `done` event **and** on the JSON body in **all nine** of my sends, four entries each, e.g. `[{provider:"openrouter",outcome:"cooling_down",ms:0},…,{provider:"openai",outcome:"answered",ms:1696}]`. Fields are `provider`/`outcome`/`ms` only — **provider ids, no URLs, no keys**; the `done` event adds `model:"gpt-4.1-mini"`.
- **"AI clone" absent everywhere I could look:** served HTML `grep -i` → exit 1; all **13** shipped `_next` JS files → exit 1 for both `ai clone` and `ai-clone` (positive control: `synthetic` matches 6×, so the grep works); live DOM `outerHTML` → **0**; `aria-label`/`title`/`alt`/`placeholder`/`aria-description` → **0** at both widths.
- **Subtitle unclipped:** "A synthetic stand-in for Vikram · ask me anything" — 273/273 at 1440 (1 line), 226/226 at 390 (2 lines), fully in viewport at both.
- **Badge:** DOM text is exactly `MiniVic · synthetic`; it renders **uppercase** because `text-transform: uppercase` is applied ("MINIVIC · SYNTHETIC" in `07-b2-1440x900-answered.png`). Copy correct; recorded so nobody is surprised.
- **The warm ping works as designed and is not a lie:** both routes are pinged on panel open (`a.run.app/?warm=1` → 204 @153 ms and `/api/chat?warm=1` → 204 @178 ms) and the POST 1.5 s later sees all three dead rungs `cooling_down, ms 0` instead of the ~1.23 s `http_402/http_402/http_429` walk. Note for the record: the function runs `minInstances: 1` (`functions/index.js:774`), so "cold" here means *cold cooldown map*, never a container start.

## G-MV1 — **PASS, and the rev-12cd9123 F-1 is genuinely fixed**

`04-panel-390.json`, `scrollY 0`, first fold, no scrolling:

| width | launcher rect | `elementFromPoint(centre)` | `hitIsSelf` | real `.click()` | panel |
|---|---|---|---|---|---|
| 390×844 | (207.6, 776) 158.4×44, `inViewport true` | `SPAN.minivic-launcher__pill` | **true** | **ok in 861 ms** | 342×396 painted |
| 1440×900 | (1231.6, 812) 184.4×64, `inViewport true` | `SPAN.minivic-launcher__pill` | **true** | **ok in 1 311 ms** | 432×452 painted |

At 390 the previous review got `VIDEO.Hero_portraitVideo` and a `TimeoutError`. Now the pill wins its own hit-test and a real Playwright click opens the panel on the first fold. The protected invariant also holds: `display:flex`, `visibility:visible`, `opacity:1` — never hidden below 834 px.

## G-OG1 — **PASS**

```
curl -sI /assets/og-image.png            → 200, image/png, 209,035 B
file                                     → PNG image data, 2400 x 1260, 8-bit/color RGB
Pillow over all 3,024,000 pixels         → maxChroma 0, chromaticPixels 0  (fully achromatic)
<meta og:image:width 2400> <og:image:height 1260>  — match the file
```

## ladder_doc — **PASS on its remit**, with F-3 recorded

The `rev-12cd9123` F-5 contradiction (§1–2 calling the retired 640×360 orphan the current live file) is gone; the changelog at the head of the doc names the fix and `t_w1_lad1`. Every video and still row in §1 matches live byte-for-byte. F-3 above is a separate, smaller staleness.

---

## Regression table — all on live `4043b8e9`, `?gl=force` unless stated

| Check | Number I measured | Verdict |
|---|---|---|
| Hero monochrome | viewport capture at 1440 **and** 390: `maxChroma 0`, 0 chromatic px of 324,000 / 82,290 sampled | **PASS** |
| G-C1 identical hrefs | the two "Email a 20-minute-call agenda" links (`#vitrine`, `#listen`) are **byte-identical**, 305 chars each | **PASS** |
| G-V3 vitrine contrast | min over 60 text leaves **6.20** (≥ 4.5); 1 canvas, 6 cards, 9 live links | **PASS** |
| G-A3 ten sectors | `#about` mounts **1 canvas** 1248×900 CSS; dial 150 shapes; **10** enumerated dimensions `01 Technical Skills … 10 North Star Align` | **PASS** |
| `#about` text contrast | min **6.20** over 43 leaves | **PASS** |
| pageerrors / console errors | 1440 normal 0/0 · 390 normal 0/0 · 1440 `?gl=force` 0/0 · 390 `?gl=force` 0/0 · both panel runs 0/0 | **PASS** |
| `/api/tts` | `POST` → **200**, 30,973 B `audio/mpeg`, 0.443 s, real MPEG layer III; `GET` → 405 | **PASS** |
| LCP / CLS | 1440 **1 204 ms** / **0** · 390 **1 512 ms** / **0** (SwiftShader, 4-core VPS under three concurrent lanes — a pessimistic box) | **PASS** |
| TC-BOT-14 H1 clearance @1440 | **−231.2 px** (contract ≥ +16) | **FAIL — F-2** |
| G-M4 strict-cold Hosting | **1 805 ms** (bar < 1 500) | **FAIL — F-1** |

---

## INTERIM evidence — not graded (per the two scope notes)

### Hero S1 (`worktree-w2-h1s1` 9287089) — record only, grade when S4 lands

| Measurement | 1440×900 | 390×844 |
|---|---|---|
| `[data-plane="hero"]` contains `[data-testid="hero-portrait"]` | **true** | **true** |
| plane contains `[data-scene="hero-atmosphere"]` | **true** | **true** |
| portrait `<img>` intrinsic → rendered | 1480×826 → 846×472.2 | 1480×826 → 366×204.3 |
| upscale factor (rendered × DPR ÷ intrinsic) | **0.572** | **0.247** — **no upscale** |
| ledger top vs `innerHeight` | 1 086.1 ≥ 900 → **below the fold** | 1 043 ≥ 844 → **below the fold** |
| text blocks in the fold | **3** (H1 · statement · actions row) ≤ 3 | **3** |
| role / location / caption | below the fold, in `[data-testid="hero-proof"]` | below the fold |
| LCP / CLS | 1 204 ms / 0 | 1 512 ms / 0 |

No regression found in contrast, pageerrors or G-MV1 from hero S1. The one hero-adjacent FAIL (F-2) is pre-existing.

### Scene 7 — `career-descent` (`worktree-w2-x2s1`) — record only, grade when s2/s3 land

- `data-scene="career-descent"` **is in the served HTML** at both `97e19d07` and `4043b8e9`, inside `[data-descent-stage]` (`position: sticky`) in `[data-descent-band]` after the roles list in `#experience`.
- Band height **1 440 px = 160vh** at 1440; **1 182 px = 140vh** at 390 (the note says 160vh — at 390 it is 140).
- Canvases in the scene: **0** at page top (lazy), **1** when the band is mid-viewport — 1392×900 CSS at 1440, 390×844 CSS at 390, under `?gl=force`.
- Over the canvas: **one caption line** ("The same eight roles, drawn as depth instead of length: each layer is as thick as the job was long, and 2010 is at the floor.") plus **5 `aria-hidden` year ticks** (now/2025/2020/2015/2010). Headings, paragraphs, links and buttons inside the sticky stage: **0**.
- **Gold 0 inside the canvas.** Canvas-only crops measure `maxChroma 0` (1440: rows 100–640 and 730–890, 840,000 px; 390: rows 60–500 and 580–830, 262,200 px). The only chroma anywhere in the capture is a 41-px band at y 665–706 (1440) / 56-px at y 511–566 (390) with adjacent complementary pixels — `(83,125,168)` beside `(150,101,77)` — the Chrome subpixel-AA fringe on the caption glyphs. I cropped and looked at it: `07-crop-1440-chromaband.png` is the caption text. Not a palette violation.
- `#experience` text contrast: min **4.81** (the 12 px year ticks) ≥ 4.5.
- **G-E2:** the dock never overlaps `.trackYears` at either width (no intersection). It **does** intersect `[data-chart]`'s bounding box — 112.4×64 px at 1440, 158.4×44 px at 390. At 1440 that corner of the plot is empty in my capture: every bar and duration label (`7.8 yr`, `6 mo`, `10 mo` …) sits above y 812, so nothing is hidden. At 390 the fixed dock sits inside the plot area between the NAB and Microsoft rows; no bar is fully hidden in the captured frame, but a row scrolling under it will be. Worth an eye when scene 7 is graded.
- **The recruiter sentence I would actually say:** *"It reads as a near-black column of faint horizontal seams with 2010 at the floor — I can see time going downward, but I cannot count eight roles or tell which one was long."*

---

## False positives I checked and discarded

1. *"Gold is leaking into the descent canvas — maxChroma 122."* No. Every canvas-only region is `maxChroma 0`; the chroma is confined to two text-height rows and is subpixel antialiasing on the caption. Cropped and viewed before calling it.
2. *"G-C1 fails — 3 unique mailto hrefs on the page."* No. The G-C1 pair is the two "Email a 20-minute-call agenda" CTAs and they are byte-identical. The other three mailtos are different affordances (hero "Email", the plain address in `#listen`, "Contact support").
3. *"The panel's `net::ERR_ABORTED` on the origin POST is a broken send."* No. It fires after the 200 and after the stream is fully read (dt 4830 → 5417 at 1440); the answer rendered, `attempts[]` arrived, and pageerrors/console errors are 0/0. Cosmetic cleanup of the settled `AbortController`.
4. *"The badge is wrong — it says MINIVIC · SYNTHETIC."* No. The DOM text is `MiniVic · synthetic`; CSS uppercases it.
5. *"The strict-cold probes were not cold — the cooldown map showed `cooling_down`."* Checked: that is the `?warm=1` branch's own `primeProviderCooldowns()` (guarded to one run per 10-min credential-cooldown window), i.e. the feature working, not stale traffic. The container is never cold regardless: `minInstances: 1`.

---

## Scope and limits of this review

- Read-only. I edited no application code and wrote only under `G-REV/97e19d07/`.
- Two concurrent Hosting samples (spaced 3 and 5) and the browser runs overlapped each other's traffic; only the two sequences labelled **strict cold** carry a documented ≥ 10-minute idle window (32 min for Hosting, 10 min 15 s for origin), and other tenants on this host could in principle have sent chat traffic I cannot see.
- G-H1 and G-X2/R2 are recorded as INTERIM and deliberately not graded.
- Elapsed 02:49Z → 03:20Z, S-2 clock 02:51:48Z → 03:15:07Z.
