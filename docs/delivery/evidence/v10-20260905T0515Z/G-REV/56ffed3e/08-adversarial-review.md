# 08 — Independent adversarial review · live `56ffed3e`

**Task:** `t_w1_rev1` · **Reviewer:** `rev-56ffed3e-w1` (fresh; implemented none of this)
**Subject:** `https://forgotten-mistory.web.app/` — **the live URL only**
**Live `build-commit`:** `56ffed3e` (probed 2026-09-06T00:54Z, unchanged through 01:20Z)
**Baseline:** `docs/adversarial/ADV-REVIEW-20260905T2315Z.md` (FAIL on `9136bc59`)
**Posture:** orchestration-skill §10 — every claim UNVERIFIED until reproduced; failures first;
implementers' evidence read only to know what to attack.
**Host:** VPS srv1356245 · Playwright 1.57.0 driving `/usr/bin/google-chrome-stable`, `--no-sandbox`,
`--use-gl=swiftshader`, headless, one browser at a time.

---

## Verdict summary

| Item | Verdict | One line |
|------|---------|----------|
| **G-H5** | **FAIL** | Canonical-URL half closed; the ≥1080p / honest-ladder half is not met — and *cannot* be met by the ladder branch, because a 3840×2160 master exists on this host |
| **G-OG1** (new) | **FAIL** (P1, outside wave-1 scope) | `/assets/og-image.png` ships a blue-cast near-black ground, undocumented and unguarded, while the palette memo claims zero exceptions on "every surface" |
| **R5** | **OPEN — not graded PASS** | 1280×720 @ 24 fps is not 4K/2160p60 |
| **G-H6** | **PASS** | Portrait, loop and MiniVic disc are monochrome **in the bytes**; 0 chromatic pixels on the still, 0 on all 295 video frames |
| **G-C1** | **PASS** | One engagement product: both engage plates decode to a byte-identical mailto with identical label |
| G-MV1 | **PASS** | Pill visible and labelled at 390 in all four modes; no `display:none` at any breakpoint |
| G-V3 | **PASS** | Vitrine rest-plate minimum contrast **6.20:1** (60 nodes sampled, 1440 and 390) |
| G-L1 | **PASS** | `#listen` field canvas present under `?gl=force` at both widths |
| palette | **PASS** | Full-page sweep: **1** non-gold saturated pixel in 18,110,880 (0.00001%) |
| pageerrors_0 | **PASS** | 0 pageerrors, 0 console errors, 0 failed requests × 4 passes |
| contrast | **PASS** | Worst sampled body plate 6.20:1 |

---

# FAILURES

## 1. G-H5 — **FAIL**. The resolution half is not met, and the ladder branch is unavailable.

`docs/adversarial/GAP-BACKLOG.md` binary acceptance:

> Ship ≥1080p path toward 4K **or** publish asset-ladder that says **no higher source exists** and
> **stop any R5 claim**. Stop 404 on `my-hero-avatar.mp4`.

**The 404 half is genuinely closed.** Reproduced:

```
$ curl -sI https://forgotten-mistory.web.app/assets/my-hero-avatar.mp4
HTTP/2 200 ; content-type: video/mp4 ; content-length: 1916328
$ curl -sI https://forgotten-mistory.web.app/assets/my-avatar.mp4
HTTP/2 301 ; location: /assets/my-hero-avatar.mp4
```
No shipped JS still names the retired path — 13 `_next` chunks downloaded and grepped:
`grep -l 'my-avatar\.mp4' js/*.js` → **NONE**; `my-hero-avatar.mp4` appears in
`chunks/611-b50aebf79dc77b8f.js` and `chunks/app/page-c3491dcce7401443.js`.
At runtime `video.currentSrc` resolves to `https://forgotten-mistory.web.app/assets/my-hero-avatar.mp4`
(`attack-results.json` → `videoAfterToggle`).

**The resolution half fails.** The served loop is:

```
$ ffprobe … dl/my-hero-avatar.mp4
width=1280  height=720  r_frame_rate=24/1  nb_frames=295  duration=12.291667  pix_fmt=yuv420p
```

and there is **no higher path at all** — every plausible variant 404s:

```
my-hero-avatar-1080.mp4  404
my-hero-avatar-1440.mp4  404
my-hero-avatar-2160.mp4  404
my-hero-avatar.webm      404
my_avatar@2x.avif        404
```

