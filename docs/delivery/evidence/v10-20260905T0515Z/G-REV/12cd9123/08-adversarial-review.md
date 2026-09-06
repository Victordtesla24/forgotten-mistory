# 08 — Independent adversarial review of live `12cd9123` (G-A3, G-H5, regression, R5)

- **Reviewer:** `rev-12cd9123-w1` · task `t_w1_rev3` · role `3rd_party_independent_adversarial_review` (docs/prompt.md §5), effort max
- **Subject:** the live site only — <https://forgotten-mistory.web.app/>. I implemented none of this and reused none of the implementers' test code; every number below is from a command in this task.
- **Probed:** 2026-09-06T01:49Z–02:06Z on VPS srv1356245 · system Chrome 152.0.7977.82 (`--no-sandbox`), one browser at a time · `ffprobe`/`ffmpeg` 8.0.1 · `curl`
- **SHA the measurements were taken on:** `12cd9123` for **every** asset, G-H5 and G-A3 measurement (01:49–02:04Z, `<meta name="build-commit" content="12cd9123">` read at 01:48Z and again before the browser runs).
  **The live build moved to `70bd273d` at ~02:05Z, mid-review.** `git diff --name-only 12cd912..70bd273` shows the only application file between them is `app/layout.tsx` (the G-OG1 OpenGraph card); Hero, About, `lib/videoRung.ts`, `app/data/portfolio/*` and `public/assets/*` are untouched. The one finding that could have been affected — the MiniVic launcher — was **re-run on `70bd273d`** at 02:06Z and reproduces identically (`mv1-recheck-live-sha.json`).
- **Artifacts written (this task only):** `h5-rung-probe.json`, `a3-field-probe.json`, `a3-hatch-texture.json`, `regression-probe.json`, `mv1-l1-probe.json`, `mv1-buttons-390.json`, `mv1-launcher-390.json`, `mv1-recheck-live-sha.json`, `a3-*.png`, `reg-*.png` — all under `docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/`.

---

## FAILURES FIRST

### F-1 — G-MV1 **FAIL on the first fold at 390×844**: the hero video eats the "Ask Mini Vic" click

Reviewer 2's interception finding is **not fixed**. The pill is *visible* — it is never `display:none`, so the protected invariant against hiding it below 834 px holds — but at the top of the page it cannot be pressed.

```
node /tmp/rev12cd/mv1c.mjs   →  mv1-launcher-390.json
scrollY 0     .minivic-launcher rect {x:207.6, y:776, w:158.4, h:44}
              document.elementFromPoint(centre) → VIDEO.Hero_portraitVideo__e3yop   hitIsSelf:false
              locator('.minivic-launcher').click({timeout:6000}) → TimeoutError
scrollY 1497  same rect, elementFromPoint → SPAN.minivic-launcher__pill             hitIsSelf:true
              click → ok; minivic-panel 342×404 painted (mv1-launcher-390.json.after)
```

Root cause, measured on `70bd273d` (`mv1-recheck-live-sha.json`): the hero portrait `<video>` box at 390 is `{x:0, y:630.9, w:390, h:217.7}`, `z-index:1`, `pointer-events:auto` — it covers y 630.9–848.6 and the launcher sits at y 776–820 underneath it. A reader who lands on the phone and reaches for the one conversational affordance gets the video instead. Below the fold the launcher works and opens the panel.
**Verdict: FAIL (first fold only).** Screenshots: `reg-390-minivic-state.png`, `reg-390-minivic-after-scroll-click.png`.

### F-2 — G-A3 sub-claim **FAIL**: at 390 the field's light does not say which of the ten are answered

The gap acceptance ("still tells ten sectors") holds — see PASS G-A3 below — but the implementers' own stated behaviour (`tests/overhaul/scene-about.spec.ts` TC-SCENE-ABOUT-10: answered sectors ≥ 1.6× open ones, ≥ 9 of 10 seams showing a ≥ 12 % step) does **not** hold on live at the screen a phone reader arrives on, measured from my own capture with the dial and the reading column hidden (`a3-field-probe.json`):

