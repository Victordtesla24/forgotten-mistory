# G-REV — live probe of the viseme stage (S7) and the half-resolution scenes (`resolutionScale`)

**Reviewer** — independent adversarial QA (docs/prompt.md §5, `verification` +
`3rd_party_independent_adversarial_review`, effort max). Read-only: no production file was
changed by this review. Every number below was re-captured on the live site in this session;
nothing is carried over from the implementer's own evidence.

| | |
|---|---|
| **Target** | `https://forgotten-mistory.web.app/`, cache-busted (`?rev=<epoch>`) on every load |
| **`build-commit` at dispatch** | `799b4a02` — `curl -fsS https://forgotten-mistory.web.app/ \| grep -o 'build-commit" content="[^"]*"'` → `799b4a02` (15:01Z) |
| **Drift during the sweep** | `799b4a02` → **`c6ee88ab`** (panel + GL-field phases) → **`b0d41a20`** (still + poster phases) → **`ce3ab346`** (attribution phase). The ten-minute Deploy metronome shipped three times while probes were running. |
| **Skew is disclosed, not hidden** | `git merge-base --is-ancestor 799b4a02 c6ee88ab` → **YES**; `… b0d41a20` → **YES**; `… ce3ab346` → **YES**. Every build measured is a **descendant** of the build named in the tasking, never an earlier one. Each context's own `build` meta is recorded in the JSON beside its numbers. |
| **Claims under test** | `c1df356` *feat(minivic): the avatar stands on a viseme-lit GLSL stage (S7)* · `af7355a` *perf(scenes): hero, about, strata at half render resolution (R2)* |
| **Ancestry — both lanes are genuinely live** | `git merge-base --is-ancestor c1df356 799b4a02` → **YES**; `… af7355a 799b4a02` → **YES** |
| **Method** | Playwright + **system Chrome** `/usr/bin/google-chrome`, `--no-sandbox`, SwiftShader (`--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, lifted from `tests/overhaul/flagship-visibility.spec.ts`), `--disable-lcd-text` on every pixel context; **one browser context at a time**. Panel opening / mute / send / request attribution follow `G-REV/411650c2/reviewer-probe.mjs`; field measures and six-cycle scroll-and-wait canvas attribution follow `G-REV/abc475e3` + `/ff67273b` (i.e. `flagship-visibility.spec.ts`'s own ground/coverage/peak/motion). |
| **Raw evidence** | `captures/probe-s7.mjs` + `.json` + `.log` · `captures/probe-res.mjs` + `.json` + `.log` · `captures/probe-s7b.mjs` + `.json` + `.log` · `captures/compare-before-after.mjs` + `.json` · 40+ PNGs beside them |

---

## FAILURES FIRST

**One red, one unproven, one withdrawn.** Of the 20 clauses below, **17 PASS**, **1 is
UNPROVEN** (F-2 — the stage's response to a *muted* reply cannot be attributed to the shader),
**1 is PARTIAL** (S7-4, recorded not required), and **1 FAILS** — `vitrine-field` @390, which is
the red already standing on `main` and belongs to neither commit under test. **Nothing in
`c1df356` or `af7355a` regressed anything I could measure.**

### F-1 — `vitrine-field` @390 still has no core: peak **0.3325** < floor **0.35** — FAIL (carried, not new)

Re-measured on this build with the same method that measured it on `ff67273b`:

```
gl 390 vitrine-field: canvas=1 store=342x745 cov=0.6798 peak=0.3325 motion=0.01778 pass=false
```
— `captures/probe-res.log`, `captures/probe-res.json → gl["390"].fields["vitrine-field"]`,
capture `captures/glforce-390-vitrine-field.png`.

It has **moved up** since `G-REV/ff67273b` (`0.2918` → `0.3325`, +0.041) without any commit
claiming to have touched it — the earlier reading was taken on a different build in the same
family, so part of that is frame phase. It is still **0.0175 under the floor (95% of it)**, and
`TC-FLAGSHIP-VIS-VITRINE @ 390` remains red on `main`. Nothing in either commit under test
claims to fix it; `af7355a` explicitly leaves the vitrine unscaled, and my measurement confirms
it (backing store 342×745 for a 342×745.97 CSS slot — ratio **1.0**). **This is not a regression
from either commit; it is the open red carried from `ff67273b` F-S5-390.**

### F-2 — the muted stream delta cannot be attributed to the shader — **UNPROVEN**, not PASS

The clause asks that the stage *visibly respond* while a reply streams, with the voice muted.
What I can show:

| measure (stage box, 200 ms sampling, 3 s) | 1440 | 390 |
|---|---|---|
| idle mean \|ΔL\| | 0.00498 | 0.00376 |
| streaming mean \|ΔL\| | **0.00630** | **0.00463** |
| ratio | ×1.27 | ×1.23 |

— `captures/probe-s7.json → panel["1440"].idle/.streaming`, frames in `.samples`.

That delta is real and repeats at both widths, **but the sampled box is not the shader**: the
same rectangle contains the portrait, the legibility gradient (`opacity-80` → `opacity-95` on
`isSpeaking`) and the scan grid, all of which change state around a reply. My isolated re-run
(`probe-s7b`, `captures/iso-1440-muted-*.png`) did not close the gap either — the send did not
fire once the isolation style had hidden the input, so its idle/stream windows are not a
like-for-like comparison and I am **not** presenting them as one.

What *is* proven, isolated, with the flagship rule (`body * {visibility:hidden}` except the
slot): **the stage is genuinely lit and genuinely moving on its own** — 1440 coverage `0.5079`,
peak `0.5333`, motion `0.02293`; 390 `0.5428 / 0.5210 / 0.00972`, i.e. it clears all three
flagship floors at both widths (`captures/panel-1440-field-minivic-viseme.png`,
`captures/panel-390-field-minivic-viseme.png`). With the voice muted no audio plays, so by the
component's own design (`VisemeStage` reads `currentVisemeRef`, which `MiniVicBot` fills from an
`AnalyserNode` on the audio element) the muted path can only breathe on
`deterministicIdleViseme` — which is exactly what `c1df356` says it does. **The honest verdict
is: the stage moves, above the floor, at both widths; that its motion *answers the reply* is
not established by a muted send, and my unmuted attribution run had not returned within the
wall-clock cap.**

### F-3 — under reduced motion the 2D mouth draws **nothing while muted** — cause named, clause **PASSES** on the fair path

Two reduced-motion contexts, same build (`ce3ab346`), same question, one difference:

| | muted | **unmuted** |
|---|---|---|
| canvases in the scene slot, before / after the reply | **0 / 0** | **0 / 0** |
| canvases in the panel | 1 (the 200×100 2D mouth) | 1 |
| mouth samples over the reply (100 ms) | 67 | 94 |
| **distinct pixel-sum values** | **1** (every sample `0`) | **39** |
| brightest sample / non-transparent pixels | 0 / 0 | 2,448,714 / **3,324 px** |
| audio element | `paused: true`, greeting `.mp3` never started | `paused: false`, blob src, `duration 37.5 s` |
| reply | 598 chars | 540 chars |

— `captures/probe-s7b.json → reduced-muted` / `reduced-unmuted`.

So the mouth **does** animate during a reply with reduced motion in force — 39 distinct frames
across a second and a half of reply — and it stops dead when the voice is muted, because it is
driven by an `AnalyserNode` on the audio element and a muted reply has no waveform. My first
pass muted the voice in the reduced-motion context too, which is not a fair test of "the mouth
still animates"; corrected here. **Not a defect. The clause passes; the muted blank is
by construction and is the same on every build that has ever shipped this component.**

---

## Verdict table

### S7 — `c1df356`, the viseme stage

| # | Clause | Verdict | Evidence (live, re-captured) |
|---|---|---|---|
| S7-1 | `[data-scene=minivic-viseme]` holds **one** live webgl canvas, `/?gl=force`, 1440 & 390, attributed by DOM over six scroll-and-wait cycles | **PASS** | 1440 slot canvases `0>0>0>1>1>1`, 390 `0>0>1>1>1>1` — never 2; context `webgl2-live`; backing store 430×145 for a 430×145.55 CSS slot @1440 and 340×127 for 340×127.63 @390 (the panel stage is **not** resolution-scaled). `probe-s7.json → panel[*].trace` |
| S7-2 | WebGL contexts before → after opening ≤ **+1** | **PASS** | 1440: `gl 4 → 5` (**+1**), canvases `2 → 3`. 390: the +1 canvas is the same one; the context counter read `+0` at the 2.5 s mark because the scene mounts lazily and had not yet asked for a context — the DOM attribution above is the reliable count. `probe-s7.json → panel[*].glBefore/glAfter`; counter patched into `HTMLCanvasElement.prototype.getContext` before any app code (`addInitScript`) |
| S7-3 | The stage responds while the reply streams (muted) | **UNPROVEN** | box motion ×1.27 @1440 / ×1.23 @390 over idle, but the box is not the shader — see **F-2**. Isolated, the stage clears every floor: `0.5079 / 0.5333 / 0.02293` @1440, `0.5428 / 0.5210 / 0.00972` @390 |
| S7-4 | Unmute variant — does the stage answer the audio too (record, do not require) | **PARTIAL — recorded** | With the voice on, the audio path is demonstrably live and drives the lip-sync: blob audio playing, `duration 37.5 s`, panel state `Speaking`, and the 2D mouth moving through **39 distinct frames** (`probe-s7b.json → reduced-unmuted`). The *GL stage's* own response to that stream is not isolated — same attribution gap as F-2. One incidental number worth keeping: in that unmuted context the first visible token took **3379 ms** (n=1, reduced motion, voice on) against 739–1016 ms muted |
| S7-5 | `prefers-reduced-motion`: **0 canvases** in the panel's scene slot | **PASS** | `slotCanvases 0` before the send and `0` after a complete reply, in **three** independent reduced-motion contexts (516 / 598 / 540-char replies); GL contexts added by opening the panel: **0**; the only canvas in the panel is the 200×100 2D mouth. `probe-s7.json → reduced`, `probe-s7b.json → reduced-*` |
| S7-6 | …AND the 2D mouth's pixels change during a reply | **PASS (unmuted)** | 94 samples at 100 ms → **39 distinct pixel sums**, peak 3,324 non-transparent pixels. Blank when muted, by construction — **F-3** |
| S7-7 | no-GL: the panel is complete and readable | **PASS** | slot present, **0 canvases**; panel 432×460 with 689 chars of copy, `minivic-input`, `minivic-synthetic-label`, 3 mode chips, 17 buttons; the reply arrives (302 chars, TTFT 951 ms); 0 pageerrors, 0 CSP. `probe-s7.json → nogl`, `captures/nogl-1440-panel.png` |
| S7-8 | **No gold** in the stage | **PASS** | 0 exact-palette-gold pixels **and** 0 warm pixels (`r>110 ∧ r−b>40 ∧ r≥g>b`) in 62,350 px @1440 and 43,180 px @390 — idle frame, streaming frame and the isolated field frame all agree. `captures/iso-1440-muted-after.png` is a grey pool |
| S7-9 | G-M1 — exactly **one** chat request (origin) per send | **PASS** | 1440: `1, 1, 1` across three sends; 390: `1`. Zero `/api/realtime`, zero `chat-with-vic`, zero TTS calls while muted. `probe-s7.json → panel[*].chatPerSend` |
| S7-10 | G-M3 — first visible token **< 1.5 s**, P50 over 3 sends | **PASS** | 1440 `976 / 829 / 755 ms` → **P50 829 ms** (worst 976); 390 `1016 ms`; reduced-motion `739 ms`; no-GL `951 ms`. Measured from the Enter keypress to the first non-empty bot bubble by MutationObserver |
| S7-11 | 0 pageerrors / 0 console errors / 0 CSP violations | **PASS** | 0 / 0 / 0 across **9 independent contexts** (panel 1440, panel 390, reduced, no-GL, GL-field 1440, GL-field 390, still 1440, still 390, poster) |

### `af7355a` — `resolutionScale`, regression clauses

| # | Clause | Verdict | Evidence |
|---|---|---|---|
| R-1 | Hero/about/strata backing store ≈ **0.5 × CSS px × DPR** | **PASS** | DPR 1. @1440 hero `720×664` for `1440×1328.88` → **0.5000**; about `192×192` for `384×384` → **0.5000**; strata `648×268` for `1297.91×536.33` → **0.4993**. @390 hero `195×744` for `390×1489.95` → **0.5000**; about `112×112` for `224×224` → **0.5000**; strata `177×330` for `355.66×660.97` → **0.4977** |
| R-2 | Skills untouched (commit's own claim) | **PASS** | skills-bench `1248×1248` → **1.000** @1440, `342×342` → **1.000** @390. Vitrine `1296/1296` and listen `1440/1440` also **1.000** — nothing was scaled that the commit did not name |
| R-3 | Flagship floors, GL path, **@1440** — coverage ≥ 0.15 / peak ≥ 0.35 / motion ≥ 0.004 | **PASS (6/6)** | hero `0.4609 / 0.8308 / 0.02857` · about `0.4678 / 0.8308 / 0.01676` · strata `0.2830 / 0.8308 / 0.03718` · skills `0.3506 / 0.5457 / 0.00904` · vitrine `0.2268 / 0.3968 / 0.01199` · listen `0.2207 / 0.5271 / 0.00511` |
| R-4 | Flagship floors, GL path, **@390** | **5/6 — vitrine FAIL** | hero `1.0000 / 0.7454 / 0.08635` · about `0.4597 / 0.4508 / 0.01252` · strata `0.4058 / 0.8308 / 0.04547` · skills `0.4507 / 0.6514 / 0.00720` · listen `0.3381 / 0.4072 / 0.01148` · **vitrine `0.6798 / 0.3325 / 0.01778` → peak under floor (F-1)** |
| R-5 | No regression vs `G-REV/abc475e3` + `/66199cba` on the three scaled scenes | **PASS** | every scaled scene is **above** its earlier reading, not below: hero mean `0.1751 → 0.1908`, about `0.1192 → 0.1199`, strata `0.0545 → 0.0583` (isolated 1440 captures, same method). `captures/compare-before-after.json` |
| R-6 | AA walk over `#hero` / `#about` / `#experience`, both paths, both widths | **PASS** | `?gl=force`: **0 of 134** nodes below AA @1440, **0 of 126** @390. Still path (`/`, reduced motion): **0 of 134** @1440, **0 of 126** @390 |
| R-7 | Visual comparison — upscale artefacts? banding? | **PASS, with one honest cost named** | see below |
| R-8 | Hero poster still ≥ **0.10** luminance | **PASS** | GL chunk blocked: first background layer is `url(".../assets/hero-atmosphere-poster.avif")`, **0 canvases**, stage-box mean luminance **0.1104** (×1.10 of floor), coverage at Δ0.04 `0.4433`. `captures/poster-1440-stage.png` |
| R-9 | Reduced-motion stills on the scaled sections | **PASS** | hero `0.4261` @1440 / `0.9073` @390, about `0.3559` / `0.3636` (floor 0.08); strata `0.0410` / `0.0418` against **its own documented floor of 0.02** (`flagship-visibility.spec.ts:145`, `fallbackCoverageMin: 0.02`) — see the false-positive register |

**R-7 in words, after looking at the pictures.** At 1440 the three scaled scenes are *not*
posterised and *not* banded: distinct luminance levels are unchanged against the pre-scale
captures (hero **162 → 162**, about **161 → 161**, strata **163 → 163**), while the three
*unscaled* control scenes lost more levels over the same interval (skills 157 → 122, vitrine
108 → 96, listen 124 → 119) — frame phase, not resolution, dominates that measure. What the
upscale does cost is fine detail: mean horizontal gradient energy on the hero falls
`0.00265 → 0.00160` (−40%) and mid-row second-difference `0.00407 → 0.00299` (−27%). That is
the expected signature of a half-resolution buffer stretched into the slot — the field reads
*softer*, not *stepped*. On the atmospheric shaders here that is a fair trade; it would not be
on a hairline, which is presumably why `skills-bench` was left alone.

### R2 tally — how many of the seven scenes are measurable and pass every floor on this build

| # | scene | measurable | @1440 | @390 |
|---|---|---|---|---|
| 1 | `hero-atmosphere` | yes | PASS | PASS |
| 2 | `about-field` | yes | PASS | PASS |
| 3 | `career-strata` | yes | PASS | PASS |
| 4 | `skills-bench` | yes | PASS | PASS |
| 5 | `vitrine-field` | yes | PASS | **FAIL** (peak 0.3325) |
| 6 | `listen-field` | yes | PASS | PASS |
| 7 | `minivic-viseme` | yes | PASS | PASS |

**7 of 7 measurable** (each holds exactly one live `webgl2` canvas addressable by
`[data-scene]`), **7 of 7 pass every floor at 1440**, **6 of 7 at 390**. R2's "at least seven
signature scenes" is met in count and in handle; the one red is the pre-existing vitrine peak.

---

## False-positive register

**Against `c1df356`'s message**

| claim | independently checked | result |
|---|---|---|
| "`lib/visemeMap.ts` is untouched (0 diff lines)" | `git diff c1df356~1 c1df356 -- lib/visemeMap.ts \| wc -l` → **0** | true |
| "the change to `MiniVicBot.tsx` is 27 added lines and 0 removed" | `git diff --numstat` → **27 0** | true |
| "TC-VISEME-GL-01 … flagship COVERAGE/PEAK/MOTION floors" | re-measured live, isolated, both widths | true — `0.5079/0.5333/0.02293` and `0.5428/0.5210/0.00972` |
| "TC-VISEME-GL-02 → zero canvases, mouth still a live 2D context" | reduced-motion context | true (the mouth *draws* nothing while muted — F-3 — but that is not what the claim says) |
| "TC-VISEME-GL-03 … adds at most one scene canvas" | before/after counts | true (+1) |
| "…and closing it hands the context back" | **not exercised** | **untested by me** — open item 2 |
| "At rest the pool breathes … never `Math.random()`" | not source-audited beyond the diff; the stage does move at rest (idle motion 0.00498 in-box, `0.02293` isolated) | consistent, not proven |

**Against `af7355a`'s message**

| claim | independently checked | result |
|---|---|---|
| "Hero, About and Experience ask for 0.5" | live backing stores | true — 0.5000 / 0.5000 / 0.4993 @1440 |
| "a 0.5 floor is added … 1.75 ceiling unchanged" | `components/gl/GLCanvas.tsx:80-84` `renderResolution()` | true as written (`Math.max(DPR_FLOOR, full * scale)`) |
| "No shader source is edited" | `git diff --numstat af7355a~1 af7355a -- '*.glsl.ts'` → **empty** | true |
| "so the hero poster stays a faithful frame" | poster path re-measured | consistent — the poster is still the first background layer and reads 0.1104 |
| "skills-bench is deliberately untouched" | ratio 1.000 at both widths | true |

**My own false positives, caught and withdrawn**

| I nearly filed | why it was wrong |
|---|---|
| "`career-strata` reduced-motion still covers only 4.1% < 8% — FAIL" | the spec gives `#experience` a **documented** `fallbackCoverageMin: 0.02` (`flagship-visibility.spec.ts:118-146`) because raising the ground under `.roleDates` by Δ0.04 would push it under 4.5:1. 0.0410 and 0.0418 **clear** that floor by ×2. Withdrawn. |
| "opening the panel at 390 adds **0** GL contexts, so the stage never mounts there" | the counter was read 2.5 s after the panel opened; the scene mounts lazily and the DOM shows the canvas one cycle later (`0>0>1>1>1>1`). Attribute by DOM, as the tasking says. Withdrawn. |
| "the stage is dark in the isolated 1440 run (`slot=0`)" | same lateness: the canvas mounted *during* the sampling window, and `captures/iso-1440-muted-after.png` is plainly the lit pool. Withdrawn as a failure — kept as open item 4. |
| "reduced motion leaves the 2D mouth blank — S7 broke the lip-sync" | it is the **mute**, not reduced motion: unmuted, the same context draws 39 distinct frames. Withdrawn (F-3). Filing it would have been the worst kind of false positive: a real-looking red against a commit whose whole argument is that it did not touch the 2D path. |

---

## Open items — one line each

1. **F-2 attribution gap — the one thing this review could not settle.** To close it, sample the *isolated* stage while a reply streams: prime the input, apply the isolate style, **re-focus the input**, then fire with `page.keyboard.press` — the missing focus is why both of my isolated sends never fired (`ttft: null` in `probe-s7b.json → 1440-muted` / `1440-unmuted`). Script committed and re-runnable.
2. **"Closing the panel hands the context back" — untested.** The one clause of `TC-VISEME-GL-03` I did not exercise live.
3. **F-1 `vitrine-field` @390 peak 0.3325 < 0.35** — open red on `main`, owned by the vitrine lane, untouched by both commits under test.
4. **The stage may not mount until the page is perturbed after opening.** Where the probe scrolled after opening the panel, the canvas appeared within ~3–5 s (`0>0>0>1>1>1` @1440, `0>0>1>1>1>1` @390). In the two contexts that opened the panel and then *stopped touching the page*, the slot still held **0 canvases 23 s later** and the light only came up during the following sampling window (`iso-1440-*-idle.png` dark → `-after.png` lit; mean luma `0.046 → 0.109`). Nothing is broken — `Scene` mounts nothing until its lazy chunk lands and the plate is complete without it — but a stage that waits for a scroll is a stage a reader who opens the panel and simply types may never see. Worth one measurement by the owning lane.
5. **First token with the voice on: 3379 ms (n=1).** Muted sends were 755–1016 ms. If the reply is gated on audio readiness, G-M3's bar is only met on the muted path; one sample is not a verdict, it is a reason to measure.

---

## What I did not do

- I did not run the repo's own Playwright batteries against production this pass — the two live
  probes are independent re-measurements, and where a number can be compared to a repo gate run
  (`ff67273b`'s vitrine `0.2918`) the comparison is named.
- I did not open the ElevenLabs / D-ID path, and every send was muted except where the register
  says otherwise — no paid call was made.
- I changed no production file; the only files added are this report and `captures/`.