The escape hatch — "publish an asset-ladder that says no higher source exists" — is **not available**,
because a higher source demonstrably exists on this very host, and the project's own memo says so:

```
$ ls -la /root/forgotten-mistory/artifacts/masters/
 4754189  minivic-greeting-1080p-voiced.mp4
58370772  minivic-greeting-2160p-master.mp4
$ ffprobe artifacts/masters/minivic-greeting-2160p-master.mp4
width=3840  height=2160  r_frame_rate=24/1  duration=12.325011
```

`docs/architecture/PALETTE-EXCEPTIONS.md` (origin/main) states verbatim that the shipped loop was
downscaled *from* that master:

> `ffmpeg -vf 'scale=1280:720:flags=lanczos,format=gray,format=yuv420p'` from the genuine
> **3840×2160@24 master** on this host (`artifacts/masters/minivic-greeting-2160p-master.mp4`)

So the wave-1 change deliberately **re-encoded 2160p down to 720p** and shipped only the 720p. A
1080p master was also on disk, untouched. Neither GAP-BACKLOG branch is satisfied. No file matching
an asset-ladder was found under `docs/` (`grep -rln "asset ladder\|no higher source"` returns only
prior reviews and the master prompt — no ladder artefact).

**Reproduction / severity:** P0 against the GAP-BACKLOG acceptance. The fix is one of: ship a
`≥1080p` source in the `<video>` (the 1080p master is 4.75 MB — inside the 500 kB-per-asset rule only
if re-encoded, so budget must be re-stated), or write the ladder honestly as *"a 2160p master exists;
we ship 720p for frame-rate/budget reasons"* — which is a different sentence from "no higher source
exists" and does not close G-H5 as written.

## 2. G-OG1 (new) — `/assets/og-image.png` is chromatic, undocumented and unguarded. **FAIL (P1)**

`<meta property="og:image" content="…/assets/og-image.png">` · served 200 · `image/png` · 1200×630.
Measured with the same instrument used on the portrait:

| Surface | max chroma | % px chroma ≤ 4 | sat > 0.25 non-gold hue |
|---|---|---|---|
| `my_avatar.png` (portrait) | **0** | **100 %** | **0** |
| `og-image.png` | **157** | **45.76 %** | **55,620** (7.36 % of the card) |

Dominant non-gold bucket: **hue 210–240° (blue), 47,410 px**, e.g. `rgb(23,25,31)` at saturation 0.26 —
against the site's own `ink900 = #0A0A0A` (chroma 0). This is not screenshot antialiasing: I tested
that hypothesis and it **failed** — resampling to 300×158 (cubic, which cancels mirrored RGB subpixel
fringes) leaves 52.9 % of pixels above chroma 4 and 8.89 % non-gold saturated. A separate 1.4 % of
pixels at chroma > 40 *is* baked-in subpixel text fringing (bbox `y[78..554]`, mirrored R/B pairs on
glyph rows), but it is not what carries the 54 %.

Viewed by eye the card reads black/white/gold (`og-image-preview.png`) — this is the *faint blue cast
over near-black* failure mode that `tests/palette_bundle.test.mjs` names in its own header comment.

**Why it is a finding:** `docs/architecture/PALETTE-EXCEPTIONS.md` asserts

> **The register is empty. There are no active exceptions.** Every surface of this site … is bound by
> the palette rule without qualification