| viewport (mine) | ring answered / open | fan answered / open | seams ≥ 12 % | hatch texture open / answered |
|---|---|---|---|---|
| 390×844 DPR 3 | **1.039** | **0.983** | 10 / 10 | **0.944** (`a3-hatch-texture.json`) |
| 1440×900 DPR 1, section's first screen (`data-axis = -1`) | **1.596** | 3.629 | **6 / 10** | 1.088 |

Per-sector ring means at 1440 (index 0…9, `about.ts` order): `0.7065 0.6327 0.3556 0.4980 0.0122 0.2169 0.0627 0.2303 0.5661 0.7133` — sector 5 *Culture Fit* (answered) is the darkest thing on the ring at 0.0122 and sector 9 *Company Stability* (role-side, open) is one of the brightest at 0.5661. The brightness ordering tracks position on the plane (the guard under the reading column, the falloff from the origin), not `about.ts`. The 1.596 at 1440 is **below the implementers' own 1.6 bar** at the screen TC-SCENE-ABOUT-11 itself calls the right one to judge. I also tested the other candidate carrier — 45° hatch energy per sector — and it does not separate the two groups either (0.944 / 1.088).
**Verdict: the ten are countable; the data mapping is not legible.** Not a G-A3 gap FAIL (the gap asks for ten sectors, weight and honesty), but the claim "an answered sector blooms, an open one hatches at four tenths" is not what a reader can read off the live plane, and TC-SCENE-ABOUT-10's 1.6 assertion is viewport- and scroll-dependent in a way the test does not admit.

### F-3 — G-L1 motion floor still under the bar (my own numbers)

`#listen` mounts its field (1 canvas, 1440×901 CSS). Five captures 400 ms apart, consecutive mean absolute luminance delta (`mv1-l1-probe.json`): `0.001999, 0.000966, 0.002889, 0.000815` → **max 0.002889 against the 0.004 floor** (an earlier 1.2 s pair gave 0.001159, `regression-probe.json`). It moves — max single-pixel delta 0.106 — but not at the rate the floor asks for. Consistent with the known 0.00142; **still a MISS.**

### F-4 — R5 **OPEN**, not graded

The top rung is a genuine 3840×2160 encode (no upscale), but `ffprobe` reads `r_frame_rate=24/1` on all three rungs. R5 asks ≥ 3840×2160 **@ 60 fps** or resolution independence. 24 real frames are not 60. **OPEN.**

### F-5 — `docs/architecture/ASSET-LADDER.md` contradicts itself (documentation defect)

§1/§2 of the shipped ladder still describe `/assets/my-hero-avatar.mp4` as "**640×360**, 160,156 B, unreferenced **orphan → RETIRE**", while §10 and the live file are 1280×720, 1,916,328 B, the base rung every reader gets. A reader who stops at §2 is told the site's default rung is dead. §10 is the true section; §1/§2 need a strike-through or a rewrite.

---

## G-H5 — **PASS** (the ladder is real, the choice is arithmetic, and nothing plays by default)

### Assets, measured on the bytes I downloaded from live

```
curl -sI  → HTTP/2 200 for all three; ffprobe -select_streams v:0
/assets/my-hero-avatar.mp4              1280×720  24/1  12.291667s  1,916,328 B  h264 High
/assets/avatar/my-hero-avatar-1080.mp4  1920×1080 24/1  12.291667s  3,690,721 B  h264 High
/assets/avatar/my-hero-avatar-2160.webm 3840×2160 24/1  12.292000s  2,913,450 B  av1 Main
/assets/my-avatar.mp4                   HTTP/2 301 → /assets/my-hero-avatar.mp4
/assets/avatar/my-hero-avatar-2160.mp4  404   -1440.mp4  404   -4320.webm  404   (nothing above the top rung)
```

Greyscale in the bytes, three frames each (n = 24, 144, 264 / t = 1 s, 6 s, 11 s), `ffprobe -f lavfi …,signalstats`: `UAVG=VAVG=128`, `SATMIN=SATAVG=SATMAX=0` on every sampled frame of every rung. The 1,916,328 B base rung matches the byte count the task pinned.

### Selection, from `video.currentSrc` after a real pointer + press (`h5-rung-probe.json`)

| config | rendered box × DPR = need | `currentSrc` served | intrinsic | rung requests **before** the pointer |
|---|---|---|---|---|
| 1440×900 @1 | 305 × 1 = 305 | `/assets/my-hero-avatar.mp4` | 1280×720 | **0** |
| 1440×900 @2 | 305 × 2 = 611 | base 720p | 1280×720 | **0** |
| 1440×900 @3 | 305 × 3 = 916 | `/assets/avatar/my-hero-avatar-1080.mp4` | 1920×1080 | **0** |
| 390×844 @3 | 218 × 3 = 653 | base 720p | 1280×720 | **0** |
| 1440×900 @3 + `saveData` | 916 | base 720p (pinned) | 1280×720 | **0** |
| 1440×900 @3 + `canPlayType('webm/av01') → ''` | 916 | 1080p **H.264** | 1920×1080 | **0** |
| 2560×1440 @2 | 321.5 × 2 = 643 | base 720p | 1280×720 | **0** |

Every rule the ladder claims holds under attack: smallest rung ≥ need; Save-Data overrules DPR; a browser without an AV1 decoder lands on H.264; and in all seven configurations the network log contains **zero** requests to any rung until a pointer arrives (`video.currentSrc === ''`, `src` attribute absent, `preload="none"` at rest). Every press produced `paused:false` — the served rung actually decodes and plays, including the 1080p H.264 rung.

**Attack that stands as a caveat, not a failure:** the portrait box is capped at ~321.5 CSS px on every layout I could produce (I widened the window to 2560×1440 and the box did not grow), so `need` maxes at ~965 device px at DPR 3 — **no device I could emulate ever selects the 2160p rung**. It is a real, correct, honestly-encoded URL that today's layout does not reach; `ASSET-LADDER.md` §10.3 says exactly that, so it is disclosed rather than oversold. 720p24 is nowhere presented as 4K.

**Verdict: G-H5 PASS on `12cd9123`.** The ADV/rev-56ffed3e finding ("only 720p served while a 2160p master exists") is answered: a ≥1080p path is live and the ladder reaches the master's own resolution.

## G-A3 — **PASS** on the gap acceptance (with F-2 recorded against the finer claim)

All captures mine, `?gl=force`, `#about` scrolled to the top of the viewport, SVG dial + reading column + header + key + caption hidden by injected CSS **after** geometry was read (`a3-field-probe.json`, `a3-*-field-alone.png`).

- **Ten sectors with the dial hidden.** At 390: all ten sectors carry ≥ 23,762 sampled pixels on the ring band (rr 0.40–0.96 of the rose radius), and **all ten seams dip 51–83 %** below their flanking sectors — the wedges are discrete, not a wash. At 1440 all ten sectors are on the annulus (~9,100 px each) with 6/10 seams clearing 12 %. Looking at my own captures (`a3-1440x900-field-alone.png`, `a3-390x844-field-alone.png`) I can count ten spokes and the wedges between them at both sizes.
- **Field weight with the dial restored: 75.2 %** of the light above the `--ink-900` ground comes from the canvas (`a3-1440-with-field.png` minus `a3-1440-without-field.png`, threshold ≥ 75 %). It passes by 0.2 points — a thin margin worth watching, and it is computed on the section's first screen, which is the honest one.
- **The dial is chrome.** Brightest painted pixel inside the instrument stage with the field hidden: luminance **0.2789**, and `--mist-400` is **0.2789** — at the token, not above it.
- **Gold honesty: 0.** Maximum chroma over every sampled pixel of the ring *and* fan at both viewports is **0** (fully achromatic); no gold pixel exists inside the canvas.
- **Reduced motion:** `prefers-reduced-motion: reduce` mounts **0 canvases**; the SVG dial carries the section statically, its ten ring sectors measured at means 0.047–0.117 with answered/open **1.20** and chroma 0 (`a3-reduced-motion-dial.png`).
- **No WebGL** (`HTMLCanvasElement.getContext('webgl*') → null`): 0 canvases, 0 pageerrors, and the dial's brightest stroke rises to **0.9216** from 0.2789 — a 3.3× recovery. The compass does regain full contrast.