and reasons explicitly about "the bytes a reader downloads, **an OpenGraph consumer reads**, or a
printer prints". The OG card is the surface an OpenGraph consumer reads. `grep -rln "og-image"
docs/ tests/ scripts/ app/ components/` returns **nothing** — it is neither declared as an exception
nor scoped out nor covered by a guard. The claim is therefore broader than what is enforced.

**Scope note (honest):** this does **not** change the G-H6 verdict. G-H6's binary acceptance is the
hero still and its loop, and both pass decisively. G-OG1 is a new, separate P1.

## 3. R5 — **OPEN. Not graded PASS.**

Per the task's own instruction and the measurement above: the hero loop is **1280×720 @ 24 fps**, the
stills are **1480×826**. R5 asks for "every surface + asset audited ≥3840×2160 / 60 fps"
(`docs/prompt.md:165`). 720p24 is not 4K, and nothing on this SHA moves it. **R5 stays OPEN.**

---

# PASSES (each tried and not broken)

## G-H6 — monochrome hero portrait. **PASS.**

Attacked at three levels; colour could not be produced.

**(a) Bytes on the wire.** Downloaded from live and decoded per-pixel
(`chroma.mjs`, chroma = `max(|R−G|,|G−B|,|R−B|)`):

| asset | dims | max chroma | % px ≤ 2 |
|---|---|---|---|
| `my_avatar.png` | 1480×826 | **0** | 100 % |
| `my_avatar.avif` | 1480×826 | **0** | 100 % |
| `my_avatar.webp` | 1480×826 | **1** | 100 % |
| loop frames 10 / 147 / 280 | 1280×720 | **0** | 100 % |

Not satisfied with three frames, I swept **all 295**:
`ffmpeg … signalstats … SATMAX` → `frames=295 min=0 max=0`, single distinct value `0`. The chroma
planes are exactly neutral on every frame of the loop.

**(b) Painted pixels in the browser.** Screenshot of the rendered `<picture>` `<img>` at 1440
(`portrait-img-rendered-1440.png`, 548×306): **max chroma 0**, 100 % of pixels ≤ 4 — far past the
≥99.5 % bar. `getComputedStyle(img).filter === 'none'` — the monochrome is in the asset, not a CSS
`grayscale()` cheat.

**(c) Tried to make it show colour.**

- Hover the figure → `portrait-figure-hover-1440.png`: max chroma **0**.
- Click `[data-testid="portrait-control"]` ("Pause the portrait") and force `video.play()` → the loop
  runs (`readyState 4`, `paused false`, `currentTime 9.27`, `videoWidth 1280`). Figure screenshot with
  video playing: max chroma **3**, **100 %** of pixels ≤ 4. The 45,937 px above chroma 2 are all
  near-black `rgb(8,9,11)`; the 15 px reported at saturation > 0.25 are the arithmetic artefact of
  HSV saturation at `max=11` — not visible colour.
- Drew the live video frame into a `<canvas>` and read the decoded pixels in-page:
  `{w:1280, h:720, maxChroma: 0, pxChromaGT4: 0, pctChromaLE4: 100}`.
- MiniVic panel talking-head: opened the dock; three `<video>` elements all point at
  `/assets/my-hero-avatar.mp4`. Dock screenshot: max chroma **3**, 100 % ≤ 4.
- Visual check: `portrait-figure-playing-1440.png` is greyscale to the eye.

Both `docs/architecture/PALETTE-EXCEPTIONS.md` (origin/main) — `**Status:** RETIRED`, "the register is
empty", "There are no active exceptions" — and `tests/palette_bundle.test.mjs` (origin/main) hold: the
test block *"Palette exceptions register (G-H6) — RETIRED, the register is empty"* asserts the RETIRED
status, the empty register, and that `public/assets/my-avatar.mp4` must not exist.

## G-C1 — one engagement product. **PASS.**

`[data-cta=engage]` count = **2** (`#vitrine`, `#listen`). Compared by **DOM-decoded `.href`**, not by
label. Both are byte-identical:

```
scheme  : mailto
to      : sarkar.vikram@gmail.com
subject : 20-minute call — Vikram Deshpande
body    : Hiring or a project:\nWhat you're building:\nThe decision you need made:\n
          Two or three times that suit you (Melbourne time):\nAnything I should read first:
label   : Email a 20-minute-call agenda
```

Identical in all four browser passes. Forbidden wording swept over the whole rendered text:
`Book` 0 · `book a` 0 · `booking` 0 · `Start a project` 0 · `Schedule` 0 · `Calendly` 0 · `cal.com` 0 ·
`SavvyCal` 0. Distinct mailto hrefs on the page = 3: the two identical engage plates, a bare
`mailto:` contact pair, and one footer `Portfolio — support`. **The dual-mailto defect from 2315Z is
closed.**

**R4, both paths, on live:**
- Employer — `Download CV` → `/docs/Vik_Resume_Final.pdf`, `HTTP/2 200`, `application/pdf`,
  157,615 B, magic bytes `%PDF-1.4`, `pdfinfo` Title `Vikram Deshpande — Resume`. A real PDF.
- Client — engage → the single mailto above. **This is a mailto, not a booking**; per
  `CLAUDE.local.md` §6 it is *not* an R4 PASS, and I do not grade it as one. It is an honest single
  product, which is what G-C1 asked for.

## Regression table — nothing closed on `9136bc59` reopened

**G-MV1 — PASS.** Pill text `Ask Mini Vic`, `visibility: visible`, rendered **106×29** at 390 and
**112×30** at 1440, in normal *and* `?gl=force`. Served CSS declares
`.minivic-launcher__pill{…display:inline-block}`. Grep of all four served stylesheets: exactly **one**
`display:none` on any `minivic` selector, and it is `.minivic-launcher__pulse` (a decorative ping),
restored to `inline-flex` at `min-width:87.5rem`. **No media query below 834 px touches the launcher**
(`@media` blocks containing minivic rules: `max-height:52rem`, `min-width:87.5rem`, `max-width:30rem`
— shrinks the disc only — and `prefers-reduced-motion`). Dock opacity sampled once a second for 8 s
after scrolling past the hero, in all four modes: reaches and holds **1** (`dock-opacity.json`);
`document.elementFromPoint` at the button centre hit-tests to the button itself.

**G-V3 — PASS.** 60 leaf text nodes in `#vitrine` at rest, computed colour over the first opaque
ancestor background. Minimum **6.20:1** (`rgb(144,144,144)` on `rgb(10,10,10)`, 14 px/500,
"What is keeping me busy"); next `8.66:1` on the gold live-URL `aether.srv1356245.hstgr.cloud`; body
copy `12.45:1`. Identical minimum at 390. ≥ 4.5:1 holds.

**G-L1 — PASS.** `#listen canvas` present at `1440×901` (1440) and `390×1018` (390), in normal **and**
`?gl=force`, `data-scene="listen-field"`. It mounts lazily — absent from a document-wide canvas census
taken at the top of the page, present once `#listen` is scrolled into view. Six `data-scene` slots
declared in the SSR HTML.

**palette — PASS.** Full-page screenshot (1440 × 12,577, every section scrolled through first),
subpixel text rendering disabled so the instrument measures design and not the rasteriser:
**1** pixel of 18,110,880 with saturation > 0.25 outside the gold band — and that one pixel sits at
hue **34.3°**, 0.7° off my band edge, `rgb(21,18,14)` near-black. 27,597 saturated pixels are in the
gold band (hue 43.5–45.0 for `--gold #c9a84c` … `--gold-dark #b0923f`). Hero fold at 1440 and 390,
normal and `?gl=force`: **max chroma 0**, zero saturated pixels.

**pageerrors_0 — PASS.** Four passes (1440×900 and 390×844, normal and `?gl=force`), `networkidle`
plus 2.5 s settle, plus scroll through hero → vitrine → listen:

| pass | pageerrors | console errors | failed requests |
|---|---|---|---|
| 1440 normal | 0 | 0 | 0 |
| 1440 `?gl=force` | 0 | 0 | 0 |
| 390 normal | 0 | 0 | 0 |
| 390 `?gl=force` | 0 | 0 | 0 |

The attack pass (video play + MiniVic panel open + full-page scroll) also recorded 0.

**contrast — PASS.** See G-V3; worst sampled plate 6.20:1 at both widths.

---

# FALSE POSITIVES — including my own (§10.3)

1. **Mine.** My first full-page palette sweep reported **9,554** non-gold saturated pixels and I was
   one step from filing "the live page carries non-gold colour". Re-running the identical sweep with
   `--disable-lcd-text --disable-font-subpixel-positioning --force-color-profile=srgb` collapsed it to
   **1**. The 9,553 were Chrome's LCD subpixel text fringing in the screenshot — mirrored R/B pairs on
   glyph stems (`rgb(83,34,10)` / `rgb(10,34,83)`, identical y-ranges). **Any future palette probe on
   this site that screenshots text must disable LCD text, or it will manufacture this finding again.**
2. **Mine.** `getComputedStyle(pill).display` returns **`block`**, and the task spec's literal G-MV1
   check is `display:inline-block`. That looked like a regression. It is not: the served CSS declares
   `inline-block`, and `.minivic-launcher` is `display:flex`, so the pill is a flex item and CSS
   blockifies it. A test asserting the *computed* value equals `inline-block` would fail on correct
   code — assert the declared rule, or assert `!== 'none'`.
3. **Mine.** I first dismissed the OG-image chroma as the same subpixel artefact. I tested it
   (cubic downsample to 300×158) and the hypothesis **failed** — 52.9 % of pixels stay above chroma 4.
   The blue ground is real. Reported as G-OG1 rather than dropped.