**Does a stranger see ten sectors of light before the dial?** Yes — with the instrument hidden, what remains is plainly a ten-spoke rose of light; what a stranger cannot do is tell from that light which three of the ten are the role-side ones (F-2).

## Regression table (live `12cd9123`; MV1 re-checked on `70bd273d`)

| Check | Number I measured | Verdict |
|---|---|---|
| G-MV1 pill at 390 — visible | rect 158.4×44 at (207.6, 776), `display:block`, never hidden at any scroll | PASS |
| G-MV1 pill at 390 — real click | scrollY 0: hit-test → `VIDEO.Hero_portraitVideo`, click **TimeoutError**; scrollY 1497: click ok, panel 342×404 | **FAIL (first fold)** |
| G-V3 vitrine strokes | title 18.32:1 · meta 18.32:1 · body 6.2:1 (≥ 4.5) | PASS |
| G-L1 listen field | 1 canvas 1440×901; motion max 0.002889 / 400 ms vs 0.004 floor | field PASS · **motion floor MISS** |
| G-C1 engage hrefs | Vitrine and Listen "Email a 20-minute-call agenda" are **byte-identical** mailto (same subject + body) | PASS (R4 still not a call booking) |
| Hero monochrome | painted `#hero` 1440×1461: **maxChroma 0**, 0 chromatic pixels | PASS |
| `#about` text contrast | answer 12.45 · name 18.32 · evidence 8.66 · lede 12.45 · **index 6.2** · caption 18.32 (min ≥ 4.5) | PASS |
| pageerrors / console errors | 1440 normal 0/0 · 390 normal 0/0 · 1440 `?gl=force` 0/0 · 390 `?gl=force` 0/0 | PASS |
| `/api/tts` | `POST` → **200**, 20,942 B audio payload, 0.368 s (`GET` → 405, correct) | PASS |
| R5 | all rungs 24 fps | **OPEN** |

## False positives I checked and discarded

1. *"The 2160p rung never loads — it must be fake."* It is real: 3840×2160 AV1, 2,913,450 B, greyscale, decodes. It is simply unreachable on today's box size; disclosed in §10.3 of the ladder.
2. *"Rungs are fetched at load."* No: zero rung requests in seven configurations before a pointer; `preload="none"`, no `src` attribute at rest.
3. *"The MiniVic pill is hidden below 834 px."* It is not — `display:block`, in the viewport, 158.4×44. The failure is interception, not hiding. (The first `button` matching "Ask Mini Vic" in DOM order is the `skip-link minivic-skip`, translated off-screen by design; grading that as the pill would have been the false positive.)
4. *"`#listen` has no field."* The count of 0 in my first pass was read before the in-view mount; on the settled page there is exactly 1 canvas.
5. *"Gold leaked into the About canvas."* Zero chromatic pixels in ring and fan at both viewports.

## Reproduce

```bash
curl -sI https://forgotten-mistory.web.app/assets/avatar/my-hero-avatar-2160.webm
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of default=nw=1 my-hero-avatar-2160.webm
node /tmp/rev12cd/h5.mjs      # rung selection + no-autoplay, 7 configs
node /tmp/rev12cd/a3.mjs      # field-alone sectors, dominance, reduced motion, no-GL
node /tmp/rev12cd/hatch.mjs   # per-sector 45-degree texture energy
node /tmp/rev12cd/reg.mjs     # regression table
node /tmp/rev12cd/mv1c.mjs    # launcher hit-test at two scroll positions
cat docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/verdicts.json
```