4. **Prior claim, now contradicted — in the site's favour.**
   `ADV-REVIEW-20260905T2315Z`: *"`/assets/my-hero-avatar.mp4` **404**"* and *"Still `my_avatar.webp`
   **1480×826 colour**"*. Both were true then; both are false on `56ffed3e` (200 + 301; chroma 0/1).
   Recorded so the 2315Z rows are not carried forward as still-open.
5. **Not reproduced as a defect:** the 2315Z note *"First-fold dock still often `opacity:0` until past
   hero."* Confirmed as-designed and harmless — opacity is 0 with `pointer-events:none` on the first
   fold and reaches 1 within ~2 s of scrolling past `#hero` in all four modes. Tracked as G-NEW-1
   (keyboard reachability on the first fold), not as a G-MV1 regression.

---

# What was NOT covered

Deliberate scope of `t_w1_rev1` (wave-1 gaps + the regression table). **Not probed here, and not
graded by this review:** G-H1 (hero set-piece), G-A3 (about recall), G-E2, G-S2, G-X2, G-M4
(`/api/chat` cold TTFB), G-R2 (provider routing), G-R3 (Higgsfield/WSS), R1/R2/R3/§14 Marvel bar.
Those remain at their `ADV-REVIEW-20260905T2315Z` status — **FAIL** — until a review that targets them
says otherwise. **Nothing in this document should be read as moving the overall production verdict off
FAIL.**

---

## Commands and artefacts

All under `docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/`:

| file | what it is |
|---|---|
| `probe.mjs` · `probe-results.json` | 4-pass browser probe (errors, engage, CV, dock, contrast, canvases) |
| `attack.mjs` · `attack-results.json` | hover / play / canvas-readback / MiniVic-panel attack |
| `palette-sweep.mjs` · `palette-sweep.json` | full-page sweep, LCD-on vs LCD-off |
| `dock.mjs` · `dock-opacity.json` | dock opacity sampled 8× over 8 s × 4 modes |
| `chroma.mjs` · `chroma-assets.json` | per-pixel chroma of downloaded stills + frames |
| `satmax-all-frames.txt` | `SATMAX` for all 295 loop frames |
| `locate.mjs` · `locate-chroma.txt` · `oghue.mjs` · `ogloc.mjs` · `ogdown.mjs` | chroma localisation, OG hue analysis |
| `ffprobe-hero.txt` · `identify-stills.txt` · `head-*.txt` | asset measurements and response headers |
| `hero-*.png` · `listen-*.png` · `vitrine-*.png` · `minivic-*.png` · `portrait-*.png` · `fullpage-*.png` · `og-image-preview.png` | screenshots (4 viewport/GL combinations) |
| `verdicts.json` | machine-readable verdicts |

No application code was read for a verdict, edited, or executed. No Hermes. No secrets printed.

---

## Addendum — the live SHA moved at 01:22Z, after the measurement window closed

`build-commit` read `56ffed3e` at 00:54Z and in all four browser passes' own
`meta[name=build-commit]`. At 01:22Z, after every measurement above was captured, live moved to
**`a1504fb9`**.

`a1504fb9` changes **no rendered surface**:

```
$ git diff --name-only 56ffed3e a1504fb9 | grep -E '^(app|components|lib|public|scripts|tests|functions)/' | wc -l
0
```

The 210 changed files are entirely `artifacts/kanban/*`, `docs/*` and `CLAUDE*.md` — the board, this
run's evidence directories, and `docs/architecture/MINIVIC-BRAIN-0-4.md`. Per GAP-BACKLOG's own rule
("Never mark architecture markdown or docs commits as live PASS"), `a1504fb9` is a docs-only SHA and
carries no UI delta.

Re-confirmed against the new live SHA at 01:23Z — every verdict above still holds:

```
my-hero-avatar.mp4  : 200 video/mp4 1916328
my-avatar.mp4       : 301 -> /assets/my-hero-avatar.mp4
[data-cta=engage]   : 2 plates, 1 distinct href
my_avatar.png etag  : 6e2bfad8…a0840f  (byte-identical to the file measured at chroma 0)
```

**Every verdict in this document is issued against the rendered surface of `56ffed3e`, which is
byte-identical to the rendered surface of `a1504fb9`.**
